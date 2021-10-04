/**
 *  Tool Class
 *  - Basic functionalities
 *  - Master for all tools
 */

import { v4 as uuidv4 } from 'uuid';

export default class Tool {
  constructor (paper, startPoint, state, primitive, options, toolname, fixedposition) {
    options = options || [];
    this.toolname = toolname;
    this.id = uuidv4();
    this.state   = state
    this.paper = paper
    this.fixedposition = fixedposition;
    
    if (this.fixedposition !== false) {
      startPoint = {x:fixedposition.x, y: fixedposition.y}
    }


    this.startPoint  = startPoint || false;
    this.mousedown = false;
    this.alreadySelected = false;
    this.painted = false;
    this.dragging = false;
    this.draggingLastPoint = false;
    this.registerOptions(options);
    if (primitive) {
      this.init(primitive)
    }
    else {
      this.draw(startPoint)
    }
  }

  registerOptions(options) {
    this.options = options;
  }

  getOptions() {
    return this.options;
  }

  getOption(optionname, asobject) {
    asobject = asobject || false
    try {
      let _selected_option = this.options.filter(e => e.property === optionname)[0];
      if (asobject === false) {
        return _selected_option.value
      }
      else {
        return _selected_option
      }
    }
    catch (err) {
      return false;
    }
  }

  getOptionByType(type) {
    try {
      return this.options.filter(e => e.type === type);
    }
    catch (err) {
      return false;
    }
  }

  selectBorderColor(color) {
    this.primitive.selectedColor = color;
  }


