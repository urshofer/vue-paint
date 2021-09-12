<template>
  <div id="app">
    <div class="painter">
      <VuePainter 
        v-bind:translations="translations"
        v-bind:csscolors="csscolors"
        v-bind:configuration="configuration"
        v-bind:fonts="fonts"
        v-bind:clipart="clipart"
        v-bind:data="data" 
        v-bind:gridX="25.981"
        v-bind:gridY="15"
        v-bind:angleStep="30"
        v-on:save="onSave"
        v-on:export="onExport"
      />
      <!--
        <VuePainter/>
      -->
    </div>
  </div>
</template>

<script>
import VuePainter from 'vue-painter'
import { saveAs } from 'file-saver'
import 'vue-painter/dist/vue-painter.css'

export default {
  name: 'App',
  components: {
    VuePainter
  },
  data() {
    return {
      data: '',
      clipart: [
        {'group': 'Körper', 'name': 'Hand', 'thumb': '/vue-paint/img/1.png', 'source': '/vue-paint/img/1.png'},
        {'group': 'Körper', 'name': 'Finger', 'thumb': '/vue-paint/img/2.png', 'source': '/vue-paint/img/2.png'},
        {'group': 'Körper', 'name': 'Hände', 'thumb': '/vue-paint/img/3.png', 'source': '/vue-paint/img/3.png'},
        {'group': 'Körper', 'name': 'Mund', 'thumb': '/vue-paint/img/5.png', 'source': '/vue-paint/img/5.png'},
        {'group': 'Körper', 'name': 'Zwei Hände', 'thumb': '/vue-paint/img/14.png', 'source': '/vue-paint/img/14.png'},
        {'group': 'Werkzeug', 'name': 'Bleistift', 'thumb': '/vue-paint/img/4.png', 'source': '/vue-paint/img/4.png'},
        {'group': 'Werkzeug', 'name': 'Schere', 'thumb': '/vue-paint/img/9.png', 'source': '/vue-paint/img/9.png'},
        {'group': 'Werkzeug', 'name': 'Lupe', 'thumb': '/vue-paint/img/10.png', 'source': '/vue-paint/img/10.png'},
        {'group': 'Werkzeug', 'name': 'Lampe', 'thumb': '/vue-paint/img/11.png', 'source': '/vue-paint/img/11.png'},
        {'group': 'Werkzeug', 'name': 'Zirkel', 'thumb': '/vue-paint/img/12.png', 'source': '/vue-paint/img/12.png'},
        {'group': 'Werkzeug', 'name': 'Hammer', 'thumb': '/vue-paint/img/13.png', 'source': '/vue-paint/img/13.png'},
        {'group': 'Natur', 'name': 'Wolke', 'thumb': '/vue-paint/img/6.png', 'source': '/vue-paint/img/6.png'},
        {'group': 'Natur', 'name': 'Würfel', 'thumb': '/vue-paint/img/7.png', 'source': '/vue-paint/img/7.png'},
        {'group': 'Natur', 'name': 'Käfer', 'thumb': '/vue-paint/img/8.png', 'source': '/vue-paint/img/8.png'}
      ],
      fonts: [
        {
          'family': 'Pattaya', 
          'file': require('./assets/fonts/Pattaya-Regular.ttf')
        }
      ],
      csscolors: [
        'black',
        'green',
        'red',
        'blue',
        'magenta',
        'rgba(0,0,0,0)'
      ],
      configuration: {
        'Rechteck': {
            class: 'Square',
            defaults: {
                radius: 0,
                radiusMin: 0,
                radiusMax: 100,
                radiusStep: 10,
                fixed: false
            }
        },
        'Kreis': {
            class: 'Circle',
            defaults: {
                fixed: {x:100,y:100, width: 100, height: 100}
            }
        },
        'Linie': {
            class: 'Line'
        },
        'Stern': {
            class: 'Star'
        },
        'Clipart': {
            class: 'Raster',
            defaults: {
                source: "/vue-paint/img/default.png",
                fixed: false
            }
        },
        'Text': {
            class: 'Text'
        },
        'Block': {
            class: 'Text',
            defaults: {
                fontSize: 14,
                fontSizeMin: 14,
                fontSizeMax: 14,
                fontFamily: 'Pattaya', // system or webfont stored fonts[], property .family)
                fontWeight: 'normal',
                leading: 20,
                leadingMin: 20,
                leadingMax: 20,
                rows: 15,
                cols: 60,
                fixed: {x:20,y:500}
            }
        },        
        'Block Links': {
            class: 'Text',
            defaults: {
                fontSize: 14,
                fontSizeMin: 14,
                fontSizeMax: 14,
                fontFamily: 'Pattaya', // system or webfont stored fonts[], property .family)
                fontWeight: 'normal',
                leading: 20,
                leadingMin: 20,
                leadingMax: 20,
                rows: 15,
                cols: 60,
                fixed: {x:20,y:500}
            }
        },
        'Block Rechts': {
            class: 'Text',
            defaults: {
                fontSize: 14,
                fontSizeMin: 14,
                fontSizeMax: 14,
                fontFamily: 'Pattaya', // system or webfont stored fonts[], property .family)
                fontWeight: 'normal',
                leading: 20,
                leadingMin: 20,
                leadingMax: 20,
                rows: 15,
                cols: 60,
                fixed: {x:400,y:500}
            }
        },
        'Kopfzeile': {
            class: 'Text',
            defaults: {
                fontSize: 28, 
                fontSizeMin: 25,
                fontSizeMax: 35,
                fontFamily: 'sans-serif',
                fontWeight: 'normal',
                leading: 28,
                leadingMin: 25,
                leadingMax: 45,                    
                rows: 1,
                cols: 30,
                fixed: {x:20,y:100}
            }
        },
        'Grid': {
          class: 'Grid',
          defaults: {
              gridX: 15,
              gridY: 15,
              gridXMax: 15 * 3,
              gridYMax: 15 * 3,
              gridXMin: 15,
              gridYMin: 15,
              gridXStep: 15,
              gridYStep: 15,
              //fixed: {x:100,y:100, width: 100, height: 100}
          }
        }
      },
      translations: {
        'tools': 'Werkzeuge',
        'file': 'Datei',
        'preset': 'Einstellungen',
        'selection': 'Auswahl',
        'parameter': 'Parameter',
        'clipboard': 'Zwischenablage',
        'save': 'Speichern',
        'export': 'Exportieren',
        'stroke': 'Strichdicke',
        'alpha': 'Alphakanal',
        'fillcolor': 'Füllfarbe',
        'strokecolor': 'Strichfarbe',
        'delete': 'Löschen',
        'copy': 'Kopieren',
        'paste': 'Einfügen',
        'clear': 'Leeren',
        'Move': 'Bewegen',
        'Rotate': 'Drehen',
        'Resize': 'Skalieren',
        'background': 'Hintergrund',
        'foreground': 'Vordergrund'
      }
    }
  },
  methods: {
    onSave(json) {
			saveAs(new Blob([json], {type: "application/json;charset=" + document.characterSet}), 'painter.json');
    },
    onExport(svg) {
      this.svg = svg
			saveAs(new Blob([svg], {type: "image/svg+xml;charset=" + document.characterSet}), 'painter.svg');
    }    
  }

}
</script>

<style lang="scss">

#app {
  font-family: Courier, Helvetica, Arial, sans-serif;
  color: #000;
  overflow: hidden;
  height: 100%;
  display: block;
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
}
.painter {
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
}
</style>
