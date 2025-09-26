defmodule BlinkenLights.Websocket do
  # @behaviour Websock

  require Logger

  def init(_) do
    IO.puts("New connection PID: #{inspect(self())}")
    {:ok, config} = BlinkenLights.config()
    cycle? = BlinkenLights.ColourCycle.running?()
    {:ok, msg} = config |> Map.from_struct() |> Map.put(:cycle, cycle?) |> Jason.encode()
    {:push, [{:text, msg}], []}
  end

  def handle_in({client_message, [opcode: :text]}, state) do
    case Jason.decode(client_message) do
      {:ok, msg} -> handle_msg(msg)
      {:error, reason} -> Logger.error("Invalid JSON from client: #{reason}")
    end

    {:ok, state}
  end

  def handle_in({client_message, opcode}, state) do
    dbg(in: [client_message, opcode])
    {:ok, state}
  end

  def handle_info({:text, server_message}, state) do
    dbg(text: server_message)
    {:push, {:text, server_message}, state}
  end

  def handle_info({:close, code, reason}, state) do
    dbg(close: {code, reason})
    {:ok, state}
  end

  defp handle_msg(%{"type" => "control_update", "control" => control, "value" => value}) do
    case control do
      "color_cycle" ->
        [colour_cycle: value]

      "white_hue" ->
        [white: value]

      "black_hue" ->
        [black: value]

      "fade" ->
        [fade: value]

      "brightness" ->
        [brightness: value]

      "saturation" ->
        [saturation: value]

      "scale" ->
        [scale: value]

      "decay" ->
        [decay: value]

      unknown ->
        Logger.error("unknown control: #{inspect(unknown)} => #{inspect(value)}")
        []
    end
    |> BlinkenLights.config()
  end
end
