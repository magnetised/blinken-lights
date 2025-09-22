use angular_units::Deg;
use prisma::Hsi;

pub type RGB = (u8, u8, u8);

pub struct DisplayConfig {
    white: Deg<f32>,
    black: Deg<f32>,
    pub fade: f32,
    pub brightness: f32,
}

impl DisplayConfig {
    pub fn default() -> Self {
        DisplayConfig {
            white: Deg(1.0),
            black: Deg(350.0),
            fade: 0.82,
            brightness: 0.2,
        }
    }
    pub fn black_colour(&self, intensity: f32) -> RGB {
        self.set_colour(self.black, intensity)
    }
    pub fn white_colour(&self, intensity: f32) -> RGB {
        self.set_colour(self.white, intensity)
    }

    fn set_colour(&self, src_colour: Deg<f32>, intensity: f32) -> RGB {
        let colour = Hsi::new(src_colour, 1.0, intensity.min(1.0) * self.brightness);
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
