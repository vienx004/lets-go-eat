import Vue from 'nativescript-vue'
import App from './components/App'
import VueDevtools from 'nativescript-vue-devtools'
import axios from 'axios'
import store from './store'
import Vuetify from 'vuetify'

if(TNS_ENV !== 'production') {
  Vue.use(VueDevtools)
}
// Prints Vue logs when --env.production is *NOT* set while building
Vue.config.silent = (TNS_ENV === 'production')

Vue.use(axios, VueDevtools, Vuetify);
Vue.registerElement("CardView", () => require('nativescript-cardview').CardView);

new Vue({
  store,
  render: h => h('frame', [h(App)])
}).$start()
