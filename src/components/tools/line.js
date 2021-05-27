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
    return new this.paper.Path.Line(this.startPoint, _toPoint);
  }
}
