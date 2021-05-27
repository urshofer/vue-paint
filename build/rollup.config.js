import commonjs from '@rollup/plugin-commonjs'; // Convert CommonJS modules to ES6
import vue from 'rollup-plugin-vue'; // Handle .vue SFC files
import css from 'rollup-plugin-css-only'
//import buble from '@rollup/plugin-buble'; // Transpile/polyfill with reasonable browser support
export default {
    input: 'src/wrapper.js', // Path relative to package.json
    output: {
        name: 'VuePainter',
        exports: 'named',
    },
    /*
    external: [              // Bundle Libs as well
        'js-base64',
        'paper',
        'wordwrapjs',
        'js-base64',
        'uuid'
    ],*/
    plugins: [
        commonjs(),
        css({
            output: 'vue-painter.css'
        }),
        vue({
            css: false, // Dynamically inject css as a <style> tag
            compileTemplate: true, // Explicitly convert template to render function
        })//,
        //buble(), // Transpile to ES5
    ],
};