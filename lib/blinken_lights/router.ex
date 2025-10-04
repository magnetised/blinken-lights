defmodule BlinkenLights.Router do
  use Plug.Router

  plug Plug.Static, at: "/static", from: "priv/static/assets"

  plug :match
  plug :dispatch

  get "/" do
    conn
    |> put_resp_header("content-type", "text/html; charset=UTF-8")
    |> send_resp(200, """
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <link rel="stylesheet" href="/static/app.css" />
        <title>Lights</title>
      </head>
      <body class="bg-gray-900">
        <div id="root"></div>
        <script src="/static/app.js"></script>
      </body>
    </html>
    """)
  end

  get "/websocket" do
    conn
    |> WebSockAdapter.upgrade(BlinkenLights.Websocket, [], timeout: 600_000)
    |> halt()
  end

  match _ do
    send_resp(conn, 404, "Not found")
  end
end
