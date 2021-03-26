/**
 *  Tool Class
 *  - Basic functionalities
 *  - Master for all tools
 */

export default class Tool {
  constructor (paper, event, state) {
    event = event || false
    this.state   = state
    this.paper = paper
    this.startPoint  = event ? this.round(event.point) : false;
    this.mousedown = false;
  }

  round(point) {
    point.x = Math.round(point.x / this.state.gridsize) * this.state.gridsize;
    point.y = Math.round(point.y / this.state.gridsize) * this.state.gridsize;
    return point;
  }

  delete() {
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

  unselect() {
    return this.primitive.selected = false;
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
  }

  onMouseUp (event) {
    if (this.state.dragged === true) {
      console.log('end drag', event)
    }
    else {
      console.log('click', event)
      try {
        this.primitive.selected = !this.primitive.selected;
        
        /* Unselect selected object */
        if (!this.paper.Key.isDown('shift') && this.state.selected.length > 0) {
          this.state.selected.forEach(s => {
            s.primitive.selected = false;
          })
          this.state.selected = [];
        }

        if (this.primitive.selected) {
          this.state.selected.push(this);
        }
      }
      catch (err) {
        console.warn('Click: no primitive available')
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
  onPaint (event) {
    this.draw (event)
  }

  onFinishPaint (event) {
    console.log('finish paint', event)
    this.originalPos = this.primitive.position;
  }

  /* Called if moved */
  onDrag (event, mouseDownPoint) {
    switch (this.state.getTransformation()) {
      case 'Rotate':
        console.log('rot')
        this.primitive.rotation = Math.round((event.point.x - mouseDownPoint.x) / this.state.anglestep) * this.state.anglestep;
        break;
      case 'Resize':
        console.log('Resize')
        this.onPaint(event)
        this.primitive.selected = true;
        break;    
      case 'Move':
        if (this.primitive.selected && this.originalPos) {
          this.primitive.position.x = this.originalPos.x + (event.point.x - mouseDownPoint.x);
          this.primitive.position.y = this.originalPos.y + (event.point.y - mouseDownPoint.y);
        }
        break;           
    }
  }

  /* Called if move ended */
  onFinishDrag (event, mouseDownPoint) {
    switch (this.state.getTransformation()) {
      case 'Rotate':
        console.log('f rot')
        this.state.setTransformation('Move');
        break;
      case 'Resize':
        console.log('f Resize')
        this.onFinishPaint(event)
        this.state.setTransformation('Move');
        break;    
      case 'Move':
        console.log('drag finish', event)
        this.primitive.position.x = this.originalPos.x + (Math.round((event.point.x - mouseDownPoint.x) / this.state.gridsize) * this.state.gridsize);
        this.primitive.position.y = this.originalPos.y + (Math.round((event.point.y - mouseDownPoint.y) / this.state.gridsize) * this.state.gridsize);
        this.originalPos = this.primitive.position;
        break;           
    }
  }

  /* Called to draw */
  draw (event) {
    event = event || {point: this.startPoint};
    if (this.primitive) {
      this.primitive.remove()
    }
    this.primitive = this.createPrimitive(event);
    this.applyStyle()
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
