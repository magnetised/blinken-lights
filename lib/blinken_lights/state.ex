defmodule BlinkenLights.State do
  use GenServer

  alias BlinkenLights.DisplayConfig

  require Logger

  @write_debounce_timeout 5_000

  def start_link(args) do
    GenServer.start_link(__MODULE__, args, name: __MODULE__)
  end

  def init(args) do
    path = Keyword.get(args, :path, "./.state/config.json")

    path
    |> Path.dirname()
    |> File.mkdir_p!()

    {:ok, _} = Registry.register(BlinkenLights.PubSub, :config, [])

    {:ok, read_config(%{path: path, write: false})}
  end

  def handle_info({:config_change, _config}, state) do
    {:noreply, state, @write_debounce_timeout}
  end

  # skip the first write as it's due to us loading the config from disk
  def handle_info(:timeout, %{write: false} = state) do
    {:noreply, %{state | write: true}}
  end

  def handle_info(:timeout, state) do
    with {:ok, config} <- BlinkenLights.config(),
         {:ok, json} <- Jason.encode(config),
         :ok <- File.write(state.path, json) do
      Logger.debug("Written new config to #{state.path}")
    else
      error ->
        Logger.warning("Failed to write config to #{state.path}: #{inspect(error)}")
    end

    {:noreply, state}
  end

  defp read_config(%{path: path} = state) do
    if File.exists?(path) do
      json = File.read!(path)
      config = Jason.decode!(json, keys: :atoms)
      Logger.info("Read config from #{path}: #{inspect(config)}")
      BlinkenLights.config(Enum.to_list(config))
    end

    state
  end
end
