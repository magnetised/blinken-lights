import Config

config :esbuild,
  version: "0.25.0",
  default: [
    args: ~w(js/app.tsx --bundle --target=es2016 --outdir=../priv/static/assets),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

config :tailwind,
  version: "4.1.13",
  default: [
    args: ~w(
      --input=assets/css/app.css
      --output=priv/static/assets/app.css
    ),
    cd: Path.expand("..", __DIR__)
  ],
  version_check: false,
  # path to npm managed CLI tool
  path: Path.expand("../assets/node_modules/.bin/tailwindcss", __DIR__)
