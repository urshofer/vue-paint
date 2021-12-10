import Tool from './tool.js'
export default class Polyline extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'Polyline'

    defaults.closed = defaults.closed || false
    defaults.smooth = defaults.smooth || false
    let options = [
      {
          property: "closed",
          description: "Close Line",
          type    : "boolean",
          value   : defaults.closed
      },
      {
        property: "smooth",
        description: "Smooth Line",
        type    : "boolean",
        value   : defaults.smooth,
        function: true,
        options: [
          {type: 'geometric', factor: 0},
          {type: 'geometric', factor: 1}
        ]
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
    this._points = []
    this._currentline = null
    this._lastPoint = null
    this._movePoint = null
  }

  createPrimitive() {
    var myPath = new this.paper.Path();
    myPath.strokeJoin = 'round';
    if (this._points && this._points.length > 0) {
      for (let index = 0; index < this._points.length; index++) {
        myPath.add(new this.paper.Point(this._points[index]));
      }
      myPath.closed = true;
    }
    if (this.getOption('smooth', true).value === true) {
      myPath.smooth()
    }
    return myPath;
  }

  createIntermediateDrawing(point) {
    var myPath = new this.paper.Path();
    myPath.strokeJoin = 'round';
    if (this._points && this._points.length > 0) {
      for (let index = 0; index < this._points.length; index++) {
        myPath.add(new this.paper.Point(this._points[index]));
      }
      myPath.add(new this.paper.Point(point));
    }
    if (this.getOption('smooth', true).value === true) {
      myPath.smooth()
    }
    return myPath;
  }  

  onFinishPaint(point) {
      if (point !== undefined) {
        try {
          if (this._currentline !== null && this._currentline.remove) {
            this._currentline.remove()
            this._currentline = null
          }
        }
        catch (err) {
          console.warn(err)
        }
        //this._lastPoint = this.round(point)
        //this._points.push(this._lastPoint)
        this._points.pop()
        this.draw(point)
      }
      this.painted = true;
      this.state.painting = false;
      if (this.primitive != null) {
        this.originalPos = this.primitive.position;
        this.state.addStack(this);
      }
  }

  onPaint(point) {
    this._lastPoint = this.round(point)
    this._points.push(this._lastPoint)
    this.state.painting = true;
  }

  onMove(point) {
    this._movePoint = this.round(point)
    if (this._currentline !== null && this._currentline.remove) {
      this._currentline.remove()
      this._currentline = null
    }
    if (this._lastPoint !== null) {
      this._currentline = this.createIntermediateDrawing(this._movePoint)
      this._currentline.strokeColor = '#CCF';
      this._currentline.fillColor = '#CCCCFF30';
      this._currentline.strokeWidth = 1;
    }
  }

  onClick() {
    this._points.push(this._movePoint)
    this._lastPoint = this._movePoint
  }


  resize(delta) {
    this.primitive.bounds.size = this.primitive.bounds.size.add(new this.paper.Size(delta.x, this.paper.Key.isDown('shift') ? (delta.x / this.primitive.bounds.width * this.primitive.bounds.height) : delta.y));
  }

  endResize() {
    if (!this.paper.Key.isDown('meta') && this.state.magnetic === true) {
      this.primitive.bounds.width = Math.round(this.primitive.bounds.width / (this.state.gridsize.x * 2)) * (this.state.gridsize.x * 2);
      this.primitive.bounds.height = Math.round(this.primitive.bounds.height / (this.state.gridsize.y * 2)) * (this.state.gridsize.y * 2);
    }
  }
}
