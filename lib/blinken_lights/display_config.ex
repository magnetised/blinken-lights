defmodule BlinkenLights.DisplayConfig do
  @derive Jason.Encoder

  defstruct white: 1.0,
            black: 350.0,
            saturation: 0.55,
            fade: 0.89,
            brightness: 0.5,
            sensitivity: 1.0,
            decay: 1.8,
            scale: false,
            dark_mode: false,
            colour_cycle: false

  @rust_keys ~w[white black saturation fade brightness sensitivity decay scale]a

  def for_websocket(%__MODULE__{} = config) do
    {:ok, config}
  end

  def encode_rust(%__MODULE__{} = config) do
    config
    |> Map.take(@rust_keys)
    |> Jason.encode()
  end
end