  setOption(name, value) {
    let redraw = false;
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
        if (o.redraw === true) redraw = o.redraw
      }
    })
    if (redraw === true) {
      this.draw()
    }
  }

  round(point) {
    if (!this.paper.Key.isDown('meta')) {
      point.x = Math.round(point.x / this.state.gridsize.x) * this.state.gridsize.x;
      point.y = Math.round(point.y / this.state.gridsize.y) * this.state.gridsize.y;
    }
    return point;
  }

  delete() {
    this.state.deleteStack(this);
    this.primitive.remove()
    delete this;
  }

  move(direction) {
    if (this.fixedposition !== false) {
      return;
    }
    let _point;
    switch (direction) {
      case 'left':
        _point = new this.paper.Point(-this.state.gridsize.x, 0);
        break;
      case 'right':
        _point = new this.paper.Point(this.state.gridsize.x, 0);
        break;
      case 'up':
        _point = new this.paper.Point(0, -this.state.gridsize.y);
        break;
      case 'down':
        _point = new this.paper.Point(0, this.state.gridsize.y);
        break;
    }
    this.primitive.translate(_point);
  }

  shift(direction) {
    switch (direction) {
      case 'front':
        this.primitive.bringToFront()
        break;
      case 'back':
        this.primitive.sendToBack();
        break;
    }
  }  

  setDragging(d) {
    this.dragging = d;
    if (d === false) {
      this.draggingLastPoint = false;
    }
  }

  unselect() {
    this.alreadySelected = this.primitive.selected = false;
    this.state.selected = this.state.selected.filter((e) => { 
      return e != this;
    });
    return false;
  }

  select() {
    this.primitive.selected = true;
    this.state.context = this;
    if (this.state.selected.find((e)=>{e==this}) == undefined) {
      this.state.selected.push(this); 
    }
    return true;
  }

  toggleSelect() {

    let _selected = this.primitive.selected

    /* Unselect objects if shift is not pressed */
    if (!this.paper.Key.isDown('shift')) {
      this.state.unselectAll();
    }

    /* Toggle own Selection and add  */
    if (_selected) {
      this.unselect()
    }
    else {
      this.select()
    }
    return this.primitive.selected;
  }

  attachEvents() {
    try {
      this.primitive.onMouseDown = (event) => {
        this.onMouseDown(event)
      } 
      this.primitive.onMouseUp = (event) => {
        return this.onMouseUp(event)
      } 
      this.primitive.onDoubleClick = (event) => {
        return this.onDoubleClick(event)
      }              
    } catch (err) {
      console.warn(err)
    }
  }

  onMouseDown (event) {
    if (this.state.painting) return;
    // console.log('init', this, event, this.primitive.selected)
    this.mousedown = event;
    this.originalPos = this.primitive.position;
    this.setDragging(false);
    this.alreadySelected = this.primitive.selected;
    if (!this.primitive.selected) {
      try {
        this.toggleSelect();
      }
      catch (err) {
        console.warn(err, 'Click: no primitive available')
      }
    }
  }

  onMouseUp () {
    if (this.state.painting) return;
    // console.log('mouseup', this, event, this.painted, this.dragging, this.alreadySelected)
    if (this.painted === true && !this.dragging && this.alreadySelected) {
     // console.log('click', event)
     try {
        this.toggleSelect();
      }
      catch (err) {
        console.warn(err, 'Click: no primitive available')
      }
    }
    this.mousedown = false;
  }

  onDoubleClick (event) {
    console.log('doubleclick', event)
  }

  /* Called on init */
  onPaint (point) {
    this.state.painting = true;
    this.draw (point)
  }

  onFinishPaint () {
    this.painted = true;
    this.state.painting = false;
    if (this.primitive != null) {
      this.originalPos = this.primitive.position;
      this.state.addStack(this);
    }
  }

  /* Called if moved */
  onDrag (point) {
    if (this.fixedposition !== false) {
      return;
    }
    this.setDragging(true);
    if (this.draggingLastPoint === false) {
      this.draggingLastPoint = point
    }
    let delta = {
      x: point.x - this.draggingLastPoint.x,
      y: point.y - this.draggingLastPoint.y
    }
    try {
      switch (this.state.getTransformation()) {
        case 'Rotate':
          if (typeof this.rotate == "function") {
            this.rotate(delta, point)
          }
          else {
            this.primitive.rotation += delta.x;
          }
          break;
        case 'Resize':
          if (typeof this.resize == "function") {
            this.resize(delta, point)
          }
          else {
            let _l = this.primitive.bounds.left;
            let _t = this.primitive.bounds.top;
            this.primitive.size = this.primitive.size.add(
              new this.paper.Size(
                delta.x, 
                this.paper.Key.isDown('shift') ? delta.x : delta.y
              )
            );
            this.primitive.bounds.left = _l;
            this.primitive.bounds.top = _t;
          }
          break;    
        case 'Move':
          if (typeof this.translate == "function") {
            this.translate(delta, point)
          }
          else {
            if (this.paper.Key.isDown('shift')) {
              if (Math.abs(delta.x) > delta.y) {
                this.primitive.position.x += delta.x;
              } else {
                this.primitive.position.y += delta.y;
              }
            }
            else {
              this.primitive.position.x += delta.x;
              this.primitive.position.y += delta.y;
            }
          }
          break;           
      }
    } catch (err) {
      console.warn(`generic transformation error'${err}'`)
      try {
        this.transformation(this.state.getTransformation(), point, delta)
      } catch (err) {
        console.warn(`transformation type '${this.state.getTransformation()}' needs to be implemented for this tool`)
        console.warn(`this can be done by defining the function transformation(mode:'${this.state.getTransformation()}', point, delta)`)
      }
    }
    this.draggingLastPoint = point;
  }

  /* Called if move ended */
  onFinishDrag (point) {
    if (this.fixedposition !== false) {
      return;
    }    
    // console.log('drag finish', point)
    this.setDragging(false);

    let delta = {
      x: point.x - this.draggingLastPoint.x,
      y: point.y - this.draggingLastPoint.y
    }    
    try {
      switch (this.state.getTransformation()) {
        case 'Rotate':
          if (typeof this.endRotate == "function") {
            this.endRotate(delta, point)
          }
          else {
            this.primitive.rotation = Math.round(this.primitive.rotation / this.state.anglestep) * this.state.anglestep;
            this.state.setTransformation('Move');
          }
          break;
        case 'Resize':
          if (typeof this.endResize == "function") {
            this.endResize(delta, point)
          }
          else {            
            this.primitive.size.width = Math.round(this.primitive.size.width / this.state.gridsize.x) * this.state.gridsize.x;
            this.primitive.size.height = Math.round(this.primitive.size.height / this.state.gridsize.y) * this.state.gridsize.y;
            this.primitive.bounds.left = Math.round(this.primitive.bounds.left / this.state.gridsize.x) * this.state.gridsize.x;
            this.primitive.bounds.top = Math.round(this.primitive.bounds.top / this.state.gridsize.y) * this.state.gridsize.y;
          }
          this.state.setTransformation('Move');
          break;    
        case 'Move':
          if (typeof this.endTranslate == "function") {
            this.endTranslate(delta, point)
          }
          else {
            this.startPoint = this.primitive.bounds.topLeft = this.round(this.primitive.bounds.topLeft);
            this.originalPos = this.primitive.position;
          }
          break;           
      }
    } catch (err) {
      try {
        this.endtransformation(this.state.getTransformation(), point, delta)
      } catch (err) {
        console.warn(`endtransformation type '${this.state.getTransformation()}' needs to be implemented for this tool`)
        console.warn(`this can be done by defining the function this.endtransformation(mode:'${this.state.getTransformation()}', point, delta)`)
      }

    }
  }

  /* Called to draw */
  draw (point) {
    point = point || this.startPoint;
    if (this.primitive) {
      try {
        this.primitive.remove()
      } catch(err) {
        console.warn(`remove is not callable: ${err}`)
      }
    }
    if (this.fixedposition !== false && this.fixedposition.width && this.fixedposition.height) {
      this.primitive = this.createPrimitive({x: this.startPoint.x + this.fixedposition.width,y: this.startPoint.y + this.fixedposition.height});
    }
    else {
      this.primitive = this.createPrimitive(point);
    }
    this.applyStyle()
    this.attachEvents()
  }

  /* Init from Primitive */
  init (primitive) {
    this.primitive = primitive;
    this.startPoint = this.primitive.position;
    this.options.forEach(o => {
      o.value = this.primitive[o.property];
      
      // un-toggle option (for clipart, editor and such)
      // since the primitive already exists and is not added
      // manually to the stage
      o.toggled = false;
    })

    this.onFinishPaint();
    this.attachEvents()
  }

  applyStyle() {
    try {
      this.primitive.strokeColor        = this.state.getStrokeColor();
      this.primitive.fillColor          = this.state.getFillColor();
      this.primitive.strokeWidth        = this.state.getStrokeWidth();
      this.primitive.opacity            = this.state.getAlpha();
    }
    catch (err) {
      console.warn(`${err} Primitive not defined`)
    }
  }
}
