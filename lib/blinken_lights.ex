defmodule BlinkenLights do
  alias BlinkenLights.DisplayConfig

  def config do
    BlinkenLights.Capture.get_config()
  end

  def config([]) do
    :ok
  end

  def config(%DisplayConfig{} = config) do
    BlinkenLights.Capture.set_config(config)
  end

  def config(attrs) when is_list(attrs) do
    {actions, config} = Keyword.split(attrs, [:colour_cycle])

    with {:ok, config} <- BlinkenLights.Capture.set_config(config) do
      apply_actions(actions, config)
    end

    Registry.dispatch(BlinkenLights.PubSub, :config, fn entries ->
      for {pid, _} <- entries, do: send(pid, {:config_change, attrs})
    end)
  end

  defp apply_actions([], _config) do
    :ok
  end

  defp apply_actions([{:colour_cycle, state} | rest], config) do
    if state,
      do: start_cycle(config),
      else: stop_cycle()

    apply_actions(rest, config)
  end

  def start_cycle(config) do
    BlinkenLights.ColourCycle.start(config)
  end

  def stop_cycle do
    BlinkenLights.ColourCycle.stop()
  end
end
