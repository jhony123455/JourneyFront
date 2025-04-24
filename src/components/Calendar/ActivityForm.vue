<template>
  <el-card class="activities-card">
    <template #header>
      <div class="card-header">
        <span>Mis Actividades</span>
      </div>
    </template>
    
    <div class="activities-container">
      <div
        v-for="activity in availableActivities"
        :key="activity.id"
        class="draggable-activity"
        :style="{ borderLeft: `4px solid ${activity.color || '#5e72e4'}` }"
        draggable="true"
        @dragstart="handleDragStart($event, activity)"
      >
        <div class="activity-content">
          <span class="activity-title">{{ activity.title }}</span>
          <div v-if="activity.tags?.length" class="activity-tags">
            <el-tag
              v-for="tag in activity.tags"
              :key="tag.id"
              size="small"
              :color="tag.color"
              effect="dark"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card-actions">
      <el-button type="primary" size="small" @click="openAddActivity">
        <el-icon><Plus /></el-icon> Nueva Actividad
      </el-button>
      <el-button size="small" @click="openTagManager">
        <el-icon><CollectionTag /></el-icon> Etiquetas
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { Plus, CollectionTag } from '@element-plus/icons-vue'
import {defineProps, defineEmits} from 'vue'

const props = defineProps({
  availableActivities: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['open-add-activity', 'open-tag-manager', 'drag-start'])

const handleDragStart = (event, activity) => {
  emit('drag-start', { event, activity })
}
</script>

<style scoped>
.activities-card {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 280px;
  max-height: 60vh;
  z-index: 10;
}

.activities-container {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 12px;
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
}

.activity-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.activity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--el-border-color);
  padding-top: 12px;
}
</style>