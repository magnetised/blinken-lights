import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  // useRef,
  // useCallback,
} from "react";
import ReactDOM from "react-dom/client";

import {
  ColorWheel,
  HorizontalSlider,
  ScaleSlider,
  Slider,
} from "./picker.jsx";

import useWebSocket, { ReadyState } from "react-use-websocket";

const WebSocketContext = createContext();
const BROWSER_WIDTH = 390;
const WHEEL_SIZE = BROWSER_WIDTH - 120;

const WebSocketProvider = ({ children }) => {
  const [socketUrl, setSocketUrl] = useState(
    `ws://${window.location.host}/websocket`,
  );
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: (_closeEvent) => true,
  });

  const [ready, setReady] = useState(false);

  const [whiteHue, setWhiteHue] = useState(0);
  const [blackHue, setBlackHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [fade, setFade] = useState(0);
  const [colorCycle, setColorCycle] = useState(false);
  const [scale, setScale] = useState(false);
  const [decay, setDecay] = useState(0);

  const setters = {
    white: setWhiteHue,
    black: setBlackHue,
    saturation: setSaturation,
    brightness: setBrightness,
    fade: setFade,
    colour_cycle: setColorCycle,
    scale: setScale,
    decay: setDecay,
  };

  const syncState = (state) => {
    for (const [key, value] of Object.entries(state)) {
      if (setters.hasOwnProperty(key)) {
        setters[key](value);
      }
    }
  };

  useEffect(() => {
    if (lastMessage !== null) {
      const { control, msg } = JSON.parse(lastMessage.data);

      if (control === "initial-state") {
        setReady(true);
      }
      syncState(msg);
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

  return (
    <WebSocketContext.Provider
      value={{
        readyState,
        sendMessage: sendJsonMessage,
        isConnected,
        whiteHue,
        setWhiteHue,
        blackHue,
        setBlackHue,
        saturation,
        setSaturation,
        brightness,
        setBrightness,
        fade,
        setFade,
        colorCycle,
        setColorCycle,
        scale,
        setScale,
        decay,
        setDecay,
      }}
    >
      {ready ? children : "Loading"}
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

const ConnectionStatus = () => {
  const { isConnected } = joinWebSocket();

  return (
    <div className="fixed top-0 left-0">
      <div
        className={`w-3 h-3 rounded-full ${isConnected() ? "bg-green-500" : "bg-red-500"}`}
      ></div>
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
  disabled = false,
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
    <div className="mb-12">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span
          className="text-sm font-mono bg-gray-100 px-2 py-1 rounded"
          style={{ color: "black" }}
        >
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
          disabled={!isConnected() || disabled}
          // className={`w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-gray-300 to-${color}-500`}
          className="w-full range range-neutral range-lg [--range-fill:0]"
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
      </div>
    </div>
  );
};

const ToggleControl = ({ label, value, onChange, color = "blue" }) => {
  const { sendMessage, isConnected } = joinWebSocket();

  const handleToggle = () => {
    const newValue = !value;
    onChange(newValue);

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
    <div className="_mb-12">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <input
          type="checkbox"
          checked={value}
          onChange={handleToggle}
          disabled={!isConnected()}
          className="toggle toggle-lg toggle-neutral"
          style={{ color: "black" }}
          // className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${ value ? `bg-${color}-600` : "bg-gray-200" }`}
        />
      </div>
    </div>
  );
};

// Color Controls Component
const ColorControls = () => {
  const {
    whiteHue,
    setWhiteHue,
    blackHue,
    setBlackHue,
    saturation,
    setSaturation,
    brightness,
    setBrightness,
    fade,
    setFade,
    colorCycle,
    setColorCycle,
    scale,
    setScale,
    decay,
    setDecay,
    sendMessage,
    isConnected,
  } = joinWebSocket();

  const handleChange = (name, setter) => {
    return (newValue) => {
      setter(newValue);

      // Send WebSocket message
      if (isConnected()) {
        sendMessage({
          type: "control_update",
          control: name,
          value: newValue,
          timestamp: Date.now(),
        });
      }
    };
  };
  const l = 50 + (1 - saturation) * 50;
  // Calculate current color
  const whiteColor = () => `hsl(${whiteHue} ${saturation * 100}% ${l}%)`;
  const blackColor = () => `hsl(${blackHue} ${saturation * 100}% ${l}%)`;

  const round = (v) => {
    return Math.round((v + Number.EPSILON) * 1000) / 1000;
  };

  const percent = (v) => {
    return `${(v * 100).toFixed(1)}%`;
  };
  const Label = ({ name, value }) => {
    return (
      <div className="text-white">
        {name} {typeof value === "string" ? value : percent(value)}
      </div>
    );
  };
  const sliderHeight = 200;
  const horizSliderWidth = BROWSER_WIDTH - 36;
  const saturationDiv = React.useRef(null);
  const [saturationHeight, setSaturationHeight] = useState(0);
  const [globalTouch, setGlobalTouch] = useState(false);
  React.useEffect(() => {
    setSaturationHeight(saturationDiv.current.clientWidth / 2);
  }, []);
  return (
    <div
      onTouchStart={() => setGlobalTouch(true)}
      onTouchEnd={() => setGlobalTouch(false)}
    >
      <div className="" ref={saturationDiv}>
        <div className="flex flex-row gap-3">
          <div className="flex flex-col grow">
            <div className="flex flex-col justify-center">
              <ColorWheel
                size={WHEEL_SIZE}
                whiteValue={whiteHue}
                blackValue={blackHue}
                onWhiteChange={handleChange("white_hue", setWhiteHue)}
                onBlackChange={handleChange("black_hue", setBlackHue)}
                disabled={colorCycle}
                whiteColor={whiteColor()}
                blackColor={blackColor()}
              />
            </div>
          </div>
          <div className="flex flex-col justify-center text-center">
            <div className="flex flex-col justify-center">
              <Slider
                globalTouch={globalTouch}
                height={WHEEL_SIZE}
                value={saturation}
                onChange={handleChange("saturation", setSaturation)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col">
            <Label name="Colour Cycle" value={colorCycle ? `ON` : "OFF"} />
            <ScaleSlider
              width={horizSliderWidth}
              value={2.0}
              toggle={colorCycle}
              minValue={1.0}
              maxValue={4.0}
              onChange={() => true}
              onToggle={handleChange("color_cycle", setColorCycle)}
              globalTouch={globalTouch}
            />
          </div>
          <div className="flex flex-col">
            <Label name="Brightness" value={brightness} />

            <HorizontalSlider
              globalTouch={globalTouch}
              width={horizSliderWidth}
              value={brightness}
              onChange={handleChange("brightness", setBrightness)}
            />
          </div>
          <div className="flex flex-col">
            <Label name="Fade" value={fade} />
            <HorizontalSlider
              globalTouch={globalTouch}
              width={horizSliderWidth}
              value={fade}
              onChange={handleChange("fade", setFade)}
            />
          </div>
          <div className="flex flex-col">
            <Label name="Scale" value={scale ? `${decay.toFixed(1)}` : "OFF"} />
            <ScaleSlider
              width={horizSliderWidth}
              value={decay}
              toggle={scale}
              minValue={1.0}
              maxValue={4.0}
              globalTouch={globalTouch}
              onChange={handleChange("decay", setDecay)}
              onToggle={handleChange("scale", setScale)}
            />
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
      <div className="min-h-screen p-3">
        <div className="">
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
