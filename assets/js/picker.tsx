import React from "react";
import { Layer, Stage, Shape, Circle, Arc } from "react-konva";

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
      radius={20}
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
