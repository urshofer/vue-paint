import Tool from './tool.js'
export default class Line extends Tool {
  constructor (paper, event, state) {
    super(paper, event, state)
    this.draw(event)
  }

  createPrimitive(event) {
    let _toPoint  = this.round(event.point)
    return new this.paper.Path.Line(this.startPoint, _toPoint);
  }

}
