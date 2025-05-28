import AuthService from '../services/auth.service';

const user = JSON.parse(localStorage.getItem('user_free'));
const initialState = {
  user: user,
  status: { loggedIn: !!user },
  token: AuthService.getToken()
};

export const auth = {
  namespaced: true,
  state: initialState,
  actions: {
    async login({ commit }, userData) {
      try {
        const response = await AuthService.login(userData);
        const { token, ...userInfo } = response.data;
        commit('loginSuccess', { user: userInfo, token });
        return response;
      } catch (error) {
        console.error("Error capturado en acción login:", error);
        commit('loginFailure');
        throw error;
      }
    },
    async logout({ commit }) {
      try {
        await AuthService.logout();
        commit('logout');
      } catch(error) {
        console.error("Error en logout:", error);
        // Aún así limpiamos el estado
        commit('logout');
      }
    },
    async register({ commit }, user) {
      try {
        const response = await AuthService.register(user);
        const { token, ...userInfo } = response.data;
        commit('loginSuccess', { user: userInfo, token });
        return response;
      } catch (error) {
        commit('loginFailure');
        throw error;
      }
    },
    async checkSession({ commit }) {
      try {
        const response = await AuthService.checkSession();
        if (response.data) {
          commit('loginSuccess', { 
            user: response.data.user,
            token: response.data.token 
          });
          return response.data;
        }
        throw new Error('Invalid session');
      } catch (error) {
        commit('loginFailure');
        throw error;
      }
    },
    async refreshToken({ commit }) {
      try {
        const token = await AuthService.refreshToken();
        commit('updateToken', token);
        return token;
      } catch (error) {
        commit('loginFailure');
        throw error;
      }
    },
    async passwordForgot({commit}, userEmail) {
      await AuthService.passwordForgot(userEmail);
    },
    async passwordReset({commit}, passwordDTO) {
      await AuthService.passwordReset(passwordDTO);
    },
  },
  mutations: {
    loginSuccess(state, { user, token }) {
      state.status.loggedIn = true;
      state.user = user;
      state.token = token;
    },
    loginFailure(state) {
      state.status.loggedIn = false;
      state.user = null;
      state.token = null;
      AuthService.clearToken();
    },
    logout(state) {
      state.status.loggedIn = false;
      state.user = null;
      state.token = null;
      AuthService.clearToken();
    },
    updateToken(state, token) {
      state.token = token;
    }
  },
  getters: {
    isLoggedIn: state => state.status.loggedIn,
    getToken: state => state.token || AuthService.getToken(),
    getUser: state => state.user
  }
};