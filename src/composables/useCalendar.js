import { ref, computed } from 'vue'
import { ElNotification } from 'element-plus'

export function useCalendar() {
  const calendarReady = ref(false)
  const calendarRef = ref(null)
  const showContextMenu = ref(false)
  const contextMenuPosition = ref({ x: 0, y: 0 })
  const selectedEvent = ref(null)
  
  const scheduledEvents = ref([])
  
  // Simular carga del calendario
  const loadCalendar = () => {
    setTimeout(() => {
      calendarReady.value = true
    }, 1000)
  }
  
  // Mostrar notificación
  const showNotification = (message, type = 'success') => {
    ElNotification({
      title: type === 'success' ? 'Éxito' : 'Error',
      message,
      type,
      duration: 3000
    })
  }
  
  // Formatear fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  
  // Refrescar calendario
  const refreshCalendar = () => {
    if (calendarRef.value?.getApi) {
      calendarRef.value.getApi().refetchEvents()
    }
  }
  
  return {
    calendarReady,
    calendarRef,
    showContextMenu,
    contextMenuPosition,
    selectedEvent,
    scheduledEvents,
    loadCalendar,
    showNotification,
    formatDate,
    refreshCalendar
  }
}