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
}

impl LEDs {
    pub fn new() -> Self {
        let ws = Ws2812Rpi::new(NUM_LEDS as i32, PIN).unwrap();
        LEDs { leds: ws }
    }
}

impl display::Display for LEDs {
    fn visualize_bins(&mut self, bins: Vec<f32>, peak_magnitudes: &mut Vec<f32>) {
        let mut lights = vec![RGB8::default(); NUM_LEDS];
        // let mut data: [RGB8; NUM_LEDS] = [RGB8::default(); NUM_LEDS];
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
            lights[i].r = brightness;
            // lights[i].g = brightness;
            lights[i].b = brightness / 8;
        }
        smart_leds::SmartLedsWrite::write(&mut self.leds, lights.iter().cloned()).unwrap();
    }
}
fn test() {
    // println!("Program start");
    //
    // // GPIO Pin 10 is SPI
    // // Other modes and PINs are available depending on the Raspberry Pi revision
    // // Additional OS configuration might be needed for any mode.
    // // Check https://github.com/jgarff/rpi_ws281x for more information.
    // const PIN: i32 = 10;
    // const NUM_LEDS: usize = 144;
    // const DELAY: time::Duration = time::Duration::from_millis(600);
    //
    // let mut ws = Ws2812Rpi::new(NUM_LEDS as i32, PIN).unwrap();
    //
    // let mut data: [RGB8; NUM_LEDS] = [RGB8::default(); NUM_LEDS];
    // let empty: [RGB8; NUM_LEDS] = [RGB8::default(); NUM_LEDS];
    //
    // // Blink the LED's in a blue-green-red-white pattern.
    // for led in data.iter_mut().step_by(4) {
    //     led.b = 32;
    // }
    //
    // if NUM_LEDS > 1 {
    //     for led in data.iter_mut().skip(1).step_by(4) {
    //         led.g = 32;
    //     }
    // }
    //
    // if NUM_LEDS > 2 {
    //     for led in data.iter_mut().skip(2).step_by(4) {
    //         led.r = 32;
    //     }
    // }
    //
    // if NUM_LEDS > 3 {
    //     for led in data.iter_mut().skip(3).step_by(4) {
    //         led.r = 32;
    //         led.g = 32;
    //         led.b = 32;
    //     }
    // }
    //
    // loop {
    //     // On
    //     println!("LEDS on");
    //     ws.write(data.iter().cloned()).unwrap();
    //     thread::sleep(DELAY);
    //
    //     // Off
    //     println!("LEDS off");
    //     ws.write(empty.iter().cloned()).unwrap();
    //     thread::sleep(DELAY);
    // }
}
