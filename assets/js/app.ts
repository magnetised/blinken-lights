const ws = new WebSocket("ws://localhost:4000/websocket");

ws.onopen = (event) => {
  console.log("Connected to the server");
};

ws.onmessage = (event) => {
  console.log("message", event);
};

ws.onclose = (event) => {
  console.log("WebSocket closed:", event.code, event.reason);
};
