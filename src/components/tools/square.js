import Tool from './tool.js'
export default class Square extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.radius = defaults.radius || 0
    defaults.radiusMin = defaults.radiusMin || 0
    defaults.radiusMax = defaults.radiusMax || 100
    defaults.radiusStep = defaults.radiusStep || 10
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'Square'

    let options = [
      {
        property: "radius",
        description: "Radius",
        type    : "int",
        value   : defaults.radius,
        min     : defaults.radiusMin,
        max     : defaults.radiusMax,
        step    : defaults.radiusStep
      }
    ];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)
  }


  createPrimitive(point) {
    let _toPoint  = this.round(point)
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x
    }
    if (Math.abs(this.startPoint.x - _toPoint.x) >= this.state.gridsize.x / 2 && Math.abs(this.startPoint.y - _toPoint.y) >= this.state.gridsize.y / 2) {
      return new this.paper.Shape.Rectangle(this.startPoint, _toPoint);
    }
    return null
  }
}

