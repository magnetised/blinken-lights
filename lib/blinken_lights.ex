defmodule BlinkenLights do
  alias BlinkenLights.DisplayConfig

  def config(%DisplayConfig{} = config) do
    BlinkenLights.Capture.set_config(config)
  end

  def config(attrs) do
    struct(DisplayConfig, attrs) |> config()
  end
end
