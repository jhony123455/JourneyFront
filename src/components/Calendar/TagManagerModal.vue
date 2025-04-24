<template>
  <el-dialog
    v-model="visible"
    title="Gestor de Etiquetas"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="tag-manager-content">
      <el-scrollbar max-height="60vh">
        <!-- Etiquetas existentes -->
        <div class="existing-tags">
          <div
            v-for="(tag, index) in tags"
            :key="tag.id"
            class="tag-item"
          >
            <el-input
              v-model="tag.name"
              placeholder="Nombre de etiqueta"
              class="tag-input"
              @change="handleTagChange(index)"
            >
              <template #prefix>
                <el-color-picker
                  v-model="tag.color"
                  show-alpha
                  class="color-picker"
                  @change="handleTagChange(index)"
                />
              </template>
            </el-input>

            <el-button
              type="danger"
              circle
              plain
              class="delete-btn"
              @click="handleDeleteTag(index)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- Nueva etiqueta -->
        <div class="new-tag-section">
          <el-divider>
            <span class="text-sm text-gray-500">Nueva Etiqueta</span>
          </el-divider>

          <div class="new-tag-form">
            <el-input
              v-model="newTag.name"
              placeholder="Nombre de la nueva etiqueta"
              class="mr-2"
            >
              <template #prefix>
                <el-color-picker
                  v-model="newTag.color"
                  show-alpha
                  class="color-picker"
                />
              </template>
            </el-input>

            <el-button
              type="primary"
              :disabled="!newTagValid"
              @click="handleAddTag"
            >
              <el-icon class="mr-1"><CirclePlus /></el-icon>
              Agregar
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <template #footer>
      <el-button @click="handleClose">Cerrar</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  ElDialog,
  ElButton,
  ElInput,
  ElColorPicker,
  ElScrollbar,
  ElDivider,
  ElIcon,
  ElMessageBox
} from 'element-plus'
import { Delete, CirclePlus } from '@element-plus/icons-vue'
import {defineProps, defineEmits} from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  tags: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['update:show', 'add-tag', 'delete-tag', 'close'])

const visible = ref(false)
const newTag = ref({ name: '', color: '#409EFF' })

const newTagValid = computed(() => {
  return newTag.value.name.trim().length > 0 && newTag.value.color
})

watch(() => props.show, (val) => {
  visible.value = val
})

const handleTagChange = (index) => {
  // Emitir cambio si es necesario
  console.log('Tag modificado:', props.tags[index])
}

const handleAddTag = () => {
  if (!newTagValid.value) return
  
  emit('add-tag', {
    ...newTag.value,
    id: Date.now() // Generar ID único
  })
  
  // Resetear formulario
  newTag.value = { name: '', color: '#409EFF' }
}

const handleDeleteTag = async (index) => {
  try {
    await ElMessageBox.confirm(
      '¿Estás seguro de eliminar esta etiqueta?',
      'Confirmación',
      {
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        type: 'warning'
      }
    )
    
    emit('delete-tag', index)
  } catch (error) {
    // Acción cancelada
  }
}

const handleClose = () => {
  emit('update:show', false)
  emit('close')
}
</script>

<style scoped>
.tag-manager-content {
  padding: 0 20px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.tag-input {
  flex: 1;
}

.color-picker {
  width: 24px;
  height: 24px;
}

.delete-btn {
  flex-shrink: 0;
}

.new-tag-form {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

:deep(.el-color-picker__trigger) {
  width: 24px;
  height: 24px;
  padding: 2px;
}

:deep(.el-divider__text) {
  background-color: transparent;
  padding: 0 10px;
}
</style>