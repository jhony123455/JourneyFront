<template>
  <el-dialog
    v-model="dialogVisible"
    :title="editMode ? 'Editar actividad' : 'Agregar nueva actividad'"
    width="500px"
    align-center
    @close="handleClose"
  >
    <el-form @submit.prevent="handleSubmit">
      <el-form-item label="Título" required>
        <el-input
          v-model="localActivity.title"
          placeholder="Título de la actividad"
        />
      </el-form-item>

      <el-form-item label="Color">
        <el-color-picker v-model="localActivity.color" show-alpha />
      </el-form-item>

      <el-form-item label="Etiquetas (opcional)">
        <div class="tag-container">
          <el-tag
            v-for="(tag, index) in localSelectedTags"
            :key="tag.id"
            :color="tag.color"
            closable
            @close="removeTag(index)"
          >
            {{ tag.name }}
          </el-tag>
        </div>
        <div class="tag-selector">
          <el-select
            v-model="selectedTagId"
            placeholder="Seleccionar etiqueta"
            class="tag-select"
            filterable
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            />
          </el-select>
          <el-button type="primary" :disabled="!selectedTagId" @click="addTag">
            Añadir
          </el-button>
        </div>
      </el-form-item>

      <el-form-item v-if="scheduledDate" label="Programar para">
        <div class="schedule-section">
          <p class="selected-date">{{ formatDate(scheduledDate) }}</p>

          <el-time-picker
            v-model="localScheduleTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="Hora de inicio"
            class="time-picker"
          />

          <el-input-number
            v-model="eventDuration"
            :min="15"
            :step="15"
            controls-position="right"
            placeholder="Duración (minutos)"
            class="duration-input"
          />
        </div>
      </el-form-item>

      <div class="form-actions">
        <el-button @click="handleClose">Cancelar</el-button>
        <el-button type="primary" native-type="submit">Guardar</el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed, defineEmits, defineProps } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  showModal: Boolean,
  editMode: Boolean,
  activity: Object,
  selectedTags: Array,
  availableTags: Array, // Recibimos las etiquetas globales desde el padre
  scheduledDate: String,
  scheduleTime: String,
  eventDuration: Number,
  formatDate: Function,
});

const emit = defineEmits(["close", "save", "add-tag", "remove-tag"]);

// Reactive state
const dialogVisible = ref(props.showModal);
const selectedTag = ref(null);
const localScheduleTime = ref(props.scheduleTime || "09:00");
const eventDuration = ref(props.eventDuration || 60);
const selectedTagId = ref(null);

// Copia profunda de la actividad
const localActivity = ref({
  title: "",
  color: "#5e72e4",
  ...props.activity,
});

// Etiquetas seleccionadas locales
const localSelectedTags = ref([...(props.selectedTags || [])]);

// Watchers
watch(
  () => props.showModal,
  (val) => {
    dialogVisible.value = val;
  }
);

watch(
  () => props.activity,
  (newActivity) => {
    localActivity.value = {
      title: "",
      color: "black",
      ...newActivity,
    };
    localSelectedTags.value = [...(props.selectedTags || [])];
  },
  { deep: true }
);

// Methods
const handleClose = () => {
  dialogVisible.value = false;
  emit("close");
};

const handleSubmit = () => {
  if (!localActivity.value.title) {
    ElMessage.error("El título es requerido");
    return;
  }

  const activityData = {
    ...localActivity.value,
    id:
      props.editMode && props.activity?.id
        ? props.activity.id
        : Date.now().toString(),
    tags: [...localSelectedTags.value],
    scheduledDate: props.scheduledDate,
    scheduleTime: localScheduleTime.value,
    duration: eventDuration.value,
    createdAt: new Date().toISOString(),
  };

  emit("save", activityData);

  if (!props.editMode) {
    localActivity.value = { title: "", color: "#5e72e4" };
    localSelectedTags.value = [];
    selectedTag.value = null;
  }

  handleClose();
};

const addTag = () => {
  if (selectedTagId.value) {
    const tagToAdd = props.availableTags.find(
      (t) => t.id === selectedTagId.value
    );
    if (
      tagToAdd &&
      !localSelectedTags.value.some((t) => t.id === selectedTagId.value)
    ) {
      localSelectedTags.value.push(tagToAdd);
      selectedTagId.value = null;
    }
  }
};

const removeTag = (index) => {
  localSelectedTags.value.splice(index, 1);
};

</script>

<style scoped>
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.tag-selector {
  display: flex;
  gap: 8px;
}

.tag-select {
  flex-grow: 1;
}

.schedule-section {
  width: 100%;
}

.selected-date {
  font-weight: 500;
  color: var(--el-color-primary);
  margin-bottom: 12px;
}

.time-picker {
  width: 100%;
  margin-bottom: 12px;
}

.duration-input {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
