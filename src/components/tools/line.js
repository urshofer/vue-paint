import Tool from './tool.js'
export default class Line extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'Line'
    
    let options = []
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)
  }


  createPrimitive(point) {
    let _toPoint  = this.round(point)
    if (Math.abs(this.startPoint.x - _toPoint.x) >= this.state.gridsize.x / 2 || Math.abs(this.startPoint.y - _toPoint.y) >= this.state.gridsize.y / 2) {
      return new this.paper.Path.Line(this.startPoint, _toPoint);
    }
    return null
  }
}
