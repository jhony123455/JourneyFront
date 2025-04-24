<template>
  <el-card
    v-if="visible"
    class="context-menu"
    :style="positionStyle"
    @click.stop
  >
    <div class="menu-content">
      <el-button
        class="menu-item"
        type="text"
        @click="handleAction('edit')"
      >
        <el-icon><Edit /></el-icon>
        <span>Editar</span>
      </el-button>

      <el-button
        class="menu-item"
        type="text"
        @click="handleAction('duplicate')"
      >
        <el-icon><DocumentCopy /></el-icon>
        <span>Duplicar</span>
      </el-button>

      <el-button
        class="menu-item"
        type="text"
        @click="handleAction('delete')"
      >
        <el-icon><Delete /></el-icon>
        <span class="text-red-500">Eliminar</span>
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import {
  ElCard,
  ElButton,
  ElIcon
} from 'element-plus'
import { Edit, DocumentCopy, Delete } from '@element-plus/icons-vue'
import {defineProps, defineEmits} from 'vue'

const props = defineProps({
  position: {
    type: Object,
    required: true,
    default: () => ({ x: 0, y: 0 })
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'duplicate', 'delete', 'close'])

const positionStyle = computed(() => ({
  top: `${props.position.y}px`,
  left: `${props.position.x}px`
}))

const handleAction = (action) => {
  emit(action)
  emit('close')
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  border-radius: 8px;
}

.menu-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  justify-content: flex-start;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background-color: var(--el-fill-color-light);
}

.menu-item span {
  margin-left: 8px;
  font-size: 14px;
}

:deep(.el-card__body) {
  padding: 8px !important;
}
</style>