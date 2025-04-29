import AuthService from '../services/auth.service';

const user = JSON.parse(localStorage.getItem('user_free'));
const initialState = user ? { loggedIn: true } : { loggedIn: false };
const stateD = {
  user: localStorage.getItem('user_free')
    ? JSON.parse(localStorage.getItem('user_free'))
    : null,
  status: localStorage.getItem('user_free')
    ? { loggedIn: true }
    : { loggedIn: false }
};

export const auth = {
  namespaced: true,
  state: stateD,
  actions: {
    async login({ commit }, userData) {
      try {
        const response = await AuthService.login(userData);
        commit('loginSuccess', response.data);
        return response;
      } catch (error) {
        console.error("Error capturado en acción login:", error);
        commit('loginFailure');
        throw error; // Importante: re-lanzamos el error para que handleLogin pueda manejarlo
      }
    },
    async logout({ commit }) {
      try {
        await AuthService.logout();
        commit('isLoggedIn', false);
      }catch(error){
        commit('isLoggedIn', true);
      }
    },
    async register({ commit }, user) {
      try {
        await AuthService.register(user);
        commit('isLoggedIn', true);
      } catch (error) {
        commit('isLoggedIn', false);
        throw(error)
      }
    },
    // eslint-disable-next-line no-unused-vars
    async passwordForgot({commit}, userEmail){
      await AuthService.passwordForgot(userEmail);
    },
    // eslint-disable-next-line no-unused-vars
    async passwordReset({commit}, passwordDTO){
      await AuthService.passwordReset(passwordDTO);
    },
  },
  mutations: {
    loginSuccess(state, userData) {
      state.status = { loggedIn: true };
      state.user = userData;
    },
    loginFailure(state) {
      state.status = { loggedIn: false };
      state.user = null;
    },
    logout(state) {
      state.status = { loggedIn: false };
      state.user = null;
    }
  },
  getters: {
    isLoggedIn(state){
      return state.loggedIn;
    }
  }, 
  
};