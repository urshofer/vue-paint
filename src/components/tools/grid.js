import Tool from './tool.js'
export default class Grid extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.gridSquare = defaults.gridSquare || true
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
        },
        {
            property: "gridSquare",
            description: "Square Raster",
            type    : "boolean",
            value   : defaults.gridSquare,
            redraw  : true
          }   
    ];

    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)
  }


  createPrimitive(point) {
    this.endPoint  = point
    // console.log(this.getOption('gridX', true).value * 1, this.startPoint.x, this.endPoint.x)

    let _lines = []
    if (this.paper.Key.isDown('shift')) {
      this.endPoint.y = this.startPoint.y + this.endPoint.x - this.startPoint.x
    }

    this.endPoint.x = Math.round(this.endPoint.x / (this.getOption('gridX', true).value * 1)) * (this.getOption('gridX', true).value * 1)
    this.endPoint.y = Math.round(this.endPoint.y / (this.getOption('gridY', true).value * 1)) * (this.getOption('gridY', true).value * 1)

    if (this.getOption('gridSquare', true).value === true) {
      let _xStart = this.startPoint.x
      while (_xStart <= this.endPoint.x) {
          _lines.push(new this.paper.Path.Line({x: _xStart, y: this.startPoint.y}, {x: _xStart, y: this.endPoint.y}))
          _xStart += this.getOption('gridX', true).value * 1
      }
    }
    let _yStart = this.startPoint.y
    while (_yStart <= this.endPoint.y) {
        _lines.push(new this.paper.Path.Line({x: this.startPoint.x, y: _yStart}, {x: this.endPoint.x, y: _yStart}))
        _yStart += this.getOption('gridY', true).value * 1
    }    
    return new this.paper.CompoundPath({
        children: _lines,
        applyMatrix: false
    });
  }


  resize(delta, point) {
    if (point.x > this.startPoint.x && point.y > this.startPoint.y) {
      this.endPoint.x = point.x
      this.endPoint.y = this.paper.Key.isDown('shift') 
                        ? this.endPoint.y + (point.x - this.startPoint.x)
                        : point.y
      this.draw(this.round(this.endPoint))
    } else {
      console.log('no negative resize')
    }
  }

  endResize () {
    this.state.setTransformation('Move');
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

