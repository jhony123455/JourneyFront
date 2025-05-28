<template>
  <div class="fab-container">
    <el-dropdown trigger="click" @command="handleCommand">
      <el-button
        class="fab fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-999"
        type="primary"
        circle
      >
        <i class="material-icons-round text-white text-lg">add</i>
      </el-button>
      
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="new">
            <div class="flex items-center">
              <i class="material-icons-round mr-2">add_circle</i>
              Nueva Actividad
            </div>
          </el-dropdown-item>
          
          <el-divider v-if="activities.length > 0" />
          
          <template v-if="activities.length > 0">
            <el-dropdown-item
              v-for="activity in activities"
              :key="activity.id"
              :command="{ type: 'edit', activity }"
            >
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center">
                  <div
                    class="w-3 h-3 rounded-full mr-2"
                    :style="{ backgroundColor: activity.color }"
                  />
                  {{ activity.title }}
                </div>
                <div class="activity-actions">
                  <el-button
                    type="text"
                    size="small"
                    @click.stop="$emit('delete-activity', activity)"
                  >
                    <i class="material-icons-round text-sm">delete</i>
                  </el-button>
                </div>
              </div>
            </el-dropdown-item>
          </template>
          
          <el-dropdown-item v-else disabled>
            <div class="text-gray-400">
              No hay actividades creadas
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  activities: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['click', 'edit-activity', 'delete-activity']);

const handleCommand = (command) => {
  if (command === 'new') {
    emit('click');
  } else if (command.type === 'edit') {
    emit('edit-activity', command.activity);
  }
};
</script>

<style scoped>
.fab {
  background-color: #3b82f6; /* Azul similar a bg-blue-500 */
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 999; /* Asegúrate de que esté por encima de otros elementos */
}
.fab:hover {
  background-color: #2563eb; /* Azul más oscuro similar a hover:bg-blue-600 */
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

:deep(.el-dropdown-menu) {
  padding: 8px !important;
  border-radius: 8px !important;
  min-width: 200px !important;
}

:deep(.el-dropdown-menu__item) {
  padding: 8px 16px !important;
  line-height: 1.5 !important;
  border-radius: 4px !important;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: #f3f4f6 !important;
}

:deep(.el-divider--horizontal) {
  margin: 8px 0 !important;
}

.activity-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.el-dropdown-item:hover .activity-actions {
  opacity: 1;
}

:deep(.el-button--text) {
  padding: 4px !important;
  min-height: auto !important;
  color: #ef4444 !important;
}

:deep(.el-button--text:hover) {
  background-color: #fef2f2 !important;
  border-radius: 4px;
}
</style>
