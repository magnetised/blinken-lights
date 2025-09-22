use std::io::{self, BufRead, BufReader, Write};
use std::panic;
use std::process;
use std::thread;
use std::time::Duration;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

use std::sync::{Arc, Mutex, mpsc};

use spectrum_analyzer::scaling::{
    combined,
    // divide_by_N, divide_by_N_sqrt,
    scale_20_times_log10,
    scale_to_zero_to_one,
};
use spectrum_analyzer::windows::hann_window;
use spectrum_analyzer::{FrequencyLimit, samples_fft_to_spectrum};

use ringbuf::traits::*;

// use erlang_port::{PortReceive, PortSend};

mod display;
mod leds;
mod piano;
mod terminal;

use crate::display::{Display, DisplayConfig};

const SAMPLE_SIZE: usize = 2usize.pow(13);

const RINGBUFFER_SIZE: usize = SAMPLE_SIZE;

enum Ping {
    Audio,
    Timeout,
}

struct ConfigWrapper {
    config: DisplayConfig,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let orig_hook = panic::take_hook();
    panic::set_hook(Box::new(move |panic_info| {
        // invoke the default handler and exit the process
        orig_hook(panic_info);
        process::exit(1);
    }));

    let display_config = Arc::new(Mutex::new(ConfigWrapper {
        config: DisplayConfig::default(),
    }));
    let display_config_read = Arc::clone(&display_config);
    let display_config_write = Arc::clone(&display_config);

    let (tx, rx) = mpsc::channel();
    let num_bins: usize = piano::num_keys();
    println!("num_bins: {}", num_bins);
    let ringbuf = ringbuf::HeapRb::<f32>::new(RINGBUFFER_SIZE);

    let shared_buffer = Arc::new(Mutex::new(ringbuf));

    let producer_buffer = Arc::clone(&shared_buffer);
    let consumer_buffer = Arc::clone(&shared_buffer);

    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .expect("no input device available");

    let config = device
        .default_input_config()
        .expect("no default input config");

    let mut stream_config: cpal::StreamConfig = config.into();

    stream_config.buffer_size = cpal::BufferSize::Fixed(1024 as u32);

    let tx_audio = tx.clone();

    let stream = device.build_input_stream(
        &stream_config,
        move |samples: &[f32], _: &cpal::InputCallbackInfo| {
            if let Ok(mut buffer) = producer_buffer.lock() {
                buffer.push_iter_overwrite(&mut samples.iter().copied());
                if tx_audio.send(Ping::Audio).is_err() {
                    panic!("Failed to send timeout ping!");
                }
            }
        },
        |err| panic!("an error occurred on stream: {}", err),
        None,
    )?;

    stream.play()?;

    thread::spawn(move || {
        let mut last_ping: Option<Ping> = None;
        loop {
            match rx.recv() {
                Ok(Ping::Audio) => {
                    last_ping = Some(Ping::Audio);
                }
                Ok(Ping::Timeout) => match last_ping {
                    Some(Ping::Timeout) => {
                        panic!("Two consecutive pings! Exiting");
                    }
                    Some(Ping::Audio) => {
                        last_ping = Some(Ping::Timeout);
                    }
                    _none => {
                        panic!("Received timeout ping before audio. Exiting");
                    }
                },
                Err(err) => {
                    eprintln!("error reading timeout consumer: {}", err);
                }
            }
        }
    });

    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_millis(500));
            if tx.send(Ping::Timeout).is_err() {
                panic!("Failed to send timeout ping!");
            }
        }
    });

    let (tx_stdin, rx_exit) = mpsc::channel();
    // let tx_stdout = tx_stdin.clone();

    thread::spawn(move || {
        let stdin = io::stdin();
        let mut reader = BufReader::new(stdin.lock());
        let mut line = String::new();

        loop {
            line.clear();
            match reader.read_line(&mut line) {
                Ok(0) => {
                    // EOF reached - stdin closed
                    eprintln!("Child: stdin closed by parent");
                    let _ = tx_stdin.send(());
                    break;
                }
                Ok(_) => {
                    // Successfully read a line
                    eprintln!("Child received: {}", line);
                    let c: display::DisplayConfig =
                        DisplayConfig::decode(&line).expect("Failed to decode json");
                    eprintln!("{:?}", c);
                    if let Ok(mut wrapper) = display_config_write.lock() {
                        wrapper.config = c;
                    }
                    // io::stdout().flush().unwrap();
                }
                Err(e) => {
                    // Error reading from stdin
                    eprintln!("Child: error reading stdin: {}", e);
                    let _ = tx_stdin.send(());
                    break;
                }
            }
        }
    });
    // thread::spawn(move || loop {
    //     let mut port = unsafe {
    //         use erlang_port::PacketSize;
    //         erlang_port::nouse_stdio(PacketSize::Four)
    //     };
    //     for string_in in port.receiver.iter::<String>() {
    //         println!("port: {}", string_in);
    //         // let result = upcase(string_in);
    //
    //         port.sender.reply(Ok::<String, String>("ok".to_string()));
    //     }
    // });

    // let lowpass = lowpass_filter(cutoff_from_frequency(6000.0, 44_100), 0.01);
    // wait for buffer to fill
    thread::sleep(Duration::from_millis(100));

    thread::spawn(move || {
        loop {
            let mut display = display_impl();
            let mut peak_magnitudes = vec![0.0; num_bins];
            let sample_rate = stream_config.sample_rate.0 as u32;
            thread::sleep(Duration::from_millis(4));

            let mut samples = [0.0f32; SAMPLE_SIZE];

            if let Ok(buffer) = consumer_buffer.lock() {
                let _samples_read = buffer.peek_slice(&mut samples);
            }
            // let vec_f64_1: Vec<f64> = samples.iter().map(|&x| x as f64).collect();
            // let lowpass_samples = quantize_samples::<f32>(&convolve(&lowpass, &vec_f64_1));
            let hann_window = hann_window(&samples);
            let fncs = combined(&[
                &scale_20_times_log10,
                // &divide_by_N_sqrt,
                &scale_to_zero_to_one,
            ]);
            let spectrum = samples_fft_to_spectrum(
                &hann_window,
                sample_rate,
                FrequencyLimit::Range(piano::MIN_FREQUENCY, piano::MAX_FREQUENCY),
                Some(&fncs),
            )
            .unwrap();
            let new_bins = piano::bin_magnitudes(spectrum, num_bins);

            if let Ok(wrapper) = display_config_read.lock() {
                display.visualize_bins(new_bins, &mut peak_magnitudes, &wrapper.config);
            }
        }
    });

    match rx_exit.recv() {
        Ok(_) => {
            eprintln!("Child: Received exit signal - shutting down");
        }
        Err(e) => {
            eprintln!("Child: Channel error: {}", e);
        }
    }

    // Clean shutdown
    eprintln!("Child: Exiting gracefully");
    process::exit(0);
}

#[cfg(feature = "leds")]
fn display_impl() -> impl display::Display {
    leds::LEDs::new()
}

#[cfg(not(feature = "leds"))]
fn display_impl() -> impl display::Display {
    terminal::Terminal::new()
}
