import paper from 'paper';
import { v4 } from 'uuid';
import wordwrap from 'wordwrapjs';
import { Base64 } from 'js-base64';
import VueDraggableResizable from 'vue-draggable-resizable';

/**
 *  Tool Class
 *  - Basic functionalities
 *  - Master for all tools
 */

class Tool {
  constructor (paper, startPoint, state, primitive, options, toolname, fixedposition) {
    options = options || [];
    this.toolname = toolname;
    this.id = v4();
    this.state   = state;
    this.paper = paper;
    this.fixedposition = fixedposition;
    
    if (this.fixedposition !== false) {
      startPoint = {x:fixedposition.x, y: fixedposition.y};
    }



    this.startPoint  = startPoint || false;
    this.mousedown = false;
    this.alreadySelected = false;
    this.painted = false;
    this.dragging = false;
    this.draggingLastPoint = false;
    this.registerOptions(options);
    if (primitive) {
      this.init(primitive);
    }
    else {
      this.draw(startPoint);
    }
  }

  showHint() {
    try {
      if (this.getOptionByType('textarea').length && this.getOptionByType('textarea')[0].toggled) return "edittext"
      if (this.getOptionByType('clipart').length && this.getOptionByType('clipart')[0].toggled) return "editimage"
      if (this.fixedposition !== false) return "fixed"      
    } catch (err) {
      console.warn(err);
      return false
    }
    return false
  }

  isTransformationAllowed(transformation) {
    // Currently, transformations for fixed elements are not allowed.
    if (transformation) {
      return this.fixedposition === false;
    }
    return true
  }

  registerOptions(options) {
    this.options = options;
  }

  getOptions() {
    return this.options;
  }

  getOption(optionname, asobject) {
    asobject = asobject || false;
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
        if (o.redraw === true) redraw = o.redraw;
      }
    });
    if (redraw === true) {
      this.draw();
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
    this.primitive.remove();
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
        this.primitive.bringToFront();
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

  untoggleOptions() {
    this.options.forEach(o => o.toggled = false);
  }

  unselect() {
    this.alreadySelected = this.primitive.selected = false;
    this.selectBorderColor(null);
    this.untoggleOptions();
    this.state.selected = this.state.selected.filter((e) => { 
      return e != this;
    });
    return false;
  }

  select() {
    this.primitive.selected = true;
    this.state.context = this;
    if (this.state.selected.find((e)=>{}) == undefined) {
      this.state.selected.push(this); 
    }
    return true;
  }

  toggleSelect(force) {
    force = force || false;
    if (this.state.getActiveName() !== '' && force === false) return;
    let _selected = this.primitive.selected;

    /* Unselect objects if shift is not pressed */
    if (!this.paper.Key.isDown('shift')) {
      this.state.unselectAll();
    }

    /* Toggle own Selection and add  */
    if (_selected) {
      this.unselect();
    }
    else {
      this.select();
    }
    return this.primitive.selected;
  }

  attachEvents() {
    try {
      this.primitive.onMouseDown = (event) => {
        this.onMouseDown(event);
      }; 
      this.primitive.onMouseUp = (event) => {
        return this.onMouseUp(event)
      }; 
      this.primitive.onDoubleClick = (event) => {
        return this.onDoubleClick(event)
      };              
    } catch (err) {
      console.warn(err);
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
        console.warn(err, 'Click: no primitive available');
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
        console.warn(err, 'Click: no primitive available');
      }
    }
    this.mousedown = false;
  }

  onDoubleClick (event) {
    console.log('doubleclick', event);
  }

  /* Called on init */
  onPaint (point) {
    this.state.painting = true;
    this.draw (point);
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
      this.draggingLastPoint = point;
    }
    let delta = {
      x: point.x - this.draggingLastPoint.x,
      y: point.y - this.draggingLastPoint.y
    };
    try {
      switch (this.state.getTransformation()) {
        case 'Rotate':
          if (typeof this.rotate == "function") {
            this.rotate(delta, point);
          }
          else {
            this.primitive.rotation += delta.x;
          }
          break;
        case 'Resize':
          if (typeof this.resize == "function") {
            this.resize(delta, point);
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
            this.translate(delta, point);
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
      console.warn(`generic transformation error'${err}'`);
      try {
        this.transformation(this.state.getTransformation(), point, delta);
      } catch (err) {
        console.warn(`transformation type '${this.state.getTransformation()}' needs to be implemented for this tool`);
        console.warn(`this can be done by defining the function transformation(mode:'${this.state.getTransformation()}', point, delta)`);
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
    };    
    try {
      switch (this.state.getTransformation()) {
        case 'Rotate':
          if (typeof this.endRotate == "function") {
            this.endRotate(delta, point);
          }
          else {
            if (!this.paper.Key.isDown('meta')) {
              this.primitive.rotation = Math.round(this.primitive.rotation / this.state.anglestep) * this.state.anglestep;
            }
          }
          break;
        case 'Resize':
          if (typeof this.endResize == "function") {
            this.endResize(delta, point);
          }
          else {
            if (!this.paper.Key.isDown('meta')) {
              this.primitive.size.width = Math.round(this.primitive.size.width / this.state.gridsize.x) * this.state.gridsize.x;
              this.primitive.size.height = Math.round(this.primitive.size.height / this.state.gridsize.y) * this.state.gridsize.y;
              this.primitive.bounds.left = Math.round(this.primitive.bounds.left / this.state.gridsize.x) * this.state.gridsize.x;
              this.primitive.bounds.top = Math.round(this.primitive.bounds.top / this.state.gridsize.y) * this.state.gridsize.y;
            }
          }
          break;    
        case 'Move':
          if (typeof this.endTranslate == "function") {
            this.endTranslate(delta, point);
          }
          else {
            this.startPoint = this.primitive.bounds.topLeft = this.round(this.primitive.bounds.topLeft);
            this.originalPos = this.primitive.position;
          }
          break;           
      }
    } catch (err) {
      try {
        this.endtransformation(this.state.getTransformation(), point, delta);
      } catch (err) {
        console.warn(`endtransformation type '${this.state.getTransformation()}' needs to be implemented for this tool`);
        console.warn(`this can be done by defining the function this.endtransformation(mode:'${this.state.getTransformation()}', point, delta)`);
      }

    }
  }

  /* Called to draw */
  draw (point) {
    point = point || this.startPoint;
    if (this.primitive) {
      try {
        this.primitive.remove();
      } catch(err) {
        console.warn(`remove is not callable: ${err}`);
      }
    }
    if (this.fixedposition !== false && this.fixedposition.width && this.fixedposition.height) {
      this.primitive = this.createPrimitive({x: this.startPoint.x + this.fixedposition.width,y: this.startPoint.y + this.fixedposition.height});
    }
    else {
      this.primitive = this.createPrimitive(point);
    }
    this.applyStyle();
    this.attachEvents();
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
    });

    this.onFinishPaint();
    this.attachEvents();
  }

  applyStyle() {
    try {
      this.primitive.strokeColor        = this.state.getStrokeColor();
      this.primitive.fillColor          = this.state.getFillColor();
      this.primitive.strokeWidth        = this.state.getStrokeWidth();
      this.primitive.opacity            = this.state.getAlpha();
    }
    catch (err) {
      console.warn(`${err} Primitive not defined`);
    }
  }
}

class Square extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {};
    defaults.radius = defaults.radius || 0;
    defaults.radiusMin = defaults.radiusMin || 0;
    defaults.radiusMax = defaults.radiusMax || 100;
    defaults.radiusStep = defaults.radiusStep || 10;
    defaults.fixed = defaults.fixed || false;
    defaults.toolName = defaults.toolName || 'Square';

    let options = [
      {
        property: "radius",
        description: "Radius",
        type    : "int",
        value   : defaults.radius,
        min     : defaults.radiusMin,
        max     : defaults.radiusMax,
        step    : defaults.radiusStep
      }
    ];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);
  }


  createPrimitive(point) {
    let _toPoint  = this.round(point);
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x;
    }
    if (Math.abs(this.startPoint.x - _toPoint.x) >= this.state.gridsize.x / 2 && Math.abs(this.startPoint.y - _toPoint.y) >= this.state.gridsize.y / 2) {
      return new this.paper.Shape.Rectangle(this.startPoint, _toPoint);
    }
    return null
  }
}

class Circle extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {};
    defaults.fixed = defaults.fixed || false;
    defaults.toolName = defaults.toolName || 'Circle';

    let options = [];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);
  }

  createPrimitive(point) {
    let _toPoint  = this.round(point);
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x;
    }
    
    if (Math.abs(this.startPoint.x - _toPoint.x) >= this.state.gridsize.x / 2 && Math.abs(this.startPoint.y - _toPoint.y) >= this.state.gridsize.y / 2) {
      var rectangle = new this.paper.Rectangle(this.startPoint, _toPoint);
      return new this.paper.Shape.Ellipse(rectangle);
    }
    return null
  }
}

class Line extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {};
    defaults.fixed = defaults.fixed || false;
    defaults.toolName = defaults.toolName || 'Line';
    
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
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);
  }

  setOption(name, value) {
    if (name === 'dash' && this.primitive) {
        this.options.forEach(o => {
          if (o.property == name) {
            o.value = value;            
          }
        });
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
      });
      if (this.getOption('dash') === true) {
        this.primitive.dashArray = [this.getOption('dashlength'), this.getOption('gaplength')];
      }
    }
  }

  createPrimitive(point) {
    let _toPoint  = this.round(point);
    if (Math.abs(this.startPoint.x - _toPoint.x) >= this.state.gridsize.x / 2 || Math.abs(this.startPoint.y - _toPoint.y) >= this.state.gridsize.y / 2) {
      return new this.paper.Path.Line(this.startPoint, _toPoint);
    }
    return null
  }
}

