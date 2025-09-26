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
        <title>Lights</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
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
