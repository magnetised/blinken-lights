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

// let piano_frequencies: Vec<f64> = vec![
// 1 27.5
// 2 29.1352
// 3 30.8677
// 4 32.7032
// 5 34.6478
// 6 36.7081
// 7 38.8909
// 8 41.2034
// 9 43.6535
// 10 46.2493
// 11 48.9994
// 12 51.9131
// 13 55.0
// 14 58.2705
// 15 61.7354
// 16 65.4064
// 17 69.2957
// 18 73.4162
// 19 77.7817
// 20 82.4069
// 21 87.3071
// 22 92.4986
// 23 97.9989
// 24 103.826
// 25 110.0
// 26 116.541
// 27 123.471
// 28 130.813
// 29 138.591
// 30 146.832
// 31 155.563
// 32 164.814
// 33 174.614
// 34 184.997
// 35 195.998
// 36 207.652
// 37 220.0
// 38 233.082
// 39 246.942
// 40 261.626
// 41 277.183
// 42 293.665
// 43 311.127
// 44 329.628
// 45 349.228
// 46 369.994
// 47 391.995
// 48 415.305
// 49 440.0
// 50 466.164
// 51 493.883
// 52 523.251
// 53 554.365
// 54 587.33
// 55 622.254
// 56 659.255
// 57 698.456
// 58 739.989
// 59 783.991
// 60 830.609
// 61 880.0
// 62 932.328
// 63 987.767
// 64 1046.5
// 65 1108.73
// 66 1174.66
// 67 1244.51
// 68 1318.51
// 69 1396.91
// 70 1479.98
// 71 1567.98
// 72 1661.22
// 73 1760.0
// 74 1864.66
// 75 1975.53
// 76 2093.0
// 77 2217.46
// 78 2349.32
// 79 2489.02
// 80 2637.02
// 81 2793.83
// 82 2959.96
// 83 3135.96
// 84 3322.44
// 85 3520.0
// 86 3729.31
// 87 3951.07
// 88 4186.01

//     27.5000,    // A0
//     29.1352,    // A#0/Bb0
//     30.8677,    // B0
//     32.7032,    // C1
//     34.6478,    // C#1/Db1
//     36.7081,    // D1
//     38.8909,    // D#1/Eb1
//     41.2034,    // E1
//     43.6535,    // F1
//     46.2493,    // F#1/Gb1
//     48.9994,    // G1
//     51.9131,    // G#1/Ab1
//     55.0000,    // A1
//     58.2705,    // A#1/Bb1
//     61.7354,    // B1
//     65.4064,    // C2
//     69.2957,    // C#2/Db2
//     73.4162,    // D2
//     77.7817,    // D#2/Eb2
//     82.4069,    // E2
//     87.3071,    // F2
//     92.4986,    // F#2/Gb2
//     97.9989,    // G2
//     103.826,    // G#2/Ab2
//     110.000,    // A2
//     116.541,    // A#2/Bb2
//     123.471,    // B2
//     130.813,    // C3
//     138.591,    // C#3/Db3
//     146.832,    // D3
//     155.563,    // D#3/Eb3
//     164.814,    // E3
//     174.614,    // F3
//     184.997,    // F#3/Gb3
//     195.998,    // G3
//     207.652,    // G#3/Ab3
//     220.000,    // A3
//     233.082,    // A#3/Bb3
//     246.942,    // B3
//     261.626,    // C4 (Middle C)
//     277.183,    // C#4/Db4
//     293.665,    // D4
//     311.127,    // D#4/Eb4
//     329.628,    // E4
//     349.228,    // F4
//     369.994,    // F#4/Gb4
//     391.995,    // G4
//     415.305,    // G#4/Ab4
//     440.000,    // A4 (Concert pitch)
//     466.164,    // A#4/Bb4
//     493.883,    // B4
//     523.251,    // C5
//     554.365,    // C#5/Db5
//     587.330,    // D5
//     622.254,    // D#5/Eb5
//     659.255,    // E5
//     698.456,    // F5
//     739.989,    // F#5/Gb5
//     783.991,    // G5
//     830.609,    // G#5/Ab5
//     880.000,    // A5
//     932.328,    // A#5/Bb5
//     987.767,    // B5
//     1046.50,    // C6
//     1108.73,    // C#6/Db6
//     1174.66,    // D6
//     1244.51,    // D#6/Eb6
//     1318.51,    // E6
//     1396.91,    // F6
//     1479.98,    // F#6/Gb6
//     1567.98,    // G6
//     1661.22,    // G#6/Ab6
//     1760.00,    // A6
//     1864.66,    // A#6/Bb6
//     1975.53,    // B6
//     2093.00,    // C7
//     2217.46,    // C#7/Db7
//     2349.32,    // D7
//     2489.02,    // D#7/Eb7
//     2637.02,    // E7
//     2793.83,    // F7
//     2959.96,    // F#7/Gb7
//     3135.96,    // G7
//     3322.44,    // G#7/Ab7
//     3520.00,    // A7
//     3729.31,    // A#7/Bb7
//     3951.07,    // B7
//     4186.01,    // C8
// ];
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_frequency_to_nearest_key() {
        assert_eq!(frequency_to_nearest_key(27.5), (1, 1.0));
        assert_eq!(frequency_to_nearest_key(170.0), (33, 0.6505743));
    }
}
