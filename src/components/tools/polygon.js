import Tool from './tool.js'
export default class Polygon extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'polygon'
    defaults.sides = defaults.sides || 5
    defaults.sidesMin = defaults.sidesMin || 3
    defaults.sidesMax = defaults.sidesMax || 20
    defaults.sidesStep = defaults.sidesStep || 1


    let options = [
      {
          property: "sides",
          description: "Sides",
          type    : "int",
          value   : defaults.sides,
          min     : defaults.sidesMin,
          max     : defaults.sidesMax,
          step    : defaults.sidesStep,
          redraw  : true
      }
  ];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)

    // Backup parameters, applied after options change

    this._pos = {
      center: false,
      radius: false,
      bounds: false,
      rotation: false,
      previousSibling: false
    }
  }

  setOption(name, value) {
    let redraw = false;
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
        this._pos.center = this.primitive.bounds.center
        this._pos.rotation = this.primitive.rotation
        this._pos.previousSibling = this.primitive.previousSibling || false
        this.primitive.remove()
      }
      this.primitive = new this.paper.Path.RegularPolygon(
        this._pos.center, 
        this.getOption('sides', true).value * 1, 
        this._pos.radius1
      );
      if (this._pos.bounds) {
        this.primitive.bounds = this._pos.bounds
      }
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

  createPrimitive(point) {
    let _toPoint  = this.round(point)

    let _distance = Math.sqrt((_toPoint.x - this.startPoint.x) ** 2 + (_toPoint.y - this.startPoint.y) ** 2)
    _distance = _distance > this.state.gridsize.x ? _distance : this.state.gridsize.x


    this._pos = {
      center: this.startPoint,
      radius1: _distance,
      bounds: false
    }

    return new this.paper.Path.RegularPolygon(
      this._pos.center, 
      this.getOption('sides', true).value * 1, 
      this._pos.radius1);
  }


  transformation(mode, point, delta) {
    switch (mode) {
      case 'Resize':
        this.primitive.bounds.size = this.primitive.bounds.size.add(new this.paper.Size(delta.x, this.paper.Key.isDown('shift') ? (delta.x / this.primitive.bounds.width * this.primitive.bounds.height) : delta.y));
        break;
    }
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
