import Vue from 'vue'
import App from './App.vue'
import store from './store'

Vue.config.productionTip = false

new Vue({
  store, // 将 store  为 (new Vue).$store, 会在所有的组件 $store
  render: h => h(App)
}).$mount('#app')
