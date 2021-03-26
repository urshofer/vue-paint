import Square from './tools/square.js'
import Circle from './tools/circle.js'
import Line   from './tools/line.js'
import Star   from './tools/star.js'

export default class State {
    constructor () {
        this.active     = null;
        this.actveByName = "";
        this.strokeWidth  = 2;
        this.strokeColor  = 'red';
        this.fillColor  = 'black';
        this.alpha      = 1;
        this.gridsize   = 25;
        this.anglestep = 30;
        this.selected   = [];

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

    deleteSelection() {
        if (this.selected.length > 0) {
            this.selected.forEach(s => {
                s.delete();
            })
            this.selected = [];
        }
    }

    moveSelection(direction, clone) {
        if (this.selected.length > 0) {
            this.selected.forEach(s => {
                if (clone) {
                    let _clone = new this.tools[s.constructor.name](s.paper, false, s.state)
                    _clone.startPoint = s.startPoint;
                }
                s.move(direction);
            })
        }
    }


    setActive(toolname) {
        if (this.tools[toolname] && this.active != this.tools[toolname]) {
            this.active = this.tools[toolname];
            this.actveByName = toolname;
        }
        else {
            this.active = null
            this.actveByName = "";
        }
    }

    getActive() {
        return this.active ? true : false;
    }

    getActiveName() {
        return this.actveByName;
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