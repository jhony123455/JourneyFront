const isAuthenticated = () => {
    const token = localStorage.getItem('user_free');
    return !!token;
  };
  
  export function authGuard(to, from, next) {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
    if (requiresAuth && !isAuthenticated()) {
      next('/login');
    } else {
      next();
    }
  }