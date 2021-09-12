import Tool from './tool.js'
export default class Grid extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.gridX = defaults.gridX || 5
    defaults.gridY = defaults.gridY || 5
    defaults.gridXMax = defaults.gridXMax || 5
    defaults.gridYMax = defaults.gridYMax || 5
    defaults.gridXMin = defaults.gridXMin || 5
    defaults.gridYMin = defaults.gridYMin || 5
    defaults.gridXStep = defaults.gridXStep || 5
    defaults.gridYStep = defaults.gridYStep || 5
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'Grid'
    let options = [
        {
            property: "gridX",
            description: "Raster X",
            type    : "int",
            value   : defaults.gridX,
            min     : defaults.gridXMin,
            max     : defaults.gridXMax,
            step    : defaults.gridXStep,
            redraw  : true
        },
        {
            property: "gridY",
            description: "Raster Y",
            type    : "int",
            value   : defaults.gridY,
            min     : defaults.gridYMin,
            max     : defaults.gridYMax,
            step    : defaults.gridYStep,
            redraw  : true
          }        
    ];

    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)
  }


  createPrimitive(point) {
    this.endPoint  = this.round(point)
    console.log(this.getOption('gridX', true).value * 1, this.startPoint.x, this.endPoint.x)

    let _lines = []
    if (this.paper.Key.isDown('shift')) {
      this.endPoint.y = this.startPoint.y + this.endPoint.x - this.startPoint.x
    }
    let _xStart = this.startPoint.x
    while (_xStart <= this.endPoint.x) {
        _lines.push(new this.paper.Path.Line({x: _xStart, y: this.startPoint.y}, {x: _xStart, y: this.endPoint.y}))
        _xStart += this.getOption('gridX', true).value * 1
    }
    let _yStart = this.startPoint.y
    while (_yStart <= this.endPoint.y) {
        _lines.push(new this.paper.Path.Line({x: this.startPoint.x, y: _yStart}, {x: this.endPoint.x, y: _yStart}))
        _yStart += this.getOption('gridY', true).value * 1
    }    
    return new this.paper.CompoundPath({
        children: _lines,
    });
  }

  /* using endpoint instead of startpoint if called without parameter */
  draw (point) {
    point = point || this.startPoint;
    if (this.primitive) {
      this.primitive.remove()
    }
    if (this.fixedposition !== false && this.fixedposition.width && this.fixedposition.height) {
      this.primitive = this.createPrimitive({x: this.startPoint.x + this.fixedposition.width,y: this.startPoint.y + this.fixedposition.height});
    }
    else {
      this.primitive = this.createPrimitive(point);
    }
    this.applyStyle()
    this.attachEvents()
  }


  transformation(mode, point, delta) {
    switch (mode) {
      case 'Resize':
        this.endPoint.x += delta.x
        this.endPoint.y += this.paper.Key.isDown('shift') ? delta.x : delta.y
        this.draw(this.endPoint);
        break;
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
      this.draw(this.endPoint)
    }
  }  
}

