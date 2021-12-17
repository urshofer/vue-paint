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
        v-bind:grids="grids"
        v-bind:horizontalRulers="horizontalRulers"
        v-bind:verticalRulers="verticalRulers"
        v-bind:gridLineColor="'#000'"
        v-bind:rulerColor="'#F0F'"
        v-bind:defaultGrid="defaultGrid"
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
const mm2px = 4.705882352941176
export default {
  name: 'App',
  components: {
    VuePainter
  },
  data() {
    let gridSize = 10 * mm2px
    return {
      data: '[{"prototype":"Rechteck","data":"WyJTaGFwZSIseyJhcHBseU1hdHJpeCI6ZmFsc2UsIm1hdHJpeCI6WzEsMCwwLDEsMTY4Ljg3NjUsMTE1NV0sInR5cGUiOiJyZWN0YW5nbGUiLCJzaXplIjpbMTI5LjkwNSw5MF0sInJhZGl1cyI6WzAsMF0sImZpbGxDb2xvciI6WzAsMCwwXSwic3Ryb2tlQ29sb3IiOlsxLDAsMF0sInN0cm9rZVdpZHRoIjoyfV0="},{"prototype":"Rechteck","data":"WyJTaGFwZSIseyJhcHBseU1hdHJpeCI6ZmFsc2UsIm1hdHJpeCI6WzEsMCwwLDEsNTQ1LjYwMSwxMjM3LjVdLCJ0eXBlIjoicmVjdGFuZ2xlIiwic2l6ZSI6WzEwMy45MjQsMTVdLCJyYWRpdXMiOlswLDBdLCJmaWxsQ29sb3IiOlswLDAsMF0sInN0cm9rZUNvbG9yIjpbMSwwLDBdLCJzdHJva2VXaWR0aCI6Mn1d"},{"prototype":"Polyline","data":"WyJQYXRoIix7ImFwcGx5TWF0cml4Ijp0cnVlLCJzZWdtZW50cyI6W1sxNjMuMDExNzYsMTg4LjIzNTI5XSxbODEuNTA1ODgsMzA1Ljg4MjM1XSxbNDA3LjUyOTQxLDMyOS40MTE3Nl0sWzM2Ni43NzY0NywxODguMjM1MjldXSwiY2xvc2VkIjp0cnVlLCJmaWxsQ29sb3IiOlswLDAsMF0sInN0cm9rZUNvbG9yIjpbMSwwLDBdLCJzdHJva2VXaWR0aCI6Miwic3Ryb2tlSm9pbiI6InJvdW5kIiwiZGFzaEFycmF5IjpbMiwyXX1d"},{"prototype":"Grid","data":"WyJDb21wb3VuZFBhdGgiLHsiYXBwbHlNYXRyaXgiOmZhbHNlLCJjaGlsZHJlbiI6W1siUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDQ4MF0sWzIyNSw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjQwLDQ4MF0sWzI0MCw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjU1LDQ4MF0sWzI1NSw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjcwLDQ4MF0sWzI3MCw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjg1LDQ4MF0sWzI4NSw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMzAwLDQ4MF0sWzMwMCw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMzE1LDQ4MF0sWzMxNSw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMzMwLDQ4MF0sWzMzMCw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMzQ1LDQ4MF0sWzM0NSw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMzYwLDQ4MF0sWzM2MCw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMzc1LDQ4MF0sWzM3NSw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMzkwLDQ4MF0sWzM5MCw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbNDA1LDQ4MF0sWzQwNSw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbNDIwLDQ4MF0sWzQyMCw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbNDM1LDQ4MF0sWzQzNSw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbNDUwLDQ4MF0sWzQ1MCw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbNDY1LDQ4MF0sWzQ2NSw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbNDgwLDQ4MF0sWzQ4MCw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbNDk1LDQ4MF0sWzQ5NSw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbNTEwLDQ4MF0sWzUxMCw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbNTI1LDQ4MF0sWzUyNSw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbNTQwLDQ4MF0sWzU0MCw2NjBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDQ4MF0sWzU0MCw0ODBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDQ5NV0sWzU0MCw0OTVdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDUxMF0sWzU0MCw1MTBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDUyNV0sWzU0MCw1MjVdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDU0MF0sWzU0MCw1NDBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDU1NV0sWzU0MCw1NTVdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDU3MF0sWzU0MCw1NzBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDU4NV0sWzU0MCw1ODVdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDYwMF0sWzU0MCw2MDBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDYxNV0sWzU0MCw2MTVdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDYzMF0sWzU0MCw2MzBdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDY0NV0sWzU0MCw2NDVdXX1dLFsiUGF0aCIseyJhcHBseU1hdHJpeCI6dHJ1ZSwic2VnbWVudHMiOltbMjI1LDY2MF0sWzU0MCw2NjBdXX1dXSwiZmlsbENvbG9yIjpbMCwwLDBdLCJzdHJva2VDb2xvciI6WzEsMCwwXSwic3Ryb2tlV2lkdGgiOjIsImRhc2hBcnJheSI6WzIsMl19XQ=="},{"prototype":"Text","data":"WyJQb2ludFRleHQiLHsiYXBwbHlNYXRyaXgiOmZhbHNlLCJtYXRyaXgiOlsxLDAsMCwxLDQwLjc1Mjk0LDQyMy41Mjk0MV0sImNvbnRlbnQiOiJUZXh0IDYwIHggMTUiLCJzdHJva2VDb2xvciI6WzEsMCwwLDFdLCJzdHJva2VXaWR0aCI6MCwiZm9udFNpemUiOjE0LCJsZWFkaW5nIjoxNH1d"},{"prototype":"Text MM","data":"WyJQb2ludFRleHQiLHsiYXBwbHlNYXRyaXgiOmZhbHNlLCJtYXRyaXgiOlsxLDAsMCwxLDMyNi4wMjM1Myw0MDBdLCJjb250ZW50IjoiVGV4dCBNTSAyNTB4NjAgUGl4ZWwiLCJzdHJva2VDb2xvciI6WzEsMCwwLDFdLCJzdHJva2VXaWR0aCI6MCwiZm9udFNpemUiOjE0LCJsZWFkaW5nIjoxNH1d"},{"prototype":"Clipart","data":"WyJSYXN0ZXIiLHsiYXBwbHlNYXRyaXgiOmZhbHNlLCJtYXRyaXgiOlswLjQ2Mjg5LDAsMCwwLjQxOTg0LDU5NS4wNTUxNCwyMTcuNTY4MjZdLCJjcm9zc09yaWdpbiI6ImFub255bW91cyIsInNvdXJjZSI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC92dWUtcGFpbnQvaW1nLzIucG5nIiwiZmlsbENvbG9yIjpbMCwwLDBdLCJzdHJva2VDb2xvciI6WzEsMCwwXSwic3Ryb2tlV2lkdGgiOjJ9XQ=="},{"prototype":"Arc","data":"WyJQYXRoIix7ImFwcGx5TWF0cml4Ijp0cnVlLCJzZWdtZW50cyI6W1tbMTYzLjAxMTc2LDc3Ni40NzA1OV0sWzAsMF0sWzE1LjQzNjA4LDMwLjg3MjE1XV0sW1syNDQuNTE3NjUsODI2Ljg0Mzk5XSxbLTM0LjUxNjExLDBdLFszNC41MTYxMSwwXV0sW1szMjYuMDIzNTMsNzc2LjQ3MDU5XSxbLTE1LjQzNjA4LDMwLjg3MjE1XSxbMCwwXV1dLCJmaWxsQ29sb3IiOlswLDAsMF0sInN0cm9rZUNvbG9yIjpbMSwwLDBdLCJzdHJva2VXaWR0aCI6Mn1d"},{"prototype":"Polygon","data":"WyJQYXRoIix7ImFwcGx5TWF0cml4Ijp0cnVlLCJzZWdtZW50cyI6W1s1MDIuMTI4MzYsODM4LjA3MDU1XSxbNDg1LjAzMzYyLDc4NS40NTgzNF0sWzUyOS43ODgyNCw3NTIuOTQyMjFdLFs1NzQuNTQyODUsNzg1LjQ1ODM0XSxbNTU3LjQ0ODExLDgzOC4wNzA1NV1dLCJjbG9zZWQiOnRydWUsImZpbGxDb2xvciI6WzAsMCwwXSwic3Ryb2tlQ29sb3IiOlsxLDAsMF0sInN0cm9rZVdpZHRoIjoyfV0="},{"prototype":"Stern","data":"WyJQYXRoIix7ImFwcGx5TWF0cml4Ijp0cnVlLCJzZWdtZW50cyI6W1s0NDguMjgyMzUsNzAuNTg5MjddLFs0NzAuNDEwMjUsODcuMTkwNjJdLFs0OTMuMDM2OTcsMTAzLjEwNTRdLFs0ODQuMDg2MDUsMTI5LjI4MDM4XSxbNDc1Ljk0MjIzLDE1NS43MTc2MV0sWzQ0OC4yODIzNSwxNTUuMjkzMjldLFs0MjAuNjIyNDgsMTU1LjcxNzYxXSxbNDEyLjQ3ODY2LDEyOS4yODAzOF0sWzQwMy41Mjc3NCwxMDMuMTA1NF0sWzQyNi4xNTQ0NSw4Ny4xOTA2Ml1dLCJjbG9zZWQiOnRydWUsImZpbGxDb2xvciI6WzAsMCwwXSwic3Ryb2tlQ29sb3IiOlsxLDAsMF0sInN0cm9rZVdpZHRoIjoyLCJkYXNoQXJyYXkiOlsyLDJdfV0="},{"prototype":"Linie","data":"WyJQYXRoIix7ImFwcGx5TWF0cml4Ijp0cnVlLCJzZWdtZW50cyI6W1s4MS41MDU4OCwxMTcuNjQ3MDZdLFsyODUuMjcwNTksMTQxLjE3NjQ3XV0sImZpbGxDb2xvciI6WzAsMCwwXSwic3Ryb2tlQ29sb3IiOlsxLDAsMF0sInN0cm9rZVdpZHRoIjoyfV0="},{"prototype":"Kreis","data":"WyJTaGFwZSIseyJhcHBseU1hdHJpeCI6ZmFsc2UsIm1hdHJpeCI6WzEsMCwwLDEsMTAxLjg4MjM1LDYyMy41Mjk0MV0sInR5cGUiOiJlbGxpcHNlIiwic2l6ZSI6WzQwLjc1Mjk0LDcwLjU4ODI0XSwicmFkaXVzIjpbMjAuMzc2NDcsMzUuMjk0MTJdLCJmaWxsQ29sb3IiOlswLDAsMF0sInN0cm9rZUNvbG9yIjpbMSwwLDBdLCJzdHJva2VXaWR0aCI6Mn1d"},{"prototype":"Rechteck","data":"WyJTaGFwZSIseyJhcHBseU1hdHJpeCI6ZmFsc2UsIm1hdHJpeCI6WzEsMCwwLDEsNjUyLjA0NzA2LDYyMy41Mjk0MV0sInR5cGUiOiJyZWN0YW5nbGUiLCJzaXplIjpbODEuNTA1ODgsNzAuNTg4MjRdLCJyYWRpdXMiOlswLDBdLCJmaWxsQ29sb3IiOlswLDAsMF0sInN0cm9rZUNvbG9yIjpbMSwwLDBdLCJzdHJva2VXaWR0aCI6Mn1d"}]',
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
        'white',
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
                //fixed: {x:100,y:100, width: 100, height: 100}
            }
        },
        'Linie': {
            class: 'Line'
        },
        'Stern': {
            class: 'Star',
            defaults: {
              starpoints: 5,
              starpointsMin: 3,
              starpointsMax: 20,
              starpointsStep: 1,
              starsize: 0.8,
              starsizeMin: 0.25,
              starsizeMax: 0.95,
              starsizeStep: 0.05              
            }
        },
        'Polygon': {
            class: 'Polygon',
            defaults: {
              sides: 5,
              sidesMin: 3,
              sidesMax: 20,
              sidesStep: 1
            }
        },
        'Arc': {
            class: 'Arc',
            defaults: {
              angle: 2,
              angleMin: 0.1,
              angleMax: 5,
              angleStep: 0.01
            }
        },        
        'Clipart': {
            class: 'Raster',
            defaults: {
                source: "/vue-paint/img/default.png",
                fixed: false,
                defaultWidth: 300,
                defaultHeight: 300,
                keepAspect: false
            }
        },
        'Text MM': {
            class: 'Text',
            defaults: {
              rows: 15,
              cols: 60,
              width: 250,
              height: 60,
              mode: 'mm'
            }
        },        
        'Text': {
            class: 'Text',
            defaults: {
              rows: 15,
              cols: 60,
            }
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
                justification: 'right',
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
              gridSquare: true,
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
        },
        'Polyline': {
            class: 'Polyline',
            defaults: {
              closed: true,
              smooth: false
            }
        },        
      },
      translations: {
        'tools': 'Werkzeuge',
        'fixedtools': 'Container',
        'file': 'Datei',
        'preset': 'Einstellungen',
        'selection': 'Auswahl',
        'functions': 'Funktionen',
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
        'zoom': 'Zoom',
        'background': 'Hintergrund',
        'foreground': 'Vordergrund',
        'magnetic': 'Am Raster ausrichten'
      },
      grids: {
        Isometrie: {
          x: gridSize * 0.866,
          y: gridSize * 0.5
        },
        Eben: {
          x: gridSize * 0.5,
          y: gridSize * 0.5
        }
      },
      defaultGrid: 'Isometrie',
      verticalRulers: [20,100],
      horizontalRulers: [20,100]
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
