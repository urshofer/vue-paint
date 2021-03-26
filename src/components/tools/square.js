import Tool from './tool.js'
export default class Square extends Tool {
  constructor (paper, event, state) {
    super(paper, event, state)
    this.draw(event)
  }

  createPrimitive(event) {
    let _toPoint  = this.round(event.point)
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x
    }
    return new this.paper.Shape.Rectangle(this.startPoint, _toPoint);
  }

}
