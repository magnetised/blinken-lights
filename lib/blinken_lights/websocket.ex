defmodule BlinkenLights.Websocket do
  def init(conn) do
    IO.puts("New connection PID: #{inspect(self())}")
    {:ok, conn}
  end

  def handle_in({client_message, [opcode: :text]}, state) do
    # Message.handle_client_message(client_message)
    dbg(client_message: client_message)
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
end
