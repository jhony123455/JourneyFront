<template>
  <el-card
    ref="cardRef"
    class="activities-card fixed bottom-6 left-6 w-72 z-10"
    shadow="hover"
  >
    <template #header>
      <div class="card-header flex justify-between items-center cursor-move" @mousedown="startDragging">
        <h3 class="text-lg font-bold">Mis Actividades</h3>
        <span class="card-drag-handle">⋮⋮</span>
      </div>
    </template>

    <div class="activities-container">
      <div
        v-for="activity in availableActivities"
        :key="activity.id"
        class="draggable-activity fc-event"
        :style="{ borderLeft: `4px solid ${activity.color || '#5e72e4'}` }"
        :data-event="
          JSON.stringify({
            title: activity.title,
            backgroundColor: activity.color || '#f8f9fa',
            textColor: activity.color ? '#ffffff' : '#333333',
            extendedProps: {
              activityId: activity.id,
              activity: activity
            },
          })
        "
        draggable="true"
        @dragstart="handleDragStart($event, activity)"
      >
        <div class="activity-content">
          <div class="flex justify-between items-start">
            <span class="activity-title">{{ activity.title }}</span>
            <div class="activity-actions">
              <el-button
                type="text"
                size="small"
                @click.stop="$emit('edit-activity', activity)"
              >
                <i class="material-icons-round text-sm">edit</i>
              </el-button>
              <el-button
                type="text"
                size="small"
                class="text-red-500"
                @click.stop="$emit('delete-activity', activity)"
              >
                <i class="material-icons-round text-sm">delete</i>
              </el-button>
            </div>
          </div>
          <div
            v-if="activity.tags && activity.tags.length > 0"
            class="activity-tags"
          >
            <el-tag
              v-for="tag in activity.tags"
              :key="tag.id"
              :style="{ backgroundColor: tag.color }"
              size="small"
              effect="dark"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <div class="card-actions mt-4">
      <el-button
        type="primary"
        size="small"
        class="w-full"
        @click="$emit('add-activity')"
      >
        <i class="material-icons-round text-sm mr-1">add</i> Nueva Actividad
      </el-button>
      <el-button
        type="default"
        size="small"
        class="w-full"
        @click="$emit('manage-tags')"
      >
        <i class="material-icons-round text-sm mr-1">label</i> Etiquetas
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, defineEmits, defineProps } from "vue";
import { Draggable } from "@fullcalendar/interaction";

const props = defineProps({
  availableActivities: {
    type: Array,
    required: true,
    default: () => []
  }
});

const emit = defineEmits([
  "add-activity",
  "manage-tags",
  "drag-start",
  "activity-saved",
  "edit-activity",
  "delete-activity"
]);

const cardRef = ref(null);

function handleDragStart(event, activity) {
  if (!activity) {
    console.error('No se proporcionó una actividad válida para el evento drag');
    return;
  }

  // Asegurarse de que el evento tenga los datos necesarios
  const eventData = {
    title: activity.title,
    backgroundColor: activity.color || '#f8f9fa',
    textColor: activity.color ? '#ffffff' : '#333333',
    extendedProps: {
      activityId: activity.id,
      activity: activity
    }
  };

  event.dataTransfer.setData('text/plain', JSON.stringify(eventData));
  emit("drag-start", event, activity);
}

let isDragging = false;
let startX = 0;
let startY = 0;
let startLeft = 0;
let startTop = 0;

function startDragging(e) {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  const computedStyle = window.getComputedStyle(cardRef.value.$el);
  startLeft = parseInt(computedStyle.left) || 0;
  startTop = parseInt(computedStyle.top) || 0;

  document.addEventListener("mousemove", moveCard);
  document.addEventListener("mouseup", stopDragging);
}

function moveCard(e) {
  if (!isDragging) return;
  const newLeft = startLeft + (e.clientX - startX);
  const newTop = startTop + (e.clientY - startY);
  cardRef.value.$el.style.left = `${newLeft}px`;
  cardRef.value.$el.style.top = `${newTop}px`;
  cardRef.value.$el.style.bottom = "auto";
}

function stopDragging() {
  isDragging = false;
  document.removeEventListener("mousemove", moveCard);
  document.removeEventListener("mouseup", stopDragging);
}
</script>

<style scoped>
.activities-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.activities-card:hover {
  transform: translateY(-2px);
}

.activities-container {
  max-height: 300px;
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

.activity-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.activity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-header {
  font-size: 14px;
}

.card-drag-handle {
  font-size: 20px;
  user-select: none;
}

.activity-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.draggable-activity:hover .activity-actions {
  opacity: 1;
}

.activity-actions .el-button {
  padding: 2px;
  height: auto;
}

.activity-actions .material-icons-round {
  font-size: 16px;
}
</style>