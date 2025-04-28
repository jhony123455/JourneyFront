<template>
  <div
    v-if="showContextMenu"
    class="context-menu fixed bg-white rounded-lg shadow-lg p-2 z-30"
    :style="{
      top: `${contextMenuPosition.y}px`,
      left: `${contextMenuPosition.x}px`,
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
defineProps({
  showContextMenu: Boolean,
  contextMenuPosition: Object,
});

defineEmits(['edit', 'duplicate', 'delete']);
</script>

<style scoped>
.context-menu {
  min-width: 180px;
  border: 1px solid #e5e7eb;
}

.context-menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.context-menu-item:hover {
  background-color: #f3f4f6;
}

.context-menu-item i {
  font-size: 16px;
}
</style>