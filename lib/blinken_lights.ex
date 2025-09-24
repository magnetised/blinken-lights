defmodule BlinkenLights do
  alias BlinkenLights.DisplayConfig

  def config(%DisplayConfig{} = config) do
    BlinkenLights.Capture.set_config(config)
  end

  def config(attrs) when is_list(attrs) do
    BlinkenLights.Capture.set_config(attrs)
  end
end