class Polyline extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {};
    defaults.fixed = defaults.fixed || false;
    defaults.toolName = defaults.toolName || 'Polyline';

    defaults.closed = defaults.closed || false;
    defaults.smooth = defaults.smooth || false;
    let options = [
      {
          property: "closed",
          description: "Close Line",
          type    : "boolean",
          value   : defaults.closed
      },
      {
        property: "smooth",
        description: "Smooth Line",
        type    : "boolean",
        value   : defaults.smooth,
        function: true,
        options: [
          {type: 'geometric', factor: 0},
          {type: 'geometric', factor: 1}
        ]
      }   
    ];
    
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);
    this._points = [];
    this._currentline = null;
    this._lastPoint = null;
    this._movePoint = null;
  }

  createPrimitive() {
    var myPath = new this.paper.Path();
    myPath.strokeJoin = 'round';
    if (this._points && this._points.length > 0) {
      for (let index = 0; index < this._points.length; index++) {
        myPath.add(new this.paper.Point(this._points[index]));
      }
      myPath.closed = true;
    }
    if (this.getOption('smooth', true).value === true) {
      myPath.smooth();
    }
    return myPath;
  }

  createIntermediateDrawing(point) {
    var myPath = new this.paper.Path();
    myPath.strokeJoin = 'round';
    if (this._points && this._points.length > 0) {
      for (let index = 0; index < this._points.length; index++) {
        myPath.add(new this.paper.Point(this._points[index]));
      }
      myPath.add(new this.paper.Point(point));
    }
    if (this.getOption('smooth', true).value === true) {
      myPath.smooth();
    }
    return myPath;
  }  

  onFinishPaint(point) {
      console.log('finish and fill', point);
      if (point !== undefined) {
        try {
          if (this._currentline !== null && this._currentline.remove) {
            this._currentline.remove();
            this._currentline = null;
          }
        }
        catch (err) {
          console.warn(err);
        }
        //this._lastPoint = this.round(point)
        //this._points.push(this._lastPoint)
        this._points.pop();
        this.draw(point);
      }
      this.painted = true;
      this.state.painting = false;
      if (this.primitive != null) {
        this.originalPos = this.primitive.position;
        this.state.addStack(this);
      }
  }

  onPaint(point) {
    console.log('start routine', point);
    this._lastPoint = this.round(point);
    this._points.push(this._lastPoint);
    this.state.painting = true;
  }

  onMove(point) {
    this._movePoint = this.round(point);
    if (this._currentline !== null && this._currentline.remove) {
      this._currentline.remove();
      this._currentline = null;
    }
    if (this._lastPoint !== null) {
      console.log('show active line', point, this._lastPoint);      
      this._currentline = this.createIntermediateDrawing(this._movePoint);
      this._currentline.strokeColor = '#CCF';
      this._currentline.fillColor = '#CCCCFF30';
      this._currentline.strokeWidth = 1;
    }
  }

  onClick(point) {
    console.log('add Point', point);
    this._points.push(this._movePoint);
    this._lastPoint = this._movePoint;
  }


  resize(delta) {
    this.primitive.bounds.size = this.primitive.bounds.size.add(new this.paper.Size(delta.x, this.paper.Key.isDown('shift') ? delta.x : delta.y));
  }

  endResize() {
    if (!this.paper.Key.isDown('meta')) {
      this.primitive.bounds.width = Math.round(this.primitive.bounds.width / (this.state.gridsize.x * 2)) * (this.state.gridsize.x * 2);
      this.primitive.bounds.height = Math.round(this.primitive.bounds.height / (this.state.gridsize.y * 2)) * (this.state.gridsize.y * 2);
    }
  }
}

class Star extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {};
    defaults.fixed = defaults.fixed || false;
    defaults.toolName = defaults.toolName || 'Star';
    defaults.starpoints = defaults.starpoints || 5;
    defaults.starpointsMin = defaults.starpointsMin || 3;
    defaults.starpointsMax = defaults.starpointsMax || 20;
    defaults.starpointsStep = defaults.starpointsStep || 1;

    defaults.starsize = defaults.starsize || 0.8;
    defaults.starsizeMin = defaults.starsizeMin || 0.25;
    defaults.starsizeMax = defaults.starsizeMax || 0.95;
    defaults.starsizeStep = defaults.starsizeStep || 0.05;


    let options = [
      {
          property: "starpoints",
          description: "Points",
          type    : "int",
          value   : defaults.starpoints,
          min     : defaults.starpointsMin,
          max     : defaults.starpointsMax,
          step    : defaults.starpointsStep,
          redraw  : true
      },
      {
        property: "starsize",
        description: "Size",
        type    : "int",
        value   : defaults.starsize,
        min     : defaults.starsizeMin,
        max     : defaults.starsizeMax,
        step    : defaults.starsizeStep,
        redraw  : true
    }

  ];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);

    // Backup parameters, applied after options change

    this._pos = {
      center: false,
      radius1: false,
      radius2: false,
      bounds: false,
      rotation: false,
      previousSibling: false
    };
  }

  setOption(name, value) {
    let redraw = false;
    this.options.forEach(o => {
      if (o.property == name) {
        try {
          this.primitive[name] = value;
          o.value = value;            
        }
        catch (err) {
          console.warn(err);
        }
        if (o.redraw === true) redraw = o.redraw;
      }
    });
    if (redraw === true) {
      if (this.primitive) {
        this._pos.bounds = this.primitive.bounds;
        this._pos.rotation = this.primitive.rotation;
        this._pos.previousSibling = this.primitive.previousSibling || false;
        this.primitive.remove();
      }
      this._pos.radius2 = this._pos.radius1 * this.getOption('starsize', true).value * 1;
      this.primitive = new this.paper.Path.Star(
        this._pos.center, 
        this.getOption('starpoints', true).value * 1, 
        this._pos.radius1,
        this._pos.radius2
      );
      if (this._pos.bounds) {
        this.primitive.bounds = this._pos.bounds;
      }
      if (this._pos.rotation) {
        this.primitive.rotation = this._pos.rotation;
      }
      if (this._pos.previousSibling) {
        this.primitive.insertAbove(this._pos.previousSibling);
      }
      this.applyStyle();
      this.attachEvents();
    }
  }

  createPrimitive(point) {
    let _toPoint  = this.round(point);
    if (this.paper.Key.isDown('shift')) {
      _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x;
    }

    let _distance = Math.sqrt((_toPoint.x - this.startPoint.x) ** 2 + (_toPoint.y - this.startPoint.y) ** 2);
    _distance = _distance > this.state.gridsize.x ? _distance : this.state.gridsize.x;


    this._pos = {
      center: this.startPoint,
      radius1: _distance,
      radius2: _distance * this.getOption('starsize', true).value * 1,
      bounds: false
    };

    console.log(this.getOption('starsize', true).value * 1);

    return new this.paper.Path.Star(
      this._pos.center, 
      this.getOption('starpoints', true).value * 1, 
      this._pos.radius1,
      this._pos.radius2);
  }


  transformation(mode, point, delta) {
    switch (mode) {
      case 'Resize':
        this.primitive.bounds.size = this.primitive.bounds.size.add(new this.paper.Size(delta.x, this.paper.Key.isDown('shift') ? delta.x : delta.y));
        break;
    }
  }


  endTranslate() {
    this.startPoint = this.primitive.bounds.topLeft = this.round(this.primitive.bounds.topLeft);
    this.originalPos = this.primitive.position;
    this._pos.center = this.primitive.bounds.center;
  }

  endtransformation(mode) {
    switch (mode) {
      case 'Resize':
        if (!this.paper.Key.isDown('meta')) {
          this.primitive.bounds.width = Math.round(this.primitive.bounds.width / (this.state.gridsize.x * 2)) * (this.state.gridsize.x * 2);
          this.primitive.bounds.height = Math.round(this.primitive.bounds.height / (this.state.gridsize.y * 2)) * (this.state.gridsize.y * 2);
        }
        this._pos.center = this.primitive.bounds.center;
        break;
    }
  }
}

class Polygon extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {};
    defaults.fixed = defaults.fixed || false;
    defaults.toolName = defaults.toolName || 'polygon';
    defaults.sides = defaults.sides || 5;
    defaults.sidesMin = defaults.sidesMin || 3;
    defaults.sidesMax = defaults.sidesMax || 20;
    defaults.sidesStep = defaults.sidesStep || 1;


    let options = [
      {
          property: "sides",
          description: "Sides",
          type    : "int",
          value   : defaults.sides,
          min     : defaults.sidesMin,
          max     : defaults.sidesMax,
          step    : defaults.sidesStep,
          redraw  : true
      }
  ];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);

    // Backup parameters, applied after options change

    this._pos = {
      center: false,
      radius: false,
      bounds: false,
      rotation: false,
      previousSibling: false
    };
  }

  setOption(name, value) {
    let redraw = false;
    this.options.forEach(o => {
      if (o.property == name) {
        try {
          this.primitive[name] = value;
          o.value = value;            
        }
        catch (err) {
          console.warn(err);
        }
        if (o.redraw === true) redraw = o.redraw;
      }
    });
    if (redraw === true) {
      if (this.primitive) {
        this._pos.bounds = this.primitive.bounds;
        this._pos.center = this.primitive.bounds.center;
        this._pos.rotation = this.primitive.rotation;
        this._pos.previousSibling = this.primitive.previousSibling || false;
        this.primitive.remove();
      }
      this.primitive = new this.paper.Path.RegularPolygon(
        this._pos.center, 
        this.getOption('sides', true).value * 1, 
        this._pos.radius1
      );
      if (this._pos.bounds) {
        this.primitive.bounds = this._pos.bounds;
      }
      if (this._pos.rotation) {
        this.primitive.rotation = this._pos.rotation;
      }
      if (this._pos.previousSibling) {
        this.primitive.insertAbove(this._pos.previousSibling);
      }
      this.applyStyle();
      this.attachEvents();
    }
  }

  createPrimitive(point) {
    let _toPoint  = this.round(point);

    let _distance = Math.sqrt((_toPoint.x - this.startPoint.x) ** 2 + (_toPoint.y - this.startPoint.y) ** 2);
    _distance = _distance > this.state.gridsize.x ? _distance : this.state.gridsize.x;


    this._pos = {
      center: this.startPoint,
      radius1: _distance,
      bounds: false
    };

    return new this.paper.Path.RegularPolygon(
      this._pos.center, 
      this.getOption('sides', true).value * 1, 
      this._pos.radius1);
  }


  transformation(mode, point, delta) {
    switch (mode) {
      case 'Resize':
        this.primitive.bounds.size = this.primitive.bounds.size.add(new this.paper.Size(delta.x, this.paper.Key.isDown('shift') ? delta.x : delta.y));
        break;
    }
  }


  endTranslate() {
    this.startPoint = this.primitive.bounds.topLeft = this.round(this.primitive.bounds.topLeft);
    this.originalPos = this.primitive.position;
  }

  endtransformation(mode) {
    switch (mode) {
      case 'Resize':
        if (!this.paper.Key.isDown('meta')) {
          this.primitive.bounds.width = Math.round(this.primitive.bounds.width / (this.state.gridsize.x * 2)) * (this.state.gridsize.x * 2);
          this.primitive.bounds.height = Math.round(this.primitive.bounds.height / (this.state.gridsize.y * 2)) * (this.state.gridsize.y * 2);
        }
        break;
    }
  }
}

