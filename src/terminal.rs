#![allow(dead_code)]

use crate::display;

use crate::piano::{key_colour, KeyColour};

pub struct Terminal {}

impl Terminal {
    pub fn new() -> Self {
        Terminal {}
    }
}

impl display::Display for Terminal {
    // fn visualize_bins(
    //     &mut self,
    //     _bins: Vec<f32>,
    //     _peak_magnitudes: &mut Vec<f32>,
    //     _config: &display::DisplayConfig,
    // ) {
    // }
    fn visualize_bins(
        &mut self,
        bins: Vec<f32>,
        peak_magnitudes: &mut Vec<f32>,
        config: &display::DisplayConfig,
    ) {
        let mut lights: Vec<String> = Vec::with_capacity(bins.len());

        for (i, &magnitude) in bins.iter().enumerate() {
            let key_colour = key_colour(i + 1);
            if magnitude > peak_magnitudes[i] {
                peak_magnitudes[i] = magnitude;
            } else {
                peak_magnitudes[i] *= config.fade;
            }

            let brightness = peak_magnitudes[i];
            // let brightness = 255.0;
            // let character = "●";
            let character = "█";
            // let character = "■";

            let colour = match key_colour {
                KeyColour::Black => {
                    let (r, g, b) = config.black_colour(brightness);
                    format!("{};{};{}", r, g, b)
                }
                KeyColour::White => {
                    let (r, g, b) = config.white_colour(brightness);
                    format!("{};{};{}", r, g, b)
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
