import Tool from './tool.js'
export default class Square extends Tool {
  constructor (paper, startPoint, state, primitive) {
    super(paper, startPoint, state, primitive)
    this.toolname = 'Square'
    this.registerOptions(
      [
        {
          property: "radius",
          description: "Radius",
          type    : "int",
          value   : 0,
          min     : 0,
          max     : 100,
          step    : 10
        }
      ]
    )
  }


  createPrimitive(point) {
    let _toPoint  = this.round(point)
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x
    }
    return new this.paper.Shape.Rectangle(this.startPoint, _toPoint);
  }

}
