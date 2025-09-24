defmodule BlinkenLights.Router do
  use Plug.Router

  plug Plug.Static, at: "/static", from: "priv/static/assets"

  plug :match
  plug :dispatch

  get "/" do
    conn
    |> put_resp_header("content-type", "text/html; charset=UTF-8")
    |> send_resp(
      200,
      "<!DOCTYPE html>\n<html>\n  <head>\n    <title>Lights</title>\n    <script src=\"/static/app.js\"></script>\n  </head>\n  <body>\n  </body>\n</html>\n"
    )
  end

  get "/websocket" do
    conn
    |> WebSockAdapter.upgrade(BlinkenLights.Websocket, conn, timeout: 600_000)
    |> halt()
  end

  match _ do
    send_resp(conn, 404, "Not found")
  end
end
