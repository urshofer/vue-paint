<template>
    <div>
      <div id="wrapper">
        <div id="grid"/>
        <canvas ref="painter" id="painter" resize></canvas>
      </div>
      <div id="menu">
        <div>
          <h1>TOOLS</h1>
          <a v-for="t in tools" v-bind:key="`tool-${t}`" :class="{'active': state.getActiveName()==t}" @click="state.setActive(state.getActiveName()==t ? false : t)">{{t}}</a>
        </div>
        <div>
          <h1>FILE</h1>
          <a @click="saveJSON()">Save</a>
          <a @click="exportSVG()">Export SVG</a>
        </div>
        <div>
          <h1>PRESET</h1>
          <label>Stroke: {{state.getStrokeWidth()}} Px
            <input @change="state.setStrokeWidth($event.target.value)" type="range" min="0" max="10" :value="state.getStrokeWidth()">
          </label>
          <label>Alpha: {{state.getAlpha()*100}}%
            <input @change="state.setAlpha($event.target.value / 4)" type="range" min="0" max="4" :value="state.getAlpha() * 4">
          </label>
          <label>Fill Color:
            <template v-for="c in colors">
              <a v-bind:key="`bgcolor-${c}`" class="color" :style="{'background-color': c}" :class="{'color-active': state.getFillColor()==c}" @click="state.setFillColor(c)"></a>
            </template>
          </label>
          <label>Stroke Color:
            <template v-for="c in colors">
              <a v-bind:key="`bgcolor-${c}`" class="color" :style="{'background-color': c}" :class="{'color-active': state.getStrokeColor()==c}" @click="state.setStrokeColor(c)"></a>
            </template>
          </label>
        </div>
      </div>
      <div id="context">
        <transition name="flipin">
          <div v-if="state.hasSelection()">
            <h1>SELECTION</h1>
            <a @click="state.deleteSelection()">Delete  <span>🔙</span></a>
            <a @click="state.copySelection()">Copy <span>cmd-c</span></a>
            <a v-for="t in transformations" v-bind:key="`transformation-${t[0]}`" :class="{'active': state.getTransformation()==t[0]}" @click="state.setTransformation(t[0])">{{t[0]}} <span>{{t[1]}}</span></a>
            <div>
              <a class="small" @click="state.moveSelection('left')"><span>&larr;</span></a>
              <a class="small" @click="state.moveSelection('up')"><span>&uarr;</span></a>
              <a class="small" @click="state.moveSelection('down')"><span>&darr;</span></a>
              <a class="small" @click="state.moveSelection('right')"><span>&rarr;</span></a>
            </div>
            <a @click="state.shiftSelection('back')">Background<span>⇞</span></a>
            <a @click="state.shiftSelection('front')">Foreground<span>⇟</span></a>
          </div>
        </transition>

        <transition name="flipin">
          <div v-if="state.hasClipboard()">
            <h1>CLIPBOARD</h1>
            <a @click="state.pasteSelection()">Paste<span>cmd-v</span></a>
            <a @click="state.clearSelection()">Clear</a>
          </div>
        </transition>

        <transition name="flipin">
          <div v-if="state.getContext()">
            <h1>PARAMETER</h1>
            <form :id="`form-${option.property}`" v-bind:key="`form-${option.description}`" v-for="option in state.getContext().getOptions()">
                <label v-bind:key="`option-${option.description}`" v-if="option.type == 'int'">{{option.description}}: {{option.value}}
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
                <label v-bind:key="`option-${option.property}`" v-if="option.type == 'text'">{{option.description}}
                  <textarea 
                    @keyup="state.getContext().setOption(option.property, $event.target.value)" 
                    @focus="disableKeys" 
                    @blur="enableKeys" 
                    :rows="option.rows" 
                    :cols="option.cols" 
                    v-model="option.value"
                    name="input"
                    wrap="hard" 
                  ></textarea>
                </label>                
            </form>
          </div>
        </transition>
      </div>

      <transition name="flipin">
        <vue-draggable-resizable :resizable="false" id="popup" v-if="state.getContext() && state.getContext().hasPopup()" :w="'auto'" :h="'auto'">
          <form :id="`form-${option.property}`" v-bind:key="`form-${option.description}`" v-for="option in state.getContext().getOptions(true)">
              <textarea 
                v-if="option.type == 'text' && option.rows > 1"
                @keyup="state.getContext().setOption(option.property, $event.target.value)" 
                @focus="disableKeys" 
                @blur="enableKeys" 
                :rows="option.rows" 
                :cols="option.cols" 
                v-model="option.value"
                name="input"
                wrap="hard"
                :style="{'font-size': `${state.getContext().primitive.fontSize}px`}"
              ></textarea>
              <input v-else-if="option.type == 'text' && option.rows == 1"
                name="input"
                v-model="option.value"
                @keyup="state.getContext().setOption(option.property, $event.target.value)" 
                @focus="disableKeys" 
                @blur="enableKeys" 
                :maxlength="option.cols" 
                :style="{'font-size': `${state.getContext().primitive.fontSize}px`}"
              />
          </form>
        </vue-draggable-resizable>
      </transition>

    </div>
</template>

<script>

import paper  from 'paper'
import State  from './state.js'
import Vue from 'vue'
import VueDraggableResizable from 'vue-draggable-resizable'
import { Base64 } from 'js-base64';

