<template>
  <el-dialog
    v-model="visible"
    title="Gestionar etiquetas"
    width="500px"
    :close-on-click-modal="false"
    custom-class="tag-manager-dialog"
    @close="handleClose"
  >
    <!-- Listado de etiquetas del backend -->
    <div v-loading="apiLoading" class="space-y-4 mb-8">
      <el-card
        v-for="tag in tagStore.availableTags"
        :key="tag.id"
        shadow="hover"
        class="tag-item"
      >
        <div class="flex items-center gap-3">
          <el-color-picker
            v-model="tag.color"
            show-alpha
            size="small"
            class="color-picker"
            @change="updateTag(tag)"
          />
          <el-input
            v-model="tag.name"
            placeholder="Nombre de etiqueta"
            clearable
            @change="updateTag(tag)"
          />
          <el-button
            type="danger"
            plain
            circle
            size="small"
            @click="removeTag(tag.id)"
          >
            <el-icon><delete /></el-icon>
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- Nueva etiqueta -->
    <el-divider />
    <h3 class="text-lg font-semibold mb-4 text-gray-700 text-center">
      Agregar nueva etiqueta
    </h3>
    <div class="flex gap-3 items-center">
      <el-input v-model="newTagName" placeholder="Nombre" clearable />
      <el-color-picker v-model="newTagColor" show-alpha size="small" />
      <el-button type="primary" :disabled="!newTagName" @click="addNewTag">
        Agregar
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from "vue";
import { Delete } from "@element-plus/icons-vue";
import useApi from "@/composables/useApi";
import useTagStore from "@/composables/useTagStore";

const props = defineProps({
  showTagModal: Boolean,
  availableTags: Array,
});

const emit = defineEmits(["close"]);

const {
  fetchTags,
  createTag,
  deleteTag: apiDeleteTag,
  updateTag: apiUpdateTag,
  loading: apiLoading,
  error: apiError,
} = useApi();

const tagStore = useTagStore();

// Datos locales
const newTagName = ref("");
const newTagColor = ref("#5e72e4");

const loadTags = async () => {
  try {
    const tagsData = await fetchTags();
    tagStore.availableTags = tagsData;
  } catch (err) {
    console.error("Error cargando etiquetas:", err);
  }
};

const addNewTag = async () => {
  if (!newTagName.value.trim()) return;

  try {
    const newTag = await createTag({
      name: newTagName.value.trim(),
      color: newTagColor.value,
    });
    tagStore.availableTags.push(newTag);
    
    // eslint-disable-next-line require-atomic-updates
    newTagName.value = "";
    // eslint-disable-next-line require-atomic-updates
    newTagColor.value = "#5e72e4";
  } catch (err) {
    console.error("Error creando etiqueta:", err);
  }
};

const updateTag = async (tag) => {
  try {
    await apiUpdateTag(tag.id, {
      name: tag.name,
      color: tag.color,
    });
  } catch (err) {
    console.error("Error actualizando etiqueta:", err);
    await loadTags();
  }
};

const removeTag = async (tagId) => {
  try {
    await apiDeleteTag(tagId);
    
    // Actualizar el store después de borrar
    const index = tagStore.availableTags.findIndex(t => t.id === tagId);
    if (index !== -1) {
      tagStore.availableTags.splice(index, 1);
    }
  } catch (err) {
    console.error("Error eliminando etiqueta:", err);
  }
};

// Sincronizar con cambios en el padre
watch(
  () => props.availableTags,
  (newTags) => {
    if (newTags) {
      tagStore.availableTags = [...newTags];
    }
  }
);

const visible = computed({
  get: () => props.showTagModal,
  set: (val) => {
    if (!val) emit("close");
  },
});

watch(
  () => props.showTagModal,
  (isOpen) => {
    if (isOpen) loadTags();
  }
);

const handleClose = () => {
  emit("close");
};
</script>

<style scoped>
.tag-item {
  margin-bottom: 12px;
}

.color-picker {
  width: 30px;
  height: 30px;
}

:deep(.tag-manager-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.el-dialog__body) {
  padding: 20px;
}
</style>