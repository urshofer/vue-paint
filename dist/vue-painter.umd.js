(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('paper'), require('uuid'), require('wordwrapjs'), require('js-base64')) :
  typeof define === 'function' && define.amd ? define(['exports', 'paper', 'uuid', 'wordwrapjs', 'js-base64'], factory) :
  (global = global || self, factory(global.VuePainter = {}, global.paper, global.uuid, global.wordwrap, global.jsBase64));
}(this, (function (exports, paper, uuid, wordwrap, jsBase64) { 'use strict';

  paper = paper && Object.prototype.hasOwnProperty.call(paper, 'default') ? paper['default'] : paper;
  wordwrap = wordwrap && Object.prototype.hasOwnProperty.call(wordwrap, 'default') ? wordwrap['default'] : wordwrap;

  /**
   *  Tool Class
   *  - Basic functionalities
   *  - Master for all tools
   */

  class Tool {
    constructor (paper, startPoint, state, primitive, options, toolname, fixedposition) {
      options = options || [];
      this.toolname = toolname;
      this.id = uuid.v4();
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
        this.draw();
      }
    }

    round(point) {
      point.x = Math.round(point.x / this.state.gridsize.x) * this.state.gridsize.x;
      point.y = Math.round(point.y / this.state.gridsize.y) * this.state.gridsize.y;
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
      if (this.state.selected.find((e)=>{}) == undefined) {
        this.state.selected.push(this); 
      }
      return true;
    }

    toggleSelect() {

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
      /*this.primitive.onClick = (event) => {
        return this.onClick(event)
      }*/
      this.primitive.onMouseDown = (event) => {
        this.onMouseDown(event);
      }; 
      this.primitive.onMouseUp = (event) => {
        return this.onMouseUp(event)
      };        
      //this.primitive.onMouseDrag = (event) => {
      //  return this.onMouseDrag(event)
      //}     
    }

    onMouseDown (event) {
      console.log('init', event);
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

    onMouseUp (event) {
      console.log('mouseup', this, event);
      if (this.painted === true && !this.dragging && this.alreadySelected) {
        console.log('click', event);
       try {
          this.toggleSelect();
        }
        catch (err) {
          console.warn(err, 'Click: no primitive available');
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
      this.draw (point);
    }

    onFinishPaint () {
      this.originalPos = this.primitive.position;
      this.painted = true;
      this.state.addStack(this);
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
            console.log('rot');
            this.primitive.rotation += delta.x;
            break;
          case 'Resize':
            if (typeof this.resize == "function") {
              this.resize(delta);
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
      console.log('drag finish', point);
      this.setDragging(false);

      let delta = {
        x: point.x - this.draggingLastPoint.x,
        y: point.y - this.draggingLastPoint.y
      };    
      try {
        switch (this.state.getTransformation()) {
          case 'Rotate':
            this.primitive.rotation = Math.round(this.primitive.rotation / this.state.anglestep) * this.state.anglestep;
            this.state.setTransformation('Move');
            break;
          case 'Resize':
            if (typeof this.endResize == "function") {
              this.endResize();
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
            this.primitive.bounds.topLeft = this.round(this.primitive.bounds.topLeft);
            this.originalPos = this.primitive.position;
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
        this.primitive.remove();
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
      return new this.paper.Shape.Rectangle(this.startPoint, _toPoint);
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
      var rectangle = new this.paper.Rectangle(this.startPoint, _toPoint);
      return new this.paper.Shape.Ellipse(rectangle);
    }
  }

  class Line extends Tool {
    constructor (paper, startPoint, state, primitive, defaults) {
      defaults = defaults || {};
      defaults.fixed = defaults.fixed || false;
      defaults.toolName = defaults.toolName || 'Line';
      
      let options = [];
      super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);
    }


    createPrimitive(point) {
      let _toPoint  = this.round(point);
      return new this.paper.Path.Line(this.startPoint, _toPoint);
    }
  }

  class Star extends Tool {
    constructor (paper, startPoint, state, primitive, defaults) {
      defaults = defaults || {};
      defaults.fixed = defaults.fixed || false;
      defaults.toolName = defaults.toolName || 'Star';

      let options = [];
      super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);
    }


    createPrimitive(point) {
      let _toPoint  = this.round(point);
      if (this.paper.Key.isDown('shift')) {
        _toPoint.y = this.startPoint.y + _toPoint.x - this.startPoint.x;
      }
      return new this.paper.Path.Star(this.startPoint, _toPoint.x - this.startPoint.x > 50 ? Math.round((_toPoint.x - this.startPoint.x) / 10) : 5, _toPoint.y - this.startPoint.y > this.state.gridsize.y * 2 ? (_toPoint.y - this.startPoint.y) - this.state.gridsize.x * 2 : 0, _toPoint.y - this.startPoint.y > 0 ? _toPoint.y - this.startPoint.y : 0);
    }


    transformation(mode, point, delta) {
      switch (mode) {
        case 'Resize':
          this.primitive.bounds.size = this.primitive.bounds.size.add(new this.paper.Size(delta.x, this.paper.Key.isDown('shift') ? delta.x : delta.y));
          break;
      }
    }

    endtransformation(mode) {
      switch (mode) {
        case 'Resize':
          this.primitive.bounds.width = Math.round(this.primitive.bounds.width / (this.state.gridsize.x * 2)) * (this.state.gridsize.x * 2);
          this.primitive.bounds.height = Math.round(this.primitive.bounds.height / (this.state.gridsize.y * 2)) * (this.state.gridsize.y * 2);
          this.state.setTransformation('Move');
          break;
      }
    }
  }

  class Raster extends Tool {
    constructor (paper, startPoint, state, primitive, defaults) {
      defaults = defaults || {};
      defaults.source = defaults.source || "/vue-paint/img/default.png";
      defaults.fixed = defaults.fixed || false;
      defaults.toolName = defaults.toolName || 'Raster';


      let options = [
        {
            property: "source",
            description: "Clipart",
            type    : "clipart",
            value   : defaults.source,
            redraw  : true,
            toggled : true
        }
      ];
      super(paper, startPoint, state, primitive, options, defaults.toolName, defaults.fixed);
    }

    /*
     * resize: called on resize, overriding standard procedure
     * @param Point delta, difference to last call
     */

    resize(delta) {
      if (this.paper.Key.isDown('shift')) {
        this.primitive.scale(
          1 / this.primitive.bounds.width * (this.primitive.bounds.width + delta.x),
          {
            x: this.primitive.bounds.left,
            y: this.primitive.bounds.top
          }
        );
      }
      else {
        this.primitive.scale(
          1 / this.primitive.bounds.width * (this.primitive.bounds.width + delta.x),
          1 / this.primitive.bounds.height * (this.primitive.bounds.height + delta.y),
          {
            x: this.primitive.bounds.left,
            y: this.primitive.bounds.top
          }
        );
      }
    }

    /*
     * endResize: called after resize (mouseup), overriding standard procedure
     */

    endResize() {
      this.primitive.scale(
        1 / this.primitive.bounds.width * (Math.round(this.primitive.bounds.width / this.state.gridsize.x) * this.state.gridsize.x),
        1 / this.primitive.bounds.height * (Math.round(this.primitive.bounds.height / this.state.gridsize.y) * this.state.gridsize.y),
        {
          x: this.primitive.bounds.left,
          y: this.primitive.bounds.top
        }
      );
      //let _b = this.primitive.bounds.clone();
      //this.primitive.scaling = [1,1]
      //this.primitive.fitBounds(_b);
  }


    createPrimitive() {
      let _toPoint  = this.round(this.startPoint);
      let _r = new this.paper.Raster({crossOrigin: 'anonymous', position: _toPoint, smoothing: 'high'});
      _r.source = this.getOption('source');
      let _initialize = () => {
        if (this.initialized !== true) {
          this.initialized = true;
          this.toggleSelect();
          this.selectBorderColor('red');
          console.log('init toggle');
        }
      };
      _r.onLoad = () => {
        console.log(this.aspect);
        _initialize();
      };
      _r.onError = () => {
        _initialize();
      };
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
    
    
    

    createPrimitive() {
      console.log(this);
      let _t = new this.paper.PointText(this.round(this.startPoint));
      return _t;
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
      }
      catch (err) {
        console.warn(`${err} Primitive not defined`);
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
          // Register Transformation Modes
          this.allowedTransformations = ['Move', 'Resize', 'Rotate'];
          this.transformation = 'Move';

          // Tools lookup table
          let _toolClasses = {
              'Square': Square,
              'Circle': Circle,
              'Line'  : Line,
              'Star'  : Star,
              'Raster': Raster,
              'Text'  : Text,
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
              'Raster': {
                  class: 'Raster'
              },
              'Text': {
                  class: 'Text'
              }
          };
          // Convert String to Classes
          // addOnMouseDown true for Text and Raster Object. Others need to be dragged.
          for (let _t in this.tools) if (Object.hasOwnProperty.call(this.tools, _t)) {
              this.tools[_t].addOnMouseDown = this.tools[_t].class == 'Text' || this.tools[_t].class == 'Raster';
              this.tools[_t].class = _toolClasses[this.tools[_t].class];
              this.tools[_t].defaults = this.tools[_t].defaults || {};
              this.tools[_t].defaults.toolName = _t;
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
          let _json = [];

          this.stack.sort((a,b) => a.primitive.index > b.primitive.index);
          
          this.stack.forEach(e => {
              _json.push({
                  'prototype': e.toolname,
                  'data'     : jsBase64.Base64.encode(e.primitive.exportJSON({asString: true}))
              });
          });
          return JSON.stringify(_json);
      }

      importStack(json) {
          if (json) {
              json.forEach(o => {
                let _primitive = this.paper.project.activeLayer.importJSON(jsBase64.Base64.decode(o.data));
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

      hasClipboard() {
          return this.copy.length > 0;
      }

      unselectAll() {
          if (this.selected.length > 0) {
              this.selected.forEach(s => {
                  s.unselect();
              });
              this.selected = [];
              this.context = false;
          }
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

      getContext() {
          if (this.context && this.selected.length == 1) {
              return this.context;
          }
          else return false;
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
              this.transformation = t;
          }
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

  var script = {
    name: 'VuePainter',
    props: {
      data: String,
      clipart: Array,
      fonts: Array,
      configuration: Object,
      csscolors: Array,
      translations: Object,
      gridX: Number,
      gridY: Number,
      angleStep: Number
    },
    data () {
      let _j = false;
      if (this.data) {
        try {
          _j = JSON.parse(this.data);
        } catch(err) {
          console.warn(err);
          _j = false;
        }
      }

      let style = document.createElement('style');
      document.head.appendChild(style);

      return {
        // Data
        json: _j,

        // Image Clipart
        clips: this.prepareClipart(this.clipart),

        // Paper & Paper.Tool Stuff
        paper: null,
        tool: null,

        // State Class
        state: new State({
          'gridsize'  : {x: this.gridX || 25, y: this.gridY || 25}, 
          'anglestep' : this.angleStep || 5, 
          'fonts'     : this.fonts,
          'tools'     : this.configuration
        }),

        // Colors
        colors: this.csscolors || ['black', 'green', 'red', 'blue', 'transparent'],

        // String Translations
        strings: this.translations || {
          'tools': 'Tools',
          'file': 'File',
          'preset': 'Preset',
          'selection': 'Selection',
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
        sheet: style.sheet

      }
    },
    mounted() {
      this.$refs.grid.style.setProperty('--backgroundX', `${this.state.gridsize.x}px 100%`);
      this.$refs.grid.style.setProperty('--backgroundY', `100% ${this.state.gridsize.y}px`);
      let _rotation  = Math.atan(this.state.gridsize.y / this.state.gridsize.x);
      this.$refs.grid2.style.setProperty('--backgroundY', `100% ${this.state.gridsize.x * Math.sin(_rotation)}px`);
      this.$refs.grid2.style.setProperty('--background', `${(this.state.gridsize.x * Math.sin(_rotation))}px`);
      this.$refs.grid2.style.setProperty('--rotation', `${-1 * _rotation / Math.PI * 180}deg`);
      

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
    methods: {
      initialize () {
        console.log('initializing vue-paint…');
        this.tools = this.state.getTools();
        this.paper = paper.setup(this.$refs.painter);
        this.paper.settings.hitTolerance = 10;
        this.tool = new paper.Tool();
        this.state.paper = this.paper;
        let _painting;

        this.tool.onMouseDown = (event) => {
          this.enableKeys();
          this.state.onMouseDown();
          if (event.item == null) {
            this.state.unselectAll(); 
            return false;
          }
        };

        this.tool.onMouseDrag = (event) => {
          if (!this.state.hasSelection()) {
            if (_painting) {
              _painting.onPaint(event.point);
            }
            else {
              if (this.state.isActive()) {
                _painting = new this.state.active(this.paper, event.point, this.state, null, this.state.getActiveDefaults());
              }
            }
          }
          else {
            this.state.onDrag(event.point);
          }
        };
        
        this.tool.onMouseUp = (event) => {
          this.state.addOnMouseDown(this.state.getActiveName());
          if (!_painting && !this.state.hasSelection() && this.state.isActive() && this.state.addOnMouseDown(this.state.getActiveName())) {
            _painting = new this.state.active(this.paper, event.point, this.state, null, this.state.getActiveDefaults());
            _painting.onPaint(event.point);        
            _painting.onFinishPaint(event.point);
            _painting = null;        
            this.state.setActive(false);
          }
          else {
            if (_painting) {
              _painting.onFinishPaint(event.point);
              _painting = null;  
              this.state.setActive(false);      
            }
            if (this.state.dragged) {
              this.state.onFinishDrag(event.point);
            }
          }
          return false;
        }; 
        
        this.tool.onKeyDown = (event) => {
          console.log(event);
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
          /*if (this.json) {
            this.json.forEach(o => {
              let _primitive = this.paper.project.activeLayer.importJSON(Base64.decode(o.data))
              this.state.setActive(o.prototype)
              new this.state.active(this.paper, false, this.state, _primitive, this.state.getActiveDefaults());
            })
            this.state.setActive('')
          }*/
        });

      },
      saveJSON() {
        this.$emit('save', this.state.exportStack());
      },
      exportSVG() {
        let svg = this.paper.project.exportSVG({
          asString: true,
          onExport: (item, node) => {
              if (item._class === 'PointText') {
                  node.textContent = null;
                  for (let i = 0; i < item._lines.length; i++) {
                      let tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                      tspan.textContent = item._lines[i] ? item._lines[i] : ' ';
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

        svg = svg.replace(/<svg(.*?)>/, (e) => {
          return (`${e}
        <defs>
          <style>
            ${_str}
          </style>
        </defs>`)
        });

        this.$emit('export', svg);
      },
      disableKeys() {
        console.log('disabling keys');
        this.keyHandlingActive = false;
      },
      enableKeys() {
        console.log('enabling keys');
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
      { staticClass: "vue-paint" },
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
          { staticClass: "vue-paint-wrapper", attrs: { id: "wrapper" } },
          [
            _vm._l(_vm.state.getOptionByType("textarea", true), function(option) {
              return _c(
                "div",
                {
                  key: "" + option.property,
                  staticClass: "vue-paint-editor",
                  style: {
                    left:
                      _vm.state.getContext().primitive.position.x -
                      _vm.state.getContext().primitive.bounds.width / 2 +
                      "px",
                    top:
                      _vm.state.getContext().primitive.position.y -
                      _vm.state.getContext().primitive.bounds.height / 2 +
                      "px"
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
                      "font-size":
                        _vm.state.getContext().primitive.fontSize + "px",
                      "line-height":
                        _vm.state.getContext().primitive.leading + "px"
                    },
                    attrs: {
                      rows: option.rows,
                      cols: Math.round(option.cols * 1.75),
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
            _c("div", {
              ref: "grid",
              staticClass: "vue-paint-grid",
              attrs: { id: "grid" }
            }),
            _vm._v(" "),
            _c("div", {
              ref: "grid2",
              staticClass: "vue-paint-grid-rotated",
              attrs: { id: "grid" }
            }),
            _vm._v(" "),
            _c("canvas", {
              ref: "painter",
              staticClass: "vue-paint-canvas",
              attrs: { id: "painter", resize: "" }
            })
          ],
          2
        ),
        _vm._v(" "),
        _c("div", { staticClass: "vue-paint-menu", attrs: { id: "menu" } }, [
          _c(
            "div",
            [
              _c("div", { staticClass: "vue-paint-menu-divider" }, [
                _vm._v(_vm._s(_vm.strings.tools))
              ]),
              _vm._v(" "),
              _vm._l(_vm.tools, function(t) {
                return _c(
                  "a",
                  {
                    key: "tool-" + t,
                    class:
                      "vue-paint-button vue-paint-button-" +
                      t +
                      (_vm.state.getActiveName() == t ? " active" : ""),
                    on: {
                      click: function($event) {
                        _vm.state.setActive(
                          _vm.state.getActiveName() == t ? false : t
                        );
                      }
                    }
                  },
                  [_vm._v(_vm._s(t))]
                )
              })
            ],
            2
          ),
          _vm._v(" "),
          _c("div", [
            _c("div", { staticClass: "vue-paint-menu-divider" }, [
              _vm._v(_vm._s(_vm.strings.file))
            ]),
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
            _c("div", { staticClass: "vue-paint-menu-divider" }, [
              _vm._v(_vm._s(_vm.strings.preset))
            ]),
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
                _vm._l(_vm.colors, function(c) {
                  return [
                    _c("a", {
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
                  ]
                })
              ],
              2
            ),
            _vm._v(" "),
            _c(
              "label",
              { staticClass: "vue-paint-label vue-paint-label-strokecolor" },
              [
                _vm._v(_vm._s(_vm.strings.strokecolor) + "\n        "),
                _vm._l(_vm.colors, function(c) {
                  return [
                    _c("a", {
                      key: "bgcolor-" + c,
                      staticClass: "color",
                      class: { "color-active": _vm.state.getStrokeColor() == c },
                      style: { "background-color": c },
                      on: {
                        click: function($event) {
                          return _vm.state.setStrokeColor(c)
                        }
                      }
                    })
                  ]
                })
              ],
              2
            )
          ])
        ]),
        _vm._v(" "),
        _c(
          "div",
          { staticClass: "vue-paint-context", attrs: { id: "context" } },
          [
            _c("transition", { attrs: { name: "flipin" } }, [
              _vm.state.hasSelection()
                ? _c(
                    "div",
                    [
                      _c("div", { staticClass: "vue-paint-menu-divider" }, [
                        _vm._v(_vm._s(_vm.strings.selection))
                      ]),
                      _vm._v(" "),
                      _c(
                        "a",
                        {
                          staticClass: "vue-paint-button vue-paint-button-delete",
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
                          staticClass: "vue-paint-button vue-paint-button-copy",
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
                        return _c(
                          "a",
                          {
                            key: "transformation-" + t[0],
                            class:
                              "vue-paint-button vue-paint-button-" +
                              t[0] +
                              (_vm.state.getTransformation() == t[0]
                                ? " active"
                                : ""),
                            on: {
                              click: function($event) {
                                return _vm.state.setTransformation(t[0])
                              }
                            }
                          },
                          [
                            _vm._v(_vm._s(_vm.translations[t[0]]) + " "),
                            _c("span", [_vm._v(_vm._s(t[1]))])
                          ]
                        )
                      }),
                      _vm._v(" "),
                      _c(
                        "a",
                        {
                          staticClass:
                            "vue-paint-button vue-paint-button-background",
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
                            "vue-paint-button vue-paint-button-foreground",
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
                      _c("div", { staticClass: "vue-paint-arrowbuttons" }, [
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
                    ],
                    2
                  )
                : _vm._e()
            ]),
            _vm._v(" "),
            _c("transition", { attrs: { name: "flipin" } }, [
              _vm.state.hasClipboard()
                ? _c("div", [
                    _c("div", { staticClass: "vue-paint-menu-divider" }, [
                      _vm._v(_vm._s(_vm.strings.clipboard))
                    ]),
                    _vm._v(" "),
                    _c(
                      "a",
                      {
                        staticClass: "vue-paint-button vue-paint-button-paste",
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
                        staticClass: "vue-paint-button vue-paint-button-clear",
                        on: {
                          click: function($event) {
                            return _vm.state.clearSelection()
                          }
                        }
                      },
                      [_vm._v(_vm._s(_vm.strings.clear))]
                    )
                  ])
                : _vm._e()
            ]),
            _vm._v(" "),
            _c("transition", { attrs: { name: "flipin" } }, [
              _vm.state.getContext()
                ? _c(
                    "div",
                    [
                      _c("div", { staticClass: "vue-paint-menu-divider" }, [
                        _vm._v(_vm._s(_vm.strings.parameter))
                      ]),
                      _vm._v(" "),
                      _vm._l(_vm.state.getContext().getOptions(), function(
                        option
                      ) {
                        return _c(
                          "form",
                          {
                            key: "form-" + option.description,
                            attrs: { id: "form-" + option.property }
                          },
                          [
                            option.type == "textarea" || option.type == "clipart"
                              ? _c(
                                  "a",
                                  {
                                    key: option.parameter,
                                    class:
                                      "vue-paint-button vue-paint-button-" +
                                      option.description +
                                      " " +
                                      (option.toggled ? " active" : ""),
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
                                          _vm.strings[option.description] ||
                                            option.description
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
                            option.type == "int"
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
                                      attrs: { name: "input", type: "text" },
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
                      })
                    ],
                    2
                  )
                : _vm._e()
            ])
          ],
          1
        )
      ],
      1
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

  exports.default = __vue_component__;
  exports.install = install;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