// optionally import default styles
import 'vue-draggable-resizable/dist/VueDraggableResizable.css'

Vue.component('vue-draggable-resizable', VueDraggableResizable)

export default {
  name: 'VuePainter',
  props: {
    data: String
  },
  data () {
    let _j;
    try {
      _j = JSON.parse(this.data);
    } catch(err) {
      console.warn(err);
      _j = false;
    }
    return {
      // Data
      json: _j,

      // Paper & Paper.Tool Stuff
      paper: null,
      tool: null,

      // State Class
      state: new State({gridsize: 25, anglestep: 5}),

      // Colors
      colors: ['black', 'green', 'red', 'blue', 'transparent'],

      // Tools
      tools: ['Square', 'Circle', 'Line', 'Star', 'Raster', 'Text', 'TextSmall', 'TextLarge'],

      // Transformations
      transformations: [
        ['Move', 'm'], 
        ['Rotate', 'r'], 
        ['Resize', 's']
      ],

      // Keyhandling
      keyHandlingActive: true, // set to false if paper should not listen to keystrokes

    }
  },
  mounted () {
    this.paper = paper.setup(this.$refs.painter);
    this.paper.settings.hitTolerance = 10;

    this.tool = new paper.Tool();
    let _painting;

    this.tool.onMouseDown = (event) => {
      this.enableKeys();
      this.state.onMouseDown()
      if (event.item == null) {
        this.state.unselectAll(); 
        return false;
      }
    }

    this.tool.onMouseDrag = (event) => {
      if (!this.state.hasSelection()) {
        if (_painting) {
          _painting.onPaint(event.point);
        }
        else {
          if (this.state.isActive()) {
            _painting = new this.state.active(this.paper, event.point, this.state, null, this.state.getActiveOptions());
          }
        }
      }
      else {
        this.state.onDrag(event.point)
      }
    }
    
    this.tool.onMouseUp = (event) => {
      console.log(this.state.addOnMouseDown(this.state.getActiveName()))
      if (!_painting && !this.state.hasSelection() && this.state.isActive() && this.state.addOnMouseDown(this.state.getActiveName())) {
        _painting = new this.state.active(this.paper, event.point, this.state, null, this.state.getActiveOptions());
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
          this.state.onFinishDrag(event.point)
        }
      }
      return false;
    } 
    
    this.tool.onKeyDown = (event) => {

      if (this.keyHandlingActive === false) {
        return true;
      }
      
      console.log(event.key)

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

    this.$nextTick(()=>{
      if (this.json) {
        this.json.forEach(o => {
          let _primitive = this.paper.project.activeLayer.importJSON(Base64.decode(o.data))
          this.state.setActive(o.prototype)
          new this.state.active(this.paper, false, this.state, _primitive, this.state.getActiveOptions());
        })
        this.state.setActive('')
      }
    });

  },
  methods: {
    saveJSON() {
      this.$emit('save', this.state.exportStack());
    },
    exportSVG() {
      this.$emit('export', this.paper.project.exportSVG({asString: true}));
    },
    disableKeys() {
      console.log('disabling keys')
      this.keyHandlingActive = false
    },
    enableKeys() {
      console.log('enabling keys')
      this.keyHandlingActive = true
    }

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
  #wrapper {
    position: absolute;
    left: 20%;
    top: 0px;
    width: 70%;
    height: 100%;
    overflow: auto;
  }
  #grid, #painter {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 750px;
    height: 1500px;
  }
  #grid {
    background: #FFF;
    &:after,
    &:before {
        content: "";
        position: absolute;
        height: 100%;
        width: 100%;
    }    
    &:before {
        background-size: 25px 100%;
        background-image: linear-gradient(to right, #d2d2eeb6 1px, transparent 1px);
    }
    &:after {
        background-size: 100% 25px;
        background-image: linear-gradient(to bottom, #d2d2eeb6 1px, transparent 1px);
    }
  }
  #painter {
    background: transparent;
  }
  #menu {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 20%;
    height: 100%;
    background: #CCC;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  #popup {
    position: absolute;
    left: 1rem;
    top: 1rem;
    padding: 1rem;
    background: #FFF;
    box-shadow: 6px 6px 12px #000;
    cursor: grab;
    input,
    textarea {
      resize: none;
      border: 1px solid #00F;
      appearance: none;
    }
  }
  #context {
    position: absolute;
    right: 0px;
    top: 0px;
    width: 10%;
    height: 100%;
    background: #CCC;
    display: flex;
    flex-direction: column;
    justify-content: space-between;    
    & > div {
      & > div {
        
      }
    }
  }

  h1 {
    font: inherit;
    padding: 0.5rem;
    color: #F00;
    background: #EEE;
    margin: 0;
    text-align: center;
  }

  label, a {
    padding: 0.5em;
    display: block;
    &.active {
      background: #999;
    }
  }
  a.color {
    width: 2em;
    height: 2em;
    box-sizing: border-box;
    display: inline-block;
    &-active {
      border: 2px solid white;
    }
  }

  label {
    a,
    input {
      float: right;
    }
    &:after {
      content: "";
      display: block;
      clear: both;
    }
  }
  
  a span {
    font-size: 60%;
    padding: 2px 3px 3px 3px;
    float: right;
    width: 2rem;
    text-align: center;
    box-shadow: 2px 2px 2px rgba(0,0,0,0.2);
    background: #FFF;
  }

  a.small {
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

</style>
