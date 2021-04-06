import Tool from './tool.js'
export default class Raster extends Tool {
  constructor (paper, startPoint, state, primitive, options) {
    super(paper, startPoint, state, primitive)
    options = options || {}
    this.toolname = 'Raster'
    this.defaultSize = options.fontSize
    this.registerOptions(
      [
        {
            property: "url",
            description: "Text Content",
            type    : "text",
            value   : "/vue-paint/img/logo.png",
            rows    : 1,
            cols    : 200,
            popup   : true,
            redraw  : true
        }
      ]
    )
  }

  createPrimitive(point) {
    let _toPoint  = this.round(point)
    let _r = new this.paper.Raster({position: _toPoint});
    _r.source = this.getOption('url');
    console.log('new raster')
    return _r;
  }



}
