import Tool from './tool.js'
export default class Circle extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'Circle'

    let options = []
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)
  }

  createPrimitive(point) {
    let _toPoint  = this.round(point)
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x
    }
    var rectangle = new this.paper.Rectangle(this.startPoint, _toPoint);
    return new this.paper.Shape.Ellipse(rectangle);
  }
}
