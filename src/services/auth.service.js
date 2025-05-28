import axios from "axios";
import authHeader from "./auth-header";

/* const BASE_URL = process.env.VUE_APP_API_BASE_URL; */

// Mantener el token en memoria (más seguro que localStorage)
let inMemoryToken = null;
let refreshTokenTimeoutId = null;

export default {
  getToken() {
    return inMemoryToken;
  },

  setToken(token) {
    inMemoryToken = token;
  },

  clearToken() {
    inMemoryToken = null;
    if (refreshTokenTimeoutId) {
      clearTimeout(refreshTokenTimeoutId);
      refreshTokenTimeoutId = null;
    }
  },

  setupRefreshToken(expiresIn) {
    const refreshTime = (expiresIn * 1000) - 60000; // Refrescar 1 minuto antes de que expire
    if (refreshTokenTimeoutId) {
      clearTimeout(refreshTokenTimeoutId);
    }
    refreshTokenTimeoutId = setTimeout(() => this.refreshToken(), refreshTime);
  },

  async login(userData) {
    try {
      const response = await axios.post(`/auth/login`, userData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        }
      });

      const { token, user, message } = response.data;
      
      if (!token) {
        throw new Error('No se recibió token en la respuesta');
      }

      this.setToken(token);
      
      // Solo guardamos la info del usuario en localStorage, no el token
      if (user) {
        localStorage.setItem("user_free", JSON.stringify(user));
      }
      
      return {
        data: {
          token,
          ...user
        }
      };
    } catch (error) {
      this.clearToken();
      console.error("Error en servicio de login:", error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw error;
    }
  },

  async logout() {
    try {
      if (inMemoryToken) {
        await axios.post("/auth/logout", {}, { 
          headers: { 
            Authorization: `Bearer ${inMemoryToken}`,
            Accept: "application/json"
          } 
        });
      }
    } finally {
      this.clearToken();
      localStorage.removeItem("user_free");
    }
  },

  async register(userData) {
    try {
      const response = await axios.post(
        "/auth/register",
        userData,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const { token, user } = response.data;
      
      if (!token) {
        throw new Error('No se recibió token en la respuesta');
      }

      this.setToken(token);
      
      if (user) {
        localStorage.setItem("user_free", JSON.stringify(user));
      }
      
      return {
        data: {
          token,
          ...user
        }
      };
    } catch (error) {
      this.clearToken();
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async checkSession() {
    const token = this.getToken();
    if (!token) {
      throw new Error('No hay token disponible');
    }

    try {
      const response = await axios.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      });

      return {
        data: {
          user: response.data,
          token: token
        }
      };
    } catch (error) {
      this.clearToken();
      localStorage.removeItem("user_free");
      throw error;
    }
  },

  async refreshToken() {
    try {
      const response = await axios.post('/auth/refresh', null, {
        headers: { 
          Authorization: `Bearer ${inMemoryToken}`,
          Accept: "application/json"
        }
      });
      
      const { token } = response.data;
      if (!token) {
        throw new Error('No se recibió token en la respuesta de refresh');
      }

      this.setToken(token);
      return token;
    } catch (error) {
      this.clearToken();
      localStorage.removeItem("user_free");
      throw error;
    }
  },

  async passwordForgot(email) {
    return axios.post('/api/auth/forgot-password', { email });
  },

  async passwordReset(data) {
    return axios.post('/api/auth/reset-password', data);
  }
};
