<template>
  <el-dialog
    :title="editMode ? 'Editar actividad' : 'Nueva actividad'"
    :modelValue="showModal"
    @close="handleClose"
    width="500px"
  >
    <el-form
      ref="formRef"
      :model="activityForm"
      :rules="rules"
      label-position="top"
    >
      <el-form-item label="Título" prop="title" required>
        <el-input v-model="activityForm.title" placeholder="Título de la actividad" />
      </el-form-item>

      <el-form-item label="Descripción" prop="description">
        <el-input
          v-model="activityForm.description"
          type="textarea"
          :rows="3"
          placeholder="Describe brevemente de qué trata esta actividad"
        />
      </el-form-item>

      <el-form-item label="Color" prop="color" required>
        <el-color-picker v-model="activityForm.color" />
      </el-form-item>

      <el-form-item label="Etiquetas (opcional)">
        <div class="flex items-center gap-2">
          <el-select
            v-model="selectedTag"
            placeholder="Seleccionar etiqueta"
            clearable
            class="flex-1"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag.id"
              :label="tag.name"
              :value="tag"
            >
              <span
                class="inline-block w-3 h-3 rounded-full mr-2"
                :style="{ backgroundColor: tag.color }"
              ></span>
              {{ tag.name }}
            </el-option>
          </el-select>
          <el-button type="primary" @click="addSelectedTag">Añadir</el-button>
        </div>
        <div v-if="activityForm.tags.length > 0" class="mt-2 flex flex-wrap gap-2">
          <el-tag
            v-for="tag in activityForm.tags"
            :key="tag.id"
            closable
            :style="{ backgroundColor: tag.color }"
            @close="removeTag(tag)"
          >
            {{ tag.name }}
          </el-tag>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer flex justify-between">
        <div>
          <el-button @click="handleClose">Cancelar</el-button>
          <el-button type="primary" @click="handleSubmit">
            {{ editMode ? 'Guardar cambios' : 'Crear actividad' }}
          </el-button>
        </div>
        <el-button 
          v-if="editMode" 
          type="danger" 
          @click="handleDelete"
        >
          Eliminar
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';

const props = defineProps({
  showModal: Boolean,
  editMode: Boolean,
  activity: {
    type: Object,
    default: () => ({})
  },
  availableTags: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'save', 'delete']);

const formRef = ref(null);
const selectedTag = ref(null);

const activityForm = ref({
  title: '',
  description: '',
  color: '#5e72e4',
  tags: []
});

const rules = {
  title: [
    { required: true, message: 'Por favor ingrese un título', trigger: 'blur' },
    { min: 3, message: 'El título debe tener al menos 3 caracteres', trigger: 'blur' }
  ],
  color: [
    { required: true, message: 'Por favor seleccione un color', trigger: 'change' }
  ]
};

// Observar cambios en la actividad para edición
watch(() => props.activity, (newActivity) => {
  if (newActivity && Object.keys(newActivity).length > 0) {
    activityForm.value = {
      id: newActivity.id,
      title: newActivity.title || '',
      description: newActivity.description || '',
      color: newActivity.color || '#5e72e4',
      tags: [...(newActivity.tags || [])]
    };
  } else {
    resetForm();
  }
}, { immediate: true });

function resetForm() {
  activityForm.value = {
    title: '',
    description: '',
    color: '#5e72e4',
    tags: []
  };
  if (formRef.value) {
    formRef.value.resetFields();
  }
}

function handleClose() {
  resetForm();
  emit('close');
}

function addSelectedTag() {
  if (selectedTag.value && !activityForm.value.tags.some(t => t.id === selectedTag.value.id)) {
    activityForm.value.tags.push(selectedTag.value);
  }
  selectedTag.value = null;
}

function removeTag(tag) {
  activityForm.value.tags = activityForm.value.tags.filter(t => t.id !== tag.id);
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate((valid, fields) => {
    if (valid) {
      // Asegurarse de que los tags sean un array de IDs
      const formData = {
        ...activityForm.value,
        tags: activityForm.value.tags.map(tag => tag.id)
      };
      emit('save', formData);
      handleClose();
    }
  });
}

function handleDelete() {
  if (props.editMode && activityForm.value.id) {
    emit('delete', activityForm.value);
    handleClose();
  }
}
</script>

<style scoped>
.el-tag + .el-tag {
  margin-left: 8px;
}
</style>
