<template>
  <div
    v-if="showContextMenu"
    class="context-menu"
    :style="{
      left: `${contextMenuPosition.x}px`,
      top: `${contextMenuPosition.y}px`
    }"
  >
    <button class="context-menu-item" @click="$emit('edit')">
      <i class="material-icons-round text-sm mr-2">edit</i> Editar
    </button>
    <button class="context-menu-item" @click="$emit('duplicate')">
      <i class="material-icons-round text-sm mr-2">content_copy</i> Duplicar
    </button>
    <button
      class="context-menu-item text-red-500"
      @click="$emit('delete')"
    >
      <i class="material-icons-round text-sm mr-2">delete</i> Eliminar
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({
  showContextMenu: Boolean,
  contextMenuPosition: Object,
  selectedEvent: Object
});

defineEmits(['edit', 'duplicate', 'delete']);

function formatDate(date) {
  return dayjs(date).format('DD/MM/YYYY');
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  min-width: 200px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 1000;
  overflow: hidden;
}

.context-menu-header {
  padding: 8px 16px;
  background-color: #f3f4f6;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  border-bottom: 1px solid #e5e7eb;
}

.context-menu-content {
  padding: 4px 0;
}

.context-menu-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
  font-size: 0.875rem;
}

.context-menu-item:hover {
  background-color: #f3f4f6;
}

.context-menu-item.delete {
  color: #ef4444;
}

.context-menu-item.delete:hover {
  background-color: #fef2f2;
}

.actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.context-menu-item:hover .actions {
  opacity: 1;
}

:deep(.el-button--text) {
  padding: 4px !important;
  min-height: auto !important;
}

:deep(.el-button--text:hover) {
  background-color: #e5e7eb !important;
  border-radius: 4px;
}
</style>