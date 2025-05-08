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

      <el-form-item label="Descripción">
        <el-input
          v-model="localActivity.description"
          type="textarea"
          placeholder="Describe brevemente de qué trata esta actividad"
          :rows="3"
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


      <div class="form-actions">
        <el-button @click="handleClose">Cancelar</el-button>
        <el-button type="primary" native-type="submit">Guardar</el-button>
        <el-button v-if="editMode" type="danger" @click="handleDelete">
          Eliminar
        </el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, watch, defineEmits, defineProps } from "vue";
import { ElMessage } from "element-plus";
import useApi from "@/composables/useApi";

const { createActivity, updateActivity, deleteActivity } = useApi();

const props = defineProps({
  showModal: Boolean,
  editMode: Boolean,
  activity: Object,
  selectedTags: Array,
  availableTags: Array, 
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

const localActivity = ref({
  title: props.activity?.title || "",
  description: props.activity?.description || "",
  color: props.activity?.color || "#5e72e4",
});


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
      title: newActivity?.title || "",
      description: newActivity?.description || "",
      color: newActivity?.color || "#5e72e4",
    };
  },
  { deep: true }
);




// Methods
const handleClose = () => {
  dialogVisible.value = false;
  emit("close");
};

const handleSubmit = async () => {
  if (
    !localActivity.value.title 
  ) {
    ElMessage.error(
      "El título es requerido"
    );
    return;
  }

  const activityData = {
    title: localActivity.value.title,
    description: localActivity.value.description || "",
    color: localActivity.value.color,
    tags: localSelectedTags.value.map((tag) => tag.id),
  };

  try {
    let savedActivity;

    if (props.editMode && props.activity?.id) {
      savedActivity = await updateActivity(props.activity.id, activityData);
    } else {
      savedActivity = await createActivity(activityData);
    }

    emit("save", savedActivity);

    if (!props.editMode) {
      // eslint-disable-next-line require-atomic-updates
      localActivity.value = {
        title: "",
        description: "",
        color: "#5e72e4",
      };
      // eslint-disable-next-line require-atomic-updates
      localSelectedTags.value = [];
      selectedTag.value = null;
    }

    handleClose();
  } catch (err) {
    ElMessage.error("No se pudo guardar la actividad");
    console.error("Error al guardar actividad:", err);
  }
};

const handleDelete = async () => {
  if (!props.activity?.id) return;

  try {
    await deleteActivity(props.activity.id);
    emit("delete", props.activity.id);
    handleClose();
  } catch (err) {
    ElMessage.error("No se pudo eliminar la actividad");
    console.error("Error al eliminar actividad:", err);
  }
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
