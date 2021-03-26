import Tool from './tool.js'
export default class Circle extends Tool {
  constructor (paper, event, state) {
    super(paper, event, state)
    this.draw(event)
  }

  createPrimitive(event) {
    let _toPoint  = this.round(event.point)
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x
    }
    var rectangle = new this.paper.Rectangle(this.startPoint, _toPoint);
    return new this.paper.Shape.Ellipse(rectangle);
  }

}
