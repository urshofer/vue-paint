import Tool from './tool.js'
import wordwrap from 'wordwrapjs'

export default class Text extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.toolName = defaults.toolName || 'Text'
    defaults.fontSize = defaults.fontSize || 14
    defaults.fontFamily = defaults.fontFamily || 'sans-serif'
    defaults.fontWeight = defaults.fontWeight || 'normal'
    defaults.fontSizeMin = defaults.fontSizeMin || 10
    defaults.fontSizeMax = defaults.fontSizeMax || 20
    defaults.leading = defaults.leading || 14
    defaults.leadingMin = defaults.leadingMin || 10
    defaults.leadingMax = defaults.leadingMax || 20
    defaults.rows = defaults.rows || 40
    defaults.cols = defaults.cols || 10
    defaults.justification = defaults.justification || 'left'
    defaults.fixed = defaults.fixed || false
    
    let options = [
      {
          property: "content",
          description: "Edit Text",
          type    : "textarea",
          value   : `${defaults.toolName} ${defaults.cols}x${defaults.rows}`,
          rows    : defaults.rows,
          cols    : defaults.cols
      },
      {
        property: "fontSize",
        description: "Font Size",
        type    : "int",
        value   : defaults.fontSize,
        min     : defaults.fontSizeMin,
        max     : defaults.fontSizeMax,
        step    : 1
      },
      {
        property: "leading",
        description: "Line Space",
        type    : "int",
        value   : defaults.leading,
        min     : defaults.leadingMin,
        max     : defaults.leadingMax,
        step    : 1
      },
      {
        property: "fontFamily",
        description: "Font",
        type    : "string",
        value   : defaults.fontFamily
      },
      {
        property: "fontWeight",
        description: "Font Weight",
        type    : "string",
        value   : defaults.fontWeight
      },
      {
        property: "justification",
        description: "Justification",
        type    : "string",
        value   : defaults.justification
      }
    ]
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)
  }

  setOption(name, value) {
    this.options.forEach(o => {
        if (o.property == name) {
          // Set Content Property, check size & do wordwrap
          if (o.property == 'content') {
            let _v = wordwrap.wrap(value, { width: o.cols, break: true, noTrim: true })
            let numberOfLines = (_v.match(/\n/g) || []).length + 1
            if (numberOfLines <= o.rows) {
              this.primitive[name] = _v;
              o.value = _v
            }
            else {
              o.value = this.primitive[name]
            }
          }
          // All other properties are stored directly
          else {
                this.primitive[name] = value;
                o.value = value;
          }
        }
    })
  }
  
  
  onDoubleClick () {
    this.state.unselectAll();
    this.select();
    let _e = {
      key: 'e',
      modifiers: {
        meta: true
      }
    }
    console.log(this.paper.tool.emit('keydown', _e))
    return false;
  }

  createPrimitive() {
    console.log(this)
    let _t = new this.paper.PointText(this.round(this.startPoint));
    _t.applyMatrix = false
    return _t;
  }

  /* Called on init */
  onPaint () {
    this.state.painting = true;
  }

  applyStyle() {
    try {
      this.getOptions().forEach(o =>{
        this.primitive[o.property] = o.value;
      })
      // this.primitive.fontSize           = this.getOption('fontSize');
      // this.primitive.leading            = this.getOption('leading');
      // this.primitive.content            = this.getOption('content');
      this.primitive.strokeColor        = this.state.getStrokeColor();
      this.primitive.fillColor          = this.state.getFillColor();
      this.primitive.strokeWidth        = 0;
      this.primitive.strokeColor.alpha  = this.state.getAlpha();
      this.primitive.fillColor.alpha    = this.state.getAlpha();
      this.primitive.justification      = this.getOption('justification')
    }
    catch (err) {
      console.warn(`${err} Primitive not defined`)
    }
  }
}