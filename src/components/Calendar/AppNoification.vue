<template>
  <div>
    <Transition name="notification">
      <div 
        v-for="notification in activeNotifications" 
        :key="notification.id"
        class="notification fixed right-6 bg-white rounded-lg shadow-lg p-4 z-50 flex items-center"
        :class="getTypeClass(notification.type)"
        :style="{ top: `${notification.position}px` }"
      >
        <span class="mr-2">
          <i class="material-icons-round text-lg">{{ getIcon(notification.type) }}</i>
        </span>
        <span>{{ notification.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref,defineExpose } from 'vue';
import gsap from 'gsap';

const activeNotifications = ref([]);
let notificationCounter = 0;

function getIcon(type) {
  switch (type) {
    case 'success': return 'check_circle';
    case 'error': return 'error';
    case 'warning': return 'warning';
    case 'info': 
    default: return 'info';
  }
}

function getTypeClass(type) {
  switch (type) {
    case 'success': return 'border-l-4 border-green-500';
    case 'error': return 'border-l-4 border-red-500';
    case 'warning': return 'border-l-4 border-yellow-500';
    case 'info': 
    default: return 'border-l-4 border-blue-500';
  }
}

function showNotification(message, options = {}) {
  const {
    type = 'info',
    duration = 3000,
  } = options;
  
  const id = `notification-${notificationCounter++}`;
  const position = 20 + activeNotifications.value.length * 60;
  
  const notification = {
    id,
    message,
    type,
    position
  };
  
  activeNotifications.value.push(notification);
  
  // Eliminar después de la duración
  setTimeout(() => {
    const index = activeNotifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      // Animar salida con GSAP
      const notificationEl = document.querySelector(`[key="${id}"]`);
      if (notificationEl) {
        gsap.to(notificationEl, {
          x: 100,
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            activeNotifications.value.splice(index, 1);
            // Reposicionar las notificaciones restantes
            activeNotifications.value.forEach((n, i) => {
              n.position = 20 + i * 60;
            });
          }
        });
      } else {
        activeNotifications.value.splice(index, 1);
      }
    }
  }, duration);
  
  return id;
}

defineExpose({
  showNotification
});
</script>

<style scoped>
.notification {
  min-width: 300px;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>