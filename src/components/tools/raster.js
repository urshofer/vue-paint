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
            value   : "http://paperjs.org/about/paper-js.gif",
            rows    : 1,
            cols    : 200,
            popup   : true,
            redraw  : true
        }
      ]
    )
  }

  createPrimitive() {
    let _r = new this.paper.Raster();
    _r.source = this.getOption('url');
    console.log('new raster', _r.source)
    return _r;
  }



}
