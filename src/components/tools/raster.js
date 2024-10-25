import Tool from './tool.js'
export default class Raster extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.source = false
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'Raster'
    defaults.defaultWidth = defaults.defaultWidth || 300
    defaults.defaultHeight = defaults.defaultHeight || 300
    defaults.keepAspect = defaults.keepAspect || true

    let options = [
      {
          property: "source",
          description: "Clipart",
          type    : "clipart",
          value   : defaults.source,
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
      },
      {
        property: "defaultHeight",
        description: "defaultHeight",
        type    : "hidden",
        value   : defaults.defaultHeight
      }      
    ]
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)
  }

  /*
   * resize: called on resize, overriding standard procedure
   * @param Point delta, difference to last call
   */

  resize(delta) {
    let _scaleX = 1 / this.primitive.bounds.width * (this.primitive.bounds.width + delta.x)
    let _scaleY = 1 / this.primitive.bounds.height * (this.primitive.bounds.height + delta.y)
    if (this.paper.Key.isDown('shift') || this.getOption('keepAspect') === true) {
      if (_scaleX > 0.1) {
        this.primitive.scale(
          _scaleX,
          {
            x: this.primitive.bounds.left,
            y: this.primitive.bounds.top
          }
        )
      }
    }
    else {
      if (_scaleX > 0.1 && _scaleY > 0.1) {
        this.primitive.scale(
          _scaleX,
          _scaleY,
          {
            x: this.primitive.bounds.left,
            y: this.primitive.bounds.top
          }
        )
      }
    }
  }

  /*
   * endResize: called after resize (mouseup), overriding standard procedure
   */

  endResize() {
    let _fX = 1 / this.primitive.bounds.width * (Math.round(this.primitive.bounds.width / this.state.gridsize.x) * this.state.gridsize.x)
    let _fY = 1 / this.primitive.bounds.height * (Math.round(this.primitive.bounds.height / this.state.gridsize.y) * this.state.gridsize.y)
    if (!this.paper.Key.isDown('meta') && this.state.magnetic === true) {
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

  onDoubleClick () {
    this.state.unselectAll();
    this.select();
    let _e = {
      key: 'i',
      modifiers: {
        meta: true
      }
    }
    console.log(this.paper.tool.emit('keydown', _e))
    return false;
  }

  createPrimitive() {
    let _toPoint  = this.round(this.startPoint)
    let _r = this.primitive || new this.paper.Raster({
      crossOrigin: 'anonymous', 
      position: _toPoint, 
      smoothing: 'high'
    });
    let _initialize = () => {
      console.log('createPrimitive!')
      /*if (this.getOption('source') !== false) {
        _r.source = this.getOption('source');
      }*/
      if (this.initialized !== true) {
        this.initialized = true;
        let _b = new this.paper.Rectangle(_toPoint.x, _toPoint.y, this.getOption('defaultWidth'), this.getOption('defaultHeight'))
        _r.fitBounds(_b);
      }
    }    

    _r.onLoad = () => {
      _initialize();
    }
    _r.onError = () => {
      _initialize();
    }

    this.primitive = _r;
    this.toggleSelect(true);
    return _r;
  }
}
