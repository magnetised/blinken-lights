#![allow(dead_code)]
use smart_leds::RGB8;
use ws281x_rpi::Ws2812Rpi;

use crate::display;
use crate::piano::{KeyColour, key_colour};

const NUM_LEDS: usize = 144;
const PIN: i32 = 10;

pub struct LEDs {
    leds: Ws2812Rpi,
    data: Vec<RGB8>,
}

impl LEDs {
    pub fn new() -> Self {
        let ws = Ws2812Rpi::new(NUM_LEDS as i32, PIN).unwrap();
        LEDs {
            leds: ws,
            data: vec![RGB8::default(); NUM_LEDS],
        }
    }
    fn set_colour(&mut self, l: usize, rgb: display::RGB) {
        let (r, g, b) = rgb;
        self.data[l].r = r;
        self.data[l].g = g;
        self.data[l].b = b;
    }
}

impl display::Display for LEDs {
    fn visualize_bins(
        &mut self,
        bins: &Vec<f32>,
        peak_magnitudes: &mut Vec<f32>,
        config: &display::DisplayConfig,
    ) {
        // offset because we don't use all the leds
        let mut l: usize = 5;
        for (i, &magnitude) in bins.iter().enumerate() {
            if l >= NUM_LEDS {
                panic!("led index out of bounds {}", l);
            }
            if magnitude > peak_magnitudes[i] {
                peak_magnitudes[i] = magnitude;
            } else {
                // eprintln!("fade: {}", config.fade);
                peak_magnitudes[i] *= config.fade;
            }
            let brightness = peak_magnitudes[i];
            match key_colour(i + 1) {
                KeyColour::White => {
                    let rgb = config.white_colour(brightness);
                    self.set_colour(l, rgb);
                    self.set_colour(l + 1, rgb);
                    self.set_colour(l + 2, rgb);
                    l = l + 3;
                }
                KeyColour::Black => {
                    let rgb = config.black_colour(brightness);
                    self.set_colour(l, rgb);
                    l = l + 1;
                }
            }
        }
        smart_leds::SmartLedsWrite::write(
            &mut self.leds,
            // smart_leds::gamma(self.data.iter().copied()),
            self.data.iter().copied(),
        )
        .unwrap();
    }
    fn reset(&mut self) {
        // self.data.fill(RGB8::default());
        let blank = vec![RGB8::default(); NUM_LEDS];
        smart_leds::SmartLedsWrite::write(
            &mut self.leds,
            // smart_leds::gamma(self.data.iter().copied()),
            blank.iter().copied(),
        );
    }
}
