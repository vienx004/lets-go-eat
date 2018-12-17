const Vue = require('nativescript-vue');
const Vuex = require('vuex');
const ApplicationSettings = require('tns-core-modules/application-settings');
Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        name: "",
        placeId: ""
    },
    mutations: {
        load(state) {
            if(ApplicationSettings.getString("store")) {
                this.replaceState(
                    Object.assign(state, JSON.parse(ApplicationSettings.getString("store")))
                );
            }
        },
        save(state, data) {
            state.name = data.name;
            state.placeId = data.placeId;
        }
    }
});


Vue.prototype.$store = store;

module.exports = store;