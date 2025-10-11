use std::io::{self, BufRead, BufReader};
use std::time::Duration;
use std::{env, panic, process, thread};

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

use std::sync::{mpsc, Arc, Mutex};

use spectrum_analyzer::scaling::{
    combined,
    // divide_by_N,
    divide_by_N_sqrt,
    scale_20_times_log10,
    scale_to_zero_to_one,
};
use spectrum_analyzer::windows::hann_window;
use spectrum_analyzer::{samples_fft_to_spectrum, FrequencyLimit};

use ringbuf::traits::*;

mod display;
mod leds;
mod null;
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

    let load_config = if let Ok(json) = env::var("DISPLAY_CONFIG") {
        eprintln!("Using config from DISPLAY_CONFIG");
        if let Ok(config) = DisplayConfig::decode(&json) {
            config
        } else {
            eprintln!("DisplayConfig has error, using default");
            DisplayConfig::default()
        }
    } else {
        eprintln!("Using default config");
        DisplayConfig::default()
    };
    let display_config = Arc::new(Mutex::new(ConfigWrapper {
        config: load_config,
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

    stream_config.buffer_size = cpal::BufferSize::Fixed(1024);

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
                        panic!("Two consecutive timeouts! Exiting");
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

    thread::spawn(move || loop {
        thread::sleep(Duration::from_millis(500));
        if tx.send(Ping::Timeout).is_err() {
            panic!("Failed to send timeout ping!");
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
                    let c: display::DisplayConfig =
                        DisplayConfig::decode(&line).expect("Failed to decode json");
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

    // wait for buffer to fill
    thread::sleep(Duration::from_millis(100));

    thread::spawn(move || {
        let mut peak_magnitudes = vec![0.0; num_bins];
        let sample_rate = stream_config.sample_rate.0 as u32;
        let mut samples = [0.0f32; SAMPLE_SIZE];
        let mut bins = vec![0.0; num_bins];
        let mut display = display_impl();
        loop {
            thread::sleep(Duration::from_millis(4));

            if let Ok(buffer) = consumer_buffer.lock() {
                let _samples_read = buffer.peek_slice(&mut samples);
            }
            let hann_window = hann_window(&samples);
            if let Ok(wrapper) = display_config_read.lock() {
                let fncs: Box<spectrum_analyzer::scaling::SpectrumScalingFunction> =
                    if wrapper.config.scale {
                        Box::new(&divide_by_N_sqrt)
                    } else {
                        combined(&[
                            &scale_20_times_log10,
                            // &divide_by_N_sqrt,
                            &scale_to_zero_to_one,
                        ])
                    };
                let spectrum = samples_fft_to_spectrum(
                    &hann_window,
                    sample_rate,
                    FrequencyLimit::Range(piano::MIN_FREQUENCY, piano::MAX_FREQUENCY),
                    Some(&fncs),
                )
                .unwrap();

                piano::bin_magnitudes(&mut bins, spectrum, num_bins, &wrapper.config);
                display.visualize_bins(&bins, &mut peak_magnitudes, &wrapper.config);
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

    eprintln!("Child: Exiting gracefully");
    let mut display = display_impl();
    display.reset();
    process::exit(0);
}

#[cfg(feature = "leds")]
fn display_impl() -> impl display::Display {
    leds::LEDs::new()
}

#[cfg(feature = "terminal")]
fn display_impl() -> impl display::Display {
    terminal::Terminal::new()
}

#[cfg(feature = "no-display")]
fn display_impl() -> impl display::Display {
    null::Null::new()
}
