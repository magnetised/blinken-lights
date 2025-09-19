use std::thread;
use std::time::Duration;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

use std::sync::{Arc, Mutex};

use spectrum_analyzer::scaling::{
    combined, divide_by_N, divide_by_N_sqrt, scale_20_times_log10, scale_to_zero_to_one,
};
use spectrum_analyzer::windows::hann_window;
use spectrum_analyzer::{FrequencyLimit, samples_fft_to_spectrum};

use ringbuf::traits::*;

mod display;
mod leds;
mod piano;
// mod spectrum;
mod terminal;

use crate::display::Display;

pub const NUM_BINS: usize = 88;
const SAMPLE_SIZE: usize = 8192;
const RINGBUFFER_SIZE: usize = SAMPLE_SIZE;
const MIN_FREQ: f32 = 25.0;
const MAX_FREQ: f32 = 4200.0;

fn main() -> Result<(), Box<dyn std::error::Error>> {
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

    let mut peak_magnitudes = vec![0.0; NUM_BINS];

    let mut display = display_impl();

    let stream = device.build_input_stream(
        &stream_config,
        move |samples: &[f32], _: &cpal::InputCallbackInfo| {
            if let Ok(mut buffer) = producer_buffer.lock() {
                buffer.push_iter_overwrite(&mut samples.iter().copied());
            }
        },
        |err| eprintln!("an error occurred on stream: {}", err),
        None,
    )?;

    stream.play()?;

    let sample_rate = stream_config.sample_rate.0 as u32;

    // let lowpass = lowpass_filter(cutoff_from_frequency(6000.0, 44_100), 0.01);
    // wait for buffer to fill
    thread::sleep(Duration::from_millis(100));
    loop {
        thread::sleep(Duration::from_millis(4));
        let mut samples = [0.0f32; SAMPLE_SIZE];
        if let Ok(buffer) = consumer_buffer.lock() {
            let _samples_read = buffer.peek_slice(&mut samples);
        }
        // let vec_f64_1: Vec<f64> = samples.iter().map(|&x| x as f64).collect();
        // let lowpass_samples = quantize_samples::<f32>(&convolve(&lowpass, &vec_f64_1));
        let hann_window = hann_window(&samples);
        // let fncs = combined(&[&scale_20_times_log10, &scale_to_zero_to_one]);
        let spectrum = samples_fft_to_spectrum(
            &hann_window,
            sample_rate,
            FrequencyLimit::Range(MIN_FREQ, MAX_FREQ),
            Some(&divide_by_N_sqrt),
        )?;
        let new_bins = piano::bin_magnitudes(spectrum);

        //
        display.visualize_bins(new_bins, &mut peak_magnitudes);
    }
    // if let Ok(spectrum_consumer) = spectrum::start() {
    //     thread::sleep(Duration::from_millis(100));
    //     let mut peak_magnitudes = vec![0.0; spectrum::NUM_BINS];
    //     loop {
    //         thread::sleep(Duration::from_millis(4));
    //         let new_bins = &spectrum_consumer.read();
    //         visualize_bins(new_bins, &mut peak_magnitudes);
    //     }
    // }
}

#[cfg(feature = "leds")]
fn display_impl() -> impl display::Display {
    leds::LEDs::new()
}

#[cfg(not(feature = "leds"))]
fn display_impl() -> impl display::Display {
    terminal::Terminal::new()
}
