defmodule BlinkenLights.Websocket do
  alias BlinkenLights.DisplayConfig
  # @behaviour Websock

  require Logger

  def init(_) do
    IO.puts("New connection PID: #{inspect(self())}")
    Process.send_after(self(), :register, 200)
    {:ok, config} = DisplayConfig.get_active()
    {:ok, data} = DisplayConfig.for_websocket(config)
    {:ok, msg} = Jason.encode(%{control: "initial-state", msg: data})
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

  def handle_info(:register, state) do
    {:ok, _} = Registry.register(BlinkenLights.PubSub, :config, [])
    {:ok, state}
  end

  def handle_info({:config_change, config}, state) do
    {:ok, msg} = Jason.encode(%{control: "config-change", msg: Map.new(config)})
    {:push, [{:text, msg}], state}
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

      "color_cycle_speed" ->
        [colour_cycle_speed: value]

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
