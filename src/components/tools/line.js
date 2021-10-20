import Tool from './tool.js'
export default class Line extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {}
    defaults.fixed = defaults.fixed || false
    defaults.toolName = defaults.toolName || 'Line'
    
    let options = [
      {
        property: "dashlength",
        description: "Dash",
        type    : "int",
        value   : 2,
        min     : 0,
        max     : 10,
        step    : 1
      },
      {
        property: "gaplength",
        description: "Gap",
        type    : "int",
        value   : 2,
        min     : 0,
        max     : 10,
        step    : 1
      },
      {
        property: "dash",
        description: "Dashed",
        type    : "boolean",
        value   : false
      }       
    ];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed)
  }

  setOption(name, value) {
    if (name === 'dash' && this.primitive) {
        this.options.forEach(o => {
          if (o.property == name) {
            o.value = value;            
          }
        })
        if (value === true)
          this.primitive.dashArray = [this.getOption('dashlength'), this.getOption('gaplength')];
        else 
          this.primitive.dashArray = [];
    } else {
      this.options.forEach(o => {
        if (o.property == name) {
          try {
            // Function Call
            if (o.function === true) {
              if (o.type === 'boolean') {
                this.primitive[name](o.options[o.value === true ? 0 : 1]);
              }
            } 
            // Parameter Call
            else {
              this.primitive[name] = value;
            }
            o.value = value;            
          }
          catch (err) {
            console.warn(err);
          }
        }
      })
      if (this.getOption('dash') === true) {
        this.primitive.dashArray = [this.getOption('dashlength'), this.getOption('gaplength')];
      }
    }
  }

  createPrimitive(point) {
    let _toPoint  = this.round(point)
    if (Math.abs(this.startPoint.x - _toPoint.x) >= this.state.gridsize.x / 2 || Math.abs(this.startPoint.y - _toPoint.y) >= this.state.gridsize.y / 2) {
      return new this.paper.Path.Line(this.startPoint, _toPoint);
    }
    return null
  }
}
