import { ref, computed } from "vue";

export default function useAuth() {
  const token = ref(localStorage.getItem("user_free") || null);
  
  const isAuthenticated = computed(() => !!token.value);
  
  function getAuthHeaders() {
    if (!token.value) {
      return {};
    }
    
    return {
      Authorization: `Bearer ${JSON.parse(token.value)}`
    };
  }

  function logout() {
    localStorage.removeItem("user_free");
    token.value = null;
  }

  return {
    token,
    isAuthenticated,
    getAuthHeaders,
    logout
  };
}