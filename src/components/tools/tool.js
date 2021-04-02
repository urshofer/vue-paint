/**
 *  Tool Class
 *  - Basic functionalities
 *  - Master for all tools
 */

export default class Tool {
  constructor (paper, startPoint, state, primitive) {
    this.state   = state
    this.paper = paper
    this.startPoint  = startPoint || false;
    this.mousedown = false;
    this.painted = false;
    this.dragging = false;
    this.draggingLastPoint = false;
    this.options = {}
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

  setOption(name, value) {
    console.log(name, value, this.primitive)
    this.options.forEach(o => {
      if (o.property == name) {
        this.primitive[name] = value;
        o.value = value;
      }
    })
  }

  round(point) {
    point.x = Math.round(point.x / this.state.gridsize) * this.state.gridsize;
    point.y = Math.round(point.y / this.state.gridsize) * this.state.gridsize;
    return point;
  }

  delete() {
    this.state.deleteStack(this);
    this.primitive.remove()
    delete this;
  }

  move(direction) {
    let _point;
    switch (direction) {
      case 'left':
        _point = new this.paper.Point(-this.state.gridsize, 0);
        break;
      case 'right':
        _point = new this.paper.Point(this.state.gridsize, 0);
        break;
      case 'up':
        _point = new this.paper.Point(0, -this.state.gridsize);
        break;
      case 'down':
        _point = new this.paper.Point(0, this.state.gridsize);
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
        this.primitive.sendToBack()
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
    this.primitive.selected = false;
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
    /*this.primitive.onClick = (event) => {
      return this.onClick(event)
    }*/
    this.primitive.onMouseDown = (event) => {
      this.onMouseDown(event)
    } 
    this.primitive.onMouseUp = (event) => {
      return this.onMouseUp(event)
    }        
    //this.primitive.onMouseDrag = (event) => {
    //  return this.onMouseDrag(event)
    //}     
  }

  onMouseDown (event) {
    console.log('init', event)
    this.mousedown = event;
    this.originalPos = this.primitive.position;
    this.setDragging(false);
  }

  onMouseUp (event) {
    console.log('mouseup', this)
    if (this.painted === true && !this.dragging) {
      console.log('click', event)
      try {
        this.toggleSelect();
      }
      catch (err) {
        console.warn(err, 'Click: no primitive available')
      }
    }
    this.mousedown = false;
    return false;
  }

  //onMouseDrag (event) {
  //  console.log('mouse drag', event)
  //  return false;
  //}

  /* Called on init */
  onPaint (point) {
    this.draw (point)
  }

  onFinishPaint () {
    console.log('finish paint')
    this.originalPos = this.primitive.position;
    this.painted = true;
    this.state.addStack(this);
  }

  /* Called if moved */
  onDrag (point) {
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
          console.log('rot')
          this.primitive.rotation += delta.x;
          break;
        case 'Resize':
          console.log('Resize')
          this.primitive.size = this.primitive.size.add(new this.paper.Size(delta.x, this.paper.Key.isDown('shift') ? delta.x : delta.y));
          break;    
        case 'Move':
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
          break;           
      }
    } catch (err) {
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
    console.log('drag finish', point)
    let delta = {
      x: point.x - this.draggingLastPoint.x,
      y: point.y - this.draggingLastPoint.y
    }    
    this.setDragging(false);
    try {
      switch (this.state.getTransformation()) {
        case 'Rotate':
          this.primitive.rotation = Math.round(this.primitive.rotation / this.state.anglestep) * this.state.anglestep;
          this.state.setTransformation('Move');
          break;
        case 'Resize':
          this.primitive.size.width = Math.round(this.primitive.size.width / (this.state.gridsize * 2)) * (this.state.gridsize * 2);
          this.primitive.size.height = Math.round(this.primitive.size.height / (this.state.gridsize * 2)) * (this.state.gridsize * 2);
          this.state.setTransformation('Move');
          break;    
        case 'Move':
          this.primitive.bounds.topLeft = this.round(this.primitive.bounds.topLeft);
          this.originalPos = this.primitive.position;
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
      this.primitive.remove()
    }
    this.primitive = this.createPrimitive(point);
    this.applyStyle()
    this.attachEvents()
  }

  /* Init from Primitive */
  init (primitive) {
    this.primitive = primitive;
    this.onFinishPaint();
    this.attachEvents()
  }

  applyStyle() {
    try {
      this.primitive.strokeColor        = this.state.getStrokeColor();
      this.primitive.fillColor          = this.state.getFillColor();
      this.primitive.strokeWidth        = this.state.getStrokeWidth();
      this.primitive.strokeColor.alpha  = this.state.getAlpha();
      this.primitive.fillColor.alpha    = this.state.getAlpha();
    }
    catch {
      console.warn('Primitive not defined')
    }
  }
}
