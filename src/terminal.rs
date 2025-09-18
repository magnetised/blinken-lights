use crate::display;

use crate::spectrum::NUM_BINS;

use crate::piano::{KeyColour, key_colour};
const FADE: f32 = 0.9;

pub struct Terminal {}

impl Terminal {
    pub fn new() -> Self {
        Terminal {}
    }
}

impl display::Display for Terminal {
    fn visualize_bins(&mut self, bins: Vec<f32>, peak_magnitudes: &mut Vec<f32>) {
        let mut lights: Vec<String> = Vec::with_capacity(NUM_BINS);

        for (i, &magnitude) in bins.iter().enumerate() {
            let key_colour = key_colour(i + 1);
            if magnitude > peak_magnitudes[i] {
                peak_magnitudes[i] = magnitude;
            } else {
                peak_magnitudes[i] *= FADE;
            }

            let brightness = (peak_magnitudes[i] * 255.0).min(255.0) as u8;
            // let brightness = 255.0;
            // let character = "●";
            let character = "█";
            // let character = "■";

            let colour = match key_colour {
                KeyColour::Black => {
                    format!("0;{0};{1}", brightness / 2, brightness / 2)
                }
                KeyColour::White => {
                    format!("{0};{0};{0}", brightness)
                }
            };
            lights.push(format!(
                // "\x1B[38;2;{0};{0};0m{1}\x1B[0m",
                // "\x1B[38;2;{0};{0};0m{1}\x1B[0m",
                "\x1B[38;2;{0}m{1}\x1B[0m",
                colour, character
            ));
        }
        // lights.join(""),
        print!("\x1B[2J\x1B[1;1H{}\n{}", lights.join(""), lights.join(""),);
        // print!("{}\n", lights.join(""));
    }
}
