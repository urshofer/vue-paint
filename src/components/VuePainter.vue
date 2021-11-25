<template>
    <div class="vue-paint" :style="cssVars">
      <transition name="flipin">
        <div 
          class="vue-paint-clipart-wrapper"
          v-for="option in state.getOptionByType('clipart', true)"
          :key="`${option.property}`"
          @click="toggleOption(option);"
        >
          <div class="vue-paint-clipart-container">
            <div class="vue-paint-clipart-container-groups">
              <div class="vue-paint-clipart-container-group" v-bind:key="`g-${group}`" v-for="group in clips.groups">
                <a href="#" @click.stop="clips.selected = group" v-html="group"/>
              </div>
            </div>
            <div class="vue-paint-clipart-container-items">
              <div class="vue-paint-clipart-container-item" v-bind:key="`g-${clip.thumb}`" v-for="clip in clips.clips[clips.selected]">
                <a href="#" @click.stop="state.getContext().setOption(option.property, clip.source); toggleOption(option);">
                  <img :src="clip.thumb"/>
                </a>
              </div>
            </div>
          </div>
        </div> 
      </transition>
      <div id="wrapper" class="vue-paint-wrapper" ref="wrapper">
        <div id="fitpopup"
          class="vue-paint-editor"
          v-for="option in state.getOptionByType('textarea', true)"
          :key="`${option.property}`"
          :style="{
          'left': `${state.getContext().primitive.position.x * scaling / 100}px`,
          'top': `${state.getContext().primitive.position.y * scaling / 100}px`,
          'transform': `scale(${scaling / 100}) rotate(${state.getContext().primitive.rotation}deg)`,
          'transform-origin': `0px 0px`
          }"
        >
          <textarea 
            @keyup="state.getContext().setOption(option.property, $event.target.value)" 
            @focus="disableKeys" 
            @blur="enableKeys" 
            :rows="option.rows" 
            :cols="option.cols" 
            v-model="option.value"
            name="input"
            wrap="hard"
            :ref="option.property"
            :style="{
              'width': `${option.cols + 1}ch`, 
              'font-size': `${state.getContext().primitive.fontSize}px`, 
              'line-height': `${state.getContext().primitive.leading}px`,
              'font-family': `${state.getContext().primitive.fontFamily}`,
              'transform': `translateX(-${state.getContext().primitive.internalBounds.width / 2}px) translateY(-${state.getContext().primitive.internalBounds.height / 2}px)`,
              'text-align': state.getContext().primitive.justification || 'left'
            }"
          ></textarea>
        </div>
        <canvas ref="painter" id="painter" :class="`vue-paint-canvas vue-paint-canvas-${state.getActiveClassName()} vue-paint-canvas-${state.getActiveName().replace(/ /g, '_')}`"></canvas>
      </div>
      
      <div v-if="state.getContext() && state.getContext().showHint()" class="vue-paint-hint">
        <div>
          {{strings[state.getContext().showHint()] || state.getContext().showHint()}}
        </div>
      </div>
      <template v-else>
        <div v-if="state.getActiveName() !== '' && strings[`hint:${state.getClassName(state.getActiveName())}`]" class="vue-paint-hint">
          <div>
            {{strings[`hint:${state.getClassName(state.getActiveName())}`]}}
          </div>
        </div>      
      </template>

      <vue-draggable-resizable :w="'auto'" :h="'auto'" drag-handle=".drag" id="menu" class="vue-paint-menu" :z="10">
        <div class="drag"/>
        <div>
          <div class="vue-paint-menu-divider" @click="$event.target.parentElement.classList.toggle('folded')">{{strings.tools}}</div>
          <a :class="`vue-paint-button vue-paint-button-tooltip vue-paint-button-selection${state.getActiveName()===''?' vue-paint-button-active':''}`" @click="state.setActive(false)"><span>{{strings.selection}}</span></a>
          <a :class="`vue-paint-button vue-paint-button-tooltip vue-paint-button-${state.getClassName(t)} vue-paint-button-${t.replace(/ /g, '_')}${state.getActiveName()==t?' vue-paint-button-active':''}`" v-for="t in tools" v-bind:key="`tool-${t}`" @click="state.setActive(state.getActiveName()==t ? false : t)"><span>{{t}}</span></a>
        </div>
        <div>
          <div class="vue-paint-menu-divider" @click="$event.target.parentElement.classList.toggle('folded')">{{strings.file}}</div>
          <a class="vue-paint-button vue-paint-button-save" @click="saveJSON()">{{strings.save}}</a>
          <a class="vue-paint-button vue-paint-button-export" @click="exportSVG()">{{strings.export}}</a>
        </div>
        <div>
          <div class="vue-paint-menu-divider" @click="$event.target.parentElement.classList.toggle('folded')">{{strings.preset}}</div>
          <label class="vue-paint-label vue-paint-label-stroke">{{strings.stroke}} {{state.getStrokeWidth()}} Px
            <input @change="state.setStrokeWidth($event.target.value)" type="range" min="0" max="10" :value="state.getStrokeWidth()">
          </label>
          <label class="vue-paint-label vue-paint-label-alpha">{{strings.alpha}} {{state.getAlpha()*100}}%
            <input @change="state.setAlpha($event.target.value / 4)" type="range" min="0" max="4" :value="state.getAlpha() * 4">
          </label>
          <label class="vue-paint-label vue-paint-label-fillcolor">{{strings.fillcolor}}
            <div class="vue-paint-colorlist">
              <a v-for="c in colors" v-bind:key="`bgcolor-${c}`" class="color" :style="{'background-color': c}" :class="{'color-active': state.getFillColor()==c}" @click="state.setFillColor(c)"></a>
            </div>
          </label>
          <label class="vue-paint-label vue-paint-label-strokecolor">{{strings.strokecolor}}
            <div class="vue-paint-colorlist">
              <a v-for="c in colors" v-bind:key="`bgcolor-${c}`" class="color" :style="{'background-color': c}" :class="{'color-active': state.getStrokeColor()==c}" @click="state.setStrokeColor(c)"></a>
            </div>
          </label>
          <label class="vue-paint-label vue-paint-label-stroke">{{strings.zoom}} {{scaling}}%
            <input @change="setScaling($event.target.value)" type="range" min="25" step="25" max="200" :value="scaling">
          </label>          
        </div>
      </vue-draggable-resizable>
      <vue-draggable-resizable @dragging="onContextDrag" v-if="state.hasSelection() || state.hasClipboard() || state.getContext()" :x="getContextX" :y="getContextY"  :w="'auto'" :h="'auto'" drag-handle=".drag" id="context" class="vue-paint-context" ref="context" :z="10">
        <div class="drag"/>
        <div v-if="state.hasSelection()">
          <div class="vue-paint-menu-divider" @click="$event.target.parentElement.classList.toggle('folded')">{{strings.functions}}</div>
          <a class="vue-paint-button vue-paint-button-shorcut vue-paint-button-delete" @click="state.deleteSelection()">{{strings.delete}}  <span>🔙</span></a>
          <a class="vue-paint-button vue-paint-button-shorcut vue-paint-button-copy" @click="state.copySelection()">{{strings.copy}} <span>cmd-c</span></a>
          <template  v-for="t in transformations">
            <a v-if="state.isTransformationAllowed(t[0])" :class="`vue-paint-button vue-paint-button-shorcut vue-paint-button-${t[0]}${state.getTransformation()==t[0]?' vue-paint-button-active':''}`" v-bind:key="`transformation-${t[0]}`" @click="state.setTransformation(t[0])">{{strings[t[0]]}} <span>{{t[1]}}</span></a>
          </template>
          <a class="vue-paint-button vue-paint-button-shorcut vue-paint-button-background" @click="state.shiftSelection('back')">{{strings.background}}<span>⇞</span></a>
          <a class="vue-paint-button vue-paint-button-shorcut vue-paint-button-foreground" @click="state.shiftSelection('front')">{{strings.foreground}}<span>⇟</span></a>
          <div class="vue-paint-arrowbuttons" v-if="state.isTransformationAllowed('Move')">
            <a @click="state.moveSelection('left')"><span>&larr;</span></a>
            <a @click="state.moveSelection('up')"><span>&uarr;</span></a>
            <a @click="state.moveSelection('down')"><span>&darr;</span></a>
            <a @click="state.moveSelection('right')"><span>&rarr;</span></a>
          </div>
        </div>
        <div v-if="state.hasClipboard()">
          <div class="vue-paint-menu-divider" @click="$event.target.parentElement.classList.toggle('folded')">{{strings.clipboard}}</div>
          <a class="vue-paint-button vue-paint-button-shorcut vue-paint-button-paste" @click="state.pasteSelection()">{{strings.paste}}<span>cmd-v</span></a>
          <a class="vue-paint-button vue-paint-button-shorcut vue-paint-button-clear" @click="state.clearSelection()">{{strings.clear}}</a>
        </div>
        <div v-if="state.getContext()">
          <div class="vue-paint-menu-divider" @click="$event.target.parentElement.classList.toggle('folded')">{{strings.parameter}}</div>
          <template v-for="option in state.getContext().getOptions()">
            <form v-if="option.type != 'hidden'" :id="`form-${option.property}`" v-bind:key="`form-${option.description}`">
              <a
                  v-if="option.type == 'textarea' || option.type == 'clipart'"
                  :class="`vue-paint-button vue-paint-button-shorcut vue-paint-button-${option.description} ${option.toggled?' vue-paint-button-active':''}`"
                  v-bind:key="option.parameter"
                  @click="toggleOption(option)"
              >
                {{strings[option.description] || option.description}}<span>{{option.type == 'textarea' ? 'cmd-e' : 'cmd-i'}}</span>
              </a>

              <label
                :class="`vue-paint-label vue-paint-label-${option.description}`" 
                v-bind:key="`option-${option.description}`"
                v-if="option.type == 'int' && option.min !== option.max">{{strings[option.description] || option.description}}: {{option.value}}
                <input 
                  @change="state.getContext().setOption(option.property, $event.target.value)" 
                  type="range" 
                  :min="option.min" 
                  :max="option.max" 
                  :step="option.step" 
                  :value="option.value"
                  name="input"
                >
              </label>
              <label
                :class="`vue-paint-label vue-paint-label-${option.description}`" 
                v-bind:key="`option-${option.description}`"
                v-if="option.type == 'boolean'">{{strings[option.description] || option.description}}
                <input 
                  @change="state.getContext().setOption(option.property, $event.target.checked)" 
                  type="checkbox" 
                  :checked="option.value"
                  name="input"
                >
              </label>              
              <label
                :class="`vue-paint-label vue-paint-label-${option.description}`"
                v-bind:key="`option-${option.property}`"
                v-if="option.type == 'text'">{{strings[option.description] || option.description}}
                <input
                  @keyup="state.getContext().setOption(option.property, $event.target.value)" 
                  @focus="disableKeys" 
                  @blur="enableKeys" 
                  v-model="option.value"
                  name="input"
                  type="text"
                >
              </label>
            </form>
          </template>
        </div>
      </vue-draggable-resizable>
    </div>
