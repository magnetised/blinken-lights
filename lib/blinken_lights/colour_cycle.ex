defmodule BlinkenLights.ColourCycle do
  use GenServer

  def start_link(args) do
    GenServer.start_link(__MODULE__, args, name: __MODULE__)
  end

  def start_cycle do
    GenServer.call(__MODULE__, :start_cycle)
  end

  def stop_cycle do
    GenServer.call(__MODULE__, :stop_cycle)
  end

  def init(_args) do
    {:ok, %{hue: 0, timer: nil}}
  end

  def handle_call(:start_cycle, _from, state) do
    {:reply, :ok, cycle(state)}
  end

  def handle_call(:stop_cycle, _from, %{timer: timer} = state) when is_reference(timer) do
    Process.cancel_timer(timer)
    {:reply, :ok, %{state | timer: nil}}
  end

  def handle_info(:cycle, state) do
    {:noreply, cycle(state)}
  end

  defp cycle(state) do
    {white, black, state} = next(state)
    BlinkenLights.config(white: white, black: black)
    ref = Process.send_after(self(), :cycle, 100)
    %{state | timer: ref}
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
