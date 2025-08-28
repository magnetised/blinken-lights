use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use std::time::Duration;

use spectrum_analyzer::scaling::divide_by_N_sqrt;
use spectrum_analyzer::windows::hann_window;
use spectrum_analyzer::{samples_fft_to_spectrum, FrequencyLimit, FrequencySpectrum};

use ringbuf::{traits::*, HeapRb};

// https://github.com/RustAudio/cpal/issues/902
// https://docs.rs/rtrb/latest/rtrb/

const NUM_BINS: usize = 88;
const MIN_FREQ: f32 = 20.0;
const MAX_FREQ: f32 = 4200.0;
const FADE: f32 = 0.98;

const SAMPLE_SIZE: usize = 8192;
const RINGBUFFER_SIZE: usize = SAMPLE_SIZE;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let ringbuf = ringbuf::HeapRb::<f32>::new(RINGBUFFER_SIZE);
    // let (_producer, mut consumer) = ringbuf.split();

    // let (producer, mut consumer) = rtrb::RingBuffer::<f32>::new(RINGBUFFER_SIZE);

    // let (_stream, rx) = setup_audio_capture(producer)?;
    let shared_buffer = Arc::new(Mutex::new(ringbuf));

    let producer_buffer = Arc::clone(&shared_buffer);
    let consumer_buffer = Arc::clone(&shared_buffer);
    // let bins_clone = Arc::clone(&bins);

    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .expect("no input device available");
    let config = device
        .default_input_config()
        .expect("no default input config");

    // let (tx, rx) = mpsc::channel();

    let mut stream_config: cpal::StreamConfig = config.into();

    stream_config.buffer_size = cpal::BufferSize::Fixed(256 as u32);

    let my_mutex = Mutex::new(5);
    let mut peak_magnitudes = vec![0.0; NUM_BINS];

    let stream = device.build_input_stream(
        &stream_config,
        move |samples: &[f32], _: &cpal::InputCallbackInfo| {
            if let Ok(mut buffer) = producer_buffer.lock() {
                buffer.push_iter_overwrite(&mut samples.iter().copied());
            }
            // let chunk = producer.write_chunk_uninit(samples.len()).unwrap();
            // chunk.fill_from_iter(samples.iter().copied());
            // if tx.send(samples.len()).is_err() {
            //     // The receiver has been dropped, so we can stop the thread.
            //     eprintln!("error");
            // }
            // thread::sleep(Duration::from_millis(6));
        },
        |err| eprintln!("an error occurred on stream: {}", err),
        None,
    )?;

    stream.play()?;

    // thread::spawn(move || {
    loop {
        thread::sleep(Duration::from_millis(5));
        if let Ok(mut buffer) = consumer_buffer.lock() {
            // if let Ok(lock) = my_mutex.lock() {
            if buffer.is_full() {
                let mut samples = [0.0f32; SAMPLE_SIZE];
                // let read_chunk = consumer.read_chunk(SAMPLE_SIZE).unwrap();
                let bytes_read = buffer.pop_slice(&mut samples);
                // let samples = read_chunk.into_iter().collect::<Vec<f32>>();
                let hann_window = hann_window(&samples);
                let spectrum = samples_fft_to_spectrum(
                    &hann_window,
                    44100,
                    FrequencyLimit::Range(MIN_FREQ, MAX_FREQ),
                    Some(&divide_by_N_sqrt),
                )
                .unwrap();
                let new_bins = bin_magnitudes(spectrum);
                visualize_bins(new_bins, &mut peak_magnitudes);
                // if let Ok(mut bins_lock) = bins_clone.lock() {
                //     *bins_lock = new_bins;
                // }
            }
        }
    }
    // });

    // loop {
    //     // turn off the cursor
    //     print!("\x1B[?25l");
    //     if let Ok(bins_lock) = bins.lock() {
    //         visualize_bins(bins_lock.clone(), &mut peak_magnitudes);
    //     }
    //     thread::sleep(Duration::from_millis(6));
    // }
}

// fn setup_audio_capture(
//     mut producer: ringbuf::Caching<Arc<SharedRb<Heap<f32>>>, true, false>,
// ) -> Result<(cpal::Stream, mpsc::Receiver<usize>), Box<dyn std::error::Error>> {
//     let host = cpal::default_host();
//     let device = host
//         .default_input_device()
//         .expect("no input device available");
//     let config = device
//         .default_input_config()
//         .expect("no default input config");
//
//     let (tx, rx) = mpsc::channel();
//
//     let mut stream_config: cpal::StreamConfig = config.into();
//     stream_config.buffer_size = cpal::BufferSize::Fixed(256 as u32);
//
//     let stream = device.build_input_stream(
//         &stream_config,
//         move |samples: &[f32], _: &cpal::InputCallbackInfo| {
//             producer.push_iter_overwrite(&mut samples.iter().copied());
//             // let chunk = producer.write_chunk_uninit(samples.len()).unwrap();
//             // chunk.fill_from_iter(samples.iter().copied());
//             if tx.send(samples.len()).is_err() {
//                 // The receiver has been dropped, so we can stop the thread.
//                 eprintln!("error");
//             }
//             // thread::sleep(Duration::from_millis(6));
//         },
//         |err| eprintln!("an error occurred on stream: {}", err),
//         None,
//     )?;
//
//     stream.play()?;
//     Ok((stream, rx))
// }

fn bin_magnitudes(spectrum: FrequencySpectrum) -> Vec<f32> {
    let mut bins = vec![0.0; NUM_BINS];

    for (freq, value) in spectrum.data().iter() {
        let bin_index = frequency_to_nearest_key(freq.val());
        if bin_index < NUM_BINS {
            bins[bin_index] += value.val();
        }
    }

    bins
}

fn visualize_bins(bins: Vec<f32>, peak_magnitudes: &mut Vec<f32>) {
    let mut lights: Vec<String> = Vec::with_capacity(NUM_BINS);

    for (i, &magnitude) in bins.iter().enumerate() {
        if magnitude > peak_magnitudes[i] {
            peak_magnitudes[i] = magnitude;
        } else {
            peak_magnitudes[i] *= FADE;
        }

        let brightness = (peak_magnitudes[i] * 255.0).min(255.0) as u8;
        let character = "●";

        lights.push(format!(
            "\x1B[38;2;{0};{0};0m{1}\x1B[0m",
            brightness, character
        ));
    }
    print!("\x1B[2J\x1B[1;1H{}", lights.join(""));
    // print!("{}\n", lights.join(""));
}

fn frequency_to_key_number(frequency: f32) -> f32 {
    12.0 * (frequency / 440.0).log2() + 49.0
}

// Function to get the nearest integer key number
fn frequency_to_nearest_key(frequency: f32) -> usize {
    let key = (frequency_to_key_number(frequency) - 0.5).ceil() as usize;
    key - 1
}

#[allow(dead_code)]
fn key_number_to_name(key_number: usize) -> String {
    if key_number < 1 || key_number > 88 {
        return "Out of range".to_string();
    }

    // Piano starts at A0 (key 1), A4 is key 49
    let note_names = [
        "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#",
    ];
    let key_index = key_number - 1; // Convert to 0-based index

    // Calculate octave and note
    let octave = if key_index < 3 {
        // A0, A#0, B0
        0
    } else {
        // C1 starts at key 4 (index 3)
        (key_index - 3) / 12 + 1
    };

    let note_index = if key_index < 3 {
        // A0, A#0, B0
        key_index
    } else {
        // C1 and beyond
        (key_index - 3) % 12 + 3
    };

    let note_index = note_index % 12;
    format!("{}{}", note_names[note_index], octave)
}