</template>

<script>

import paper  from 'paper'
import State  from './state.js'
import VueDraggableResizable from 'vue-draggable-resizable'

const DOUBLECLICK_TIME_MS = 450;
const DOUBLECLICK_DELTA = 3;

export default {
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
      contextX: this.$root._vp_x ? this.$root._vp_x : (window.innerWidth - 300),
      contextY: this.$root._vp_y ? this.$root._vp_y : 150
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
        })
      }
      else {
        this.initialize();
      }
    }
    catch (err) {
      console.warn('no custom fonts')
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
      this.contextX = this.$root._vp_x = x
      this.contextY = this.$root._vp_y = y
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
        this.paper.view.scale(1 / this.paper.view.zoom, [0,0])
        this.paper.view.scale(this.scaling / 100, [0,0])
        this.paper.view.viewSize = this.viewSize.multiply(this.scaling / 100)
      }
    },
    initialize () {
      console.log('initializing vue-paint…')
      this.tools = this.state.getTools();
      this.paper = paper.setup(this.$refs.painter);
      this.paper.settings.hitTolerance = 20;
      this.tool = new paper.Tool();
      this.state.paper = this.paper;
      let _painting;
      this.viewSize = this.paper.view.viewSize.clone()
      this.drawGrid();

      this.layer = new this.paper.Layer();

      // Double Click Stuff
      let _lastClick = 0;
      let _lastPoint = {
        x: -1000,
        y: -1000
      }

      let _disableMouseUp = false

      this.tool.onMouseDown = (event) => {
        this.enableKeys();
        this.state.onMouseDown()
        if (event.item == null || event.item.layer.getIndex() === 0) {
          let _selectionLength = this.state.unselectAll();
          // Disable MouseUp Actions for one time if we really deselected something
          if (_selectionLength > 0) {
            _disableMouseUp = true
          }
          return false;
        }
      }
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
          this.state.onDrag(event.point)
        }
      }

      this.tool.onMouseMove = (event) => {
        if (
          !this.state.hasSelection() &&
          this.state.addOnDoubleClick(this.state.getActiveName()) === true && 
          _painting
        ) {
            _painting.onMove(event.point);
        }
      }


      this.tool.onMouseUp = (event) => {
        if (_disableMouseUp === true) {
          _disableMouseUp = false
          return
        }

        // Action for AddOnClick Itmes

        if (!_painting && !this.state.hasSelection() && this.state.isActive() && this.state.addOnMouseDown(this.state.getActiveName())) {
          _painting = new this.state.active(this.paper, event.point, this.state, null, this.state.getActiveDefaults());
          _painting.onPaint(event.point);        
          _painting.onFinishPaint(event.point);
          _painting = null;
          this.state.setActive(false)
          console.log('--------')
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
            this.state.onFinishDrag(event.point)
          }
        }

        // Double Click Trigger (timeout and delta)

        if (
          event.timeStamp - _lastClick <= DOUBLECLICK_TIME_MS &&
          Math.sqrt((_lastPoint.x - event.point.x) ** 2 + (_lastPoint.y - event.point.y) ** 2) <= DOUBLECLICK_DELTA 
        ) {
          this.tool.onDoubleClick(event);
        }
        _lastClick = event.timeStamp
        _lastPoint = event.point
        return false;
      } 

      this.tool.onDoubleClick = (event) => {
        if (_painting && this.state.addOnDoubleClick(this.state.getActiveName())) {
          _painting.onFinishPaint(event.point);
          _painting = null;
        }
      }
      
      this.tool.onKeyDown = (event) => {
        if (this.keyHandlingActive === true) {
          if (event.key == 'delete' || event.key == 'backspace') {
              this.state.deleteSelection()
              return false;
          }
          if (event.key == 'up' || event.key == 'down' || event.key == 'left' || event.key == 'right') {
            this.state.moveSelection(event.key, event.modifiers.shift)
            return false;
          }
          if (event.key == 'page-up') {
            this.state.shiftSelection('back')
            return false;
          }      
          if (event.key == 'page-down') {
            this.state.shiftSelection('front')
            return false;
          }            

          if (event.key == 'c' && event.modifiers.meta) {
            this.state.copySelection()
            return false;
          }      
          if (event.key == 'v' && event.modifiers.meta) {
            this.state.pasteSelection()
            return false;
          }
          this.transformations.forEach(t => {
            if (event.key == t[1]) {
              this.state.setTransformation(t[0]);
              return false;
            }
          })
        }
        // Toggle first text area option (if there are multiples)
        if (event.key == 'e' && event.modifiers.meta && this.state.getOptionByType('textarea').length > 0) {
          this.toggleOption(this.state.getOptionByType('textarea')[0])
          return false;
        }

        if (event.key == 'i' && event.modifiers.meta && this.state.getOptionByType('clipart').length > 0) {
          this.toggleOption(this.state.getOptionByType('clipart')[0])
          return false;
        }
      }

      // Import json data to stage if passed as a prop

      this.$nextTick(()=>{
        try {
          if (this.json) {
            this.state.importStack(this.json)
          }
        } catch (err) {
          this.$emit('error', 'loading_json');
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
      }
      let _str = Array.from(this.sheet.cssRules)
        .map(rule => stringifyRule(rule))
        .join('\n')

      svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${this.paper.project.view.bounds.width}" height="${this.paper.project.view.bounds.height}" viewBox="0,0,${this.paper.project.view.bounds.width},${this.paper.project.view.bounds.height}">
      <defs>
        <style>
          ${_str}
        </style>
      </defs>
      ${svg}
      </svg>`

      this.$emit('export', svg);
    },
    disableKeys() {
      this.keyHandlingActive = false
    },
    enableKeys() {
      this.keyHandlingActive = true
    },
    // needed to ensure reactivity ($set)
    toggleOption(option) {
      this.$set(option, 'toggled', !option.toggled)
      this.state.getContext().selectBorderColor(option.toggled ? 'red' : null)
      if (!option.toggled) {
        this.enableKeys();
      }
      else {
        this.disableKeys();
        this.state.disableTransformation()
        this.$nextTick(() => {
          try {
            this.$refs[option.property][0].focus()
          }
          catch (err) {
            console.warn('obviously no text area to focus!')
          }
          
        })
      }
    },
    prepareClipart(clips) {
      clips = clips || []
      let _prepared = {
        'groups': [],
        'clips': {},
        'selected': ''
      };
      clips.forEach((clip) => {
        if (_prepared.groups.indexOf(clip.group)===-1) {
          _prepared.groups.push(clip.group)
        }
        _prepared.clips[clip.group] = _prepared.clips[clip.group] || [];
        _prepared.clips[clip.group].push(clip)
      })
      _prepared.selected = _prepared.groups[0]
      return _prepared;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  .vue-paint {
    .folded {
      label, a, form, .vue-paint-arrowbuttons {
        display: none;
      }
      .vue-paint-menu-divider {
        &:after {
          content: "+"
        }
      }
    }
    height: 100vh;
    position: absolute;
    left: 0px;
    top: 0px;
    width: 100%;
    overflow: hidden;
    &-wrapper {
      position: absolute;
      left: 20%;
      top: 0px;
      width: 70%;
      height: 100%;
      overflow: auto;
    }
    &-canvas {
      position: absolute;
      left: 0px;
      top: 0px;
      width: 750px;
      height: 1500px;
      background: transparent;
      z-index: 3;
      cursor: crosshair;
      &-select {
        cursor: pointer;
      }
    }
    &-menu {
      position: absolute;
      left: 0px;
      top: 0px;
      width: 20% !important;
      height: auto;
      max-height: 100%;
      background: #CCC;
    }
    &-clipart {
      &-wrapper {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;      
        z-index: 10;
      }
      &-container {
        background: #FFF;
        box-shadow: 6px 6px 12px #000;
        overflow-x: hidden;
        overflow-y: auto;
        width: 100%;
        height: 80vh;
        max-width: 800px;
        position: relative;
        display: block;
        &-groups {
          position: fixed;
          width: 100%;
          max-width: 800px;
          white-space: nowrap;
          z-index: 1;
          height: 3rem;
          background: #FFF;
        }
        &-group {
          display: inline-block;
          padding: 1rem 0.5rem;
        }
        &-items {
          display: flex;
          flex-wrap: wrap;
          z-index: 0;
          margin-top: 3rem;
        }
        &-item {
          width: 25%;
          padding-bottom: 25%;
          position: relative;
          box-sizing: border-box;
          img {
            position: absolute;
            left: 0px;
            top: 0px;
            padding: 1rem;
            width: 100%;
            height: 100%;
            object-fit: contain;
            box-sizing: border-box;
          }
        }
      }
    }
    &-editor {
      padding: 0;
      border: none;
      background: transparent;
      position: absolute;
      z-index: 10;
      width: auto;
      height: auto;
      input,
      textarea {
        resize: none;
        border: 1px solid transparent;
        appearance: none;
        background: rgba(0,0,0,0.1);
        padding: 0;
        overflow: hidden;
        color: transparent;
        caret-color: black;
        margin: -1px;
        box-sizing: border-box;
        &:focus {
          outline: none;
        }
      }
    }
    &-context {
      position: absolute;
      left: 0px;
      top: 0px;
      width: 10% !important;
      height: auto;
      max-height: 100%;
      background: #CCC;
    }
    &-hint {
      bottom: 10px;
      width: 50% !important;
      left: 25%;
      background: #CCC;
    }
    &-menu, &-context {
      overflow-y: auto;
      .drag {
        position: absolute;
        left: 0.5em;
        top: 0px;
        width: 2em;
        height: 2em;
        z-index: 10;
        cursor: grab;
        &:after {
          content: "⇱";
          font-size: 150%;
        }
      }
    }
    &-menu-divider {
      font: inherit;
      padding: 0.5rem;
      color: #F00;
      background: #EEE;
      margin: 0;
      text-align: center;
      cursor: pointer;
      position: relative;
      &:after {
        content: "-";
        display: block;
        position: absolute;
        right: 5px;
        top: 50%;
        line-height: 0;
      }
    }

    &-label {
      padding: 0.5em;
      display: block;
      a,
      input {
        float: right;
      }
      &:after {
        content: "";
        display: block;
        clear: both;
      }
      a.color {
        width: 2em;
        height: 2em;
        box-sizing: border-box;
        display: inline-block;
        border: 2px solid black;
        &-active {
          border: 2px solid white;
        }
      }
    }

    &-button {
      padding: 0.5em;
      display: block;
      &-shorcut {
        span {
          font-size: 60%;
          padding: 2px 3px 3px 3px;
          float: right;
          width: 2rem;
          text-align: center;
          box-shadow: 2px 2px 2px rgba(0,0,0,0.2);
          background: #FFF;
        }
      }
      &-active {
        background: #999;
      }
    }
    

    &-arrowbuttons {
      a {
        display: inline-block;
        width: 25%;
        padding: 0.5em;
        box-sizing: border-box;
        span {
          display: block;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          padding: 0.25em 0 0.5em;
          font-size: 60%;
          float: right;
          text-align: center;
          box-shadow: 2px 2px 2px rgba(0,0,0,0.2);
          background: #FFF;          
        }
      }
    }

    .flipin-enter-active, .flipin-leave-active {
            opacity: 1;
            transition: opacity 0.5s;
    }
    .flipin-enter {
            opacity: 0;
    }
    .flipin-leave-to {
          opacity: 0;
    }
  }

</style>
