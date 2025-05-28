import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";
import router from "./router";
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";
import MaterialDashboard from "./material-dashboard";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "@/assets/css/calendar.css";
import axios from "axios";
import AuthService from "./services/auth.service";

// Configurar axios
axios.defaults.baseURL = process.env.VUE_APP_API_URL || 'http://localhost:8000/api';

// Interceptor para añadir el token a todas las peticiones
axios.interceptors.request.use(
  (config) => {
    // No añadir token para login/registro
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
      return config;
    }

    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no estamos ya intentando refrescar el token
    // Y no estamos en login/register
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/register')) {
      
      originalRequest._retry = true;

      try {
        // Intentar refrescar el token
        await store.dispatch('auth/refreshToken');
        
        // Actualizar el token en la petición original y reintentarla
        const token = AuthService.getToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Limpiar datos de usuario y token
        store.dispatch('auth/logout');
        // Solo redirigir si no estamos ya en la página de login
        if (router.currentRoute.value.name !== 'login') {
          router.push('/login');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Función para verificar si la ruta actual es login o registro
const isAuthRoute = (route) => {
  return ['login', 'register'].includes(route.name);
};

// Intentar recuperar la sesión solo si:
// 1. Hay información de usuario
// 2. No estamos en una ruta de autenticación
const user = JSON.parse(localStorage.getItem("user_free"));
if (user && !isAuthRoute(router.currentRoute.value)) {
  // Intentar validar la sesión sin refrescar el token inmediatamente
  store.dispatch('auth/checkSession').catch(() => {
    if (!isAuthRoute(router.currentRoute.value)) {
      router.push('/login');
    }
  });
}

const app = createApp(App);
app.use(ElementPlus);
app.use(store);
app.use(router);
app.use(MaterialDashboard);
app.mount("#app");
