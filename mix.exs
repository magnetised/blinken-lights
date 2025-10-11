defmodule BlinkenLights.MixProject do
  use Mix.Project

  def project do
    [
      app: :blinken_lights,
      version: "0.1.0",
      elixir: "~> 1.14",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      aliases: aliases()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger],
      mod: {BlinkenLights.Application, []}
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:jason, "~> 1.0"},
      {:bandit, "~> 1.0"},
      {:plug, "~> 1.0"},
      {:websock_adapter, "~> 0.5"},
      {:esbuild, "~> 0.10.0"},
      {:tailwind, "~> 0.4.0"},
      {:tz, "~> 0.28"}
    ]
  end

  defp aliases do
    [
      dev: ["cmd cargo build --release --features no-display", "run --no-halt"],
      lights: [
        "cmd cargo build --release --features leds",
        "esbuild default --minify",
        "tailwind default --minify",
        "run --no-halt"
      ]
    ]
  end
end
