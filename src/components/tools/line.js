import Tool from './tool.js'
export default class Line extends Tool {
  constructor (paper, startPoint, state, primitive) {
    super(paper, startPoint, state, primitive)
  }


  createPrimitive(point) {
    let _toPoint  = this.round(point)
    return new this.paper.Path.Line(this.startPoint, _toPoint);
  }

}
