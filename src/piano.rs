pub enum KeyColour {
    White,
    Black,
}

const BLACK_KEYS: [usize; 5] = [1, 4, 6, 9, 11];

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

fn key_colour(key_number: usize) -> KeyColour {
    let note_index = key_number_to_index(key_number + 1);
    if BLACK_KEYS.contains(&note_index) {
        KeyColour::Black
    } else {
        KeyColour::White
    }
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
    (key - 1, decay)
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
