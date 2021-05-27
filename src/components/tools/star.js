import Tool from './tool.js'
export default class Star extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'Star'

    let options = []
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)
  }


  createPrimitive(point) {
    let _toPoint  = this.round(point)
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x
    }
    return new this.paper.Path.Star(this.startPoint, _toPoint.x - this.startPoint.x > 50 ? Math.round((_toPoint.x - this.startPoint.x) / 10) : 5, _toPoint.y - this.startPoint.y > this.state.gridsize.y * 2 ? (_toPoint.y - this.startPoint.y) - this.state.gridsize.x * 2 : 0, _toPoint.y - this.startPoint.y > 0 ? _toPoint.y - this.startPoint.y : 0);
  }


  transformation(mode, point, delta) {
    switch (mode) {
      case 'Resize':
        this.primitive.bounds.size = this.primitive.bounds.size.add(new this.paper.Size(delta.x, this.paper.Key.isDown('shift') ? delta.x : delta.y));
        break;
    }
  }

  endtransformation(mode) {
    switch (mode) {
      case 'Resize':
        this.primitive.bounds.width = Math.round(this.primitive.bounds.width / (this.state.gridsize.x * 2)) * (this.state.gridsize.x * 2);
        this.primitive.bounds.height = Math.round(this.primitive.bounds.height / (this.state.gridsize.y * 2)) * (this.state.gridsize.y * 2);
        this.state.setTransformation('Move');
        break;
    }
  }
}