class Raster extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {};
    defaults.source = false;
    defaults.fixed = defaults.fixed || false;
    defaults.toolName = defaults.toolName || 'Raster';
    defaults.defaultWidth = defaults.defaultWidth || 300;
    defaults.defaultHeight = defaults.defaultHeight || 300;
    defaults.keepAspect = defaults.keepAspect || true;

    let options = [
      {
          property: "source",
          description: "Clipart",
          type    : "clipart",
          value   : defaults.source,
          toggled : true
      },
      {
        property: "keepAspect",
        description: "Keep Aspect",
        type    : "boolean",
        value   : defaults.keepAspect
      },
      {
        property: "defaultWidth",
        description: "defaultWidth",
        type    : "hidden",
        value   : defaults.defaultWidth
      },
      {
        property: "defaultHeight",
        description: "defaultHeight",
        type    : "hidden",
        value   : defaults.defaultHeight
      }      

    ];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);
  }

  /*
   * resize: called on resize, overriding standard procedure
   * @param Point delta, difference to last call
   */

  resize(delta) {
    let _scaleX = 1 / this.primitive.bounds.width * (this.primitive.bounds.width + delta.x);
    let _scaleY = 1 / this.primitive.bounds.height * (this.primitive.bounds.height + delta.y);
    if (this.paper.Key.isDown('shift') || this.getOption('keepAspect') === true) {
      if (_scaleX > 0.1) {
        this.primitive.scale(
          _scaleX,
          {
            x: this.primitive.bounds.left,
            y: this.primitive.bounds.top
          }
        );
      }
    }
    else {
      if (_scaleX > 0.1 && _scaleY > 0.1) {
        this.primitive.scale(
          _scaleX,
          _scaleY,
          {
            x: this.primitive.bounds.left,
            y: this.primitive.bounds.top
          }
        );
      }
    }
  }

  /*
   * endResize: called after resize (mouseup), overriding standard procedure
   */

  endResize() {
    let _fX = 1 / this.primitive.bounds.width * (Math.round(this.primitive.bounds.width / this.state.gridsize.x) * this.state.gridsize.x);
    let _fY = 1 / this.primitive.bounds.height * (Math.round(this.primitive.bounds.height / this.state.gridsize.y) * this.state.gridsize.y);
    if (this.paper.Key.isDown('meta')) {
      _fX = 1;
      _fY = 1;
    }
    if (this.paper.Key.isDown('shift') || this.getOption('keepAspect') === true) {
      _fY = _fX;
    }
    let _pos = this.round({
      x: this.primitive.bounds.left,
      y: this.primitive.bounds.top
    });
    this.primitive.scale(
      _fX,
      _fY,
      _pos
    );
    //let _b = this.primitive.bounds.clone();
    //this.primitive.scaling = [1,1]
    //this.primitive.fitBounds(_b);
}

  /* Called on init */
  onPaint () {
    this.state.painting = true;
  }

  onDoubleClick () {
    this.state.unselectAll();
    this.select();
    let _e = {
      key: 'i',
      modifiers: {
        meta: true
      }
    };
    console.log(this.paper.tool.emit('keydown', _e));
    return false;
  }

  createPrimitive() {
    console.log('createPrimitive!');
    let _toPoint  = this.round(this.startPoint);
    let _r = new this.paper.Raster({
      crossOrigin: 'anonymous', 
      position: _toPoint, 
      smoothing: 'high'
    });
    let _initialize = () => {
      if (this.getOption('source') !== false) {
        _r.source = this.getOption('source');
      }
      if (this.initialized !== true) {
        this.initialized = true;
        let _b = new this.paper.Rectangle(_toPoint.x, _toPoint.y, this.getOption('defaultWidth'), this.getOption('defaultHeight'));
        _r.fitBounds(_b);
      }
    };    

    _r.onLoad = () => {
      _initialize();
    };
    _r.onError = () => {
      _initialize();
    };

    this.primitive = _r;
    this.toggleSelect(true);
    return _r;
  }
}

class Text extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {};
    defaults.toolName = defaults.toolName || 'Text';
    defaults.fontSize = defaults.fontSize || 14;
    defaults.fontFamily = defaults.fontFamily || 'sans-serif';
    defaults.fontWeight = defaults.fontWeight || 'normal';
    defaults.fontSizeMin = defaults.fontSizeMin || 10;
    defaults.fontSizeMax = defaults.fontSizeMax || 20;
    defaults.leading = defaults.leading || 14;
    defaults.leadingMin = defaults.leadingMin || 10;
    defaults.leadingMax = defaults.leadingMax || 20;
    defaults.rows = defaults.rows || 40;
    defaults.cols = defaults.cols || 10;
    defaults.justification = defaults.justification || 'left';
    defaults.fixed = defaults.fixed || false;
    
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
    ];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);
  }

  setOption(name, value) {
    this.options.forEach(o => {
        if (o.property == name) {
          // Set Content Property, check size & do wordwrap
          if (o.property == 'content') {
            let _v = wordwrap.wrap(value, { width: o.cols, break: true, noTrim: true });
            let numberOfLines = (_v.match(/\n/g) || []).length + 1;
            if (numberOfLines <= o.rows) {
              this.primitive[name] = _v;
              o.value = _v;
            }
            else {
              o.value = this.primitive[name];
            }
          }
          // All other properties are stored directly
          else {
                this.primitive[name] = value;
                o.value = value;
          }
        }
    });
  }
  
  
  onDoubleClick () {
    this.state.unselectAll();
    this.select();
    let _e = {
      key: 'e',
      modifiers: {
        meta: true
      }
    };
    console.log(this.paper.tool.emit('keydown', _e));
    return false;
  }

  createPrimitive() {
    console.log(this);
    let _t = new this.paper.PointText(this.round(this.startPoint));
    _t.applyMatrix = false;
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
      });
      // this.primitive.fontSize           = this.getOption('fontSize');
      // this.primitive.leading            = this.getOption('leading');
      // this.primitive.content            = this.getOption('content');
      this.primitive.strokeColor        = this.state.getStrokeColor();
      this.primitive.fillColor          = this.state.getFillColor();
      this.primitive.strokeWidth        = 0;
      this.primitive.strokeColor.alpha  = this.state.getAlpha();
      this.primitive.fillColor.alpha    = this.state.getAlpha();
      this.primitive.justification      = this.getOption('justification');
    }
    catch (err) {
      console.warn(`${err} Primitive not defined`);
    }
  }
}

class Grid extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {};
    defaults.gridSquare = defaults.gridSquare || false;
    defaults.gridX = defaults.gridX || 5;
    defaults.gridY = defaults.gridY || 5;
    defaults.gridXMax = defaults.gridXMax || 5;
    defaults.gridYMax = defaults.gridYMax || 5;
    defaults.gridXMin = defaults.gridXMin || 5;
    defaults.gridYMin = defaults.gridYMin || 5;
    defaults.gridXStep = defaults.gridXStep || 5;
    defaults.gridYStep = defaults.gridYStep || 5;
    defaults.fixed = defaults.fixed || false;
    defaults.toolName = defaults.toolName || 'Grid';
    let options = [
        {
            property: "gridX",
            description: "Raster X",
            type    : "int",
            value   : defaults.gridX,
            min     : defaults.gridXMin,
            max     : defaults.gridXMax,
            step    : defaults.gridXStep,
            redraw  : true
        },
        {
            property: "gridY",
            description: "Raster Y",
            type    : "int",
            value   : defaults.gridY,
            min     : defaults.gridYMin,
            max     : defaults.gridYMax,
            step    : defaults.gridYStep,
            redraw  : true
        },
        {
            property: "gridSquare",
            description: "Square Raster",
            type    : "boolean",
            value   : defaults.gridSquare,
            redraw  : true
          }   
    ];

    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);
  }


  createPrimitive(point) {
    this.endPoint  = point;
    // console.log(this.getOption('gridX', true).value * 1, this.startPoint.x, this.endPoint.x)

    let _lines = [];
    if (this.paper.Key.isDown('shift')) {
      this.endPoint.y = this.startPoint.y + this.endPoint.x - this.startPoint.x;
    }

    this.endPoint.x = Math.round(this.endPoint.x / (this.getOption('gridX', true).value * 1)) * (this.getOption('gridX', true).value * 1);
    this.endPoint.y = Math.round(this.endPoint.y / (this.getOption('gridY', true).value * 1)) * (this.getOption('gridY', true).value * 1);

    if (this.getOption('gridSquare', true).value === true) {
      let _xStart = this.startPoint.x;
      while (_xStart <= this.endPoint.x) {
          _lines.push(new this.paper.Path.Line({x: _xStart, y: this.startPoint.y}, {x: _xStart, y: this.endPoint.y}));
          _xStart += this.getOption('gridX', true).value * 1;
      }
    }
    let _yStart = this.startPoint.y;
    while (_yStart <= this.endPoint.y) {
        _lines.push(new this.paper.Path.Line({x: this.startPoint.x, y: _yStart}, {x: this.endPoint.x, y: _yStart}));
        _yStart += this.getOption('gridY', true).value * 1;
    }    
    return new this.paper.CompoundPath({
        children: _lines,
        applyMatrix: false
    });
  }


  resize(delta, point) {
    if (point.x > this.startPoint.x && point.y > this.startPoint.y) {
      this.endPoint.x = point.x;
      this.endPoint.y = this.paper.Key.isDown('shift') 
                        ? this.endPoint.y + (point.x - this.startPoint.x)
                        : point.y;
      this.draw(this.round(this.endPoint));
    } else {
      console.log('no negative resize');
    }
  }

  endResize () {
  }

  setOption(name, value) {
    let redraw = false;
    this.options.forEach(o => {
      if (o.property == name) {
        try {
          this.primitive[name] = value;
          o.value = value;            
        }
        catch (err) {
          console.warn(err);
        }
        if (o.redraw === true) redraw = o.redraw;
      }
    });
    if (redraw === true) {
      this.draw(this.endPoint);
    }
  }  
}

