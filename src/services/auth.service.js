import axios from "axios";
import authHeader from "./auth-header";

const BASE_URL = process.env.VUE_APP_API_BASE_URL;

export default {
  async login(user) {
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/login`,
        {
          name: user.name,
          password: user.password
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 segundos de timeout
        }
      );
  
      if (!response.data.token) {
        throw new Error('No se recibió token en la respuesta');
      }
  
      localStorage.setItem("user_free", JSON.stringify(response.data.token));
      return response.data;
      
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Tiempo de espera agotado');
      }
      throw error;
    }
  },

  async logout() {
    await axios.post(BASE_URL + "/logout", {}, { headers: authHeader() });
    localStorage.removeItem("user_free");
  },

  async register(user) {
    try {
      const response = await axios.post(
        BASE_URL + "/auth/register",
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
