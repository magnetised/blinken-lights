import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  // useRef,
  // useCallback,
} from "react";
import ReactDOM from "react-dom/client";

import useWebSocket, { ReadyState } from "react-use-websocket";

const WebSocketContext = createContext();

const WebSocketProvider = ({ children }) => {
  const [socketUrl, setSocketUrl] = useState("ws://localhost:4000/websocket");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (lastMessage !== null) {
      setMessages((prev) => prev.concat(lastMessage));
    }
  }, [lastMessage]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  const isConnected = () => readyState == ReadyState.OPEN;

  const sendJSONMessage = (msg) => {
    sendMessage(JSON.stringify(msg));
  };

  return (
    <WebSocketContext.Provider
      value={{
        readyState,
        messages,
        sendMessage: sendJSONMessage,
        isConnected,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

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
const ConnectionStatus = () => {
  const { isConnected } = joinWebSocket();

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${isConnected() ? "bg-green-500" : "bg-red-500"}`}
          ></div>
          <span className="font-medium">
            WebSocket {isConnected() ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </div>
  );
};

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
  const { sendMessage, isConnected } = joinWebSocket();

  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);

    // Send WebSocket message
    if (isConnected()) {
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
          disabled={!isConnected()}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
            bg-gradient-to-r from-gray-300 to-${color}-500`}
          style={{
            background:
              label === "White Hue" || label === "Black Hue"
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
  const { sendMessage, isConnected } = joinWebSocket();

  const handleToggle = () => {
    const newValue = !value;
    onChange(newValue);

    // Send WebSocket message
    if (isConnected()) {
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
          disabled={!isConnected()}
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
  const [whiteHue, setWhiteHue] = useState(180);
  const [blackHue, setBlackHue] = useState(180);
  const [saturation, setSaturation] = useState(1.0);
  const [brightness, setBrightness] = useState(0.5);
  const [fade, setFade] = useState(1.0);
  const [colorCycle, setColorCycle] = useState(false);

  // Calculate current color
  const whiteColor = `hsl(${whiteHue} ${saturation * 100}% 50%)`;
  const blackColor = `hsl(${blackHue} ${saturation * 100}% 50%)`;

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
            style={{ backgroundColor: whiteColor }}
          />
          <div
            className="w-24 h-24 rounded-lg border-2 border-gray-300 shadow-inner"
            style={{ backgroundColor: blackColor }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <div>White keys: {whiteColor}</div>
          <div>Black Keys: {blackColor}</div>
        </div>
      </div>

      {/* Controls */}
      <SliderControl
        label="White Hue"
        value={whiteHue}
        min={0}
        max={360}
        step={1}
        onChange={setWhiteHue}
        unit="°"
        color="red"
      />
      <SliderControl
        label="Black Hue"
        value={blackHue}
        min={0}
        max={360}
        step={1}
        onChange={setBlackHue}
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

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Current Values
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            White Hue: <span className="font-bold">{whiteHue}°</span>
          </div>
          <div>
            Black Hue: <span className="font-bold">{blackHue}°</span>
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

const App = () => {
  return (
    <WebSocketProvider>
      <ConnectionStatus />
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            HSL Color Controller
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ColorControls />
          </div>
        </div>
      </div>
    </WebSocketProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(<App />);
