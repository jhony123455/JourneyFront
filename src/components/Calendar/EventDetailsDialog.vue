<template>
  <el-dialog
    :model-value="modelValue"
    @close="$emit('update:modelValue', false)"
    title="Detalles del evento"
    width="500px"
  >
    <div class="event-details">
      <div class="event-header" :style="{ backgroundColor: eventColor }">
        <h3 class="text-xl font-semibold text-white mb-4">{{ event.title }}</h3>
      </div>
      
      <div class="content-wrapper">
        <div class="mb-4">
          <p class="text-gray-600">{{ event.description || 'Sin descripción' }}</p>
        </div>

        <div class="mb-4">
          <strong>Fecha:</strong>
          <span>{{ formatDate(event.start) }}</span>
          <span v-if="event.end"> - {{ formatDate(event.end) }}</span>
        </div>

        <div class="mb-4" v-if="event.tags && event.tags.length">
          <strong>Etiquetas:</strong>
          <div class="flex flex-wrap gap-2 mt-2">
            <el-tag
              v-for="tag in event.tags"
              :key="tag.id"
              :style="{ backgroundColor: tag.color }"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="$emit('update:modelValue', false)">Cerrar</el-button>
        <el-button 
          type="danger" 
          @click="handleDelete"
        >
          Eliminar del calendario
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({
  modelValue: Boolean,
  event: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'delete']);

const eventColor = computed(() => {
  return props.event.color || props.event.backgroundColor || "#5e72e4";
});

function formatDate(date) {
  return date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '';
}

function handleDelete() {
  emit('delete', props.event);
  emit('update:modelValue', false);
}
</script>

<style scoped>
.event-details {
  padding: 0;
}

.event-header {
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.content-wrapper {
  padding: 0 1.5rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
}

:deep(.el-dialog__body) {
  padding: 0;
}

:deep(.el-dialog__footer) {
  padding: 1rem 1.5rem;
}
</style> 