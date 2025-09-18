pub trait Display {
    fn visualize_bins(&mut self, bins: Vec<f32>, peak_magnitudes: &mut Vec<f32>) -> ();
}
