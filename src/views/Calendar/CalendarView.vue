<template>
  <div class="calendar-main">
    <div v-if="!calendarReady" class="loader">
      <div class="loader-animation"></div>
      <p>Cargando calendario...</p>
    </div>
    
    <div v-else class="calendar-container">
      <FullCalendar
        ref="calendarRef"
        :options="calendarOptions"
        class="main-calendar"
      />
      
      <div class="activities-panel">
        <h3>Actividades</h3>
        <div class="activities-container">
          <div 
            v-for="(activity, index) in activities" 
            :key="index"
            class="draggable-activity"
            draggable="true"
            @dragstart="handleDragStart($event, activity)"
            :style="{ borderLeft: `4px solid ${activity.color}` }"
          >
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-duration">{{ activity.duration }} min</div>
            <div class="activity-tags">
              <span 
                v-for="tag in activity.tags" 
                :key="tag.id" 
                class="activity-tag"
                :style="{ backgroundColor: tag.color }"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
        </div>
        <button class="add-activity-btn" @click="showActivityForm = true">
          + Agregar actividad
        </button>
      </div>
    </div>

    <!-- Modal para añadir/editar actividad -->
    <div class="modal" v-if="showActivityForm">
      <div class="modal-backdrop" @click="showActivityForm = false"></div>
      <div class="modal-content">
        <h3>{{ currentActivity ? 'Editar' : 'Agregar' }} Actividad</h3>
        <form @submit.prevent="handleActivitySubmit">
          <div class="form-group">
            <label>Título</label>
            <input v-model="formActivity.title" required>
          </div>
          <div class="form-group">
            <label>Duración (minutos)</label>
            <input v-model="formActivity.duration" type="number" min="1" required>
          </div>
          <div class="form-group">
            <label>Color</label>
            <input v-model="formActivity.color" type="color">
          </div>
          <div class="form-group">
            <label>Etiquetas</label>
            <div class="tags-container">
              <div 
                v-for="tag in availableTags" 
                :key="tag.id"
                class="tag-option"
                :class="{ selected: formActivity.tags.some(t => t.id === tag.id) }"
                @click="toggleTag(tag)"
                :style="{ borderColor: tag.color }"
              >
                {{ tag.name }}
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" @click="showActivityForm = false">Cancelar</button>
            <button type="submit">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export default {
  components: {
    FullCalendar
  },
  setup() {
    // Estado del calendario
    const calendarReady = ref(false)
    const calendarRef = ref(null)
    const calendarOptions = reactive({
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      editable: true,
      selectable: true,
      droppable: true,
      events: [],
      eventClick: (info) => {
        handleEventClick(info);
      },
      dateClick: (info) => {
        selectedDate.value = info.dateStr;
        showActivityForm.value = true;
      },
      eventDrop: (info) => {
        console.log('Evento movido:', info.event);
        updateEvent(info.event);
      },
      eventReceive: (info) => {
        console.log('Evento recibido:', info.event);
        addEventToCalendar(info.event);
      }
    })

    // Estado de actividades
    const activities = ref([
      {
        id: 1,
        title: 'Reunión de equipo',
        duration: 60,
        color: '#4CAF50',
        tags: [{ id: 1, name: 'Trabajo', color: '#2196F3' }]
      },
      {
        id: 2,
        title: 'Ejercicio',
        duration: 45,
        color: '#FF9800',
        tags: [{ id: 2, name: 'Personal', color: '#9C27B0' }]
      },
      {
        id: 3,
        title: 'Leer',
        duration: 30,
        color: '#E91E63',
        tags: [{ id: 2, name: 'Personal', color: '#9C27B0' }]
      }
    ])

    // Estado de etiquetas
    const availableTags = ref([
      { id: 1, name: 'Trabajo', color: '#2196F3' },
      { id: 2, name: 'Personal', color: '#9C27B0' },
      { id: 3, name: 'Importante', color: '#F44336' },
      { id: 4, name: 'Familia', color: '#4CAF50' }
    ])

    // Estado del formulario
    const showActivityForm = ref(false)
    const currentActivity = ref(null)
    const selectedDate = ref(null)
    const formActivity = reactive({
      id: null,
      title: '',
      duration: 30,
      color: '#4CAF50',
      tags: []
    })

    // Eventos del calendario
    const events = ref([])

    // Carga inicial de datos
    const loadInitialData = () => {
      // Simulando carga de datos
      setTimeout(() => {
        calendarReady.value = true
        
        // Añadir algunos eventos de ejemplo
        const now = new Date()
        events.value = [
          {
            id: 'event1',
            title: 'Reunión de equipo',
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0),
            backgroundColor: '#4CAF50',
            borderColor: '#4CAF50',
            extendedProps: {
              activityId: 1,
              tags: [{ id: 1, name: 'Trabajo', color: '#2196F3' }]
            }
          }
        ]
        
        nextTick(() => {
          updateCalendarEvents()
        })
      }, 1000)
    }

    // Actualizar eventos en el calendario
    const updateCalendarEvents = () => {
      if (calendarRef.value) {
        const calendarApi = calendarRef.value.getApi()
        calendarApi.removeAllEvents()
        events.value.forEach(event => {
          calendarApi.addEvent(event)
        })
      }
    }

    // Manejar inicio de arrastre
    const handleDragStart = (event, activity) => {
      event.dataTransfer.setData('text/plain', JSON.stringify({
        title: activity.title,
        id: activity.id,
        duration: activity.duration,
        backgroundColor: activity.color,
        borderColor: activity.color,
        extendedProps: {
          activityId: activity.id,
          tags: activity.tags
        }
      }))
    }

    // Manejar clic en evento
    const handleEventClick = (info) => {
      const eventId = info.event.id
      const event = events.value.find(e => e.id === eventId)
      
      if (event) {
        const activity = activities.value.find(a => a.id === event.extendedProps.activityId)
        
        if (activity) {
          currentActivity.value = { ...activity }
          formActivity.id = activity.id
          formActivity.title = activity.title
          formActivity.duration = activity.duration
          formActivity.color = activity.color
          formActivity.tags = [...activity.tags]
          showActivityForm.value = true
        }
      }
    }

    // Añadir evento al calendario
    const addEventToCalendar = (event) => {
      const newEvent = {
        id: `event${Date.now()}`,
        title: event.title,
        start: event.start,
        end: event.end,
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        extendedProps: event.extendedProps
      }
      
      events.value.push(newEvent)
    }

    // Actualizar evento
    const updateEvent = (event) => {
      const index = events.value.findIndex(e => e.id === event.id)
      
      if (index !== -1) {
        events.value[index] = {
          ...events.value[index],
          start: event.start,
          end: event.end
        }
      }
    }

    // Manejar envío del formulario
    const handleActivitySubmit = () => {
      if (currentActivity.value) {
        // Actualizar actividad existente
        const index = activities.value.findIndex(a => a.id === formActivity.id)
        if (index !== -1) {
          activities.value[index] = {
            ...activities.value[index],
            title: formActivity.title,
            duration: parseInt(formActivity.duration),
            color: formActivity.color,
            tags: [...formActivity.tags]
          }
        }
      } else {
        // Añadir nueva actividad
        const newActivity = {
          id: Date.now(),
          title: formActivity.title,
          duration: parseInt(formActivity.duration),
          color: formActivity.color,
          tags: [...formActivity.tags]
        }
        
        activities.value.push(newActivity)
      }
      
      // Limpiar formulario
      resetForm()
      showActivityForm.value = false
    }

    // Reiniciar formulario
    const resetForm = () => {
      currentActivity.value = null
      formActivity.id = null
      formActivity.title = ''
      formActivity.duration = 30
      formActivity.color = '#4CAF50'
      formActivity.tags = []
    }

    // Alternar etiqueta
    const toggleTag = (tag) => {
      const index = formActivity.tags.findIndex(t => t.id === tag.id)
      
      if (index === -1) {
        formActivity.tags.push(tag)
      } else {
        formActivity.tags.splice(index, 1)
      }
    }

    // Inicialización
    onMounted(() => {
      loadInitialData()
    })

    return {
      calendarReady,
      calendarRef,
      calendarOptions,
      activities,
      availableTags,
      showActivityForm,
      currentActivity,
      selectedDate,
      formActivity,
      handleDragStart,
      handleActivitySubmit,
      toggleTag
    }
  }
}
</script>

