defmodule BlinkenLights.DisplayConfig do
  @derive Jason.Encoder

  defstruct white: 1.0,
            black: 350.0,
            fade: 0.82,
            brightness: 0.6,
            sensitivity: 1.0
end
