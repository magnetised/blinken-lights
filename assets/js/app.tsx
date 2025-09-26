// const ws = new WebSocket("ws://localhost:4000/websocket");
//
// ws.onopen = (event) => {
//   console.log("Connected to the server");
// };
//
// ws.onmessage = (event) => {
//   console.log("message", event);
// };
//
// ws.onclose = (event) => {
//   console.log("WebSocket closed:", event.code, event.reason);
// };

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import ReactDOM from "react-dom/client";

import useWebSocket, { ReadyState } from "react-use-websocket";

// WebSocket Context
const WebSocketContext = createContext();

// WebSocket Provider Component
const WebSocketProvider = ({ children }) => {
  const [socketUrl, setSocketUrl] = useState("ws://localhost:4000/websocket");
  // const [isConnected, setIsConnected] = useState(false);
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (lastMessage !== null) {
      setMessages((prev) => prev.concat(lastMessage));
    }
  }, [lastMessage]);

  // const reconnectTimeoutRef = useRef();
  // const reconnectAttemptsRef = useRef(0);
  // const maxReconnectAttempts = 5;

  // const connect = useCallback(() => {
  //   try {
  //     // const ws = new WebSocket("ws://localhost:4000/websocket");
  //     // const ws = new WebSocket("wss://echo.websocket.org/");
  //     // const ws = new WebSocket("ws://jack:10000/");
  //
  //     ws.onopen = () => {
  //       console.log("WebSocket connected");
  //       setIsConnected(true);
  //       reconnectAttemptsRef.current = 0;
  //       setSocket(ws);
  //     };
  //
  //     ws.onmessage = (event) => {
  //       const message = {
  //         id: Date.now() + Math.random(),
  //         data: event.data,
  //         timestamp: new Date().toLocaleTimeString(),
  //         type: "received",
  //       };
  //       setMessages((prev) => [...prev.slice(-19), message]); // Keep last 20 messages
  //     };
  //
  //     // ws.onclose = () => {
  //     //   console.log("WebSocket disconnected");
  //     //   setIsConnected(false);
  //     //   setSocket(null);
  //     //
  //     //   if (reconnectAttemptsRef.current < maxReconnectAttempts) {
  //     //     reconnectTimeoutRef.current = setTimeout(() => {
  //     //       reconnectAttemptsRef.current++;
  //     //       connect();
  //     //     }, 2000 * reconnectAttemptsRef.current);
  //     //   }
  //     // };
  //     //
  //     // ws.onerror = (error) => {
  //     //   console.error("WebSocket error:", error);
  //     // };
  //   } catch (error) {
  //     console.error("Failed to connect:", error);
  //   }
  // }, []);

  // const disconnect = useCallback(() => {
  //   if (reconnectTimeoutRef.current) {
  //     clearTimeout(reconnectTimeoutRef.current);
  //   }
  //   if (socket) {
  //     socket.close();
  //   }
  // }, [socket]);

  // const sendMessage = useCallback(
  //   (message) => {
  //     if (socket && isConnected) {
  //       const messageStr =
  //         typeof message === "object" ? JSON.stringify(message) : message;
  //       socket.send(messageStr);
  //
  //       const sentMessage = {
  //         id: Date.now() + Math.random(),
  //         data: messageStr,
  //         timestamp: new Date().toLocaleTimeString(),
  //         type: "sent",
  //       };
  //       setMessages((prev) => [...prev.slice(-19), sentMessage]);
  //       return true;
  //     }
  //     return false;
  //   },
  //   [socket, isConnected],
  // );

  // useEffect(() => {
  //   connect();
  //   return () => {
  //     disconnect();
  //   };
  // }, [connect, disconnect]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  // return (
  //   <div>
  //     <div className="bg-white p-4 rounded-lg shadow-md mb-6">
  //       <div className="flex items-center justify-between">
  //         <div className="flex items-center space-x-2">
  //           <div
  //             className={`w-3 h-3 rounded-full ${readyState == ReadyState.OPEN ? "bg-green-500" : "bg-red-500"}`}
  //           ></div>
  //           <span className="font-medium">WebSocket {connectionStatus}</span>
  //         </div>
  //       </div>
  //     </div>
  //     <div></div>
  //   </div>
  // );
  return (
    <WebSocketContext.Provider
      value={{
        readyState,
        messages,
        sendMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use WebSocket context
const joinWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
};

// HSL to RGB conversion utility
const hslToRgb = (h, s, l) => {
  h = h / 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return [f(0), f(8), f(4)];
};

// Connection Status Component
// const ConnectionStatus = () => {
//   // const { isConnected, connect, disconnect } = joinWebSocket();
//
//   return (
//     <div className="bg-white p-4 rounded-lg shadow-md mb-6">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-2">
//           <div
//             className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
//           ></div>
//           <span className="font-medium">
//             WebSocket {isConnected ? "Connected" : "Disconnected"}
//           </span>
//         </div>
//         <div className="space-x-2">
//           <button
//             onClick={connect}
//             disabled={isConnected}
//             className="px-3 py-1 text-sm bg-green-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
//           >
//             Connect
//           </button>
//           <button
//             onClick={disconnect}
//             disabled={!isConnected}
//             className="px-3 py-1 text-sm bg-red-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600"
//           >
//             Disconnect
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// Slider Component
const SliderControl = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = "",
  color = "blue",
}) => {
  const { sendMessage, readyState } = joinWebSocket();

  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);

    // Send WebSocket message
    if (readyState == ReadyState.OPEN) {
      sendMessage({
        type: "control_update",
        control: label.toLowerCase().replace(" ", "_"),
        value: newValue,
        timestamp: Date.now(),
      });
    }
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
          {value.toFixed(step < 1 ? 2 : 0)}
          {unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={!readyState == ReadyState.OPEN}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
            bg-gradient-to-r from-gray-300 to-${color}-500`}
          style={{
            background:
              label === "Hue"
                ? "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)"
                : label === "Saturation"
                  ? `linear-gradient(to right, #808080, hsl(${Math.round(value * 360)}, 100%, 50%))`
                  : label === "Brightness"
                    ? `linear-gradient(to right, #000000, hsl(${Math.round(value * 360)}, 100%, 50%))`
                    : `linear-gradient(to right, #e5e5e5, #${color === "blue" ? "3b82f6" : color === "green" ? "10b981" : "f59e0b"})`,
          }}
        />
        <div
          className={`absolute top-0 w-4 h-2 bg-white border-2 border-${color}-600 rounded-full transform -translate-x-2`}
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Toggle Component
const ToggleControl = ({ label, value, onChange, color = "blue" }) => {
  const { sendMessage, readyState } = joinWebSocket();

  const handleToggle = () => {
    const newValue = !value;
    onChange(newValue);

    // Send WebSocket message
    if (readyState == ReadyState.OPEN) {
      sendMessage({
        type: "control_update",
        control: label.toLowerCase().replace(" ", "_"),
        value: newValue,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <button
          onClick={handleToggle}
          disabled={!readyState == ReadyState.OPEN}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            value ? `bg-${color}-600` : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              value ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      <div className="mt-1">
        <span className="text-xs text-gray-500">
          Status:{" "}
          <span
            className={`font-medium ${value ? "text-green-600" : "text-gray-600"}`}
          >
            {value ? "ON" : "OFF"}
          </span>
        </span>
      </div>
    </div>
  );
};

// Color Controls Component
const ColorControls = () => {
  const [hue, setHue] = useState(180);
  const [saturation, setSaturation] = useState(1.0);
  const [brightness, setBrightness] = useState(0.5);
  const [fade, setFade] = useState(1.0);
  const [colorCycle, setColorCycle] = useState(false);

  // Calculate current color
  const [r, g, b] = hslToRgb(hue, saturation, brightness);
  const currentColor = `rgb(${r}, ${g}, ${b})`;
  const currentColorWithFade = `rgba(${r}, ${g}, ${b}, ${fade})`;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        Color Controls
      </h2>

      {/* Color Preview */}
      <div className="mb-8">
        <div className="text-sm font-medium text-gray-700 mb-3">
          Color Preview
        </div>
        <div className="flex space-x-4">
          <div
            className="w-24 h-24 rounded-lg border-2 border-gray-300 shadow-inner"
            style={{ backgroundColor: currentColor }}
          />
          <div
            className="w-24 h-24 rounded-lg border-2 border-gray-300 shadow-inner"
            style={{ backgroundColor: currentColorWithFade }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <div>Solid: {currentColor}</div>
          <div>With Fade: {currentColorWithFade}</div>
          <div>
            HSL: hsl({hue}°, {Math.round(saturation * 100)}%,{" "}
            {Math.round(brightness * 100)}%)
          </div>
        </div>
      </div>

      {/* Controls */}
      <SliderControl
        label="Hue"
        value={hue}
        min={0}
        max={360}
        step={1}
        onChange={setHue}
        unit="°"
        color="red"
      />

      <SliderControl
        label="Saturation"
        value={saturation}
        min={0}
        max={1}
        step={0.01}
        onChange={setSaturation}
        color="green"
      />

      <SliderControl
        label="Brightness"
        value={brightness}
        min={0}
        max={1}
        step={0.01}
        onChange={setBrightness}
        color="yellow"
      />

      <SliderControl
        label="Fade"
        value={fade}
        min={0}
        max={1}
        step={0.01}
        onChange={setFade}
        color="blue"
      />

      <ToggleControl
        label="Color Cycle"
        value={colorCycle}
        onChange={setColorCycle}
        color="purple"
      />

      {/* Current Values Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Current Values
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            Hue: <span className="font-bold">{hue}°</span>
          </div>
          <div>
            Saturation:{" "}
            <span className="font-bold">{saturation.toFixed(2)}</span>
          </div>
          <div>
            Brightness:{" "}
            <span className="font-bold">{brightness.toFixed(2)}</span>
          </div>
          <div>
            Fade: <span className="font-bold">{fade.toFixed(2)}</span>
          </div>
          <div className="col-span-2">
            Color Cycle:{" "}
            <span className="font-bold">{colorCycle ? "ON" : "OFF"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Message Log Component
const MessageLog = () => {
  const { messages } = joinWebSocket();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        WebSocket Messages
      </h3>
      <div className="h-96 overflow-y-auto border border-gray-200 rounded p-3 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">
            No messages yet. Adjust the controls to send messages.
          </p>
        ) : (
          messages.map((message) => {
            let parsedMessage;
            try {
              parsedMessage = JSON.parse(message.data);
            } catch {
              parsedMessage = { raw: message.data };
            }

            return (
              <div
                key={message.id}
                className={`mb-2 p-3 rounded text-sm ${
                  message.type === "sent"
                    ? "bg-blue-50 border-l-4 border-blue-400"
                    : "bg-green-50 border-l-4 border-green-400"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`font-medium text-xs uppercase tracking-wide ${
                      message.type === "sent"
                        ? "text-blue-700"
                        : "text-green-700"
                    }`}
                  >
                    {message.type === "sent" ? "Sent" : "Received"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp}
                  </span>
                </div>

                {parsedMessage.type === "control_update" ? (
                  <div className="font-mono text-xs">
                    <div className="text-gray-700">
                      <span className="font-semibold">Control:</span>{" "}
                      {parsedMessage.control}
                    </div>
                    <div className="text-gray-700">
                      <span className="font-semibold">Value:</span>{" "}
                      {parsedMessage.value}
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-xs break-all text-gray-600">
                    {parsedMessage.raw ||
                      JSON.stringify(parsedMessage, null, 2)}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            HSL Color Controller
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ColorControls />
            <MessageLog />
          </div>

          <div className="mt-8 text-center text-sm text-gray-600 bg-white p-4 rounded-lg">
            <p className="mb-2">
              <strong>How it works:</strong> Each control sends a JSON message
              via WebSocket when changed.
            </p>
            <p>
              Message format:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {"{"}"type": "control_update", "control": "hue", "value": 180,
                "timestamp": 1234567890{"}"}
              </code>
            </p>
          </div>
        </div>
      </div>
    </WebSocketProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
