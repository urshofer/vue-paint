import Square from './tools/square.js'
import Circle from './tools/circle.js'
import Line   from './tools/line.js'
import Polyline   from './tools/polyline.js'
import Star   from './tools/star.js'
import Polygon from './tools/polygon.js'
import Raster from './tools/raster.js'
import Text   from './tools/text.js'
import Grid   from './tools/grid.js'
import Arc  from './tools/arc.js'
import { Base64 } from 'js-base64'

export default class State {
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
        // Clipboard
        console.log(options.root)
        options.root._vp_clipboard = options.root._vp_clipboard || [];        
        this.copy   = options.root._vp_clipboard;
        this.stack  = [];
        this.clips  = [];
        this.paper  = null;
        this.painting = true;
        this.magnetic = true;
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
        }

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
        }
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

    setGrid(x, y) {
        this.gridsize.x = x
        this.gridsize.y = y
    }

    setMagnetic(value) {
        this.magnetic = value
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

    isFixed(_tool) {
        return (this.tools[_tool].defaults.fixed && this.tools[_tool].defaults.fixed.x !== undefined && this.tools[_tool].defaults.fixed.y != undefined ? true : false)
    }

    exists(_element) {
        return (this.stack.filter(_e => _e.toolname === _element).length > 0)
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
        this.unselectAll();
        let _json = [];

        this.stack.sort((a,b) => a.primitive.index > b.primitive.index)
        
        this.stack.forEach(e => {
            _json.push({
                'prototype': e.toolname,
                'data'     : Base64.encode(e.primitive.exportJSON({asString: true}))
            })
        })
        return JSON.stringify(_json);
    }

    importStack(json) {
        if (json) {
            json.forEach(o => {
              let _primitive = this.paper.project.activeLayer.importJSON(Base64.decode(o.data))
              this.setActive(o.prototype)
              new this.active(this.paper, false, this, _primitive, this.getActiveDefaults());
            })
            this.setActive('')
        }
    }

    onMouseDown() {
        this.dragged = false;
    }

    onDrag(point) {
        this.dragged = true;
        this.selected.forEach(s => {s.onDrag(point)})
    }
    
    onFinishDrag(point) {
        this.selected.forEach(s => {s.onFinishDrag(point)})
        this.dragged = false
    }

    hasSelection() {
        return this.selected.length > 0;
    }

    hasSelectionBoundingBox() {
        let _r = false
        let _t = false
        if (this.selected.length > 0) {
            this.selected.forEach(s => {
                if (s.primitive.bounds.top < _t || _t === false) {
                    _t = s.primitive.bounds.top
                }
                if (s.primitive.bounds.right > _r || _r === false) {
                    _r = s.primitive.bounds.right
                }
            })
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
        let _selectionLength = this.selected.length
        if (_selectionLength > 0) {
            this.selected.forEach(s => {
                s.unselect();
            })
            this.selected = [];
            this.context = false;
        }
        return _selectionLength
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
                try {
                    let _clone = new this.tools[s.toolname].class(s.paper, s.startPoint, this, s.primitive.clone(), this.tools[s.toolname].defaults);
                    if (_clone) {
                        _clone._pos = s._pos
                        _clone.move('right');
                        _clone.move('down');
                        _clone.shift('front');
                        _clone.select();
                    }
                } catch (err) {
                    console.warn(err)
                }
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
            this.transformation == t
                ? this.transformation = false
                : this.transformation = t
        }
    }

    disableTransformation() {
        this.transformation = false
    }

    applyStyle() {
        if (this.selected.length > 0) {
            this.selected.forEach(s => {
                s.applyStyle();
            })
        }
    }
}