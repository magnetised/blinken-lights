defmodule BlinkenLights.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      {Registry, name: BlinkenLights.PubSub, keys: :duplicate},
      {DynamicSupervisor, name: BlinkenLights.DynamicSupervisor, strategy: :one_for_one},
      {Bandit, plug: BlinkenLights.Router},
      {BlinkenLights.Capture, %BlinkenLights.DisplayConfig{}},
      {BlinkenLights.DarkMode,
       start_time: ~T[18:00:00], end_time: ~T[08:00:00], dark_target: [brightness: 0.1]}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: BlinkenLights.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
