import React, {
  createContext,
  SyntheticEvent,
  useContext,
  useEffect,
  useState,
  // useRef,
  // useCallback,
} from "react";
import ReactDOM from "react-dom/client";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { BROWSER_WIDTH, WHEEL_SIZE, THUMB_SIZE } from "./constants.ts";

import {
  ColorWheel,
  HorizontalSlider,
  ScaleSlider,
  Slider,
} from "./picker.jsx";

type DisplayContext = {
  readyState;
  sendMessage: sendJsonMessage;
  isConnected;
  white;
  setWhite;
  black;
  setBlack;
  brightness;
  setBrightness;
  fade;
  setFade;
  colorCycle;
  setColorCycle;
  colorCycleSpeed;
  setColorCycleSpeed;
  scale;
  setScale;
  decay;
  setDecay;
  darkMode;
  setDarkMode;
};
const WebSocketContext = createContext<DisplayContext | null>(null);
const iconColour = "oklch(0.4859 0.0941 264.665)";

const ConnectionIcon = (_props: { text?: string }) => {
  const { isConnected, darkMode } = joinWebSocket();
  const onClass = (onState: boolean, extra = "") => {
    return `stroke-none ${onState ? "opacity-90" : "opacity-10"} ${extra}`;
  };
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
    </div>
  );
};

type DisplayColour = {
  hue: number;
  saturation: number;
};
type DisplayConfig = {
  white: DisplayColour;
  black: DisplayColour;
  saturation: number;
  brightness: number;
  fade: number;
  colour_cycle: boolean;
  colour_cycle_speed: number;
  scale: boolean;
  decay: number;
};
type DisplayColourUpdate = { hue?: number; saturation?: number };

