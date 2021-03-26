<template>
    <div>
      <div id="grid"/>
      <canvas ref="painter" id="painter" resize></canvas>
      <div id="menu">
        <div>
          <a v-for="t in tools" v-bind:key="`tool-${t}`" :class="{'active': state.getActiveName()==t}" @click="state.setActive(t)">{{t}}</a>
        </div>
        <div>
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
          <div v-if="state.selected.length > 0">
            <a @click="state.deleteSelection()">Delete  <span>🔙</span></a>
            <a v-for="t in transformations" v-bind:key="`transformation-${t[0]}`" :class="{'active': state.getTransformation()==t[0]}" @click="state.setTransformation(t[0])">{{t[0]}} <span>{{t[1]}}</span></a>
            <div>
              <a class="small" @click="state.moveSelection('left')"><span>&larr;</span></a>
              <a class="small" @click="state.moveSelection('up')"><span>&uarr;</span></a>
              <a class="small" @click="state.moveSelection('down')"><span>&darr;</span></a>
              <a class="small" @click="state.moveSelection('right')"><span>&rarr;</span></a>
            </div>
          </div>
        </transition>
      </div>

    </div>
</template>

<script>

import paper  from 'paper'
import State  from './state.js'


export default {
  name: 'VuePainter',
  data () {
    return {
      // Paper & Paper.Tool Stuff
      paper: null,
      tool: null,

      // Objects Store
      //objects: [],

      // State Class
      state: new State(),

      // Colors
      colors: ['black', 'green', 'red', 'blue'],

      // Tools
      tools: ['Square', 'Circle', 'Line', 'Star'],

      // Transformations
      transformations: [
        ['Move', 'm'], 
        ['Rotate', 'r'], 
        ['Resize', 's']
      ]

    }
  },
  mounted () {
    this.paper = paper.setup(this.$refs.painter);
    this.tool = new paper.Tool();
    let _painting;
    let _mouseDownPoint;
    

    this.tool.onMouseDown = (event) => {
      _mouseDownPoint = event.point.clone();
      this.state.dragged = false;
      if (this.state.selected && event.item == null) {
        this.state.selected.forEach(s => {s.unselect()})
        this.state.selected = [] 
        return false;
      }
    }


    this.tool.onMouseDrag = (event) => {
      if (this.state.selected.length == 0) {
        if (_painting) {
          _painting.onPaint(event);
        }
        else {
          if (this.state.getActive()) {
            console.log(this.state.getActive())
            _painting = new this.state.active(this.paper, event, this.state);
           // this.objects.push(_painting)
          }
        }
      }
      else {
        this.state.dragged = true;
        this.state.selected.forEach(s => {s.onDrag(event, _mouseDownPoint)})
      }
    }
    
    this.tool.onMouseUp = (event) => {
      if (_painting) {
        _painting.onFinishPaint(event);
        _painting = null;        
      }
      if (this.state.dragged) {
        this.state.selected.forEach(s => {s.onFinishDrag(event, _mouseDownPoint)})
        this.state.dragged = false
      }

      return false;
    } 
    
    this.tool.onKeyDown = (event) => {
      if (event.key == 'delete' || event.key == 'backspace') {
          this.state.deleteSelection()
          return false;
      }
      if (event.key == 'up' || event.key == 'down' || event.key == 'left' || event.key == 'right') {
        this.state.moveSelection(event.key, event.modifiers.shift)
        return false;
      }
      this.transformations.forEach(t => {
        if (event.key == t[1]) {
          this.state.setTransformation(t[0]);
          return false;
        }
      })
    }   
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
  #grid, #painter {
    position: absolute;
    left: 20%;
    top: 0px;
    width: 70%;
    height: 100%;
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
  #context {
    position: absolute;
    right: 0px;
    top: 0px;
    width: 10%;
    height: 100%;
    background: #CCC;
    & > div {
      & > div {
        
      }
    }
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
