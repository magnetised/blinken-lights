defmodule BlinkenLights.ColourCycle do
  use GenServer, restart: :transient

  def start_link(config) do
    GenServer.start_link(__MODULE__, config, name: __MODULE__)
  end

  def start(config) do
    DynamicSupervisor.start_child(BlinkenLights.DynamicSupervisor, {__MODULE__, config})
  end

  def stop do
    case GenServer.whereis(__MODULE__) do
      nil ->
        :ok

      pid when is_pid(pid) ->
        GenServer.call(pid, :stop_cycle)
    end
  end

  def set_speed(speed) do
    case GenServer.whereis(__MODULE__) do
      nil ->
        :ok

      pid when is_pid(pid) ->
        GenServer.call(pid, {:set_speed, speed})
    end
  end

  def running? do
    __MODULE__
    |> GenServer.whereis()
    |> is_pid()
  end

  def init(config) do
    %{white: white, black: black, colour_cycle_speed: speed} = config
    {:ok, %{white: white, black: black, speed: speed}, {:continue, :start}}
  end

  def handle_continue(:start, state) do
    {:noreply, cycle(state)}
  end

  def handle_continue(:stop_cycle, state) do
    {:stop, :normal, state}
  end

  def handle_call({:set_speed, speed}, _from, state) do
    {:reply, :ok, %{state | speed: speed}}
  end

  def handle_call(:stop_cycle, _from, state) do
    {:reply, :ok, state, {:continue, :stop_cycle}}
  end

  def handle_info(:cycle, state) do
    {:noreply, cycle(state)}
  end

  defp cycle(state) do
    state =
      %{white: white, black: black, speed: speed} =
      state |> next(:white) |> next(:black)

    BlinkenLights.config(white: white, black: black)

    ## if you change this interval calculation, change the duration calculation
    # in app.tsx
    _ref = Process.send_after(self(), :cycle, max(10, round((1 - speed) * 1000)))

    state
  end

  defp next(state, colour) do
    hue = Map.fetch!(state, colour)
    hue = :math.fmod(hue + 1, 360.0)
    Map.put(state, colour, hue)
  end
end