const WebSocketProvider = ({ children }) => {
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    `ws://${window.location.host}/websocket`,
    {
      shouldReconnect: (closeEvent: CloseEvent) => {
        console.log(closeEvent);
        return true;
      },
      heartbeat: { message: "ping", interval: 1000 },
    },
  );

  const [ready, setReady] = useState(false);

  const [white, setWhite] = useState({ hue: 0, saturation: 1 });
  const [black, setBlack] = useState({ hue: 0, saturation: 1 });
  const [brightness, setBrightness] = useState(0);
  const [fade, setFade] = useState(0);
  const [colorCycle, setColorCycle] = useState(false);
  const [colorCycleSpeed, setColorCycleSpeed] = useState(false);
  const [scale, setScale] = useState(false);
  const [decay, setDecay] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const setColor = (
    update: DisplayColourUpdate,
    value: DisplayColour,
    setter,
  ) => {
    let newValue = { ...value };
    for (const [key, v] of Object.entries(update)) {
      if (newValue.hasOwnProperty(key)) {
        newValue[key] = v;
      }
    }
    setter(newValue);
  };
  // type ConfigSettersMap = Record<
  //   keyof typeof ConfigSetterKey,
  //   (val: DisplayConfigValue) => DisplayConfigValue
  // >;
  const setters = {
    white: (v: DisplayColourUpdate) => setColor(v, white, setWhite),
    black: (v: DisplayColourUpdate) => setColor(v, black, setBlack),
    brightness: setBrightness,
    fade: setFade,
    dark_mode: setDarkMode,
    colour_cycle: setColorCycle,
    colour_cycle_speed: setColorCycleSpeed,
    scale: setScale,
    decay: setDecay,
  };

  const syncState = (state: DisplayConfig) => {
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
        white,
        setWhite,
        black,
        setBlack,
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
  const { isConnected } = joinWebSocket();

  return (
    <div>
      <ConnectionIcon />
      <div className={`${isConnected() ? "" : "relative opacity-10"}`}>
        {children}
        {!isConnected() ? (
          <div
            className="absolute bottom-0 left-0 right-0 top-0"
            onTouchStart={(e) => {
              e.preventDefault();
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
    white,
    setWhite,
    black,
    setBlack,
    brightness,
    setBrightness,
    darkMode,
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

  const handleChange = (
    name: string,
    setter: (v) => any,
    mapper = (v) => v,
  ) => {
    return (newValue: DisplayColour | boolean | number) => {
      const value = mapper(newValue);
      setter(value);

      // Send WebSocket message
      if (isConnected()) {
        sendMessage({
          type: "control_update",
          control: name,
          value: value,
          timestamp: Date.now(),
        });
      }
    };
  };

  const hslColor = (c: DisplayColour) => {
    return `hsl(${c.hue} ${c.saturation * 100}% ${50 + (1 - c.saturation) * 50}%)`;
  };

  const percent = (v: number) => {
    return `${(v * 100).toFixed(1)}%`;
  };

  const Label = ({ name, value }: { name: string; value: number | string }) => {
    return (
      <div>
        <span className="text-label">{name}</span>{" "}
        <span className="text-subdued">
          {typeof value === "string" ? value : percent(value)}
        </span>
      </div>
    );
  };
  const horizSliderWidth = BROWSER_WIDTH - THUMB_SIZE;
  const [globalTouch, setGlobalTouch] = useState(false);
  const cycleDuration = () => {
    if (!colorCycle) {
      return "OFF";
    }
    const interval = Math.max(10, (1 - colorCycleSpeed) * 1000);
    const duration = 360 * (interval / 1000);
    return `${duration.toFixed(1)}s`;
  };
  const [active, setActive] = useState("white");

  let setter;
  let value;

  if (active === "white") {
    [value, setter] = [white, setWhite];
  } else {
    [value, setter] = [black, setBlack];
  }

  const Tab = ({
    keyBg,
    color,
    onClick,
    isActive,
  }: {
    keyBg: string;
    color: DisplayColour;
    onClick: () => void;
    isActive: boolean;
  }) => {
    return (
      <div
        className={`flex flex-row items-center grow p-[10px] gap-1 ${isActive ? "" : "tab-inactive"}`}
        onClick={onClick}
        onTouchStart={onClick}
      >
        <div
          style={{ backgroundColor: hslColor(color) }}
          className={`flex grow items-end h-[38px] rounded-sm p-[4px]`}
        >
          <div
            className={`h-[4px] w-full rounded-sm ${isActive ? keyBg : ""}`}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div
      onTouchStart={() => setGlobalTouch(true)}
      onTouchEnd={() => setGlobalTouch(false)}
    >
      <div className="flex flex-col gap-5">
        <div className="bg-black/20 flex flex-col grow justify-center pb-[10px]">
          <div className="flex justify-center">
            <div className=" flex flex-col justify-center grow">
              <div className="flex flex-row grow">
                <Tab
                  keyBg={"bg-white"}
                  color={white}
                  isActive={active === "white"}
                  onClick={() => setActive("white")}
                />
                <Tab
                  keyBg={"bg-black"}
                  color={black}
                  isActive={active === "black"}
                  onClick={() => setActive("black")}
                />
              </div>
              <div className="flex flex-col items-center">
                <div className="max-w-[390px]">
                  <div className="flex flex-row gap-3 pt-[10px]">
                    <div className="flex flex-col grow">
                      <div className="flex flex-col justify-center">
                        <ColorWheel
                          size={WHEEL_SIZE}
                          value={value.hue}
                          onChange={handleChange(active, setter, (v) => ({
                            ...value,
                            hue: v,
                          }))}
                          disabled={colorCycle}
                          selectorColor={active === "white" ? "#fff" : "#000"}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center text-center">
                      <div className="flex flex-col justify-center">
                        <Slider
                          globalTouch={globalTouch}
                          height={WHEEL_SIZE}
                          value={value.saturation}
                          onChange={handleChange(active, setter, (v) => ({
                            ...value,
                            saturation: v,
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="max-w-[390px]">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col">
                <Label name="Colour Cycle" value={cycleDuration()} />
                <ScaleSlider
                  width={horizSliderWidth}
                  value={colorCycleSpeed}
                  toggle={colorCycle}
                  minValue={0}
                  maxValue={1.0}
                  onChange={handleChange(
                    "color_cycle_speed",
                    setColorCycleSpeed,
                  )}
                  onToggle={handleChange("color_cycle", setColorCycle)}
                  globalTouch={globalTouch}
                />
              </div>
              <div className="flex flex-col">
                <div className="flex flex-row gap-1">
                  <Label name="Brightness" value={brightness} />
                  <div className="flex grow justify-start opacity-40 relative top-[1px]">
                    {darkMode ? (
                      <div>
                        <svg
                          className="darkmode stroke-none"
                          width="18px"
                          height="18px"
                          viewBox="0 0 64 64"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M43.139 2a29.885 29.885 0 0 1 5.121 16.756c0 16.701-13.686 30.24-30.57 30.24a30.656 30.656 0 0 1-15.689-4.285C7.209 54.963 17.93 62 30.318 62C47.816 62 62 47.969 62 30.66C62 17.867 54.246 6.871 43.139 2z"></path>
                        </svg>
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <HorizontalSlider
                  globalTouch={globalTouch}
                  width={horizSliderWidth}
                  value={brightness}
                  onChange={handleChange("brightness", setBrightness)}
                />
              </div>
              <div className="flex flex-col">
                <Label name="Sustain" value={fade} />
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
                <Label
                  name="Scale"
                  value={scale ? `${decay.toFixed(1)}` : "OFF"}
                />
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
      </div>
    </div>
  );
};

const App = () => {
  return (
    <WebSocketProvider>
      <div className="flex flex-col grow">
        <ConnectionStatus>
          <ColorControls />
        </ConnectionStatus>
      </div>
    </WebSocketProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(<App />);
