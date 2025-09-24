use angular_units::Deg;
use prisma::{FromColor, Hsi, Hsv, Rgb};

use serde::{self, Deserialize, Serialize};
use serde_json::Result;

pub type RGB = (u8, u8, u8);

#[derive(Serialize, Deserialize, Debug)]
pub struct DisplayConfig {
    white: f32,
    black: f32,
    pub fade: f32,
    pub brightness: f32,
    pub sensitivity: f32,
}

impl DisplayConfig {
    pub fn default() -> Self {
        DisplayConfig {
            white: (1.0),
            black: (350.0),
            fade: 0.9,
            brightness: 0.5,
            sensitivity: 1.0,
        }
    }
    pub fn decode(json: &str) -> Result<Self> {
        serde_json::from_str(json)
    }
    pub fn black_colour(&self, intensity: f32) -> RGB {
        self.set_colour(self.black, intensity)
    }
    pub fn white_colour(&self, intensity: f32) -> RGB {
        self.set_colour(self.white, intensity)
    }

    fn set_colour(&self, src_colour: f32, intensity: f32) -> RGB {
        let colour = Hsv::new(
            Deg(src_colour.clamp(0.0, 359.9)),
            1.0,
            (intensity * self.brightness).clamp(0.0, 1.0),
        );
        let rgb = Rgb::from_color(&colour);
        // let rgb = colour.to_rgb(prisma::HsiOutOfGamutMode::Preserve);
        (
            (rgb.red() * 255.0).round() as u8,
            (rgb.green() * 255.0).round() as u8,
            (rgb.blue() * 255.0).round() as u8,
        )
    }
}

pub trait Display {
    fn visualize_bins(
        &mut self,
        bins: &Vec<f32>,
        peak_magnitudes: &mut Vec<f32>,
        config: &DisplayConfig,
    ) -> ();
    fn reset(&mut self) -> ();
}
