import Tool from './tool.js'
export default class Star extends Tool {
  constructor (paper, startPoint, state, primitive) {
    super(paper, startPoint, state, primitive)
  }


  createPrimitive(point) {
    let _toPoint  = this.round(point)
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x
    }
    return new this.paper.Path.Star(this.startPoint, _toPoint.x - this.startPoint.x > 50 ? Math.round((_toPoint.x - this.startPoint.x) / 10) : 5, _toPoint.y - this.startPoint.y > this.state.gridsize * 2 ? (_toPoint.y - this.startPoint.y) - this.state.gridsize * 2 : 0, _toPoint.y - this.startPoint.y > 0 ? _toPoint.y - this.startPoint.y : 0);
  }

}
