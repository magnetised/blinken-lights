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
  container,
  whiteValue,
  blackValue,
  onWhiteChange,
  onBlackChange,
  whiteColor,
  blackColor,
  disabled,
}) => {
  const [size, setWidth] = React.useState(300);
  const wheelThickness = 30;
  const mainRadius = size / 2 - wheelThickness / 2;
  const centre = mainRadius + wheelThickness / 4;
  console.log(container);
  const checkSize = () => {};
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
    ctx.fillStyle = "#EBEBEB";
    ctx.fill();
    ctx.fillStrokeShape(shape);
  };
  const div = React.useRef(null);
  React.useEffect(() => {
    setWidth(div.current.clientWidth);
  }, []);
  const arcRadius = mainRadius - wheelThickness - 20;
  return (
    <div ref={div}>
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
  const totalWidth = 36 * 2 + 4;
  const barWidth = 2;
  const top = totalWidth / 2;
  const middleX = 1 + totalWidth / 2;

  const onDrag = (e) => {
    const value = 1.0 - (e.target.attrs.y - top) / height;
    onChange(value);
  };
  const dragBound = (pos) => {
    return {
      x: middleX,
      y: pos.y < top ? top : pos.y > top + height ? top + height : pos.y,
    };
  };
  const innerR = 8 + 10;
  return (
    <Stage width={totalWidth} height={height + top * 2}>
      <Layer>
        <Rect
          x={middleX - barWidth / 2}
          y={top}
          width={barWidth}
          height={height}
          cornerRadius={barWidth / 2}
          stroke={"#eee"}
          fill={"#fff"}
          opacity={0.3}
        />
        <Rect
          x={middleX - barWidth / 2}
          y={top + height * (1.0 - value)}
          width={barWidth}
          height={height - height * (1.0 - value)}
          cornerRadius={barWidth / 2}
          stroke={"#eee"}
          fill={"#fff"}
          opacity={0.8}
        />
        <Group
          draggable
          onDragStart={onDrag}
          onDragMove={onDrag}
          dragBoundFunc={dragBound}
          transformsEnabled={"position"}
          x={middleX}
          y={top + height * (1.0 - value)}
        >
          <Circle
            radius={8}
            stroke={"#000"}
            strokeWidth={0}
            fill={"#fff"}
            opacity={0.9}
            x={0}
            y={0}
          />
          <Ring
            innerRadius={innerR}
            outerRadius={innerR + 18}
            fill={"#fff"}
            opacity={0.3}
            x={0}
            y={0}
          />
          <Ring
            innerRadius={innerR}
            outerRadius={innerR + 18}
            opacity={0.2}
            strokeWidth={1}
            stroke={"#fff"}
            x={0}
            y={0}
          />
        </Group>
      </Layer>
    </Stage>
  );
};
