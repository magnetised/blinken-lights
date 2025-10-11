import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  // useRef,
  // useCallback,
} from "react";
import ReactDOM from "react-dom/client";
import { BROWSER_WIDTH, WHEEL_SIZE, THUMB_SIZE } from "./constants.ts";

import {
  ColorWheel,
  HorizontalSlider,
  ScaleSlider,
  Slider,
} from "./picker.jsx";

import useWebSocket, { ReadyState } from "react-use-websocket";

const WebSocketContext = createContext();

const ConnectionIcon = ({ text }) => {
  const { isConnected, darkMode } = joinWebSocket();
  const onClass = (onState, extra = "") => {
    return `stroke-none ${onState ? "opacity-90" : "opacity-10"} ${extra}`;
  };
  const iconColour = "oklch(0.4859 0.0941 264.665)";
  return (
    <div className="fixed top-[0px] left-[0px] flex flex-row z-1000">
      {isConnected() ? (
        ""
      ) : (
        <svg
          style={{ fill: iconColour }}
          className={onClass(
            isConnected(),
            `${!isConnected() ? "animate-pulse" : ""}`,
          )}
          width="30px"
          height="30px"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18.4961 10.7088L9.8603 19.5885C9.6207 19.8349 9.22228 19.5503 9.37764 19.2437L12.4518 13.1779C12.553 12.9783 12.408 12.7423 12.1842 12.7423H5.71762C5.45129 12.7423 5.31702 12.4211 5.5041 12.2315L13.5132 4.11699C13.7455 3.88157 14.132 4.14034 14.0029 4.44487L11.706 9.86069C11.6215 10.06 11.7694 10.2805 11.9859 10.2778L18.2773 10.1997C18.5444 10.1964 18.6823 10.5174 18.4961 10.7088Z" />
        </svg>
      )}
      {isConnected() && darkMode ? (
        <svg
          style={{ fill: iconColour }}
          className={onClass(darkMode, "relative top-[4px]")}
          width="20px"
          height="20px"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 11.5373 21.3065 11.4608 21.0672 11.8568C19.9289 13.7406 17.8615 15 15.5 15C11.9101 15 9 12.0899 9 8.5C9 6.13845 10.2594 4.07105 12.1432 2.93276C12.5392 2.69347 12.4627 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
        </svg>
      ) : (
        ""
      )}
    </div>
  );
};

const WebSocketProvider = ({ children }) => {
  const [socketUrl, setSocketUrl] = useState(
    `ws://${window.location.host}/websocket`,
  );
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: (closeEvent) => {
      console.log(closeEvent);
      return true;
    },
    // heartbeat: { message: JSON.stringify({ type: "ping", interval: 2000 }) },
    heartbeat: { message: "ping", interval: 2000 },
  });

  const [ready, setReady] = useState(false);

  const [whiteHue, setWhiteHue] = useState(0);
  const [blackHue, setBlackHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [fade, setFade] = useState(0);
  const [colorCycle, setColorCycle] = useState(false);
  const [colorCycleSpeed, setColorCycleSpeed] = useState(false);
  const [scale, setScale] = useState(false);
  const [decay, setDecay] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const setters = {
    white: setWhiteHue,
    black: setBlackHue,
    saturation: setSaturation,
    brightness: setBrightness,
    fade: setFade,
    dark_mode: setDarkMode,
    colour_cycle: setColorCycle,
    colour_cycle_speed: setColorCycleSpeed,
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
        sendJsonMessage({
          type: "status_update",
          value: "ready",
          timestamp: Date.now(),
        });
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
        colorCycleSpeed,
        setColorCycleSpeed,
        scale,
        setScale,
        decay,
        setDecay,
        darkMode,
        setDarkMode,
      }}
    >
      {ready ? children : <ConnectionIcon text="Loading..." />}
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

const ConnectionStatus = ({ children }) => {
  const { isConnected, darkMode } = joinWebSocket();

  return (
    <div>
      <ConnectionIcon />
      <div className={`relative ${isConnected() ? "" : "opacity-10"}`}>
        {children}
        {!isConnected() ? (
          <div
            className="absolute bottom-0 left-0 right-0 top-0"
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopImmediatePropagation();
            }}
          ></div>
        ) : (
          ""
        )}
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
    colorCycleSpeed,
    setColorCycleSpeed,
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

  const percent = (v) => {
    return `${(v * 100).toFixed(1)}%`;
  };

  const Label = ({ name, value }) => {
    return (
      <div>
        <span className="text-label">{name}</span>{" "}
        <span className="text-subdued">
          {typeof value === "string" ? value : percent(value)}
        </span>
      </div>
    );
  };
  const sliderHeight = 200;
  const horizSliderWidth = BROWSER_WIDTH - THUMB_SIZE;
  const saturationDiv = React.useRef(null);
  const [saturationHeight, setSaturationHeight] = useState(0);
  const [globalTouch, setGlobalTouch] = useState(false);
  React.useEffect(() => {
    setSaturationHeight(saturationDiv.current.clientWidth / 2);
  }, []);
  const cycleDuration = () => {
    if (!colorCycle) {
      return "OFF";
    }
    const interval = Math.max(10, (1 - colorCycleSpeed) * 1000);
    const duration = 360 * (interval / 1000);
    return `${duration.toFixed(1)}s`;
  };
  return (
    <div
      onTouchStart={() => setGlobalTouch(true)}
      onTouchEnd={() => setGlobalTouch(false)}
    >
      <div className="flex flex-col gap-8" ref={saturationDiv}>
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
            <Label name="Colour Cycle" value={cycleDuration()} />
            <ScaleSlider
              width={horizSliderWidth}
              value={colorCycleSpeed}
              toggle={colorCycle}
              minValue={0}
              maxValue={1.0}
              onChange={handleChange("color_cycle_speed", setColorCycleSpeed)}
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
              valueMap={(value) => Math.pow(value, 1 / 3.2)}
              inverseValueMap={(value) => Math.pow(value, 3.2)}
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
      <div className="flex justify-center">
        <div className="max-w-[390px] flex flex-col">
          <ConnectionStatus>
            <div className="min-h-screen p-3">
              <div className="">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ColorControls />
                </div>
              </div>
            </div>
          </ConnectionStatus>
        </div>
      </div>
    </WebSocketProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(<App />);
