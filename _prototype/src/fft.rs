use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use rustfft::num_complex::Complex;
use rustfft::FftPlanner;
use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use std::time::Duration;

const NUM_BINS: usize = 128;
const RESOLUTION: usize = 4096;
const MIN_FREQ: f32 = 1000.0;
const MAX_FREQ: f32 = 4000.0;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let (_stream, rx) = setup_audio_capture()?;
    let bins = Arc::new(Mutex::new(vec![0.0; NUM_BINS]));

    let bins_clone = Arc::clone(&bins);
    thread::spawn(move || {
        let mut planner = FftPlanner::new();
        let fft = planner.plan_fft_forward(RESOLUTION);
        loop {
            match rx.recv() {
                Ok(buffer) => {
                    let magnitudes = process_fft(buffer, &fft);
                    let new_bins = bin_magnitudes(magnitudes);
                    if let Ok(mut bins_lock) = bins_clone.lock() {
                        *bins_lock = new_bins;
                    }
                }
                Err(_) => break,
            }
        }
    });

    let mut peak_magnitudes = vec![0.0; NUM_BINS];
    loop {
        thread::sleep(Duration::from_millis(16));
        if let Ok(bins_lock) = bins.lock() {
            visualize_bins(bins_lock.clone(), &mut peak_magnitudes);
        }
    }
}

fn setup_audio_capture() -> Result<(cpal::Stream, mpsc::Receiver<Vec<Complex<f32>>>), Box<dyn std::error::Error>> {
    let host = cpal::default_host();
    let device = host.default_input_device().expect("no input device available");
    let config = device.default_input_config().expect("no default input config");
    let (tx, rx) = mpsc::channel();

    let stream = device.build_input_stream(
        &config.into(),
        move |data: &[f32], _: &cpal::InputCallbackInfo| {
            let buffer: Vec<Complex<f32>> = data.iter().map(|&s| Complex::new(s, 0.0)).collect();
            if tx.send(buffer).is_err() {
                // The receiver has been dropped, so we can stop the thread.
            }
        },
        |err| eprintln!("an error occurred on stream: {}", err),
        None,
    )?;

    stream.play()?;
    Ok((stream, rx))
}

fn process_fft(mut buffer: Vec<Complex<f32>>, fft: &std::sync::Arc<dyn rustfft::Fft<f32>>) -> Vec<f32> {
    if buffer.len() > RESOLUTION {
        buffer.resize(RESOLUTION, Complex::new(0.0, 0.0));
    } else {
        buffer.resize(RESOLUTION, Complex::new(0.0, 0.0));
    }
    fft.process(&mut buffer);
    buffer.iter().take(buffer.len() / 2).map(|c| (c.re.powi(2) + c.im.powi(2)).sqrt()).collect()
}

fn bin_magnitudes(magnitudes: Vec<f32>) -> Vec<f32> {
    let mut bins = vec![0.0; NUM_BINS];
    let mut counts = vec![0; NUM_BINS];
    let frequency_resolution = 44100.0 / RESOLUTION as f32;

    for (i, &magnitude) in magnitudes.iter().enumerate() {
        let freq = i as f32 * frequency_resolution;
        if !(MIN_FREQ..=MAX_FREQ).contains(&freq) {
            continue;
        }
        let bin_index = (((freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ) * NUM_BINS as f32) as usize).min(NUM_BINS - 1);
        if bin_index < NUM_BINS {
            bins[bin_index] += magnitude;
            counts[bin_index] += 1;
        }
    }

    for i in 0..NUM_BINS {
        if counts[i] > 0 {
            bins[i] /= counts[i] as f32;
        }
    }
    bins
}

fn visualize_bins(bins: Vec<f32>, peak_magnitudes: &mut Vec<f32>) {
    let mut lines: Vec<String> = Vec::with_capacity(NUM_BINS);

    for (i, &magnitude) in bins.iter().enumerate() {
        let mut mag = magnitude;
        const THRESHOLD: f32 = 1.0;

        if mag < THRESHOLD {
            mag = 0.0;
        }

        if mag > peak_magnitudes[i] {
            peak_magnitudes[i] = mag;
        } else {
            peak_magnitudes[i] *= 0.8;
        }

        let brightness = (peak_magnitudes[i] * 255.0).min(255.0) as u8;
        let character = "●";

        lines.push(format!(
            "\x1B[38;2;{0};{0};0m{1}\x1B[0m",
            brightness, character
        ));
    }
    print!("\x1B[2J\x1B[1;1H{}", lines.join(""));
}
