import Square from './tools/square.js'
import Circle from './tools/circle.js'
import Line   from './tools/line.js'
import Star   from './tools/star.js'

export default class State {
    constructor (options) {
        options = options || {};
        this.active     = null;
        this.actveByName = "";
        this.strokeWidth  = 2;
        this.strokeColor  = 'red';
        this.fillColor  = 'black';
        this.alpha      = 1;
        this.gridsize   = options.gridsize || 25;
        this.anglestep  = options.anglestep || 30;
        this.selected   = [];
        this.initPoint = null;
        this.context = false;
        this.copy   = [];
        this.stack  = [];

        // Register Transformation Modes
        this.allowedTransformations = ['Move', 'Resize', 'Rotate'];
        this.transformation = 'Move';

        // Register Tools
        this.tools = {
            'Square': Square,
            'Circle': Circle,
            'Line':   Line,
            'Star':   Star
        }
    }

    addStack(e) {
        if (this.stack.find((_e)=>{e==_e}) == undefined) {
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
        this.stack.forEach(e => {
            _json.push({
                'prototype': e.constructor.name,
                'data'     : e.primitive.exportJSON({asString: false})
            })
        })
        return JSON.stringify(_json);
    }

    onMouseDown(point) {
        this.initPoint = point;
        this.dragged = false;
  
    }

    onDrag(point) {
        this.dragged = true;
        this.selected.forEach(s => {s.onDrag(point, this.initPoint)})
    }
    
    onFinishDrag(point) {
        this.selected.forEach(s => {s.onFinishDrag(point, this.initPoint)})
        this.dragged = false
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
            })
            this.selected = [];
            this.context = false;
        }
    }

    deleteSelection() {
        if (this.selected.length > 0) {
            this.selected.forEach(s => {
                s.delete();
            })
            this.selected = [];
        }
    }

    moveSelection(direction) {
        if (this.selected.length > 0) {
            this.selected.forEach(s => {
                s.move(direction);
            })
        }
    }

    shiftSelection(direction) {
        if (this.selected.length > 0) {
            this.selected.forEach(s => {
                s.shift(direction);
            })
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
                console.log(this);
                let _clone = new this.tools[s.constructor.name](s.paper, s.startPoint, this, s.primitive.clone());
                _clone.move('right');
                _clone.move('down');
                _clone.shift('front');
                _clone.select();
            });
            this.copySelection();
        }
        
    }

    setActive(toolname) {
        if (this.tools[toolname]) {
            this.active = this.tools[toolname];
            this.actveByName = toolname;
        }
        else {
            this.active = null
            this.actveByName = "";
        }
    }

    isActive() {
        return this.active ? true : false;
    }

    getActiveName() {
        return this.actveByName;
    }

    getContext() {
        if (this.context && this.selected.length == 1) {
            return this.context;
        }
        else return false;
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
        this.fillColor = color
        this.applyStyle()
    }

    setAlpha(alpha) {
        this.alpha = alpha
        this.applyStyle()
    }

    setStrokeColor(color) {
        this.strokeColor = color
        this.applyStyle()
    }

    setStrokeWidth(width) {
        this.strokeWidth = width
        this.applyStyle()
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
            })
        }
    }
}