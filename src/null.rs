#![allow(dead_code)]

use crate::display;

use crate::piano::{key_colour, KeyColour};

pub struct Null {}

impl Null {
    pub fn new() -> Self {
        Null {}
    }
}

impl display::Display for Null {
    fn visualize_bins(
        &mut self,
        _bins: &[f32],
        _peak_magnitudes: &mut Vec<f32>,
        _config: &display::DisplayConfig,
    ) {
    }
    fn reset(&mut self) {}
}