class Arc extends Tool {
  constructor (paper, startPoint, state, primitive, defaults) {
    defaults = defaults || {};
    defaults.fixed = defaults.fixed || false;
    defaults.toolName = defaults.toolName || 'arc';
    defaults.angle = defaults.angle || 2;
    defaults.angleMin = defaults.angleMin || 0.1;
    defaults.angleMax = defaults.angleMax || 5;
    defaults.angleStep = defaults.angleStep || 0.01;


    let options = [
      {
          property: "angle",
          description: "Angle",
          type    : "int",
          value   : defaults.angle,
          min     : defaults.angleMin,
          max     : defaults.angleMax,
          step    : defaults.angleStep,
          redraw  : true
      }
  ];
    super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);

    // Backup parameters, applied after options change

    this._pos = {
      startPoint: false,
      toPoint: false,
      bounds: false,
      rotation: false,
      previousSibling: false
    };
  }

  setOption(name, value) {
    let redraw = false;
    this.options.forEach(o => {
      if (o.property == name) {
        try {
          this.primitive[name] = value;
          o.value = value;            
        }
        catch (err) {
          console.warn(err);
        }
        if (o.redraw === true) redraw = o.redraw;
      }
    });
    if (redraw === true) {
        
      if (this.primitive) {
        this._pos.bounds = this.primitive.bounds;
        this._pos.rotation = this.primitive.rotation;
        this._pos.previousSibling = this.primitive.previousSibling || false;
        this.primitive.remove();
      }
      this.primitive = this.drawAngle(this._pos.startPoint, this._pos.toPoint);
/*      if (this._pos.bounds) {
        this.primitive.bounds = this._pos.bounds
      }*/
      if (this._pos.rotation) {
        this.primitive.rotation = this._pos.rotation;
      }
      if (this._pos.previousSibling) {
        this.primitive.insertAbove(this._pos.previousSibling);
      }
      this.applyStyle();
      this.attachEvents();
    }
  }

  drawAngle(from, to) {
    let x1 = new this.paper.Point(from.x + ((to.y - from.y) / 2), from.y + ((to.x - from.x) / 2));
    let x2 = to.subtract(from).divide(2).add(from);
    let through = x1.subtract(x2).divide(this.getOption('angle', true).value * 1).add(x2);
	return (new this.paper.Path.Arc(from, through, to));
  }

  createPrimitive(point) {
    let _toPoint  = this.round(point);
    this._pos = {
      startPoint: this.startPoint,
      toPoint: _toPoint,
    };
    return this.drawAngle(this._pos.startPoint, this._pos.toPoint)
  }


  transformation(mode, point, delta) {
    switch (mode) {
      case 'Resize':
        this.primitive.bounds.size = this.primitive.bounds.size.add(new this.paper.Size(delta.x, this.paper.Key.isDown('shift') ? delta.x : delta.y));
        break;
    }
  }

  translate(delta) {
    this._pos.startPoint.x += delta.x;
    this._pos.startPoint.y += delta.y;
    this._pos.toPoint.x += delta.x;
    this._pos.toPoint.y += delta.y;
    this.primitive.position.x += delta.x;
    this.primitive.position.y += delta.y;
  }


  endTranslate() {
    this.startPoint = this.primitive.bounds.topLeft = this.round(this.primitive.bounds.topLeft);
    this.originalPos = this.primitive.position;
  }

  endtransformation(mode) {
    switch (mode) {
      case 'Resize':
        if (!this.paper.Key.isDown('meta')) {
          this.primitive.bounds.width = Math.round(this.primitive.bounds.width / (this.state.gridsize.x * 2)) * (this.state.gridsize.x * 2);
          this.primitive.bounds.height = Math.round(this.primitive.bounds.height / (this.state.gridsize.y * 2)) * (this.state.gridsize.y * 2);
        }
        break;
    }
  }
}

class State {
    constructor (options) {
        options = options || {};
        this.active     = null;
        this.actveByName = "";
        this.strokeWidth  = 2;
        this.strokeColor  = 'red';
        this.fillColor  = 'black';
        this.alpha      = 1;
        this.gridsize   = options.gridsize || {x: 25, y: 25};
        this.anglestep  = options.anglestep || 30;
        this.fonts      = options.fonts || [];
        this.selected   = [];
        this.context = false;
        this.copy   = [];
        this.stack  = [];
        this.clips  = [];
        this.paper  = null;
        this.painting = true;
        // Register Transformation Modes
        this.allowedTransformations = ['Move', 'Resize', 'Rotate'];
        this.transformation = 'Move';

        // Tools lookup table
        let _toolClasses = {
            'Square': Square,
            'Circle': Circle,
            'Line'  : Line,
            'Star'  : Star,
            'Polygon': Polygon,
            'Raster': Raster,
            'Text'  : Text,
            'Grid'  : Grid,
            'Polyline': Polyline,
            'Arc': Arc
        };

        // Register Tools
        this.tools = options.tools || {
            'Square': {
                class: 'Square'
            },
            'Circle': {
                class: 'Circle'
            },
            'Line': {
                class: 'Line'
            },
            'Star': {
                class: 'Star'
            },
            'Polygon': {
                class: 'Polygon'
            },
            'Raster': {
                class: 'Raster'
            },
            'Text': {
                class: 'Text'
            },
            'Grid': {
                class: 'Grid'
            },
            'Polyline': {
                class: 'Polyline'
            },
            'Arc': {
                class: 'Arc'
            }
        };
        // Convert String to Classes

        for (let _t in this.tools) if (Object.hasOwnProperty.call(this.tools, _t)) {
            // addOnMouseDown true for Text and Raster Object. Others need to be dragged.
            this.tools[_t].addOnMouseDown = this.tools[_t].class == 'Text' || this.tools[_t].class == 'Raster';

            // addOnDoubleClick true for Polyline
            this.tools[_t].addOnDoubleClick = this.tools[_t].class == 'Polyline';

            this.tools[_t].defaults = this.tools[_t].defaults || {};
            this.tools[_t].defaults.toolName = _t;

            // Overload Class
            this.tools[_t].className = this.tools[_t].class;            
            this.tools[_t].class = _toolClasses[this.tools[_t].class];
        }
    }

    addClipart(clips) {
        this.clips = clips;
    }

    getTools() {
        let _tools = [];
        for (const key in this.tools) {
            if (Object.hasOwnProperty.call(this.tools, key)) {
                _tools.push(key);
            }
        }
        return _tools;
    }

    addStack(e) {
        if (this.stack.find((_e)=>{}) == undefined) {
            this.stack.push(e); 
        }
    }

    deleteStack(e) {
        this.stack = this.stack.filter((_e) => { 
            return e != _e;
        });
    }

    exportStack() {
        this.unselectAll();
        let _json = [];

        this.stack.sort((a,b) => a.primitive.index > b.primitive.index);
        
        this.stack.forEach(e => {
            _json.push({
                'prototype': e.toolname,
                'data'     : Base64.encode(e.primitive.exportJSON({asString: true}))
            });
        });
        return JSON.stringify(_json);
    }

    importStack(json) {
        if (json) {
            json.forEach(o => {
              let _primitive = this.paper.project.activeLayer.importJSON(Base64.decode(o.data));
              this.setActive(o.prototype);
              new this.active(this.paper, false, this, _primitive, this.getActiveDefaults());
            });
            this.setActive('');
        }
    }

    onMouseDown() {
        this.dragged = false;
    }

    onDrag(point) {
        this.dragged = true;
        this.selected.forEach(s => {s.onDrag(point);});
    }
    
    onFinishDrag(point) {
        this.selected.forEach(s => {s.onFinishDrag(point);});
        this.dragged = false;
    }

    hasSelection() {
        return this.selected.length > 0;
    }

    hasSelectionBoundingBox() {
        let _r = false;
        let _t = false;
        if (this.selected.length > 0) {
            this.selected.forEach(s => {
                if (s.primitive.bounds.top < _t || _t === false) {
                    _t = s.primitive.bounds.top;
                }
                if (s.primitive.bounds.right > _r || _r === false) {
                    _r = s.primitive.bounds.right;
                }
            });
        }
        return {
            x: _r || 0,
            y: _t || 0
        }
    }

    hasClipboard() {
        return this.copy.length > 0;
    }

    unselectAll() {
        let _selectionLength = this.selected.length;
        if (_selectionLength > 0) {
            this.selected.forEach(s => {
                s.unselect();
            });
            this.selected = [];
            this.context = false;
        }
        return _selectionLength
    }

    deleteSelection() {
        if (this.selected.length > 0) {
            this.selected.forEach(s => {
                s.delete();
            });
            this.selected = [];
        }
    }

    moveSelection(direction) {
        if (this.selected.length > 0) {
            this.selected.forEach(s => {
                s.move(direction);
            });
        }
    }

    shiftSelection(direction) {
        if (this.selected.length > 0) {
            this.selected.forEach(s => {
                s.shift(direction);
            });
        }
    }

    copySelection() {
        this.copy = this.selected;
    }

    clearSelection() {
        this.copy = [];
    }

    pasteSelection() {
        if (this.copy.length > 0) {
            this.unselectAll();
            this.copy.forEach(s => {
                console.log(this, s);
                let _clone = new this.tools[s.toolname].class(s.paper, s.startPoint, this, s.primitive.clone(), this.tools[s.toolname].defaults);
                _clone._pos = s._pos;
                _clone.move('right');
                _clone.move('down');
                _clone.shift('front');
                _clone.select();
            });
            this.copySelection();
        }
        
    }

    setActive(toolname) {
        if (toolname && this.tools[toolname]) {
            this.unselectAll();
            this.active = this.tools[toolname].class;
            this.actveByName = toolname;
        }
        else {
            this.active = null;
            this.actveByName = "";
        }
    }

    isActive() {
        return this.active ? true : false;
    }

    getActiveName() {
        return this.actveByName;
    }

    getActiveClassName() {
        if (this.active) {
            return this.tools[this.actveByName].className
        }
        else
            return ""
    }

    getClassName(toolname) {
        return this.tools[toolname].className
    }

    getActiveDefaults() {
        return this.tools[this.actveByName].defaults || null;
    }

    addOnMouseDown() {
        try {
            return this.tools[this.actveByName].addOnMouseDown;
        } catch (err) {
            return false
        }
    }

    addOnDoubleClick() {
        try {
            return this.tools[this.actveByName].addOnDoubleClick;
        } catch (err) {
            return false
        }
    }

