import axios from "axios";
import authHeader from "./auth-header";

/* const BASE_URL = process.env.VUE_APP_API_BASE_URL; */

export default {
  async login(userData) {
    try {
      const response = await axios.post(`/auth/login`, userData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });
      if (response && response.data && response.data.token) {
        localStorage.setItem("user_free", JSON.stringify(response.data.token));
        return response;
      } else {
        throw new Error("La respuesta no contiene un token");
      }
    } catch (error) {
      console.error("Error en servicio de login:", error);
      if (error.code === "ECONNABORTED") {
        throw new Error("Tiempo de espera agotado");
      }

      if (error.response) {
        const errorMsg =
          error.response.data?.message ||
          `Error ${error.response.status}: ${error.response.statusText}`;
        console.error("Error de respuesta:", errorMsg);
        throw new Error(errorMsg);
      } else if (error.request) {
        console.error("No se recibió respuesta:", error.request);
        throw new Error("No se recibió respuesta del servidor");
      }

      throw error;
    }
  },

  async logout() {
    await axios.post("/auth/logout", {}, { headers: authHeader() });
    localStorage.removeItem("user_free");
  },

  async register(user) {
    try {
      const response = await axios.post(
        "/auth/register",
        {
          name: user.name,
          password: user.password,
          password_confirmation: user.password_confirmation,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.token) {
        localStorage.setItem("user_free", JSON.stringify(response.data.token));
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 422) {
          const errors = error.response.data.errors;
          let errorMessages = [];

          for (const key in errors) {
            errorMessages.push(...errors[key]);
          }

          throw new Error(errorMessages.join("\n"));
        }

        throw new Error(error.response.data.message || "Error en el servidor");
      } else {
        throw error;
      }
    }
  },

  async checkSession() {
    const token = localStorage.getItem("user_free");

    if (token) {
      try {
        axios.defaults.headers.common["Authorization"] =
          "Bearer " + JSON.parse(token);

        const response = await axios.get("/auth/me");

        if (response.data) {
          console.log("Usuario autenticado:", response.data);
        }
      } catch (error) {
        console.error("Error validando sesión:", error);
        // Token inválido, redirigir a login y limpiar el storage
        localStorage.removeItem("user_free");
        delete axios.defaults.headers.common["Authorization"];
        // Redirigir a login si quieres
      }
    } else {
      console.log("No hay token en localStorage");
      // No hay sesión, ir a login
    }
  },

  /* async passwordForgot(userEmail) {

    var response = await axios.post(API_URL + '/password-forgot', {
      redirect_url: BASE_URL + "/password-reset",
      email: userEmail
    })
    return response.status;
  },

  async passwordReset(passwordDTO) {

    var response = await axios.post(API_URL + '/password-reset', {
      password: passwordDTO.newPassword,
      password_confirmation: passwordDTO.confirmPassword,
      email: passwordDTO.email,
      token: passwordDTO.token
    })
    return response.status;
  } */
};
