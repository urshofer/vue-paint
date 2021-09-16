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

    let options = [
      {
          property: "starpoints",
          description: "Points",
          type    : "int",
          value   : defaults.starpoints,
          min     : defaults.pointsMin,
          max     : defaults.pointsMax,
          step    : defaults.pointsStep,
          redraw  : true
      }
  ];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)

    this._pos = {
      center: false,
      radius1: false,
      radius2: false
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
        this.primitive.remove()
      }
      this.primitive = new this.paper.Path.Star(
        this._pos.center, 
        this.getOption('starpoints', true).value * 1, 
        this._pos.radius1,
        this._pos.radius2
      );
      this.applyStyle()
      this.attachEvents()
    }
  }

  createPrimitive(point) {
    let _toPoint  = this.round(point)
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x
    }

    this._pos = {
      center: this.startPoint,
      radius1: _toPoint.x - this.startPoint.x > this.state.gridsize.x ? _toPoint.x - this.startPoint.x : this.state.gridsize.x,
      radius2: _toPoint.y - this.startPoint.y > this.state.gridsize.y ? _toPoint.y - this.startPoint.y : this.state.gridsize.y
    }

    return new this.paper.Path.Star(
      this._pos.center, 
      this.getOption('starpoints', true).value * 1, 
      this._pos.radius1,
      this._pos.radius2);
  }


  transformation(mode, point, delta) {
    switch (mode) {
      case 'Resize':
        this.primitive.bounds.size = this.primitive.bounds.size.add(new this.paper.Size(delta.x, this.paper.Key.isDown('shift') ? delta.x : delta.y));
        break;
    }
  }

  endMove() {
    this.startPoint = this.primitive.bounds.topLeft = this.round(this.primitive.bounds.topLeft);
    this.originalPos = this.primitive.position;
    this._pos.center = this.primitive.bounds.center
  }

  endtransformation(mode) {
    switch (mode) {
      case 'Resize':
        this.primitive.bounds.width = Math.round(this.primitive.bounds.width / (this.state.gridsize.x * 2)) * (this.state.gridsize.x * 2);
        this.primitive.bounds.height = Math.round(this.primitive.bounds.height / (this.state.gridsize.y * 2)) * (this.state.gridsize.y * 2);
        this.state.setTransformation('Move');
        this._pos.center = this.primitive.bounds.center
        break;
    }
  }
}
