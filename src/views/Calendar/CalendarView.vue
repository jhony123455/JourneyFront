<template>
  <div class="relative">
    <SeasonLoader v-if="!calendarReady || isLoading" />
    
    <FullCalendarWrapper
      v-if="calendarReady"
      ref="calendarRef"
      :calendar-ready="calendarReady"
      :calendar-options="calendarOptions"
      :available-activities="availableActivities"
      @show-event-details="handleShowEventDetails"
      @show-context-menu="handleShowContextMenu"
    />
    
    <FloatingActionButton @click="openAddActivity" />
    
    <!-- Actividades Disponibles -->
    <ActivitiesCard
      :available-activities="availableActivities"
      @add-activity="openAddActivity"
      @manage-tags="openTagManager"
      @drag-start="handleDragStart"
      @edit-activity="editActivity"
      @delete-activity="deleteActivityAndEvents"
    />
    
    <!-- Modal para Agregar/Editar Actividades -->
    <AddActivityModal
      :show-modal="showModal"
      :edit-mode="editMode"
      :activity="currentActivity"
      :available-tags="availableTags"
      @close="closeModal"
      @save="saveActivityFromModal"
      @delete="deleteActivityAndEvents"
    />

    <!-- Gestionar Etiquetas -->
    <TagManagerModal
     :show-tag-modal="showTagModal"
      :available-tags="availableTags"
      @close="closeTagModal"
      @delete-tag="deleteTag"
      @add-new-tag="addNewTag"
    />
    
    <!-- Menú Contextual -->
    <ContextMenu
      :show-context-menu="showContextMenu"
      :context-menu-position="contextMenuPosition"
      @edit="editSelectedEvent"
      @duplicate="duplicateSelectedEvent"
      @delete="deleteSelectedEvent"
    />

    <!-- Diálogo de Detalles del Evento -->
    <EventDetailsDialog
      v-model="showEventDetails"
      :event="selectedEventDetails"
      @delete="handleDeleteFromDetails"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SeasonLoader from '@/views/components/SeasonLoader.vue';
import FullCalendarWrapper from '@/components/Calendar/FullCalendarWrapper.vue';
import FloatingActionButton from '@/components/Calendar/FloatingActionButton.vue';
import ActivitiesCard from '@/components/Calendar/ActivitiesCard.vue';
import AddActivityModal from '@/components/Calendar/AddActivityModal.vue';
import TagManagerModal from '@/components/Calendar/TagManagerModal.vue';
import ContextMenu from '@/components/Calendar/ContextMenu.vue';
import EventDetailsDialog from '@/components/Calendar/EventDetailsDialog.vue';
import useCalendar from '@/composables/useCalendar';
import useAnimation from '@/composables/useAnimation';
import useApi from '@/composables/useApi';

const {
  calendarReady,
  calendarRef,
  showModal,
  showTagModal,
  editMode,
  currentActivityId,
  currentEventId,
  showContextMenu,
  contextMenuPosition,
  selectedEvent,
  scheduledDate,
  scheduleTime,
  eventDuration,
  availableTags,
  availableActivities,
  scheduledEvents,
  newActivity,
  selectedTags,
  selectedTag,
  newTagName,
  newTagColor,
  formattedEvents,
  calendarOptions,
  openAddActivity,
  closeModal,
  addTag,
  removeTag,
  saveActivity,
  editSelectedEvent,
  duplicateSelectedEvent,
  deleteSelectedEvent,
  openTagManager,
  closeTagModal,
  addNewTag,
  deleteTag,
  handleDragStart,
  formatDate,
  refreshCalendar,
  showEventDetails,
  selectedEventDetails,
  handleEventEdit,
  deleteCalendarEvent,
} = useCalendar();

const { showNotification } = useAnimation();
const api = useApi();
const router = useRouter();

// Estado de carga
const isLoading = ref(false);

const currentActivity = ref(null);

// Función para editar una actividad
async function editActivity(activity) {
  try {
    if (activity?.id) {
      // Si la actividad tiene un tipo específico, redirigir a su página de edición
      if (activity.type) {
        router.push(`/activities/${activity.type}/${activity.id}/edit`);
        return;
      }
      // Si no tiene tipo, usar el modal genérico
      currentActivity.value = { ...activity };
      editMode.value = true;
      showModal.value = true;
    }
  } catch (error) {
    console.error('Error al editar la actividad:', error);
    showNotification('Error al editar la actividad: ' + (error.message || 'Error desconocido'), 'error');
  }
}

