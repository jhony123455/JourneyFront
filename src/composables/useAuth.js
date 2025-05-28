import { useStore } from 'vuex';
import { computed } from 'vue';

export default function useAuth() {
  const store = useStore();

  const isAuthenticated = computed(() => store.getters['auth/isLoggedIn']);
  const token = computed(() => store.getters['auth/getToken']);
  const user = computed(() => store.getters['auth/getUser']);

  function getAuthHeaders() {
    const currentToken = token.value;
    if (!currentToken) {
      console.warn('No authentication token found');
      return {};
    }
    
    return {
      'Authorization': `Bearer ${currentToken}`
    };
  }

  return {
    isAuthenticated,
    token,
    user,
    getAuthHeaders
  };
}