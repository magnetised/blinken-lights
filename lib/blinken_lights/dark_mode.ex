defmodule BlinkenLights.DarkMode do
  use GenServer
  alias BlinkenLights.DisplayConfig
  @midnight 24 * 3600 - 1

  def start_link(args) do
    GenServer.start_link(__MODULE__, args, name: __MODULE__)
  end

  defp seconds_after_midnight(time) do
    Time.to_seconds_after_midnight(time) |> elem(0)
  end

  def new(args) do
    night = [
      seconds_after_midnight(args[:start_time])..@midnight,
      0..seconds_after_midnight(args[:end_time])
    ]

    state = %{dark_target: args[:dark_target], step: args[:step] || 0.05}

    Map.merge(
      state,
      %{
        original: original(%DisplayConfig{}, state),
        active: :light,
        target: nil,
        night: night
      }
    )
  end

  @impl GenServer
  def init(args) do
    state = new(args)

    {:ok, state |> schedule_check()}
  end

  @impl GenServer
  def handle_info(:check_time, state) do
    state =
      case adjust(&current_config/0, state) do
        {state, []} ->
          state

        {state, changes} ->
          IO.inspect(dark_mode: changes)
          :ok = BlinkenLights.config(changes)
          state
      end

    {:noreply, state |> schedule_check()}
  end

  defp current_config do
    {:ok, config} = BlinkenLights.config()
    config
  end

  def adjust(time \\ Time.utc_now(), display_config, state) do
    converge(mode(time, state), display_config, state)
  end

  defp mode(time, state) do
    seconds = seconds_after_midnight(time)

    if Enum.any?(state.night, &(seconds in &1)) do
      :dark
    else
      :light
    end
  end

  defp converge(mode, _display_config, %{target: nil, active: mode} = state) do
    {state, []}
  end

  defp converge(:dark, display_config, %{active: :light} = state) do
    display_config = resolve_config(display_config)

    converge(:dark, display_config, %{
      state
      | original: original(display_config, state),
        target: state.dark_target,
        active: :dark
    })
  end

  defp converge(:light, display_config, %{active: :dark} = state) do
    display_config = resolve_config(display_config)

    converge(:light, display_config, %{
      state
      | target: state.original,
        active: :light
    })
  end

  defp converge(_mode, display_config, state) do
    %{target: target, step: step} = state

    display_config = resolve_config(display_config)

    diff = Enum.map(target, fn {k, v} -> {k, v - Map.fetch!(display_config, k)} end)

    changes =
      diff
      |> Enum.filter(fn {_k, v} -> abs(v) > 0 end)
      |> Enum.map(fn {k, v} ->
        new_v =
          cond do
            abs(v) < 0.01 -> target[k]
            v > 0 -> Float.round(Map.fetch!(display_config, k) + step, 3)
            v < 0 -> Float.round(Map.fetch!(display_config, k) - step, 3)
          end

        {k, new_v}
      end)

    state =
      if changes == [] do
        %{state | target: nil}
      else
        state
      end

    {state, changes}
  end

  defp resolve_config(config_fun) when is_function(config_fun, 0), do: config_fun.()
  defp resolve_config(%DisplayConfig{} = config), do: config

  defp original(display_config, state) do
    Map.take(display_config, Keyword.keys(state.dark_target)) |> Enum.to_list()
  end

  defp schedule_check(state) do
    Process.send_after(self(), :check_time, 60_000)
    state
  end
end