    getContext() {
        if (this.context && this.selected.length == 1) {
            return this.context;
        }
        else return false;
    }

    isTransformationAllowed(transformation) {
        if (this.getContext() === false) return true;
        else return this.getContext().isTransformationAllowed(transformation)
    }

    getOptionByType(option, toggled) {
        toggled = toggled || false;
        if (this.context && this.selected.length == 1) {
            let _options = this.context.getOptionByType(option);
            if (toggled) {
                return _options.filter(e => e.toggled === true);
            }
            else {
                return _options;
            }
            
        }
        else {
            return [];
        }
    }

    getStrokeColor() {
        return this.strokeColor;
    }

    getFillColor() {
        return this.fillColor;
    }

    getStrokeWidth() {
        return this.strokeWidth;
    }

    getTransformation() {
        return this.transformation;
    }

    getAlpha() {
        return this.alpha
    }

    setFillColor(color) {
        this.fillColor = color;
        this.applyStyle();
    }

    setAlpha(alpha) {
        this.alpha = alpha;
        this.applyStyle();
    }

    setStrokeColor(color) {
        this.strokeColor = color;
        this.applyStyle();
    }

    setStrokeWidth(width) {
        this.strokeWidth = width;
        this.applyStyle();
    }    

    setTransformation(t) {
        if (this.allowedTransformations.indexOf(t) !== -1) {
            this.transformation == t
                ? this.transformation = false
                : this.transformation = t;
        }
    }

    disableTransformation() {
        this.transformation = false;
    }

    applyStyle() {
        if (this.selected.length > 0) {
            this.selected.forEach(s => {
                s.applyStyle();
            });
        }
    }
}

//

const DOUBLECLICK_TIME_MS = 450;
const DOUBLECLICK_DELTA = 3;

