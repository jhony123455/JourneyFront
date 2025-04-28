<template>
  <el-dialog
    v-model="visible"
    title="Gestionar etiquetas"
    width="500px"
    :close-on-click-modal="false"
    custom-class="tag-manager-dialog"
    @close="handleClose"
  >
    <!-- Listado de etiquetas -->
    <div class="space-y-4 mb-8">
      <el-card
        v-for="(tag, index) in localTags"
        :key="index"
        shadow="hover"
        class="tag-item"
      >
        <div class="flex items-center gap-3">
          <el-color-picker
            v-model="localTags[index].color"
            show-alpha
            size="small"
            class="color-picker"
            @change="saveTags"
          />
          <el-input
            v-model="localTags[index].name"
            placeholder="Nombre de etiqueta"
            clearable
            @change="saveTags"
          />
          <el-button
            type="danger"
            plain
            circle
            size="small"
            @click="deleteTag(index)"
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

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">Cerrar</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from "vue";
import { Delete } from "@element-plus/icons-vue";

const props = defineProps({
  showTagModal: Boolean,
  availableTags: Array, // Recibimos las etiquetas globales desde el padre
});

const emit = defineEmits(["update-tags", "close"]);

// Datos locales
const newTagName = ref("");
const newTagColor = ref("#5e72e4");
const localTags = ref([]);

// Cargar etiquetas al iniciar
const loadTags = () => {
  localTags.value = [...props.availableTags];
};

// Guardar etiquetas y emitir al padre
const saveTags = () => {
  emit("update-tags", localTags.value); // Emitimos las etiquetas actualizadas
};

// Añadir nueva etiqueta
const addNewTag = () => {
  const newTag = {
    id: Date.now(), // Usamos el timestamp como ID único
    name: newTagName.value,
    color: newTagColor.value,
  };

  localTags.value.push(newTag);
  saveTags();
  newTagName.value = "";
  newTagColor.value = "#5e72e4";
};

// Eliminar etiqueta
const deleteTag = (index) => {
  localTags.value.splice(index, 1);
  saveTags();
};

// Control del diálogo
const visible = computed({
  get: () => props.showTagModal,
  set: (val) => !val && emit("close"),
});

const handleClose = () => {
  emit("close");
};

// Cargar etiquetas cuando el componente se monta
loadTags();
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
