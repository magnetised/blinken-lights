use std::thread;
use std::time::Duration;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

use std::sync::{Arc, Mutex};

use spectrum_analyzer::scaling::{
    combined, divide_by_N, divide_by_N_sqrt, scale_20_times_log10, scale_to_zero_to_one,
};
use spectrum_analyzer::windows::hann_window;
use spectrum_analyzer::{FrequencyLimit, FrequencySpectrum, samples_fft_to_spectrum};

use ringbuf::traits::*;

// #[cfg(feature = "leds")]
// use smart_leds::{RGB8, SmartLedsWrite};
// use synthrs::filter::{convolve, cutoff_from_frequency, lowpass_filter};
// use synthrs::synthesizer::quantize_samples;
// #[cfg(feature = "leds")]
// use ws281x_rpi::Ws2812Rpi;

mod display;
mod leds;
mod spectrum;
mod terminal;

pub const NUM_BINS: usize = 88;
const SAMPLE_SIZE: usize = 8192;
const RINGBUFFER_SIZE: usize = SAMPLE_SIZE;
const MIN_FREQ: f32 = 30.0;
const MAX_FREQ: f32 = 3200.0;

enum KeyColour {
    White,
    Black,
}

const FADE: f32 = 0.9;
const PIN: i32 = 10;
// const NUM_LEDS: usize = 144;
const NUM_LEDS: usize = NUM_BINS;
// const DELAY: time::Duration = time::Duration::from_millis(600);

const LEDS: bool = false;

const BLACK_KEYS: [usize; 5] = [1, 4, 6, 9, 11];
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

    let mut display = display_impl(); // #[cfg(feature = "leds")]
    // let mut ws = Ws2812Rpi::new(NUM_LEDS as i32, PIN).unwrap();
    // // GPIO Pin 10 is SPI
    // // Other modes and PINs are available depending on the Raspberry Pi revision
    // // Additional OS configuration might be needed for any mode.
    // // Check https://github.com/jgarff/rpi_ws281x for more information.
    //
    //
    // let mut data: [RGB8; NUM_LEDS] = [RGB8::default(); NUM_LEDS];
    // let empty: [RGB8; NUM_LEDS] = [RGB8::default(); NUM_LEDS];

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

    // turn off the cursor
    print!("\x1B[?25l");

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
        let fncs = combined(&[&divide_by_N_sqrt, &scale_to_zero_to_one]);
        let spectrum = samples_fft_to_spectrum(
            &hann_window,
            sample_rate,
            FrequencyLimit::Range(MIN_FREQ, MAX_FREQ),
            Some(&divide_by_N_sqrt),
        )?;
        let new_bins = spectrum::bin_magnitudes(spectrum);

        // #[cfg(feature = "leds")]
        // visualize_bins_led(&mut ws, new_bins, &mut peak_magnitudes);
        //
        // #[cfg(not(feature = "leds"))]
        display.visualize_bins(new_bins, &mut peak_magnitudes);

        //     ws.write(data.iter().cloned()).unwrap();
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

fn display_impl() -> Box<dyn display::Display> {
    if cfg!(feature = "leds") {
        Box::new(leds::LEDs::new())
    } else {
        Box::new(terminal::Terminal::new())
    }
}
// #[cfg(feature = "leds")]
// fn visualize_bins_led(ws: &mut Ws2812Rpi, bins: Vec<f32>, peak_magnitudes: &mut Vec<f32>) {
//     let mut lights: [RGB8; NUM_LEDS] = [RGB8::default(); NUM_LEDS];
//     // let mut data: [RGB8; NUM_LEDS] = [RGB8::default(); NUM_LEDS];
//     for (i, &magnitude) in bins.iter().enumerate() {
//         let note_index = key_number_to_index(i + 1);
//         let _key_colour: KeyColour = if BLACK_KEYS.contains(&note_index) {
//             KeyColour::Black
//         } else {
//             KeyColour::White
//         };
//         if magnitude > peak_magnitudes[i] {
//             peak_magnitudes[i] = magnitude;
//         } else {
//             peak_magnitudes[i] *= FADE;
//         }
//         let brightness = (peak_magnitudes[i] * 32.0).min(255.0) as u8;
//         lights[i].r = brightness;
//         // lights[i].g = brightness;
//         lights[i].b = brightness / 8;
//     }
//     ws.write(lights.iter().cloned()).unwrap();
// }

// #[cfg(not(feature = "leds"))]
// fn visualize_bins(bins: Vec<f32>, peak_magnitudes: &mut Vec<f32>) {
//     let mut lights: Vec<String> = Vec::with_capacity(spectrum::NUM_BINS);
//
//     let black_keys = [1, 4, 6, 9, 11];
//     for (i, &magnitude) in bins.iter().enumerate() {
//         let note_index = key_number_to_index(i + 1);
//         let key_colour: KeyColour = if black_keys.contains(&note_index) {
//             KeyColour::Black
//         } else {
//             KeyColour::White
//         };
//         if magnitude > peak_magnitudes[i] {
//             peak_magnitudes[i] = magnitude;
//         } else {
//             peak_magnitudes[i] *= FADE;
//         }
//
//         let brightness = (peak_magnitudes[i] * 255.0).min(255.0) as u8;
//         // let brightness = 255.0;
//         // let character = "●";
//         let character = "█";
//         // let character = "■";
//
//         let colour = match key_colour {
//             KeyColour::Black => {
//                 format!("0;{0};{1}", brightness / 2, brightness / 2)
//             }
//             KeyColour::White => {
//                 format!("{0};{0};{0}", brightness)
//             }
//         };
//         lights.push(format!(
//             // "\x1B[38;2;{0};{0};0m{1}\x1B[0m",
//             // "\x1B[38;2;{0};{0};0m{1}\x1B[0m",
//             "\x1B[38;2;{0}m{1}\x1B[0m",
//             colour, character
//         ));
//     }
//     // lights.join(""),
//     print!("\x1B[2J\x1B[1;1H{}\n{}", lights.join(""), lights.join(""),);
//     // print!("{}\n", lights.join(""));
// }