<style>
.calendar-main {
  position: relative;
  height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;
  font-family: Arial, sans-serif;
}

/* Estilos del cargador */
.loader {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.loader-animation {
  width: 50px;
  height: 50px;
  margin-bottom: 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Estilos del contenedor del calendario */
.calendar-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.main-calendar {
  flex: 1;
  min-width: 60%;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: white;
  padding: 20px;
}

/* Estilos del panel de actividades */
.activities-panel {
  width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.activities-container {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.draggable-activity {
  padding: 10px;
  margin-bottom: 8px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  cursor: grab;
  transition: all 0.2s ease;
}

.draggable-activity:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.activity-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.activity-duration {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.activity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.activity-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  color: white;
  white-space: nowrap;
}

.add-activity-btn {
  width: 100%;
  padding: 8px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-activity-btn:hover {
  background-color: #45a049;
}

/* Estilos del modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.modal-content {
  width: 400px;
  max-width: 90%;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  position: relative;
  z-index: 1010;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

/* Estilos del formulario */
.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.tag-option {
  padding: 4px 8px;
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-option.selected {
  background-color: #f0f0f0;
  font-weight: bold;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.form-actions button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.form-actions button[type="button"] {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
}

.form-actions button[type="submit"] {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.form-actions button:hover {
  opacity: 0.9;
}

/* Estilos responsive */
@media (max-width: 768px) {
  .calendar-container {
    flex-direction: column;
  }
  
  .main-calendar {
    min-width: 100%;
  }
  
  .activities-panel {
    width: 100%;
  }
}
</style>