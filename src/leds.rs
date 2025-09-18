use smart_leds::{Brightness, RGB8};
// use smart_leds_trait::SmartLedsWrite;
use ws281x_rpi::Ws2812Rpi;

use crate::display;
use crate::piano::{KeyColour, key_colour};

const FADE: f32 = 0.9;
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
    fn white_key(&mut self, l: usize, brightness: u8) {
        self.data[l].r = brightness;
        self.data[l].g = 0;
        self.data[l].b = brightness / 8;
    }
    fn black_key(&mut self, l: usize, brightness: u8) {
        self.data[l].r = brightness;
        self.data[l].g = brightness / 8;
        self.data[l].b = 0;
    }
}

impl display::Display for LEDs {
    fn visualize_bins(&mut self, bins: Vec<f32>, peak_magnitudes: &mut Vec<f32>) {
        let mut l: usize = 0;
        for (i, &magnitude) in bins.iter().enumerate() {
            if l >= NUM_LEDS {
                panic!("led index out of bounds {}", l);
            }
            if magnitude > peak_magnitudes[i] {
                peak_magnitudes[i] = magnitude;
            } else {
                peak_magnitudes[i] *= FADE;
            }
            let brightness = (peak_magnitudes[i] * 32.0).min(255.0) as u8;
            match key_colour(i + 1) {
                KeyColour::White => {
                    self.white_key(l, brightness);
                    self.white_key(l + 1, brightness);
                    // self.data[l].r = brightness;
                    // // lights[l].g = brightness;
                    // self.data[l].b = brightness / 8;
                    //
                    // self.data[l + 1].r = brightness;
                    // // lights[l].g = brightness;
                    // self.data[l + 1].b = brightness / 8;
                    l = l + 2;
                }
                KeyColour::Black => {
                    self.black_key(l, brightness);
                    // self.data[l].r = brightness;
                    // self.data[l].g = brightness;
                    // self.data[l].b = brightness / 8;
                    l = l + 1;
                }
            }
        }
        smart_leds::SmartLedsWrite::write(&mut self.leds, self.data.iter().copied()).unwrap();
    }
}
