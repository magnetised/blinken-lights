use angular_units::Deg;
use prisma::Hsi;

use serde::{self, Deserialize, Serialize};
use serde_json::Result;

pub type RGB = (u8, u8, u8);

#[derive(Serialize, Deserialize, Debug)]
pub struct DisplayConfig {
    white: f32,
    black: f32,
    pub fade: f32,
    pub brightness: f32,
}

impl DisplayConfig {
    pub fn default() -> Self {
        DisplayConfig {
            white: (1.0),
            black: (350.0),
            fade: 0.99,
            brightness: 0.2,
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
        let colour = Hsi::new(
            Deg(src_colour),
            1.0,
            (intensity * self.brightness).clamp(0.0, 1.0),
        );
        let rgb = colour.to_rgb(prisma::HsiOutOfGamutMode::Clip);
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
        bins: Vec<f32>,
        peak_magnitudes: &mut Vec<f32>,
        config: &DisplayConfig,
    ) -> ();
}
