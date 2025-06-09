import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'

import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Import auth utils for global access
import { authUtils } from './utils/auth'

Vue.config.productionTip = false

// Make auth utils globally available in all components
Vue.prototype.$auth = authUtils

// Global error handler for authentication errors
Vue.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err, info)

  // Handle authentication errors globally (e.g. 401 Unauthorized)
  if (err.message && err.message.includes('401')) {
    authUtils.removeToken() // FIX: old code had removeAuth, your method is removeToken
    // Optional: redirect to login page
    // router.push('/login')
  }
}

// Toast configuration
const toastOptions = {
  position: "top-right",
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: "button",
  icon: true,
  rtl: false
}

Vue.use(Toast, toastOptions)

new Vue({
  router,
  vuetify,
  render: h => h(App)
}).$mount('#app')
