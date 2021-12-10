import Tool from './tool.js'
export default class Circle extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'Circle'

    let options = [
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
    ]
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)
  }

  createPrimitive(point) {
    let _toPoint  = this.round(point)
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x
    }
    
    if (Math.abs(this.startPoint.x - _toPoint.x) >= this.state.gridsize.x / 2 && Math.abs(this.startPoint.y - _toPoint.y) >= this.state.gridsize.y / 2) {
      var rectangle = new this.paper.Rectangle(this.startPoint, _toPoint);
      return new this.paper.Shape.Ellipse(rectangle);
    }
    return null
  }
}
