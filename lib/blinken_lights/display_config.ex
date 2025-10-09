defmodule BlinkenLights.DisplayConfig do
  use GenServer

  @derive Jason.Encoder

  defstruct white: 1.0,
            black: 350.0,
            saturation: 0.55,
            fade: 0.89,
            brightness: 0.5,
            sensitivity: 1.0,
            decay: 1.8,
            scale: false,
            dark_mode: false,
            colour_cycle: false,
            colour_cycle_speed: 0.0

  @config_key :config
  @table __MODULE__
  @rust_keys ~w[white black saturation fade brightness sensitivity decay scale]a

  def set_active(config) do
    :ets.insert(@table, {@config_key, config})
    :ok
  end

  def get_active do
    case :ets.lookup(@table, @config_key) do
      [{@config_key, config}] -> {:ok, config}
      [] -> :error
    end
  end

  def for_websocket(%__MODULE__{} = config) do
    {:ok, config}
  end

  def encode_rust(%__MODULE__{} = config) do
    config
    |> Map.take(@rust_keys)
    |> Jason.encode()
  end

  def start_link(config) do
    GenServer.start_link(__MODULE__, config, name: __MODULE__)
  end

  def init(config) do
    _table = :ets.new(@table, [:public, :named_table])
    set_active(config)
    {:ok, []}
  end
end
