use smart_leds::RGB8;
use ws281x_rpi::Ws2812Rpi;

use crate::display;
use crate::piano::{KeyColour, key_colour};

use angular_units::Deg;
use prisma::Hsi;

const FADE: f32 = 0.95;
const NUM_LEDS: usize = 144;
const PIN: i32 = 10;
const BRIGHTNESS: f32 = 64.0;

pub struct LEDs {
    leds: Ws2812Rpi,
    data: Vec<RGB8>,
    white: Hsi<f32>,
    black: Hsi<f32>,
}

impl LEDs {
    pub fn new() -> Self {
        let ws = Ws2812Rpi::new(NUM_LEDS as i32, PIN).unwrap();
        LEDs {
            leds: ws,
            data: vec![RGB8::default(); NUM_LEDS],
            white: Hsi::new(Deg(1.0), 1.0, 1.0),
            black: Hsi::new(Deg(350.0), 1.0, 1.0),
        }
    }
    fn white_key(&mut self, l: usize, brightness: f32) {
        self.set_colour(l, self.white, brightness);
    }
    fn black_key(&mut self, l: usize, brightness: f32) {
        self.set_colour(l, self.black, brightness);
    }
    fn set_colour(&mut self, l: usize, src_colour: Hsi<f32>, brightness: f32) {
        let mut colour = src_colour.clone();
        colour.set_intensity(brightness.min(1.0));
        let rgb = colour.to_rgb(prisma::HsiOutOfGamutMode::Clip);
        self.data[l].r = (rgb.red() * 255.0).round() as u8;
        self.data[l].g = (rgb.green() * 255.0).round() as u8;
        self.data[l].b = (rgb.blue() * 255.0).round() as u8;
    }
}

impl display::Display for LEDs {
    fn visualize_bins(&mut self, bins: Vec<f32>, peak_magnitudes: &mut Vec<f32>) {
        // offset by 2 because we only use 140 out of the 144 leds
        let mut l: usize = 2;
        for (i, &magnitude) in bins.iter().enumerate() {
            if l >= NUM_LEDS {
                panic!("led index out of bounds {}", l);
            }
            if magnitude > peak_magnitudes[i] {
                peak_magnitudes[i] = magnitude;
            } else {
                peak_magnitudes[i] *= FADE;
            }
            // let brightness = (peak_magnitudes[i] * BRIGHTNESS).min(255.0) as u8;
            let brightness = peak_magnitudes[i];
            match key_colour(i + 1) {
                KeyColour::White => {
                    self.white_key(l, brightness);
                    self.white_key(l + 1, brightness);
                    l = l + 2;
                }
                KeyColour::Black => {
                    self.black_key(l, brightness);
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
}
