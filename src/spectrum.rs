use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

use std::sync::{Arc, Mutex};

use spectrum_analyzer::scaling::divide_by_N_sqrt;
use spectrum_analyzer::windows::hann_window;
use spectrum_analyzer::{FrequencyLimit, FrequencySpectrum, samples_fft_to_spectrum};

use crate::piano;
use ringbuf::traits::*;

pub const NUM_BINS: usize = 88;
const SAMPLE_SIZE: usize = 8192;
const RINGBUFFER_SIZE: usize = SAMPLE_SIZE;
const MIN_FREQ: f32 = 30.0;
const MAX_FREQ: f32 = 4200.0;

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
        let new_bins = piano::bin_magnitudes(spectrum);

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
    let new_bins = piano::bin_magnitudes(spectrum);

    new_bins
}
