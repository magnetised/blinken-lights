defmodule BlinkenLights.DisplayConfig do
  @derive Jason.Encoder

  defstruct white: 1.0,
            black: 350.0,
            saturation: 0.55,
            fade: 0.89,
            brightness: 0.5,
            sensitivity: 1.0,
            decay: 1.8,
            scale: false
end