var script = {
  name: 'VuePainter',
  components: {
    VueDraggableResizable
  },
  props: {
    data: String,
    clipart: Array,
    fonts: Array,
    configuration: Object,
    csscolors: Array,
    translations: Object,
    gridX: Number,
    gridY: Number,
    angleStep: Number,
    gridColor: String,
    dotColor: String
  },
  computed: {
    getContextX () {
      /*if (this.contextX !== false) return this.contextX;
      this.contextX = this.state.hasSelectionBoundingBox().x*/
      return this.contextX;
    },
    getContextY () {
      /*if (this.contextY !== false) return this.contextY;
      if (this.$refs.context && this.$refs.painter) {
        if (this.state.hasSelectionBoundingBox().y - this.$refs.wrapper.scrollTop < this.$refs.wrapper.clientHeight  - this.$refs.context.$el.clientHeight) {
          this.contextY = this.state.hasSelectionBoundingBox().y - this.$refs.wrapper.scrollTop
        }
        else {
          this.contextY = this.$refs.wrapper.clientHeight - this.$refs.context.$el.clientHeight;
        }
      }
      else {
        this.contextY = 0
      }*/
      return this.contextY;
    },    
    cssVars () {
      return {
        '--vue-paint-scaling-factor': `${this.scaling}`
      }
    }
  },
  data () {

    let style = document.createElement('style');
    document.head.appendChild(style);

    return {
      // Data
      json: null,

      // Image Clipart
      clips: null,

      // Paper & Paper.Tool Stuff
      paper: null,
      tool: null,

      // State Class
      state: null,

      // Colors
      colors: this.csscolors || ['black', 'green', 'red', 'blue', 'transparent'],

      // String Translations
      strings: this.translations || {
        'tools': 'Tools',
        'file': 'File',
        'preset': 'Preset',
        'selection': 'Selection',
        'functions': 'Functions',
        'parameter': 'Parameter',
        'clipboard': 'Clipboard',
        'save': 'Save',
        'export': 'Export SVG',
        'stroke': 'Stroke',
        'alpha': 'Alpha',
        'fillcolor': 'Fill Color',
        'strokecolor': 'Stroke Color',
        'delete': 'Delete',
        'copy': 'Copy',
        'paste': 'Paste',
        'clear': 'Clear',
        'Move': 'Move',
        'Rotate': 'Rotate',
        'Resize': 'Resize',
        'zoom': 'Zoom',
        'background': 'Send to Back',
        'foreground': 'Bring to Front'
      },

      // Tools
      tools: [],

      // Transformations
      transformations: [
        ['Move', 'm'], 
        ['Rotate', 'r'], 
        ['Resize', 's']
      ],

      // Keyhandling
      keyHandlingActive: true, // set to false if paper should not listen to keystrokes

      // Style Sheet
      sheet: style.sheet,

      // Drawing Layer
      layer: null,

      // Scaling
      scaling: 100,
      viewSize: {},

      // ContextPos
      contextX: 300,
      contextY: 150
    }
  },
  created() {
    if (this.data) {
      try {
        this.json = JSON.parse(this.data);
      } catch(err) {
        console.warn(err);
        this.json = false;
      }
    }
    this.clips = this.prepareClipart(this.clipart);
    this.state = new State({
      'gridsize'  : {x: this.gridX || 25, y: this.gridY || 25}, 
      'anglestep' : this.angleStep || 5, 
      'fonts'     : this.fonts,
      'tools'     : this.configuration
    });
  },
  mounted() {
        // Inject Fonts into CSS HEAD
    try {
      if (this.fonts && this.fonts.length && this.fonts.length > 0) {
        let _loaded = this.fonts.length;
        this.fonts.forEach(f => {
          let _rule = `@font-face {
            font-family: "${f.family}";
            font-style: normal;
            font-weight: normal;
            src: url("${f.file}") format('woff');
          }`;
          this.sheet.insertRule(_rule, this.sheet.cssRules.length);
          // Preload fonts if document.fonts api is available
          if (document.fonts) {
            try {
              document.fonts.load(`10pt ${f.family}`).then((e)=>{
                console.log(`font loaded: ${e[0].family}`);
                _loaded--;
                if (_loaded == 0) {
                  this.initialize();
                }
              });
            }
            catch (err) {
              _loaded--;
              if (_loaded == 0) {
                this.initialize();
              }
            }
          }
          else {
            _loaded--;
            if (_loaded == 0) {
              this.initialize();
            }
          }
        });
      }
      else {
        this.initialize();
      }
    }
    catch (err) {
      console.warn('no custom fonts');
      this.initialize();
    }
  },
  destroyed() {
    this.tool.remove(); // This is important, otherwise all event handlers are called on a wrong vue instance on reload
    this.paper =
    this.tool  =
    this.state =
    this.json  =
    this.clips = null;
  },
  methods: {
    onContextDrag(x,y) {
      this.contextX = x;
      this.contextY = y;
    },
    longestWord(string) {
      var str = string.split("\n");
      var longest = 0;
      for (var i = 0; i < str.length - 1; i++) {
          if (longest < str[i].length) {
              longest = str[i].length;
          }
      }
      return longest;
    },
    drawGrid() {
      new this.paper.Layer();
      let _rotation  = Math.atan(this.state.gridsize.y / this.state.gridsize.x) * -(180/Math.PI);

      this.paper.Path.Line({
          from: [0, this.paper.project.view.bounds.height / 2],
          to: [this.paper.project.view.bounds.width, this.paper.project.view.bounds.height / 2],
          strokeColor: '#CCC',
      });
      this.paper.Path.Line({
          from: [this.paper.project.view.bounds.width / 2, 0],
          to: [this.paper.project.view.bounds.width / 2, this.paper.project.view.bounds.height],
          strokeColor: '#CCC',
      });      

      if (this.state.gridsize.y != this.state.gridsize.x) {
        for (let _y = 0; _y < this.paper.project.view.bounds.height * 2; _y+=this.state.gridsize.y) {
          let _l = this.paper.Path.Line({
              from: [0, _y],
              to: [this.paper.project.view.bounds.width * 2, _y],
              strokeColor: this.gridColor || '#CCF',
              dashArray: [1, 2]
          });
          _l.rotate(_rotation, [0,_y]);
          _l = this.paper.Path.Line({
              from: [this.paper.project.view.bounds.width * -2, _y],
              to: [this.paper.project.view.bounds.width, _y],
              strokeColor: this.gridColor || '#CCF',
              dashArray: [1, 2]
          });
          _l.rotate(_rotation * -1, [Math.floor(this.paper.project.view.bounds.width / this.state.gridsize.x) * this.state.gridsize.x,_y]);        
        }      
      } else {
        for (let _y = 0; _y < this.paper.project.view.bounds.height; _y+=this.state.gridsize.y) {
          this.paper.Path.Line({
              from: [0, _y],
              to: [this.paper.project.view.bounds.width, _y],
              strokeColor: this.gridColor || '#CCF',
              dashArray: [1, 2]
          });
        }
        for (let _x = 0; _x < this.paper.project.view.bounds.width; _x+=this.state.gridsize.x) {
          this.paper.Path.Line({
              from: [_x, 0],
              to: [_x, this.paper.project.view.bounds.height],
              strokeColor: this.gridColor || '#CCF',
              dashArray: [1, 2]
          });
        }        
      }
      for (let _y = 0; _y < this.paper.project.view.bounds.height; _y+=this.state.gridsize.y) {
        for (let _x = 0; _x < this.paper.project.view.bounds.width; _x+=this.state.gridsize.x) {
          new this.paper.Path.Circle({
              center: [_x, _y],
              radius: 1,
              fillColor: this.dotColor || '#000',
          });
        }
      }
    },
    setScaling(value) {
      this.scaling = value * 1.0;
      if (this.$refs.painter) {
        this.paper.view.scale(1 / this.paper.view.zoom, [0,0]);
        this.paper.view.scale(this.scaling / 100, [0,0]);
        this.paper.view.viewSize = this.viewSize.multiply(this.scaling / 100);
      }
    },
    initialize () {
      console.log('initializing vue-paint…');
      this.tools = this.state.getTools();
      this.paper = paper.setup(this.$refs.painter);
      this.paper.settings.hitTolerance = 20;
      this.tool = new paper.Tool();
      this.state.paper = this.paper;
      let _painting;
      this.viewSize = this.paper.view.viewSize.clone();
      this.drawGrid();

      this.layer = new this.paper.Layer();

      // Double Click Stuff
      let _lastClick = 0;
      let _lastPoint = {
        x: -1000,
        y: -1000
      };

      let _disableMouseUp = false;

      this.tool.onMouseDown = (event) => {
        this.enableKeys();
        this.state.onMouseDown();
        if (event.item == null || event.item.layer.getIndex() === 0) {
          let _selectionLength = this.state.unselectAll();
          // Disable MouseUp Actions for one time if we really deselected something
          if (_selectionLength > 0) {
            _disableMouseUp = true;
          }
          return false;
        }
      };
      this.tool.onMouseDrag = (event) => {
        if (!this.state.hasSelection()) {
          if (this.state.addOnDoubleClick(this.state.getActiveName()) === false) {
            if (_painting) {
              _painting.onPaint(event.point);
            }
            else {
              if (this.state.isActive()) {
                _painting = new this.state.active(this.paper, event.point, this.state, null, this.state.getActiveDefaults());
              }
            }
          }
        }
        else {
          this.state.onDrag(event.point);
        }
      };

      this.tool.onMouseMove = (event) => {
        if (
          !this.state.hasSelection() &&
          this.state.addOnDoubleClick(this.state.getActiveName()) === true && 
          _painting
        ) {
            _painting.onMove(event.point);
        }
      };


      this.tool.onMouseUp = (event) => {
        if (_disableMouseUp === true) {
          _disableMouseUp = false;
          return
        }

        // Action for AddOnClick Itmes

        if (!_painting && !this.state.hasSelection() && this.state.isActive() && this.state.addOnMouseDown(this.state.getActiveName())) {
          _painting = new this.state.active(this.paper, event.point, this.state, null, this.state.getActiveDefaults());
          _painting.onPaint(event.point);        
          _painting.onFinishPaint(event.point);
          _painting = null;
          this.state.setActive(false);
          console.log('--------');
        }
        else {

          // Already drawing: Finishing Actions or Intermediate Actions

          if (_painting) {

            // Action for addOnDoubleClick (intermediate action)

            if (this.state.addOnDoubleClick(this.state.getActiveName())) {
                _painting.onClick(event.point);
            } 
            
            // Action for single-dragging items (i.e. circles)
            
            else {
              _painting.onFinishPaint(event.point);
              _painting = null;
            }
          }

          // Not drawing: Starting Actions

          else {

            // Double Click Items: Start here
            // All others started on mousedown (due to dragging functionality)

            if (this.state.addOnDoubleClick(this.state.getActiveName()) && !this.state.hasSelection()) {
              _painting = new this.state.active(this.paper, event.point, this.state, null, this.state.getActiveDefaults());
              _painting.onPaint(event.point);        
            }
          }

          // General finish drag event

          if (this.state.dragged) {
            this.state.onFinishDrag(event.point);
          }
        }

        // Double Click Trigger (timeout and delta)

        if (
          event.timeStamp - _lastClick <= DOUBLECLICK_TIME_MS &&
          Math.sqrt((_lastPoint.x - event.point.x) ** 2 + (_lastPoint.y - event.point.y) ** 2) <= DOUBLECLICK_DELTA 
        ) {
          this.tool.onDoubleClick(event);
        }
        _lastClick = event.timeStamp;
        _lastPoint = event.point;
        return false;
      }; 

      this.tool.onDoubleClick = (event) => {
        if (_painting && this.state.addOnDoubleClick(this.state.getActiveName())) {
          _painting.onFinishPaint(event.point);
          _painting = null;
        }
      };
      
      this.tool.onKeyDown = (event) => {
        if (this.keyHandlingActive === true) {
          if (event.key == 'delete' || event.key == 'backspace') {
              this.state.deleteSelection();
              return false;
          }
          if (event.key == 'up' || event.key == 'down' || event.key == 'left' || event.key == 'right') {
            this.state.moveSelection(event.key, event.modifiers.shift);
            return false;
          }
          if (event.key == 'page-up') {
            this.state.shiftSelection('back');
            return false;
          }      
          if (event.key == 'page-down') {
            this.state.shiftSelection('front');
            return false;
          }            

          if (event.key == 'c' && event.modifiers.meta) {
            this.state.copySelection();
            return false;
          }      
          if (event.key == 'v' && event.modifiers.meta) {
            this.state.pasteSelection();
            return false;
          }
          this.transformations.forEach(t => {
            if (event.key == t[1]) {
              this.state.setTransformation(t[0]);
              return false;
            }
          });
        }
        // Toggle first text area option (if there are multiples)
        if (event.key == 'e' && event.modifiers.meta && this.state.getOptionByType('textarea').length > 0) {
          this.toggleOption(this.state.getOptionByType('textarea')[0]);
          return false;
        }

        if (event.key == 'i' && event.modifiers.meta && this.state.getOptionByType('clipart').length > 0) {
          this.toggleOption(this.state.getOptionByType('clipart')[0]);
          return false;
        }
      };

      // Import json data to stage if passed as a prop

      this.$nextTick(()=>{
        if (this.json) {
          this.state.importStack(this.json);
        }
      });

    },
    saveJSON() {
      this.$emit('save', this.state.exportStack());
    },
    exportSVG() {
      let svg = this.paper.project.activeLayer.exportSVG({
        asString: true,
        embedImages: false,
        onExport: (item, node) => {
            if (item._class === 'PointText') {
                node.textContent = null;
                for (let i = 0; i < item._lines.length; i++) {
                    let tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                    tspan.textContent = item._lines[i] ? item._lines[i] : "\u00A0";
                    let dy = item.leading;
                    if (i === 0) {
                        dy = 0;
                    }
                    tspan.setAttributeNS(null, 'x', node.getAttribute('x'));
                    tspan.setAttributeNS(null, 'dy', dy);
                    node.appendChild(tspan);
                }
            }
            return node;
          }
        }
      );

      let stringifyRule = function(rule) {
        return rule.cssText || ''
      };
      let _str = Array.from(this.sheet.cssRules)
        .map(rule => stringifyRule(rule))
        .join('\n');

      svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${this.paper.project.view.bounds.width}" height="${this.paper.project.view.bounds.height}" viewBox="0,0,${this.paper.project.view.bounds.width},${this.paper.project.view.bounds.height}">
      <defs>
        <style>
          ${_str}
        </style>
      </defs>
      ${svg}
      </svg>`;

      this.$emit('export', svg);
    },
    disableKeys() {
      this.keyHandlingActive = false;
    },
    enableKeys() {
      this.keyHandlingActive = true;
    },
    // needed to ensure reactivity ($set)
    toggleOption(option) {
      this.$set(option, 'toggled', !option.toggled);
      this.state.getContext().selectBorderColor(option.toggled ? 'red' : null);
      if (!option.toggled) {
        this.enableKeys();
      }
      else {
        this.disableKeys();
        this.state.disableTransformation();
        this.$nextTick(() => {
          try {
            this.$refs[option.property][0].focus();
          }
          catch (err) {
            console.warn('obviously no text area to focus!');
          }
          
        });
      }
    },
    prepareClipart(clips) {
      clips = clips || [];
      let _prepared = {
        'groups': [],
        'clips': {},
        'selected': ''
      };
      clips.forEach((clip) => {
        if (_prepared.groups.indexOf(clip.group)===-1) {
          _prepared.groups.push(clip.group);
        }
        _prepared.clips[clip.group] = _prepared.clips[clip.group] || [];
        _prepared.clips[clip.group].push(clip);
      });
      _prepared.selected = _prepared.groups[0];
      return _prepared;
    }
  }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    const options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

/* script */
const __vue_script__ = script;
/* template */
var __vue_render__ = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    { staticClass: "vue-paint", style: _vm.cssVars },
    [
      _c(
        "transition",
        { attrs: { name: "flipin" } },
        _vm._l(_vm.state.getOptionByType("clipart", true), function(option) {
          return _c(
            "div",
            {
              key: "" + option.property,
              staticClass: "vue-paint-clipart-wrapper",
              on: {
                click: function($event) {
                  return _vm.toggleOption(option)
                }
              }
            },
            [
              _c("div", { staticClass: "vue-paint-clipart-container" }, [
                _c(
                  "div",
                  { staticClass: "vue-paint-clipart-container-groups" },
                  _vm._l(_vm.clips.groups, function(group) {
                    return _c(
                      "div",
                      {
                        key: "g-" + group,
                        staticClass: "vue-paint-clipart-container-group"
                      },
                      [
                        _c("a", {
                          attrs: { href: "#" },
                          domProps: { innerHTML: _vm._s(group) },
                          on: {
                            click: function($event) {
                              $event.stopPropagation();
                              _vm.clips.selected = group;
                            }
                          }
                        })
                      ]
                    )
                  }),
                  0
                ),
                _vm._v(" "),
                _c(
                  "div",
                  { staticClass: "vue-paint-clipart-container-items" },
                  _vm._l(_vm.clips.clips[_vm.clips.selected], function(clip) {
                    return _c(
                      "div",
                      {
                        key: "g-" + clip.thumb,
                        staticClass: "vue-paint-clipart-container-item"
                      },
                      [
                        _c(
                          "a",
                          {
                            attrs: { href: "#" },
                            on: {
                              click: function($event) {
                                $event.stopPropagation();
                                _vm.state
                                  .getContext()
                                  .setOption(option.property, clip.source);
                                _vm.toggleOption(option);
                              }
                            }
                          },
                          [_c("img", { attrs: { src: clip.thumb } })]
                        )
                      ]
                    )
                  }),
                  0
                )
              ])
            ]
          )
        }),
        0
      ),
      _vm._v(" "),
      _c(
        "div",
        {
          ref: "wrapper",
          staticClass: "vue-paint-wrapper",
          attrs: { id: "wrapper" }
        },
        [
          _vm._l(_vm.state.getOptionByType("textarea", true), function(option) {
            return _c(
              "div",
              {
                key: "" + option.property,
                staticClass: "vue-paint-editor",
                style: {
                  left:
                    (_vm.state.getContext().primitive.position.x *
                      _vm.scaling) /
                      100 +
                    "px",
                  top:
                    (_vm.state.getContext().primitive.position.y *
                      _vm.scaling) /
                      100 +
                    "px",
                  transform:
                    "scale(" +
                    _vm.scaling / 100 +
                    ") rotate(" +
                    _vm.state.getContext().primitive.rotation +
                    "deg)",
                  "transform-origin": "0px 0px"
                },
                attrs: { id: "fitpopup" }
              },
              [
                _c("textarea", {
                  directives: [
                    {
                      name: "model",
                      rawName: "v-model",
                      value: option.value,
                      expression: "option.value"
                    }
                  ],
                  ref: option.property,
                  refInFor: true,
                  style: {
                    width: option.cols + 1 + "ch",
                    "font-size":
                      _vm.state.getContext().primitive.fontSize + "px",
                    "line-height":
                      _vm.state.getContext().primitive.leading + "px",
                    "font-family":
                      "" + _vm.state.getContext().primitive.fontFamily,
                    transform:
                      "translateX(-" +
                      _vm.state.getContext().primitive.internalBounds.width /
                        2 +
                      "px) translateY(-" +
                      _vm.state.getContext().primitive.internalBounds.height /
                        2 +
                      "px)",
                    "text-align":
                      _vm.state.getContext().primitive.justification || "left"
                  },
                  attrs: {
                    rows: option.rows,
                    cols: option.cols,
                    name: "input",
                    wrap: "hard"
                  },
                  domProps: { value: option.value },
                  on: {
                    keyup: function($event) {
                      _vm.state
                        .getContext()
                        .setOption(option.property, $event.target.value);
                    },
                    focus: _vm.disableKeys,
                    blur: _vm.enableKeys,
                    input: function($event) {
                      if ($event.target.composing) {
                        return
                      }
                      _vm.$set(option, "value", $event.target.value);
                    }
                  }
                })
              ]
            )
          }),
          _vm._v(" "),
          _c("canvas", {
            ref: "painter",
            class:
              "vue-paint-canvas vue-paint-canvas-" +
              _vm.state.getActiveClassName() +
              " vue-paint-canvas-" +
              _vm.state.getActiveName().replace(/ /g, "_"),
            attrs: { id: "painter" }
          })
        ],
        2
      ),
      _vm._v(" "),
      _vm.state.getContext() && _vm.state.getContext().showHint()
        ? _c("div", { staticClass: "vue-paint-hint" }, [
            _c("div", [
              _vm._v(
                "\n      " +
                  _vm._s(
                    _vm.strings[_vm.state.getContext().showHint()] ||
                      _vm.state.getContext().showHint()
                  ) +
                  "\n    "
              )
            ])
          ])
        : [
            _vm.state.getActiveName() !== "" &&
            _vm.strings[
              "hint:" + _vm.state.getClassName(_vm.state.getActiveName())
            ]
              ? _c("div", { staticClass: "vue-paint-hint" }, [
                  _c("div", [
                    _vm._v(
                      "\n        " +
                        _vm._s(
                          _vm.strings[
                            "hint:" +
                              _vm.state.getClassName(_vm.state.getActiveName())
                          ]
                        ) +
                        "\n      "
                    )
                  ])
                ])
              : _vm._e()
          ],
      _vm._v(" "),
      _c(
        "vue-draggable-resizable",
        {
          staticClass: "vue-paint-menu",
          attrs: {
            w: "auto",
            h: "auto",
            "drag-handle": ".drag",
            id: "menu",
            z: 10
          }
        },
        [
          _c("div", { staticClass: "drag" }),
          _vm._v(" "),
          _c(
            "div",
            [
              _c(
                "div",
                {
                  staticClass: "vue-paint-menu-divider",
                  on: {
                    click: function($event) {
                      return $event.target.parentElement.classList.toggle(
                        "folded"
                      )
                    }
                  }
                },
                [_vm._v(_vm._s(_vm.strings.tools))]
              ),
              _vm._v(" "),
              _c(
                "a",
                {
                  class:
                    "vue-paint-button vue-paint-button-tooltip vue-paint-button-selection" +
                    (_vm.state.getActiveName() === ""
                      ? " vue-paint-button-active"
                      : ""),
                  on: {
                    click: function($event) {
                      return _vm.state.setActive(false)
                    }
                  }
                },
                [_c("span", [_vm._v(_vm._s(_vm.strings.selection))])]
              ),
              _vm._v(" "),
              _vm._l(_vm.tools, function(t) {
                return _c(
                  "a",
                  {
                    key: "tool-" + t,
                    class:
                      "vue-paint-button vue-paint-button-tooltip vue-paint-button-" +
                      _vm.state.getClassName(t) +
                      " vue-paint-button-" +
                      t.replace(/ /g, "_") +
                      (_vm.state.getActiveName() == t
                        ? " vue-paint-button-active"
                        : ""),
                    on: {
                      click: function($event) {
                        _vm.state.setActive(
                          _vm.state.getActiveName() == t ? false : t
                        );
                      }
                    }
                  },
                  [_c("span", [_vm._v(_vm._s(t))])]
                )
              })
            ],
            2
          ),
          _vm._v(" "),
          _c("div", [
            _c(
              "div",
              {
                staticClass: "vue-paint-menu-divider",
                on: {
                  click: function($event) {
                    return $event.target.parentElement.classList.toggle(
                      "folded"
                    )
                  }
                }
              },
              [_vm._v(_vm._s(_vm.strings.file))]
            ),
            _vm._v(" "),
            _c(
              "a",
              {
                staticClass: "vue-paint-button vue-paint-button-save",
                on: {
                  click: function($event) {
                    return _vm.saveJSON()
                  }
                }
              },
              [_vm._v(_vm._s(_vm.strings.save))]
            ),
            _vm._v(" "),
            _c(
              "a",
              {
                staticClass: "vue-paint-button vue-paint-button-export",
                on: {
                  click: function($event) {
                    return _vm.exportSVG()
                  }
                }
              },
              [_vm._v(_vm._s(_vm.strings.export))]
            )
          ]),
          _vm._v(" "),
          _c("div", [
            _c(
              "div",
              {
                staticClass: "vue-paint-menu-divider",
                on: {
                  click: function($event) {
                    return $event.target.parentElement.classList.toggle(
                      "folded"
                    )
                  }
                }
              },
              [_vm._v(_vm._s(_vm.strings.preset))]
            ),
            _vm._v(" "),
            _c(
              "label",
              { staticClass: "vue-paint-label vue-paint-label-stroke" },
              [
                _vm._v(
                  _vm._s(_vm.strings.stroke) +
                    " " +
                    _vm._s(_vm.state.getStrokeWidth()) +
                    " Px\n        "
                ),
                _c("input", {
                  attrs: { type: "range", min: "0", max: "10" },
                  domProps: { value: _vm.state.getStrokeWidth() },
                  on: {
                    change: function($event) {
                      return _vm.state.setStrokeWidth($event.target.value)
                    }
                  }
                })
              ]
            ),
            _vm._v(" "),
            _c(
              "label",
              { staticClass: "vue-paint-label vue-paint-label-alpha" },
              [
                _vm._v(
                  _vm._s(_vm.strings.alpha) +
                    " " +
                    _vm._s(_vm.state.getAlpha() * 100) +
                    "%\n        "
                ),
                _c("input", {
                  attrs: { type: "range", min: "0", max: "4" },
                  domProps: { value: _vm.state.getAlpha() * 4 },
                  on: {
                    change: function($event) {
                      return _vm.state.setAlpha($event.target.value / 4)
                    }
                  }
                })
              ]
            ),
            _vm._v(" "),
            _c(
              "label",
              { staticClass: "vue-paint-label vue-paint-label-fillcolor" },
              [
                _vm._v(_vm._s(_vm.strings.fillcolor) + "\n        "),
                _c(
                  "div",
                  { staticClass: "vue-paint-colorlist" },
                  _vm._l(_vm.colors, function(c) {
                    return _c("a", {
                      key: "bgcolor-" + c,
                      staticClass: "color",
                      class: { "color-active": _vm.state.getFillColor() == c },
                      style: { "background-color": c },
                      on: {
                        click: function($event) {
                          return _vm.state.setFillColor(c)
                        }
                      }
                    })
                  }),
                  0
                )
              ]
            ),
            _vm._v(" "),
            _c(
              "label",
              { staticClass: "vue-paint-label vue-paint-label-strokecolor" },
              [
                _vm._v(_vm._s(_vm.strings.strokecolor) + "\n        "),
                _c(
                  "div",
                  { staticClass: "vue-paint-colorlist" },
                  _vm._l(_vm.colors, function(c) {
                    return _c("a", {
                      key: "bgcolor-" + c,
                      staticClass: "color",
                      class: {
                        "color-active": _vm.state.getStrokeColor() == c
                      },
                      style: { "background-color": c },
                      on: {
                        click: function($event) {
                          return _vm.state.setStrokeColor(c)
                        }
                      }
                    })
                  }),
                  0
                )
              ]
            ),
            _vm._v(" "),
            _c(
              "label",
              { staticClass: "vue-paint-label vue-paint-label-stroke" },
              [
                _vm._v(
                  _vm._s(_vm.strings.zoom) +
                    " " +
                    _vm._s(_vm.scaling) +
                    "%\n        "
                ),
                _c("input", {
                  attrs: { type: "range", min: "25", step: "25", max: "200" },
                  domProps: { value: _vm.scaling },
                  on: {
                    change: function($event) {
                      return _vm.setScaling($event.target.value)
                    }
                  }
                })
              ]
            )
          ])
        ]
      ),
      _vm._v(" "),
      _vm.state.hasSelection() ||
      _vm.state.hasClipboard() ||
      _vm.state.getContext()
        ? _c(
            "vue-draggable-resizable",
            {
              ref: "context",
              staticClass: "vue-paint-context",
              attrs: {
                x: _vm.getContextX,
                y: _vm.getContextY,
                w: "auto",
                h: "auto",
                "drag-handle": ".drag",
                id: "context",
                z: 10
              },
              on: { dragging: _vm.onContextDrag }
            },
            [
              _c("div", { staticClass: "drag" }),
              _vm._v(" "),
              _vm.state.hasSelection()
                ? _c(
                    "div",
                    [
                      _c(
                        "div",
                        {
                          staticClass: "vue-paint-menu-divider",
                          on: {
                            click: function($event) {
                              return $event.target.parentElement.classList.toggle(
                                "folded"
                              )
                            }
                          }
                        },
                        [_vm._v(_vm._s(_vm.strings.functions))]
                      ),
                      _vm._v(" "),
                      _c(
                        "a",
                        {
                          staticClass:
                            "vue-paint-button vue-paint-button-shorcut vue-paint-button-delete",
                          on: {
                            click: function($event) {
                              return _vm.state.deleteSelection()
                            }
                          }
                        },
                        [
                          _vm._v(_vm._s(_vm.strings.delete) + "  "),
                          _c("span", [_vm._v("🔙")])
                        ]
                      ),
                      _vm._v(" "),
                      _c(
                        "a",
                        {
                          staticClass:
                            "vue-paint-button vue-paint-button-shorcut vue-paint-button-copy",
                          on: {
                            click: function($event) {
                              return _vm.state.copySelection()
                            }
                          }
                        },
                        [
                          _vm._v(_vm._s(_vm.strings.copy) + " "),
                          _c("span", [_vm._v("cmd-c")])
                        ]
                      ),
                      _vm._v(" "),
                      _vm._l(_vm.transformations, function(t) {
                        return [
                          _vm.state.isTransformationAllowed(t[0])
                            ? _c(
                                "a",
                                {
                                  key: "transformation-" + t[0],
                                  class:
                                    "vue-paint-button vue-paint-button-shorcut vue-paint-button-" +
                                    t[0] +
                                    (_vm.state.getTransformation() == t[0]
                                      ? " vue-paint-button-active"
                                      : ""),
                                  on: {
                                    click: function($event) {
                                      return _vm.state.setTransformation(t[0])
                                    }
                                  }
                                },
                                [
                                  _vm._v(_vm._s(_vm.strings[t[0]]) + " "),
                                  _c("span", [_vm._v(_vm._s(t[1]))])
                                ]
                              )
                            : _vm._e()
                        ]
                      }),
                      _vm._v(" "),
                      _c(
                        "a",
                        {
                          staticClass:
                            "vue-paint-button vue-paint-button-shorcut vue-paint-button-background",
                          on: {
                            click: function($event) {
                              return _vm.state.shiftSelection("back")
                            }
                          }
                        },
                        [
                          _vm._v(_vm._s(_vm.strings.background)),
                          _c("span", [_vm._v("⇞")])
                        ]
                      ),
                      _vm._v(" "),
                      _c(
                        "a",
                        {
                          staticClass:
                            "vue-paint-button vue-paint-button-shorcut vue-paint-button-foreground",
                          on: {
                            click: function($event) {
                              return _vm.state.shiftSelection("front")
                            }
                          }
                        },
                        [
                          _vm._v(_vm._s(_vm.strings.foreground)),
                          _c("span", [_vm._v("⇟")])
                        ]
                      ),
                      _vm._v(" "),
                      _vm.state.isTransformationAllowed("Move")
                        ? _c("div", { staticClass: "vue-paint-arrowbuttons" }, [
                            _c(
                              "a",
                              {
                                on: {
                                  click: function($event) {
                                    return _vm.state.moveSelection("left")
                                  }
                                }
                              },
                              [_c("span", [_vm._v("←")])]
                            ),
                            _vm._v(" "),
                            _c(
                              "a",
                              {
                                on: {
                                  click: function($event) {
                                    return _vm.state.moveSelection("up")
                                  }
                                }
                              },
                              [_c("span", [_vm._v("↑")])]
                            ),
                            _vm._v(" "),
                            _c(
                              "a",
                              {
                                on: {
                                  click: function($event) {
                                    return _vm.state.moveSelection("down")
                                  }
                                }
                              },
                              [_c("span", [_vm._v("↓")])]
                            ),
                            _vm._v(" "),
                            _c(
                              "a",
                              {
                                on: {
                                  click: function($event) {
                                    return _vm.state.moveSelection("right")
                                  }
                                }
                              },
                              [_c("span", [_vm._v("→")])]
                            )
                          ])
                        : _vm._e()
                    ],
                    2
                  )
                : _vm._e(),
              _vm._v(" "),
              _vm.state.hasClipboard()
                ? _c("div", [
                    _c(
                      "div",
                      {
                        staticClass: "vue-paint-menu-divider",
                        on: {
                          click: function($event) {
                            return $event.target.parentElement.classList.toggle(
                              "folded"
                            )
                          }
                        }
                      },
                      [_vm._v(_vm._s(_vm.strings.clipboard))]
                    ),
                    _vm._v(" "),
                    _c(
                      "a",
                      {
                        staticClass:
                          "vue-paint-button vue-paint-button-shorcut vue-paint-button-paste",
                        on: {
                          click: function($event) {
                            return _vm.state.pasteSelection()
                          }
                        }
                      },
                      [
                        _vm._v(_vm._s(_vm.strings.paste)),
                        _c("span", [_vm._v("cmd-v")])
                      ]
                    ),
                    _vm._v(" "),
                    _c(
                      "a",
                      {
                        staticClass:
                          "vue-paint-button vue-paint-button-shorcut vue-paint-button-clear",
                        on: {
                          click: function($event) {
                            return _vm.state.clearSelection()
                          }
                        }
                      },
                      [_vm._v(_vm._s(_vm.strings.clear))]
                    )
                  ])
                : _vm._e(),
              _vm._v(" "),
              _vm.state.getContext()
                ? _c(
                    "div",
                    [
                      _c(
                        "div",
                        {
                          staticClass: "vue-paint-menu-divider",
                          on: {
                            click: function($event) {
                              return $event.target.parentElement.classList.toggle(
                                "folded"
                              )
                            }
                          }
                        },
                        [_vm._v(_vm._s(_vm.strings.parameter))]
                      ),
                      _vm._v(" "),
                      _vm._l(_vm.state.getContext().getOptions(), function(
                        option
                      ) {
                        return [
                          option.type != "hidden"
                            ? _c(
                                "form",
                                {
                                  key: "form-" + option.description,
                                  attrs: { id: "form-" + option.property }
                                },
                                [
                                  option.type == "textarea" ||
                                  option.type == "clipart"
                                    ? _c(
                                        "a",
                                        {
                                          key: option.parameter,
                                          class:
                                            "vue-paint-button vue-paint-button-shorcut vue-paint-button-" +
                                            option.description +
                                            " " +
                                            (option.toggled
                                              ? " vue-paint-button-active"
                                              : ""),
                                          on: {
                                            click: function($event) {
                                              return _vm.toggleOption(option)
                                            }
                                          }
                                        },
                                        [
                                          _vm._v(
                                            "\n            " +
                                              _vm._s(
                                                _vm.strings[
                                                  option.description
                                                ] || option.description
                                              )
                                          ),
                                          _c("span", [
                                            _vm._v(
                                              _vm._s(
                                                option.type == "textarea"
                                                  ? "cmd-e"
                                                  : "cmd-i"
                                              )
                                            )
                                          ])
                                        ]
                                      )
                                    : _vm._e(),
                                  _vm._v(" "),
                                  option.type == "int" &&
                                  option.min !== option.max
                                    ? _c(
                                        "label",
                                        {
                                          key: "option-" + option.description,
                                          class:
                                            "vue-paint-label vue-paint-label-" +
                                            option.description
                                        },
                                        [
                                          _vm._v(
                                            _vm._s(
                                              _vm.strings[option.description] ||
                                                option.description
                                            ) +
                                              ": " +
                                              _vm._s(option.value) +
                                              "\n            "
                                          ),
                                          _c("input", {
                                            attrs: {
                                              type: "range",
                                              min: option.min,
                                              max: option.max,
                                              step: option.step,
                                              name: "input"
                                            },
                                            domProps: { value: option.value },
                                            on: {
                                              change: function($event) {
                                                _vm.state
                                                  .getContext()
                                                  .setOption(
                                                    option.property,
                                                    $event.target.value
                                                  );
                                              }
                                            }
                                          })
                                        ]
                                      )
                                    : _vm._e(),
                                  _vm._v(" "),
                                  option.type == "boolean"
                                    ? _c(
                                        "label",
                                        {
                                          key: "option-" + option.description,
                                          class:
                                            "vue-paint-label vue-paint-label-" +
                                            option.description
                                        },
                                        [
                                          _vm._v(
                                            _vm._s(
                                              _vm.strings[option.description] ||
                                                option.description
                                            ) + "\n            "
                                          ),
                                          _c("input", {
                                            attrs: {
                                              type: "checkbox",
                                              name: "input"
                                            },
                                            domProps: { checked: option.value },
                                            on: {
                                              change: function($event) {
                                                _vm.state
                                                  .getContext()
                                                  .setOption(
                                                    option.property,
                                                    $event.target.checked
                                                  );
                                              }
                                            }
                                          })
                                        ]
                                      )
                                    : _vm._e(),
                                  _vm._v(" "),
                                  option.type == "text"
                                    ? _c(
                                        "label",
                                        {
                                          key: "option-" + option.property,
                                          class:
                                            "vue-paint-label vue-paint-label-" +
                                            option.description
                                        },
                                        [
                                          _vm._v(
                                            _vm._s(
                                              _vm.strings[option.description] ||
                                                option.description
                                            ) + "\n            "
                                          ),
                                          _c("input", {
                                            directives: [
                                              {
                                                name: "model",
                                                rawName: "v-model",
                                                value: option.value,
                                                expression: "option.value"
                                              }
                                            ],
                                            attrs: {
                                              name: "input",
                                              type: "text"
                                            },
                                            domProps: { value: option.value },
                                            on: {
                                              keyup: function($event) {
                                                _vm.state
                                                  .getContext()
                                                  .setOption(
                                                    option.property,
                                                    $event.target.value
                                                  );
                                              },
                                              focus: _vm.disableKeys,
                                              blur: _vm.enableKeys,
                                              input: function($event) {
                                                if ($event.target.composing) {
                                                  return
                                                }
                                                _vm.$set(
                                                  option,
                                                  "value",
                                                  $event.target.value
                                                );
                                              }
                                            }
                                          })
                                        ]
                                      )
                                    : _vm._e()
                                ]
                              )
                            : _vm._e()
                        ]
                      })
                    ],
                    2
                  )
                : _vm._e()
            ]
          )
        : _vm._e()
    ],
    2
  )
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  const __vue_inject_styles__ = undefined;
  /* scoped */
  const __vue_scope_id__ = undefined;
  /* module identifier */
  const __vue_module_identifier__ = undefined;
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* style inject */
  
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__ = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    undefined,
    undefined,
    undefined
  );

// Import vue painter

// Declare install function executed by Vue.use()
function install(Vue) {
	if (install.installed) return;
	install.installed = true;
	Vue.component('VuePainter', __vue_component__);
}

// Create module definition for Vue.use()
const plugin = {
	install,
};

// Auto-install when vue is found (eg. in browser via <script> tag)
let GlobalVue = null;
if (typeof window !== 'undefined') {
	GlobalVue = window.Vue;
} else if (typeof global !== 'undefined') {
	GlobalVue = global.Vue;
}
if (GlobalVue) {
	GlobalVue.use(plugin);
}

export default __vue_component__;
export { install };
