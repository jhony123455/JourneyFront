import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";
import router from "./router";
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";
import MaterialDashboard from "./material-dashboard";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import axios from "axios";

const BASE_URL = process.env.VUE_APP_API_BASE_URL;
axios.defaults.baseURL = BASE_URL;



const token = JSON.parse(localStorage.getItem("user_free"));
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const appInstance = createApp(App);
appInstance.use(ElementPlus);
appInstance.use(store);
appInstance.use(router);
appInstance.use(MaterialDashboard);
appInstance.mount("#app");
