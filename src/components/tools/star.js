import Tool from './tool.js'
export default class Star extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'Star'
    defaults.starpoints = defaults.starpoints || 5
    defaults.starpointsMin = defaults.starpointsMin || 3
    defaults.starpointsMax = defaults.starpointsMax || 20
    defaults.starpointsStep = defaults.starpointsStep || 1

    defaults.starsize = defaults.starsize || 0.8
    defaults.starsizeMin = defaults.starsizeMin || 0.25
    defaults.starsizeMax = defaults.starsizeMax || 0.95
    defaults.starsizeStep = defaults.starsizeStep || 0.05


    let options = [
      {
          property: "starpoints",
          description: "Points",
          type    : "int",
          value   : defaults.starpoints,
          min     : defaults.starpointsMin,
          max     : defaults.starpointsMax,
          step    : defaults.starpointsStep,
          redraw  : true
      },
      {
        property: "starsize",
        description: "Size",
        type    : "int",
        value   : defaults.starsize,
        min     : defaults.starsizeMin,
        max     : defaults.starsizeMax,
        step    : defaults.starsizeStep,
        redraw  : true
    }

  ];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)

    // Backup parameters, applied after options change

    this._pos = {
      center: false,
      radius1: false,
      radius2: false,
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
        this._pos.rotation = this.primitive.rotation
        this._pos.previousSibling = this.primitive.previousSibling || false
        this.primitive.remove()
      }
      this._pos.radius2 = this._pos.radius1 * this.getOption('starsize', true).value * 1
      this.primitive = new this.paper.Path.Star(
        this._pos.center, 
        this.getOption('starpoints', true).value * 1, 
        this._pos.radius1,
        this._pos.radius2
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
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x
    }

    let _distance = Math.sqrt((_toPoint.x - this.startPoint.x) ** 2 + (_toPoint.y - this.startPoint.y) ** 2)
    _distance = _distance > this.state.gridsize.x ? _distance : this.state.gridsize.x


    this._pos = {
      center: this.startPoint,
      radius1: _distance,
      radius2: _distance * this.getOption('starsize', true).value * 1,
      bounds: false
    }

    console.log(this.getOption('starsize', true).value * 1)

    return new this.paper.Path.Star(
      this._pos.center, 
      this.getOption('starpoints', true).value * 1, 
      this._pos.radius1,
      this._pos.radius2);
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
    this._pos.center = this.primitive.bounds.center
  }

  endtransformation(mode) {
    switch (mode) {
      case 'Resize':
        if (!this.paper.Key.isDown('meta') && this.state.magnetic === true) {
          this.primitive.bounds.width = Math.round(this.primitive.bounds.width / (this.state.gridsize.x * 2)) * (this.state.gridsize.x * 2);
          this.primitive.bounds.height = Math.round(this.primitive.bounds.height / (this.state.gridsize.y * 2)) * (this.state.gridsize.y * 2);
        }
        this._pos.center = this.primitive.bounds.center
        break;
    }
  }
}
