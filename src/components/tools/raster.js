import Tool from './tool.js'
export default class Raster extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.source = defaults.source || "/vue-paint/img/default.png"
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'Raster'
    defaults.defaultWidth = defaults.defaultWidth || 250
    defaults.keepAspect = defaults.keepAspect || true

    let options = [
      {
          property: "source",
          description: "Clipart",
          type    : "clipart",
          value   : defaults.source,
          redraw  : true,
          toggled : true
      },
      {
        property: "keepAspect",
        description: "Keep Aspect",
        type    : "boolean",
        value   : defaults.keepAspect
      },
      {
        property: "defaultWidth",
        description: "defaultWidth",
        type    : "hidden",
        value   : defaults.defaultWidth
      }      
    ]
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)
  }

  /*
   * resize: called on resize, overriding standard procedure
   * @param Point delta, difference to last call
   */

  resize(delta) {
    if (this.paper.Key.isDown('shift') || this.getOption('keepAspect') === true) {
      this.primitive.scale(
        1 / this.primitive.bounds.width * (this.primitive.bounds.width + delta.x),
        {
          x: this.primitive.bounds.left,
          y: this.primitive.bounds.top
        }
      )
    }
    else {
      this.primitive.scale(
        1 / this.primitive.bounds.width * (this.primitive.bounds.width + delta.x),
        1 / this.primitive.bounds.height * (this.primitive.bounds.height + delta.y),
        {
          x: this.primitive.bounds.left,
          y: this.primitive.bounds.top
        }
      )
    }
  }

  /*
   * endResize: called after resize (mouseup), overriding standard procedure
   */

  endResize() {
    let _fX = 1 / this.primitive.bounds.width * (Math.round(this.primitive.bounds.width / this.state.gridsize.x) * this.state.gridsize.x)
    let _fY = 1 / this.primitive.bounds.height * (Math.round(this.primitive.bounds.height / this.state.gridsize.y) * this.state.gridsize.y)
    if (this.paper.Key.isDown('meta')) {
      _fX = 1
      _fY = 1
    }
    if (this.paper.Key.isDown('shift') || this.getOption('keepAspect') === true) {
      _fY = _fX
    }
    let _pos = this.round({
      x: this.primitive.bounds.left,
      y: this.primitive.bounds.top
    })
    this.primitive.scale(
      _fX,
      _fY,
      _pos
    )
    //let _b = this.primitive.bounds.clone();
    //this.primitive.scaling = [1,1]
    //this.primitive.fitBounds(_b);
}

  /* Called on init */
  onPaint () {
    this.state.painting = true;
  }


  createPrimitive() {
    let _toPoint  = this.round(this.startPoint)
    let _r = new this.paper.Raster({
      crossOrigin: 'anonymous', 
      position: _toPoint, 
      smoothing: 'high',
      width: this.getOption('defaultWidth')
    });
    _r.source = this.getOption('source');
    let _initialize = () => {
      if (this.initialized !== true) {
        this.initialized = true;
        this.toggleSelect();
        this.selectBorderColor('red')
        console.log('init toggle')
      }
    }
    _r.onLoad = () => {
      console.log(this.aspect);
      _initialize();
    }
    _r.onError = () => {
      _initialize();
    }
    return _r;
  }
}

