import React from "react";
import { Layer, Stage, Shape, Circle } from "react-konva";

const drawHueSlider = (ctx, shape) => {
  var x = 150;
  var y = 150;
  var radius = 125;
  var counterClockwise = false;

  ctx.clearRect(0, 0, 300, 300);

  for (var angle = 0; angle < 360; angle++) {
    var startAngle = ((angle - 1) * Math.PI) / 180;
    var endAngle = ((angle + 1) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise);
    ctx.closePath();
    // ctx.fillStyle = 'hsl('+angle+','+this.state.saturation+'%,'+this.state.light+'%)';
    ctx.fillStyle = "hsl(" + angle + "," + "100" + "%," + "50" + "%)";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 360);
  ctx.closePath();

  ctx.beginPath();
  ctx.arc(x, y, radius - 30, 0, 360);
  ctx.closePath();
  ctx.fillStyle = "#EBEBEB";
  ctx.fill();
  ctx.fillStrokeShape(shape);
};

const Selector = ({ value, onChange, dragBound, x, y }) => {
  const getHue = (x, y) => {
    const angleDeg = Math.floor(
      (Math.atan2(150 - y, 150 - x) * 180) / Math.PI + 180,
    );
    onChange(angleDeg);
  };
  const onDrag = (e) => {
    const x = e.target.attrs.x;
    const y = e.target.attrs.y;
    getHue(x, y);
  };
  const color = () => `hsl(${value} 100% 50%)`;
  return (
    <Circle
      radius={20}
      stroke="white"
      strokeWidth={1}
      fill={color()}
      shadowBlur={4}
      draggable
      onDragStart={onDrag}
      onDragMove={onDrag}
      dragBoundFunc={dragBound}
      transformsEnabled={"position"}
      x={x}
      y={y}
    />
  );
};
export const ColorWheel = ({ width, height, value, onChange, disabled }) => {
  const hueDragBound = (pos) => {
    var x = 150;
    var y = 150;
    var radius = 110;

    if (pos.x === x && pos.y === y) return { x: x + radius, y: y };
    else {
      var scale =
        radius / Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
      return {
        y: Math.round((pos.y - y) * scale + y),
        x: Math.round((pos.x - x) * scale + x),
      };
    }
  };
  return (
    <Stage width={width} height={height}>
      <Layer>
        <Shape width={width} height={height} sceneFunc={drawHueSlider} />
        <Selector
          onChange={onChange}
          value={value}
          dragBound={hueDragBound}
          x={150}
          y={40}
        />
      </Layer>
    </Stage>
  );
};
/*
class ColorWheel extends React.Component {
  constructor() {
    super();
    this.state = {
      hue: 270,
      saturation: 100,
      light: 50,
      color: "hsl(270,100%,50%)",
    };
    this.getHue = this.getHue.bind(this);
    this.getSaturation = this.getSaturation.bind(this);
    this.getLight = this.getLight.bind(this);
    this.hueDragBound = this.hueDragBound.bind(this);
    this.saturationDragBound = this.saturationDragBound.bind(this);
    this.lightDragBound = this.lightDragBound.bind(this);
    this.drawHueSlider = this.drawHueSlider.bind(this);
    this.drawSaturationSlider = this.drawSaturationSlider.bind(this);
    this.drawLightSlider = this.drawLightSlider.bind(this);
    this.drawSample = this.drawSample.bind(this);
  }

  drawSample() {
    var canvas = this.refs.layer.canvas;
    var ctx = canvas.getContext("2d");

    var color = tinycolor(this.state.color);
    var hex = "#" + color.toHex().toUpperCase();

    ctx.clearRect(95, 85, 110, 130);
    ctx.fillStyle = "lightgray";
    ctx.fillRect(95, 85, 110, 130);
    ctx.fillStyle = this.state.color;
    ctx.fillRect(100, 90, 100, 100);

    ctx.font = "20px sans-serif";
    ctx.fillStyle = "gray";
    ctx.fillText(hex, 107, 210);
  }

  getHue(x, y) {
    var angleDeg = Math.floor(
      (Math.atan2(150 - y, 150 - x) * 180) / Math.PI + 180,
    );
    this.setState({
      hue: angleDeg,
      color:
        "hsl(" +
        angleDeg +
        "," +
        this.state.saturation +
        "%," +
        this.state.light +
        "%)",
    });
    this.drawSaturationSlider();
    this.drawLightSlider();
    this.drawSample();
  }

  getSaturation(x, y) {
    var offset = 50;
    var height = 200;
    var saturation = Math.round(-y / 2 + 125);
    this.setState({
      saturation: saturation,
      color:
        "hsl(" +
        this.state.hue +
        "," +
        saturation +
        "%," +
        this.state.light +
        "%)",
    });
    this.drawHueSlider();
    this.drawLightSlider();
    this.drawSample();
  }

  getLight(x, y) {
    var offset = 50;
    var height = 200;
    var light = Math.round(-y / 2 + 125);
    this.setState({
      light: light,
      color:
        "hsl(" +
        this.state.hue +
        "," +
        this.state.saturation +
        "%," +
        light +
        "%)",
    });
    this.drawHueSlider();
    this.drawSaturationSlider();
    this.drawSample();
  }

  saturationDragBound(pos) {
    var top = 50;
    var height = 200;
    var bottom = height + top;
    return {
      x: 365,
      y: pos.y < top ? top : pos.y > bottom ? bottom : pos.y,
    };
  }

  hueDragBound(pos) {
    var x = 150;
    var y = 150;
    var radius = 110;

    if (pos.x === x && pox.y === y) return { x: x + radius, y: y };
    else {
      var scale =
        radius / Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
      return {
        y: Math.round((pos.y - y) * scale + y),
        x: Math.round((pos.x - x) * scale + x),
      };
    }
  }

  lightDragBound(pos) {
    var top = 50;
    var height = 200;
    var bottom = height + top;
    return {
      x: 445,
      y: pos.y < top ? top : pos.y > bottom ? bottom : pos.y,
    };
  }

  drawLightSlider() {
    var canvas = this.refs.layer.canvas;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(425, 0, 40, 300);

    ctx.beginPath();
    ctx.arc(445, 50, 15, 0, 360, true);
    ctx.fillStyle =
      "hsl(" + this.state.hue + "," + this.state.light + "%,100%)";
    // ctx.fillStyle = 'hsl(0,0%,100%)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(445, 250, 15, 0, 180, false);
    ctx.fillStyle = "hsl(" + this.state.hue + "," + this.state.light + "%,0%)";
    // ctx.fillStyle = 'hsl(0,0%,0%)';
    ctx.fill();

    for (var i = 0; i <= 100; i++) {
      ctx.fillStyle =
        "hsl(" + this.state.hue + "," + this.state.saturation + "%," + i + "%)";
      // ctx.fillStyle = 'hsl(0,0%,'+i+'%)';
      ctx.fillRect(430, 250 - 2 * i, 30, 2);
    }
  }

  drawSaturationSlider() {
    var canvas = this.refs.layer.canvas;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(350, 0, 40, 300);
    ctx.beginPath();
    ctx.arc(365, 50, 15, 0, 360, true);
    // ctx.fillStyle = 'hsl('+this.state.hue+',100%,'+this.state.light+'%)';
    ctx.fillStyle = "hsl(" + this.state.hue + ",100%," + "50%)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(365, 250, 15, 0, 180, false);
    // ctx.fillStyle = 'hsl('+this.state.hue+',0%,'+this.state.light+'%)';
    ctx.fillStyle = "hsl(" + this.state.hue + ",0%," + "50%)";
    ctx.fill();

    for (var i = 0; i <= 100; i++) {
      // ctx.fillStyle = 'hsl('+this.state.hue+','+i+'%,'+this.state.light+'%)';
      ctx.fillStyle = "hsl(" + this.state.hue + "," + i + "%," + "50%)";
      ctx.fillRect(350, 250 - 2 * i, 30, 2);
    }
  }

  drawHueSlider() {
    var canvas = this.refs.layer.canvas;
    var ctx = canvas.getContext("2d");
    var x = 150;
    var y = 150;
    var radius = 125;
    var counterClockwise = false;

    ctx.clearRect(0, 0, 300, 300);

    for (var angle = 0; angle < 360; angle++) {
      var startAngle = ((angle - 1) * Math.PI) / 180;
      var endAngle = ((angle + 1) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, radius, startAngle, endAngle, counterClockwise);
      ctx.closePath();
      // ctx.fillStyle = 'hsl('+angle+','+this.state.saturation+'%,'+this.state.light+'%)';
      ctx.fillStyle = "hsl(" + angle + "," + "100" + "%," + "50" + "%)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 360);
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(x, y, radius - 30, 0, 360);
    ctx.closePath();
    ctx.fillStyle = "#EBEBEB";
    ctx.fill();
  }

  componentDidMount() {
    this.drawHueSlider();
    this.drawSaturationSlider();
    this.drawLightSlider();
    this.drawSample();
  }

  render() {
    return (
      <div id="background" style={{ background: "grey" }}>
        <div id="stage">
          <Stage width={500} height={300}>
            <Layer ref="layer" />
            <Layer>
              <Selector
                getColor={this.getHue}
                color={this.state.color}
                dragBound={this.hueDragBound}
                x={150}
                y={40}
              />
            </Layer>
            <Layer>
              <Selector
                getColor={this.getSaturation}
                color={this.state.color}
                dragBound={this.saturationDragBound}
                x={365}
                y={50}
              />
            </Layer>
            <Layer>
              <Selector
                getColor={this.getLight}
                color={this.state.color}
                dragBound={this.lightDragBound}
                x={445}
                y={150}
              />
            </Layer>
          </Stage>
        </div>
      </div>
    );
  }
}

class Selector extends React.Component {
  constructor() {
    super();
    this.onDrag = this.onDrag.bind(this);
  }

  componentDidMount() {
    this.refs.circle.attrs.x = this.props.x;
    this.refs.circle.attrs.y = this.props.y;
  }

  onDrag(e) {
    var _x = e.target.attrs.x;
    var _y = e.target.attrs.y;
    this.props.getColor(_x, _y);
  }

  render() {
    return (
      <Circle
        ref="circle"
        radius={20}
        stroke="white"
        strokeWidth={1}
        fill={this.props.color}
        shadowBlur={4}
        draggable
        onDragStart={this.onDrag}
        onDragMove={this.onDrag}
        dragBoundFunc={this.props.dragBound}
        transformsEnabled={"position"}
      />
    );
  }
}

module.exports = ColorWheel;
*/
// ReactDOM.render(<ColorWheel />, document.getElementById("container"));
//
