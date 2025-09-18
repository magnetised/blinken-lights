use smart_leds::RGB8;
// use smart_leds_trait::SmartLedsWrite;
use ws281x_rpi::Ws2812Rpi;

use crate::display;
use crate::spectrum;

const FADE: f32 = 0.9;
const NUM_LEDS: usize = 88;
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
}

impl display::Display for LEDs {
    fn visualize_bins(&mut self, bins: Vec<f32>, peak_magnitudes: &mut Vec<f32>) {
        for (i, &magnitude) in bins.iter().enumerate() {
            let note_index = spectrum::key_number_to_index(i + 1);
            let _key_colour: spectrum::KeyColour = if spectrum::BLACK_KEYS.contains(&note_index) {
                spectrum::KeyColour::Black
            } else {
                spectrum::KeyColour::White
            };
            if magnitude > peak_magnitudes[i] {
                peak_magnitudes[i] = magnitude;
            } else {
                peak_magnitudes[i] *= FADE;
            }
            let brightness = (peak_magnitudes[i] * 32.0).min(255.0) as u8;
            self.data[i].r = brightness;
            // lights[i].g = brightness;
            self.data[i].b = brightness / 8;
        }
        smart_leds::SmartLedsWrite::write(&mut self.leds, self.data.iter().copied()).unwrap();
    }
}
