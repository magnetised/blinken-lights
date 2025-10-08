import React from "react";
import {
  Layer,
  Stage,
  Shape,
  Circle,
  Arc,
  Rect,
  Group,
  Ring,
} from "react-konva";

const selectorRadius = 20;
const Selector = ({ value, onChange, centre, radius, borderColor }) => {
  const r = Math.PI / 180;
  const hw = centre;
  const hh = centre;
  const getHue = (x, y) => {
    const angleDeg = (Math.atan2(hh - y, hw - x) * 180) / Math.PI + 180;
    onChange(angleDeg);
  };
  const onDrag = (e) => {
    const x = e.target.attrs.x;
    const y = e.target.attrs.y;
    getHue(x, y);
  };
  const hueDragBound = (pos) => {
    var scale =
      radius /
      Math.sqrt(Math.pow(pos.x - centre, 2) + Math.pow(pos.y - centre, 2));

    return {
      y: Math.round((pos.y - centre) * scale + centre),
      x: Math.round((pos.x - centre) * scale + centre),
    };
  };
  // calc position from hue...
  const pos = {
    x: centre + radius * Math.cos(value * r),
    y: centre + radius * Math.sin(value * r),
  };

  const color = () => `hsl(${value} 100% 50%)`;

  return (
    <Circle
      radius={selectorRadius}
      stroke={borderColor}
      strokeWidth={3}
      fill={color()}
      shadowBlur={4}
      draggable
      onDragStart={onDrag}
      onDragMove={onDrag}
      dragBoundFunc={hueDragBound}
      transformsEnabled={"position"}
      x={pos.x}
      y={pos.y}
    />
  );
};
export const ColorWheel = ({
  size,
  whiteValue,
  blackValue,
  onWhiteChange,
  onBlackChange,
  whiteColor,
  blackColor,
  disabled,
}) => {
  // const [size, setWidth] = React.useState(300);
  const wheelThickness = 30;
  const mainRadius = size / 2 - wheelThickness / 4;
  const centre = mainRadius + wheelThickness / 8;
  const drawHueSlider = (ctx, shape) => {
    var x = centre;
    var y = centre;
    var counterClockwise = false;

    ctx.clearRect(0, 0, size, size);

    for (var angle = 0; angle < 360; angle++) {
      var startAngle = ((angle - 1) * Math.PI) / 180;
      var endAngle = ((angle + 1) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, mainRadius, startAngle, endAngle, counterClockwise);
      ctx.closePath();
      // ctx.fillStyle = 'hsl('+angle+','+this.state.saturation+'%,'+this.state.light+'%)';
      ctx.fillStyle = "hsl(" + angle + "," + "100" + "%," + "50" + "%)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, mainRadius, 0, 360);
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(x, y, mainRadius - wheelThickness, 0, 360);
    ctx.closePath();
    ctx.fillStyle = "oklch(0.21 0.034 264.665)";
    ctx.fill();
    ctx.fillStrokeShape(shape);
  };

  const div = React.useRef(null);

  // React.useEffect(() => {
  //   setWidth(div.current.clientWidth * 0.75);
  // }, []);

  const arcRadius = mainRadius - wheelThickness - 20;
  return (
    <div className="flex justify-center align-center" ref={div}>
      <Stage width={size} height={size}>
        <Layer>
          <Shape
            width={size}
            height={size}
            sceneFunc={drawHueSlider}
            onClick={(e) => {
              console.log("onclick");
            }}
          />
        </Layer>
        <Layer>
          <Selector
            onChange={onWhiteChange}
            value={whiteValue}
            width={size}
            height={size}
            borderColor="#ffffff"
            centre={mainRadius + wheelThickness / 4}
            radius={mainRadius - wheelThickness / 2}
          />
          <Selector
            onChange={onBlackChange}
            value={blackValue}
            width={size}
            height={size}
            borderColor="#000000"
            centre={mainRadius + wheelThickness / 4}
            radius={mainRadius - wheelThickness / 2}
          />
        </Layer>
        <Layer rotation={0} offset={{ x: mainRadius, y: mainRadius }}>
          <Arc
            rotation={90}
            innerRadius={0}
            outerRadius={arcRadius}
            x={mainRadius * 2 + wheelThickness / 4 - 8}
            y={mainRadius * 2 + wheelThickness / 4}
            fill={whiteColor}
            angle={180}
            stroke={"#fff"}
            strokeWidth={5}
          />
          <Arc
            rotation={-90}
            innerRadius={0}
            outerRadius={arcRadius}
            x={mainRadius * 2 + wheelThickness / 4 + 8}
            y={mainRadius * 2 + wheelThickness / 4}
            fill={blackColor}
            angle={180}
            stroke={"#000"}
            strokeWidth={5}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export const Slider = ({ height, value, onChange }) => {
  const innerR = 18;
  const outerR = innerR + 18;
  const totalWidth = outerR * 2 + 4;
  const finalHeight = height - 2 * outerR - 2;
  const barWidth = 2;
  const top = totalWidth / 2;
  const middleX = 1 + totalWidth / 2;
  const [touching, setTouching] = React.useState(false);

  const onDrag = (e) => {
    const value = 1.0 - (e.target.attrs.y - top + outerR) / finalHeight;
    onChange(value);
  };
  const dragBound = (pos) => {
    let y;
    if (pos.y < top - outerR) {
      y = top - outerR;
    } else if (pos.y > top + finalHeight - outerR) {
      y = top + finalHeight - outerR;
    } else {
      y = pos.y;
    }
    return {
      x: middleX - outerR,
      y: y,
    };
  };
  return (
    <Stage width={totalWidth} height={height}>
      <Layer>
        <Rect
          x={middleX - barWidth / 2}
          y={top}
          width={barWidth}
          height={finalHeight}
          cornerRadius={barWidth / 2}
          stroke={"#eee"}
          fill={"#fff"}
          opacity={0.2}
        />
        <Rect
          x={middleX - barWidth / 2}
          y={top + finalHeight * (1.0 - value)}
          width={barWidth}
          height={finalHeight - finalHeight * (1.0 - value)}
          cornerRadius={barWidth / 2}
          fill={"#fff"}
          opacity={0.8}
        />
        <Group
          draggable
          onDragStart={onDrag}
          onDragMove={onDrag}
          onTouchStart={() => setTouching(true)}
          onTouchEnd={() => setTouching(false)}
          dragBoundFunc={dragBound}
          transformsEnabled={"position"}
          width={totalWidth}
          height={totalWidth}
          x={middleX - outerR}
          y={top - outerR + finalHeight * (1.0 - value)}
        >
          <Circle
            x={outerR}
            y={outerR}
            radius={outerR}
            fill={"#fff"}
            opacity={0.01}
          />
          <Circle
            radius={8}
            stroke={"#000"}
            strokeWidth={0}
            fill={"#fff"}
            opacity={0.9}
            x={outerR}
            y={outerR}
          />
          <Ring
            innerRadius={innerR}
            outerRadius={outerR}
            fill={"#fff"}
            opacity={touching ? 0.2 : 0.05}
            x={outerR}
            y={outerR}
          />
          <Ring
            innerRadius={innerR}
            outerRadius={outerR}
            opacity={0.05}
            strokeWidth={1}
            stroke={"#fff"}
            x={outerR}
            y={outerR}
          />
        </Group>
      </Layer>
    </Stage>
  );
};

export const HorizontalSlider = ({ width, value, onChange }) => {
  const innerR = 18;
  const outerR = innerR + 18;
  const totalHeight = outerR * 2 + 4;
  const finalWidth = width - 2 * outerR - 2;
  const barHeight = 2;
  const left = totalHeight / 2;
  const middleY = 1 + totalHeight / 2;
  const [touching, setTouching] = React.useState(false);

  const onDrag = (e) => {
    const value = (e.target.attrs.x - left + outerR) / finalWidth;
    onChange(value);
  };
  const dragBound = (pos) => {
    let x;
    if (pos.x < left - outerR) {
      x = left - outerR;
    } else if (pos.x > left + finalWidth - outerR) {
      x = left + finalWidth - outerR;
    } else {
      x = pos.x;
    }
    return {
      y: middleY - outerR,
      x: x,
    };
  };
  return (
    <Stage width={width} height={totalHeight}>
      <Layer>
        <Rect
          x={left}
          y={middleY - barHeight / 2}
          width={finalWidth}
          height={barHeight}
          cornerRadius={barHeight / 2}
          stroke={"#eee"}
          fill={"#fff"}
          opacity={0.2}
        />
        <Rect
          x={left}
          y={middleY - barHeight / 2}
          width={finalWidth * value}
          height={barHeight}
          cornerRadius={barHeight / 2}
          fill={"#fff"}
          opacity={0.8}
        />
        <Group
          draggable
          onDragStart={onDrag}
          onDragMove={onDrag}
          onTouchStart={() => setTouching(true)}
          onTouchEnd={() => setTouching(false)}
          dragBoundFunc={dragBound}
          transformsEnabled={"position"}
          width={totalHeight}
          height={totalHeight}
          x={left - outerR + finalWidth * value}
          y={middleY - outerR}
        >
          <Circle
            x={outerR}
            y={outerR}
            radius={outerR}
            fill={"#fff"}
            opacity={0.01}
          />
          <Circle
            radius={8}
            stroke={"#000"}
            strokeWidth={0}
            fill={"#fff"}
            opacity={0.9}
            x={outerR}
            y={outerR}
          />
          <Ring
            innerRadius={innerR}
            outerRadius={outerR}
            fill={"#fff"}
            opacity={touching ? 0.2 : 0.05}
            x={outerR}
            y={outerR}
          />
          <Ring
            innerRadius={innerR}
            outerRadius={outerR}
            opacity={0.05}
            strokeWidth={1}
            stroke={"#fff"}
            x={outerR}
            y={outerR}
          />
        </Group>
      </Layer>
    </Stage>
  );
};
export const ScaleSlider = ({
  width,
  value,
  minValue,
  maxValue,
  onChange,
  toggle,
  onToggle,
}) => {
  const innerR = 18;
  const outerR = innerR + 18;
  const totalHeight = outerR * 2 + 4;
  const finalWidth = width - 2 * outerR - 2;
  const barHeight = 2;
  const left = totalHeight / 2;
  const middleY = 1 + totalHeight / 2;
  const offPos = left + outerR;

  const scaledValue = (value - minValue) / maxValue;
  const sliderPos = toggle ? offPos + finalWidth * scaledValue : left;
  const [touching, setTouching] = React.useState(false);

  const onDrag = (e) => {
    const x = e.target.attrs.x;
    if (x >= offPos - outerR) {
      onToggle(true);
      const value = ((x - offPos + outerR) / finalWidth) * maxValue + minValue;
      onChange(value);
    } else {
      onToggle(false);
    }
  };
  const dragBound = (pos) => {
    let x;
    if (pos.x < left - outerR) {
      x = left - outerR;
    } else if (pos.x > left + finalWidth - outerR) {
      x = left + finalWidth - outerR;
    } else if (pos.x < offPos - outerR) {
      x = left - outerR;
    } else {
      x = pos.x;
    }
    return {
      y: middleY - outerR,
      x: x,
    };
  };
  return (
    <Stage width={width} height={totalHeight}>
      <Layer>
        <Rect
          x={left}
          y={middleY - barHeight / 2}
          width={finalWidth}
          height={barHeight}
          cornerRadius={barHeight / 2}
          stroke={"#eee"}
          fill={"#fff"}
          opacity={0.2}
        />
        <Rect
          x={offPos}
          y={middleY - barHeight / 2}
          width={toggle ? finalWidth * scaledValue : 0}
          height={barHeight}
          cornerRadius={0}
          fill={"#fff"}
          opacity={toggle ? 0.8 : 0}
        />
        <Rect
          x={offPos}
          y={middleY - innerR}
          width={1}
          height={2 * innerR}
          cornerRadius={barHeight / 2}
          fill={"#fff"}
          opacity={0.8}
        />
        <Group
          draggable
          onDragStart={onDrag}
          onDragMove={onDrag}
          onTouchStart={() => setTouching(true)}
          onTouchEnd={() => setTouching(false)}
          dragBoundFunc={dragBound}
          transformsEnabled={"position"}
          width={totalHeight}
          height={totalHeight}
          x={sliderPos - outerR}
          y={middleY - outerR}
        >
          <Circle
            x={outerR}
            y={outerR}
            radius={outerR}
            fill={"#fff"}
            opacity={0.01}
          />
          <Circle
            radius={8}
            stroke={"#000"}
            strokeWidth={0}
            fill={"#fff"}
            opacity={0.9}
            x={outerR}
            y={outerR}
          />
          <Ring
            innerRadius={innerR}
            outerRadius={outerR}
            fill={"#fff"}
            opacity={touching ? 0.2 : 0.05}
            x={outerR}
            y={outerR}
          />
          <Ring
            innerRadius={innerR}
            outerRadius={outerR}
            opacity={0.05}
            strokeWidth={1}
            stroke={"#fff"}
            x={outerR}
            y={outerR}
          />
        </Group>
      </Layer>
    </Stage>
  );
};
