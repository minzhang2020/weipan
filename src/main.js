import Vue from 'vue'
import VueResource from 'vue-resource'
import VueTouch from 'vue-touch'
import Stock from './components/stock.vue'
Vue.use(VueResource)
Vue.use(VueTouch)
VueTouch.config.pan = {
    pointers: 2
}
new Vue({
    el: 'body',
    components: {
        Stock
    }
})
