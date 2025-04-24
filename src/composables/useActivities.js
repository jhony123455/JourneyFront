import { ref, watch } from 'vue'
import { useCalendar } from './useCalendar'

export function useActivities() {
  const { scheduledEvents, showNotification } = useCalendar()
  
  const availableActivities = ref([])
  const showModal = ref(false)
  const editMode = ref(false)
  const currentActivityId = ref(null)
  const currentEventId = ref(null)
  
  // Nueva actividad
  const newActivity = ref({
    title: "",
    color: "#5e72e4",
    tags: [],
  })
  
  // Datos para programación
  const scheduledDate = ref("")
  const scheduleTime = ref("09:00")
  const eventDuration = ref(60)
  
  // Cargar/guardar datos
  const loadActivities = () => {
    const saved = localStorage.getItem('calendarActivities')
    if (saved) availableActivities.value = JSON.parse(saved)
  }
  
  const saveActivities = () => {
    localStorage.setItem('calendarActivities', JSON.stringify(availableActivities.value))
  }
  
  // Watcher para guardar automáticamente
  watch(availableActivities, saveActivities, { deep: true })
  
  return {
    availableActivities,
    showModal,
    editMode,
    currentActivityId,
    currentEventId,
    newActivity,
    scheduledDate,
    scheduleTime,
    eventDuration,
    loadActivities,
    saveActivities
  }
}