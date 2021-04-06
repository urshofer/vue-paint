import Tool from './tool.js'
export default class Text extends Tool {
  constructor (paper, startPoint, state, primitive, options) {
    super(paper, startPoint, state, primitive)
    options = options || {
        toolName: 'Text',
        fontSize: 14
    }
    this.toolname = options.toolName
    this.defaultSize = options.fontSize
    this.registerOptions(
      [
        {
            property: "content",
            description: "Text Content",
            type    : "text",
            value   : this.primitive.content || "Texteingabe",
            rows    : options.toolName == 'TextLarge' ? 1  : 10,
            cols    : options.toolName == 'TextLarge' ? 30 : 60,
            popup   : true
        }
      ]
    )
  }

  setOption(name, value) {
    console.log(name, value, this.primitive)
    this.options.forEach(o => {
        if (o.property == name && o.property == 'content') {
            let _v = new FormData(document.querySelector(`#form-${o.property}`)).get('input');
            this.primitive[name] = _v;
            o.value = _v;
        }
        else {
            if (o.property == name) {
                this.primitive[name] = value;
                o.value = value;
            }
        }
    })
  }
  

  /* Called to draw */
  draw (point) {
    point = point || this.startPoint;
    if (this.primitive) {
        this.textcontent = this.primitive.content
        this.primitive.remove()
    }
    this.primitive = this.createPrimitive(point);
    this.textcontent = this.primitive.content
    this.applyStyle()
    this.attachEvents()
  }

  createPrimitive() {
    console.log('new text')
    let _t = new this.paper.PointText(this.round(this.startPoint));
    _t.fontSize = this.defaultSize;
    _t.content  = this.textcontent || 'New Text';
    return _t;
  }

  applyStyle() {
    try {
      this.primitive.strokeColor        = this.state.getStrokeColor();
      this.primitive.fillColor          = this.state.getFillColor();
      this.primitive.strokeWidth        = 0;
      this.primitive.strokeColor.alpha  = this.state.getAlpha();
      this.primitive.fillColor.alpha    = this.state.getAlpha();
    }
    catch {
      console.warn('Primitive not defined')
    }
  }


}
