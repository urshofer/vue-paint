<template>
  <div id="app">
    <VuePainter/>
  </div>
</template>

<script>
import VuePainter from './components/VuePainter'

export default {
  name: 'App',
  components: {
    VuePainter
  }
}
</script>

<style>
#app {
  font-family: Helvetica, Arial, sans-serif;
  color: #000;
}
</style>
