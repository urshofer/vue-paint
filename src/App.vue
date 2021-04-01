<template>
  <div id="app">
    <div class="painter">
      <VuePainter v-bind:data="data" v-on:save="onSave"/>
    </div>
    <div class="debug" v-on:click="svg = json = ''">
      {{json}}
      {{svg}}
    </div>
  </div>
</template>

<script>
import VuePainter from './components/VuePainter'
import { saveAs } from 'file-saver';

export default {
  name: 'App',
  components: {
    VuePainter
  },
  data() {
    return {
      data: '[{"prototype":"Star","data":["Path",{"applyMatrix":true,"segments":[[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300],[550,300]],"closed":true,"fillColor":[0,0,0,1],"strokeColor":[1,0,0,1],"strokeWidth":2}]},{"prototype":"Star","data":["Path",{"applyMatrix":true,"segments":[[500,175],[520.16884,125.90578],[531.24746,177.81232],[559.85829,133.10836],[561.49059,186.1589],[597.62384,147.282],[589.75737,199.77146],[632.25168,167.97118],[615.13928,218.21249],[662.62884,194.5109],[636.82051,240.88928],[687.77898,226.04818],[654.10422,267.07298],[706.89375,261.56937],[666.43489,295.92203],[719.35878,299.93279],[673.41621,326.50918],[724.77344,339.90541],[674.82379,357.85135],[722.9637,380.20248],[670.61238,388.94116],[713.98772,419.52882],[660.91736,418.77938],[698.13399,456.62045],[646.05032,446.40697],[675.91208,490.28521],[626.4891,470.93596],[648.03621,519.44108],[602.86242,491.57797],[615.40234,543.15098],[575.92965,507.66955],[579.05934,560.65285],[546.55645,518.6935],[540.1753,571.38416],[515.68688,524.2955],[500,575],[484.31312,524.2955],[459.8247,571.38416],[453.44355,518.6935],[420.94066,560.65285],[424.07035,507.66955],[384.59766,543.15098],[397.13758,491.57797],[351.96379,519.44108],[373.5109,470.93596],[324.08792,490.28521],[353.94968,446.40697],[301.86601,456.62045],[339.08264,418.77938],[286.01228,419.52882],[329.38762,388.94116],[277.0363,380.20248],[325.17621,357.85135],[275.22656,339.90541],[326.58379,326.50918],[280.64122,299.93279],[333.56511,295.92203],[293.10625,261.56937],[345.89578,267.07298],[312.22102,226.04818],[363.17949,240.88928],[337.37116,194.5109],[384.86072,218.21249],[367.74832,167.97118],[410.24263,199.77146],[402.37616,147.282],[438.50941,186.1589],[440.14171,133.10836],[468.75254,177.81232],[479.83116,125.90578]],"closed":true,"fillColor":[1,0,0,0.5],"strokeColor":[0,0.50196,0,0.5],"strokeWidth":"0"}]},{"prototype":"Square","data":["Shape",{"applyMatrix":false,"matrix":[1,0,0,1,200,475],"type":"rectangle","size":[300,300],"radius":[80,80],"fillColor":[0,0,1,0.5],"strokeColor":[0,0.50196,0,0.5],"strokeWidth":"0"}]},{"prototype":"Line","data":["Path",{"applyMatrix":true,"segments":[[26,25],[976,25]],"fillColor":[1,0,0,1],"strokeColor":[1,0,0,1],"strokeWidth":"10"}]},{"prototype":"Line","data":["Path",{"applyMatrix":true,"segments":[[25,25],[25,650]],"fillColor":[0,0.50196,0,1],"strokeColor":[0,0.50196,0,1],"strokeWidth":"10"}]},{"prototype":"Line","data":["Path",{"applyMatrix":true,"segments":[[25,650],[975,650]],"fillColor":[0,0,0,1],"strokeColor":[0,0,0,1],"strokeWidth":"10"}]},{"prototype":"Line","data":["Path",{"applyMatrix":true,"segments":[[975,650],[25,25]],"fillColor":[0,0,0,1],"strokeColor":[1,0,0,1],"strokeWidth":2}]},{"prototype":"Line","data":["Path",{"applyMatrix":true,"segments":[[975,25],[25,650]],"fillColor":[0,0,0,1],"strokeColor":[1,0,0,1],"strokeWidth":2}]},{"prototype":"Line","data":["Path",{"applyMatrix":true,"segments":[[975,25],[975,650]],"fillColor":[0,0,1,1],"strokeColor":[0,0,1,1],"strokeWidth":"10"}]},{"prototype":"Line","data":["Path",{"applyMatrix":true,"segments":[[325,350],[325,350]],"fillColor":[0,0,0,1],"strokeColor":[1,0,0,1],"strokeWidth":2}]},{"prototype":"Line","data":["Path",{"applyMatrix":true,"segments":[[925,250],[925,250]],"fillColor":[0,0,0,1],"strokeColor":[1,0,0,1],"strokeWidth":2}]},{"prototype":"Circle","data":["Shape",{"applyMatrix":false,"matrix":[1,0,0,1,775,225],"type":"ellipse","size":[350,350],"radius":[175,175],"fillColor":[0,0.50196,0,0.5],"strokeColor":[0,0.50196,0,0.5],"strokeWidth":"0"}]},{"prototype":"Circle","data":["Shape",{"applyMatrix":false,"matrix":[1,0,0,1,400,125],"type":"ellipse","size":[0,0],"radius":[0,0],"fillColor":[0,0,1,1],"strokeColor":[0,0.50196,0,1],"strokeWidth":"0"}]},{"prototype":"Circle","data":["Shape",{"applyMatrix":false,"matrix":[1,0,0,1,225,425],"type":"ellipse","size":[0,0],"radius":[0,0],"fillColor":[0,0,1,1],"strokeColor":[0,0.50196,0,1],"strokeWidth":"0"}]},{"prototype":"Circle","data":["Shape",{"applyMatrix":false,"matrix":[1,0,0,1,150,225],"type":"ellipse","size":[0,0],"radius":[0,0],"fillColor":[1,0,0,0.5],"strokeColor":[0,0.50196,0,0.5],"strokeWidth":"0"}]},{"prototype":"Circle","data":["Shape",{"applyMatrix":false,"matrix":[1,0,0,1,300,25],"type":"ellipse","size":[0,0],"radius":[0,0],"fillColor":[0,0,0,0.5],"strokeColor":[0,0.50196,0,0.5],"strokeWidth":"0"}]},{"prototype":"Circle","data":["Shape",{"applyMatrix":false,"matrix":[1,0,0,1,200,25],"type":"ellipse","size":[0,0],"radius":[0,0],"fillColor":[0,0,0,0.5],"strokeColor":[0,0.50196,0,0.5],"strokeWidth":"0"}]},{"prototype":"Circle","data":["Shape",{"applyMatrix":false,"matrix":[1,0,0,1,200,25],"type":"ellipse","size":[0,0],"radius":[0,0],"fillColor":[0,0,0,0.5],"strokeColor":[0,0.50196,0,0.5],"strokeWidth":"0"}]},{"prototype":"Circle","data":["Shape",{"applyMatrix":false,"matrix":[1,0,0,1,975,525],"type":"ellipse","size":[0,0],"radius":[0,0],"fillColor":[0,0,0,1],"strokeColor":[0,0,0,1],"strokeWidth":"10"}]},{"prototype":"Circle","data":["Shape",{"applyMatrix":false,"matrix":[1,0,0,1,975,525],"type":"ellipse","size":[0,0],"radius":[0,0],"fillColor":[0,0,0,1],"strokeColor":[0,0,0,1],"strokeWidth":"10"}]},{"prototype":"Square","data":["Shape",{"applyMatrix":false,"matrix":[1,0,0,1,200,200],"selected":true,"type":"rectangle","size":[300,300],"radius":[80,80],"fillColor":[0,0,1,0.5],"strokeColor":[0,0.50196,0,0.5],"strokeWidth":"0"}]}]',
      json: '',
      svg: ''
    }
  },
  methods: {
    onSave(data) {
      this.svg = data.svg
      this.json = data.json
			saveAs(new Blob([this.svg], {type: "image/svg+xml;charset=" + document.characterSet}), 'painter.svg');
			saveAs(new Blob([this.json], {type: "application/json;charset=" + document.characterSet}), 'painter.json');

    }
  }

}
</script>

<style>
#app {
  font-family: Courier, Helvetica, Arial, sans-serif;
  color: #000;
}
.painter {
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 80%;
}
.debug {
  position: absolute;
  left: 0px;
  bottom: 0px;
  width: 100%;
  height: 20%;
  background: #000;
  color: #FFF;
}
</style>
