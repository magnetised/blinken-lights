defmodule BlinkenLights.ColourCycle do
  use GenServer, restart: :transient

  def start_link(args) do
    GenServer.start_link(__MODULE__, args, name: __MODULE__)
  end

  def start do
    DynamicSupervisor.start_child(BlinkenLights.DynamicSupervisor, {__MODULE__, []})
  end

  def stop do
    GenServer.call(__MODULE__, :stop_cycle)
  end

  def init(_args) do
    {:ok, cycle(%{hue: 0})}
  end

  def handle_continue(:stop_cycle,  state) do
    {:stop, :normal, state}
  end

  def handle_call(:stop_cycle, _from,  state) do
    {:reply,  :ok, state, {:continue, :stop_cycle}}
  end

  def handle_info(:cycle, state) do
    {:noreply, cycle(state)}
  end

  defp cycle(state) do
    {white, black, state} = next(state)
    BlinkenLights.config(white: white, black: black)
    _ref = Process.send_after(self(), :cycle, 100)
    state
  end

  defp next(%{hue: hue} = state) do
    white = rem(hue + 1, 360)
    black = white - 10

    black =
      if black < 0 do
        360 + black
      else
        rem(black, 360)
      end

    {white, black, %{state | hue: white}}
  end
end
