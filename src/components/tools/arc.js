import Tool from './tool.js'
export default class Arc extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'arc'
    defaults.angle = defaults.angle || 2
    defaults.angleMin = defaults.angleMin || 0.1
    defaults.angleMax = defaults.angleMax || 5
    defaults.angleStep = defaults.angleStep || 0.01


    let options = [
      {
          property: "angle",
          description: "Angle",
          type    : "int",
          value   : defaults.angle,
          min     : defaults.angleMin,
          max     : defaults.angleMax,
          step    : defaults.angleStep,
          redraw  : true
      },
      {
        property: "dashlength",
        description: "Dash",
        type    : "int",
        value   : 2,
        min     : 0,
        max     : 10,
        step    : 1
      },
      {
        property: "gaplength",
        description: "Gap",
        type    : "int",
        value   : 2,
        min     : 0,
        max     : 10,
        step    : 1
      },
      {
        property: "dash",
        description: "Dashed",
        type    : "boolean",
        value   : false
      }             
  ];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)

    // Backup parameters, applied after options change

    this._pos = {
      startPoint: false,
      toPoint: false,
      bounds: false,
      rotation: false,
      previousSibling: false
    }
  }

  setOption(name, value) {
    let redraw = false;
    this.applyDash(name, value)
    this.options.forEach(o => {
      if (o.property == name) {
        try {
          this.primitive[name] = value;
          o.value = value;            
        }
        catch (err) {
          console.warn(err);
        }
        if (o.redraw === true) redraw = o.redraw
      }
    })
    if (redraw === true) {
        
      if (this.primitive) {
        this._pos.bounds = this.primitive.bounds
        this._pos.rotation = this.primitive.rotation
        this._pos.previousSibling = this.primitive.previousSibling || false
        this.primitive.remove()
      }
      this.primitive = this.drawAngle(this._pos.startPoint, this._pos.toPoint);
/*      if (this._pos.bounds) {
        this.primitive.bounds = this._pos.bounds
      }*/
      if (this._pos.rotation) {
        this.primitive.rotation = this._pos.rotation
      }
      if (this._pos.previousSibling) {
        this.primitive.insertAbove(this._pos.previousSibling)
      }
      this.applyStyle()
      this.attachEvents()
    }
  }

  drawAngle(from, to) {
    let x1 = new this.paper.Point(from.x + ((to.y - from.y) / 2), from.y + ((to.x - from.x) / 2))
    let x2 = to.subtract(from).divide(2).add(from)
    let through = x1.subtract(x2).divide(this.getOption('angle', true).value * 1).add(x2)
	return (new this.paper.Path.Arc(from, through, to));
  }

  createPrimitive(point) {
    let _toPoint  = this.round(point)
    this._pos = {
      startPoint: this.startPoint,
      toPoint: _toPoint,
    }
    return this.drawAngle(this._pos.startPoint, this._pos.toPoint)
  }


  transformation(mode, point, delta) {
    switch (mode) {
      case 'Resize':
        this.primitive.bounds.size = this.primitive.bounds.size.add(new this.paper.Size(delta.x, this.paper.Key.isDown('shift') ? (delta.x / this.primitive.bounds.width * this.primitive.bounds.height) : delta.y));
        break;
    }
  }

  translate(delta) {
    this._pos.startPoint.x += delta.x;
    this._pos.startPoint.y += delta.y;
    this._pos.toPoint.x += delta.x;
    this._pos.toPoint.y += delta.y;
    this.primitive.position.x += delta.x;
    this.primitive.position.y += delta.y;
  }


  endTranslate() {
    this.startPoint = this.primitive.bounds.topLeft = this.round(this.primitive.bounds.topLeft);
    this.originalPos = this.primitive.position;
  }

  endtransformation(mode) {
    switch (mode) {
      case 'Resize':
        if (!this.paper.Key.isDown('meta') && this.state.magnetic === true) {
          this.primitive.bounds.width = Math.round(this.primitive.bounds.width / (this.state.gridsize.x * 2)) * (this.state.gridsize.x * 2)
          this.primitive.bounds.height = Math.round(this.primitive.bounds.height / (this.state.gridsize.y * 2)) * (this.state.gridsize.y * 2)
        }
        break;
    }
  }
}
