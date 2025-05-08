<template>
  <div class="relative">
    <SeasonLoader v-if="!calendarReady" />
    
    <FullCalendarWrapper
      v-if="calendarReady"
      ref="calendarRef"
      :calendar-ready="calendarReady"
      :calendar-options="calendarOptions"
    />
    
    <FloatingActionButton @click="openAddActivity" />
    
    <!-- Actividades Disponibles -->
    <ActivitiesCard
      :available-activities="availableActivities"
      @add-activity="openAddActivity"
      @manage-tags="openTagManager"
      @drag-start="handleDragStart"
      @edit-activity="editActivity"
    />
    
    <!-- Modal para Agregar/Editar Actividades -->
    <AddActivityModal
      :show-modal="showModal"
      :edit-mode="editMode"
      :activity="currentActivity"
      :selected-tags="selectedTags"
      :available-tags="availableTags"
      :scheduled-date="scheduledDate"
      :schedule-time="scheduleTime"
      :event-duration="eventDuration"
      :format-date="formatDate"
      @close="closeModal"
      @save="saveActivityFromModal"
      @add-tag="addTag"
      @remove-tag="removeTag"
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
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SeasonLoader from '@/views/components/SeasonLoader.vue';
import FullCalendarWrapper from '@/components/Calendar/FullCalendarWrapper.vue';
import FloatingActionButton from '@/components/Calendar/FloatingActionButton.vue';
import ActivitiesCard from '@/components/Calendar/ActivitiesCard.vue';
import AddActivityModal from '@/components/Calendar/AddActivityModal.vue';
import TagManagerModal from '@/components/Calendar/TagManagerModal.vue';
import ContextMenu from '@/components/Calendar/ContextMenu.vue';
import useCalendar from '@/composables/useCalendar';

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
  availableActivities, // Estado reactivo de las actividades
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
} = useCalendar();

// Función para guardar una actividad desde el modal
function saveActivityFromModal(activityData) {
  if (editMode.value && activityData.id) {
    // Editar actividad existente
    const index = availableActivities.value.findIndex(
      (act) => act.id === activityData.id
    );
    if (index !== -1) {
      availableActivities.value[index] = { ...activityData }; // Actualizar la actividad
    }

    // Actualizar eventos programados relacionados
    scheduledEvents.value.forEach((event) => {
      if (event.extendedProps.activityId === activityData.id) {
        event.title = activityData.title;
        event.backgroundColor = activityData.color;
        event.borderColor = activityData.color;
        event.extendedProps.tags = activityData.tags || []; // Actualizar etiquetas
      }
    });
  } else {
    // Agregar nueva actividad
    availableActivities.value.push(activityData);

    // Si hay una fecha programada, agregar el evento al calendario
    if (scheduledDate.value) {
      const eventStart = `${scheduledDate.value}T${scheduleTime.value}:00`;
      const startDate = new Date(eventStart);
      const endDate = new Date(startDate);
      endDate.setMinutes(startDate.getMinutes() + parseInt(eventDuration.value));

      const eventToAdd = {
        id: `event-${Date.now()}`,
        title: activityData.title,
        start: eventStart,
        end: endDate.toISOString(),
        backgroundColor: activityData.color,
        textColor: "#ffffff",
        extendedProps: {
          tags: activityData.tags || [], // Incluir las etiquetas seleccionadas
          activityId: activityData.id,
        },
      };
      scheduledEvents.value.push(eventToAdd);
    }
  }

  // Refrescar el calendario y cerrar el modal
  refreshCalendar();
  closeModal();
}

// Función para abrir el modal en modo edición
function editActivity(activity) {
  currentActivityId.value = activity.id;
  editMode.value = true;
  newActivity.value = { ...activity }; // Copia profunda de la actividad
  selectedTags.value = [...(activity.tags || [])]; // Copia profunda de las etiquetas
  showModal.value = true;
}

function updateAvailableTags(updatedTags) {
  availableTags.value = updatedTags; // Actualiza el estado reactivo de las etiquetas
}

// Función para agregar una etiqueta a una actividad
function addTagToActivity(tag) {
  if (!selectedTags.value.some((t) => t.id === tag.id)) {
    selectedTags.value.push(tag);
  }
}

// Función para eliminar una etiqueta de una actividad
function removeTagFromActivity(index) {
  selectedTags.value.splice(index, 1);
}




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