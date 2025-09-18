use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

use std::sync::{Arc, Mutex};

use spectrum_analyzer::scaling::divide_by_N_sqrt;
use spectrum_analyzer::windows::hann_window;
use spectrum_analyzer::{FrequencyLimit, FrequencySpectrum, samples_fft_to_spectrum};

use ringbuf::traits::*;

pub const NUM_BINS: usize = 88;
const SAMPLE_SIZE: usize = 8192;
const RINGBUFFER_SIZE: usize = SAMPLE_SIZE;
const MIN_FREQ: f32 = 30.0;
const MAX_FREQ: f32 = 4200.0;
pub const BLACK_KEYS: [usize; 5] = [1, 4, 6, 9, 11];

pub enum KeyColour {
    White,
    Black,
}

// struct with ref to consumer side of ring buffer
// plus audio info like sammple_rate
pub struct SpectrumConsumer {
    sample_rate: u32,
    buffer: Arc<Mutex<ringbuf::HeapRb<f32>>>,
}

impl SpectrumConsumer {
    pub fn read(&self) -> Vec<f32> {
        let mut samples = [0.0f32; SAMPLE_SIZE];
        if let Ok(buffer) = self.buffer.lock() {
            let _samples_read = buffer.peek_slice(&mut samples);
        }
        let hann_window = hann_window(&samples);
        let spectrum = samples_fft_to_spectrum(
            &hann_window,
            self.sample_rate,
            FrequencyLimit::Range(MIN_FREQ, MAX_FREQ),
            Some(&divide_by_N_sqrt),
        )
        .unwrap();
        let new_bins = bin_magnitudes(spectrum);

        new_bins
    }
}

pub fn start() -> Result<SpectrumConsumer, cpal::PlayStreamError> {
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

    stream_config.buffer_size = cpal::BufferSize::Fixed(256 as u32);

    // let mut peak_magnitudes = vec![0.0; NUM_BINS];

    let stream = device
        .build_input_stream(
            &stream_config,
            move |samples: &[f32], _: &cpal::InputCallbackInfo| {
                println!("s");
                // for s in samples.into_iter() {
                //
                // }
                if let Ok(mut buffer) = producer_buffer.lock() {
                    buffer.push_iter_overwrite(&mut samples.iter().copied());
                }
            },
            |err| eprintln!("an error occurred on stream: {}", err),
            None,
        )
        .unwrap();
    stream.play()?;

    Ok(SpectrumConsumer {
        buffer: consumer_buffer,
        sample_rate: stream_config.sample_rate.0 as u32,
    })
}

pub fn read(consumer: &SpectrumConsumer) -> Vec<f32> {
    let mut samples = [0.0f32; SAMPLE_SIZE];
    if let Ok(buffer) = consumer.buffer.lock() {
        let _samples_read = buffer.peek_slice(&mut samples);
    }
    let hann_window = hann_window(&samples);
    let spectrum = samples_fft_to_spectrum(
        &hann_window,
        consumer.sample_rate,
        FrequencyLimit::Range(MIN_FREQ, MAX_FREQ),
        Some(&divide_by_N_sqrt),
    )
    .unwrap();
    let new_bins = bin_magnitudes(spectrum);

    new_bins
}

pub fn bin_magnitudes(spectrum: FrequencySpectrum) -> Vec<f32> {
    let mut bins = vec![0.0; NUM_BINS];

    for (freq, value) in spectrum.data().iter() {
        let (bin_index, decay) = frequency_to_nearest_key(freq.val());
        if bin_index < NUM_BINS {
            bins[bin_index] += decay * value.val();
        }
    }

    bins
}

// Function to get the nearest integer key number
fn frequency_to_nearest_key(frequency: f32) -> (usize, f32) {
    let key_position = frequency_to_key_number(frequency);
    let key = key_position.round() as usize;
    let diff = key as f32 - key_position;
    let decay = normal_decay(diff, 0.3);
    // println!(
    //     "{} -> {} {} {} {}",
    //     frequency, key_position, key, diff, decay
    // );
    (key, decay)
}

fn frequency_to_key_number(frequency: f32) -> f32 {
    12.0 * (frequency / 440.0).log2() + 49.0
}

fn key_number_to_frequency(key: usize) -> f32 {
    (440.0 * 2.0_f64.powf((key as f64 - 49.0) / 12.0)) as f32
}

fn normal_decay(x: f32, sigma: f32) -> f32 {
    let x = x.clamp(0.0, 1.0);
    let gaussian = (-0.5 * (x / sigma).powi(2)).exp();
    // Normalize so that f(0) = 1
    gaussian / ((-0.5 * (0.0 / sigma).powi(2)).exp())
}

pub fn key_number_to_index(key_number: usize) -> usize {
    let key_index = key_number - 1; // Convert to 0-based index
    let note_index = if key_index < 3 {
        // A0, A#0, B0
        key_index
    } else {
        // C1 and beyond
        (key_index - 3) % 12 + 3
    };
    note_index % 12
}
