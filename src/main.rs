use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use std::time::Duration;

use spectrum_analyzer::scaling::divide_by_N_sqrt;
// use spectrum_analyzer::windows::hann_window;
use spectrum_analyzer::{samples_fft_to_spectrum, FrequencyLimit, FrequencySpectrum};

// https://github.com/RustAudio/cpal/issues/902
// https://docs.rs/rtrb/latest/rtrb/

const NUM_BINS: usize = 128;
// const RESOLUTION: usize = 4096;
const MIN_FREQ: f32 = 100.0;
const MAX_FREQ: f32 = 4000.0;
// const SENSITIVITY: f32 = 0.2;
const THRESHOLD: f32 = 0.01;
const FADE: f32 = 0.9;

const SAMPLE_SIZE: usize = 1024;
const RINGBUFFER_SIZE: usize = SAMPLE_SIZE * 2;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let (producer, mut consumer) = rtrb::RingBuffer::<f32>::new(RINGBUFFER_SIZE);
    let (_stream, rx) = setup_audio_capture(producer)?;
    let bins = Arc::new(Mutex::new(vec![0.0; NUM_BINS]));

    let bins_clone = Arc::clone(&bins);

    thread::spawn(move || {
        loop {
            match rx.recv() {
                Ok(_count) => {
                    if consumer.slots() >= SAMPLE_SIZE {
                        let read_chunk = consumer.read_chunk(SAMPLE_SIZE).unwrap();
                        let samples = read_chunk.into_iter().collect::<Vec<f32>>();
                        // let hann_window = hann_window(&samples);
                        // let buffer: Vec<Complex<f32>> = data.iter().map(|&s| Complex::new(s, 0.0)).collect();
                        let spectrum = samples_fft_to_spectrum(
                            &samples,
                            // sampling rate
                            44100,
                            // optional frequency limit: e.g. only interested in frequencies 50 <= f <= 150?
                            // FrequencyLimit::All,
                            FrequencyLimit::Range(MIN_FREQ, MAX_FREQ),
                            // optional scale
                            Some(&divide_by_N_sqrt),
                        )
                        .unwrap();
                        // let magnitudes = process_fft(buffer, &fft);
                        let new_bins = bin_magnitudes(spectrum);
                        if let Ok(mut bins_lock) = bins_clone.lock() {
                            *bins_lock = new_bins;
                        }
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

fn setup_audio_capture(
    mut producer: rtrb::Producer<f32>,
) -> Result<(cpal::Stream, mpsc::Receiver<usize>), Box<dyn std::error::Error>> {
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .expect("no input device available");
    let config = device
        .default_input_config()
        .expect("no default input config");
    let (tx, rx) = mpsc::channel();

    let mut stream_config: cpal::StreamConfig = config.into();
    stream_config.buffer_size = cpal::BufferSize::Fixed(SAMPLE_SIZE as u32);

    let stream = device.build_input_stream(
        &stream_config,
        move |samples: &[f32], _: &cpal::InputCallbackInfo| {
            // println!("here {}", samples.len());
            let chunk = producer.write_chunk_uninit(samples.len()).unwrap();
            chunk.fill_from_iter(samples.iter().copied());
            if tx.send(samples.len()).is_err() {
                // The receiver has been dropped, so we can stop the thread.
                eprintln!("error");
            }
        },
        |err| eprintln!("an error occurred on stream: {}", err),
        None,
    )?;

    stream.play()?;
    Ok((stream, rx))
}

fn bin_magnitudes(spectrum: FrequencySpectrum) -> Vec<f32> {
    let mut bins = vec![0.0; NUM_BINS];
    let mut counts = vec![0; NUM_BINS];
    // let frequency_resolution = 44100.0 / RESOLUTION as f32;

    for (freq, value) in spectrum.data().iter() {
        let bin_index = ((((freq.val()) - MIN_FREQ) / (MAX_FREQ - MIN_FREQ) * NUM_BINS as f32)
            as usize)
            .min(NUM_BINS - 1);
        if bin_index < NUM_BINS {
            bins[bin_index] += value.val();
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
        // let mut mag = magnitude;
        // const THRESHOLD: f32 = 1.0;
        //
        // if mag < THRESHOLD {
        //     mag = 0.0;
        // }

        if magnitude > peak_magnitudes[i] {
            peak_magnitudes[i] = magnitude;
        } else {
            peak_magnitudes[i] *= 0.9;
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
