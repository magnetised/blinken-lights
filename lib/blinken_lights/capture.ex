defmodule BlinkenLights.Capture do
  use GenServer

  alias BlinkenLights.DisplayConfig

  def start_link(args) do
    GenServer.start_link(__MODULE__, args, name: __MODULE__)
  end

  # def get_config do
  #   GenServer.call(__MODULE__, :get_config)
  # end

  def set_config(config) do
    GenServer.call(__MODULE__, {:set_config, config})
  end

  def init(_args) do
    {:ok, config} = DisplayConfig.get_active()
    port = start_port(config)
    {:ok, {port, config}}
  end

  def handle_info({port, {:data, data}}, {port, config}) do
    IO.puts([":: ", data])
    {:noreply, {port, config}}
  end

  def handle_info({port, {:exit_status, _status}}, {port, config}) do
    IO.puts("Port crashed, restarting")
    port = start_port(config)
    send_config({port, config})
    {:noreply, {port, config}}
  end

  # def handle_call(:get_config, _from, {port, config}) do
  #   {:reply, {:ok, config}, {port, config}}
  # end

  def handle_call({:set_config, attrs}, _from, {port, config}) do
    config = Enum.reduce(attrs, config, fn {k, v}, config -> Map.put(config, k, v) end)
    send_config({port, config})
    {:reply, {:ok, config}, {port, config}}
  end

  defp start_port(config) do
    {:ok, json} = DisplayConfig.encode_rust(config)

    Port.open({:spawn_executable, exe_path()}, [
      :stream,
      :use_stdio,
      :binary,
      :exit_status,
      env: [{~c"DISPLAY_CONFIG", to_charlist(json)}]
    ])
  end

  defp exe_path, do: Path.expand("../../target/release/leds", __DIR__) |> to_charlist()

  defp send_config({port, config}) do
    {:ok, json} = DisplayConfig.encode_rust(config)
    true = Port.command(port, IO.iodata_to_binary([json, "\n"]))
  end
end