// Función para guardar una actividad desde el modal
async function saveActivityFromModal(activityData) {
  try {
    isLoading.value = true;
    let savedActivity;
    
  if (editMode.value && activityData.id) {
      savedActivity = await api.updateActivity(activityData.id, activityData);
      availableActivities.value = availableActivities.value.map(act => 
        act.id === savedActivity.id ? savedActivity : act
      );
      showNotification(`Actividad "${savedActivity.title}" actualizada correctamente`);
    } else {
      savedActivity = await api.createActivity(activityData);
      availableActivities.value.push(savedActivity);
      showNotification(`Actividad "${savedActivity.title}" creada correctamente`);
    }
    
    closeModal();
  } catch (error) {
    console.error('Error al guardar la actividad:', error);
    showNotification('Error al guardar la actividad: ' + (error.message || 'Error desconocido'), 'error');
  } finally {
    isLoading.value = false;
  }
}

// Función para eliminar una actividad y sus eventos
async function deleteActivityAndEvents(activity) {
  try {
    if (!activity?.id) {
      throw new Error('ID de actividad no válido');
    }
    
    isLoading.value = true;
    
    // Primero eliminar la actividad del backend
    await api.deleteActivity(activity.id);
    
    // Actualizar la lista local de actividades
    availableActivities.value = availableActivities.value.filter(
      act => act.id !== activity.id
    );

    // Obtener y eliminar los eventos del calendario
    if (calendarRef.value?.getApi) {
      const calendarApi = calendarRef.value.getApi();
      const events = calendarApi.getEvents();
      
      // Filtrar y eliminar eventos relacionados con esta actividad
      const relatedEvents = events.filter(
        event => event.extendedProps?.activityId === activity.id
      );
      
      // Eliminar cada evento
      for (const event of relatedEvents) {
        await deleteCalendarEvent(event.id);
    }
  }

    // Actualizar el calendario
  refreshCalendar();
    
    showNotification(`Actividad "${activity.title}" eliminada correctamente`);
    closeModal(); // Solo cerrar el modal si la eliminación fue exitosa
  } catch (error) {
    console.error('Error al eliminar la actividad:', error);
    showNotification('Error al eliminar la actividad: ' + (error.message || 'Error desconocido'), 'error');
  } finally {
    isLoading.value = false;
  }
}

// Función para manejar la visualización de detalles del evento
function handleShowEventDetails(event) {
  selectedEventDetails.value = {
    id: event.id,
    title: event.title,
    description: event.extendedProps?.description || '',
    color: event.backgroundColor || event.color,
    tags: event.extendedProps?.tags || [],
    start: event.start,
    end: event.end,
    activity: event.extendedProps?.activity
  };
  showEventDetails.value = true;
}

// Función para manejar el menú contextual
function handleShowContextMenu(data) {
  showContextMenu.value = true;
  contextMenuPosition.value = {
    x: data.x,
    y: data.y
  };
  selectedEvent.value = data.event;
}

// Función para manejar la eliminación desde el diálogo de detalles
async function handleDeleteFromDetails(event) {
  try {
    console.log('Evento recibido para eliminar:', event);
    console.log('ID del evento:', event?.id);
    console.log('Propiedades extendidas:', event?.extendedProps);

    if (!event?.id) {
      console.error('ID del evento no válido:', event);
      showNotification('No se puede eliminar el evento: ID no válido', 'error');
      return;
    }

    isLoading.value = true;

    try {
      // Llamar a la función de eliminación del calendario
      await deleteCalendarEvent(event.id);
      console.log('Evento eliminado correctamente');
      showEventDetails.value = false; // Cerrar el diálogo después de eliminar
    } catch (error) {
      console.error('Error detallado al eliminar el evento:', {
        event,
        error,
        errorMessage: error.message,
        errorResponse: error.response?.data
      });
      showNotification('Error al eliminar el evento: ' + (error.response?.data?.message || error.message || 'Error desconocido'), 'error');
    }
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  // No se necesita cargar actividades desde la API aquí, ya que se maneja en el componente
});

</script>

<style>
/* Estilos globales (pueden moverse a un archivo CSS aparte) */
.notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #4da6ff;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.fc-event {
  cursor: pointer;
  transition: all 0.2s ease;
}

.fc-event:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.fc-event-title {
  font-weight: 500;
  margin-bottom: 2px;
}

.event-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 2px;
}

.event-tag {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 8px;
  color: white;
  white-space: nowrap;
}
</style>