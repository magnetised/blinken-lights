defmodule BlinkenLights.Capture do
use GenServer

alias BlinkenLights.DisplayConfig
def start_link(args) do
  GenServer.start_link(__MODULE__, args, name: __MODULE__)
end

def set_config(%DisplayConfig{} = config) do
  GenServer.call(__MODULE__, {:set_config, config})
end
  
  def init(_args) do

port = start_port()
{:ok, {port, %{}}}
  end

  def handle_info({port, {:data, data}}, {port, config}) do
    IO.puts([":: ", data])
    {:noreply, {port, config}}
  end
  def handle_info({port, {:exit_status, _status}}, {port, config}) do
  IO.puts("Port crashed, restarting")
port = start_port()
send_config({port, config})
{:noreply, {port, config}}
  end

  def handle_call({:set_config, %DisplayConfig{} = config}, _from, {port, _config}) do
  send_config({port, config})
    {:reply, :ok, {port, config}}
  end
  defp start_port do
  Port.open({:spawn_executable, exe_path()}, [:stream, :use_stdio, :binary, :exit_status])
  end
  defp exe_path, do: Path.expand("../../target/release/leds", __DIR__) |> to_charlist()
  defp send_config({port, config}) do
    
  {:ok, json} = Jason.encode(config)
   true= Port.command(port, IO.iodata_to_binary([json, "\n"]))
  end
end
