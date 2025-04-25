import { ref, computed, watch } from 'vue';
import gsap from 'gsap';

export default function useTags() {
  // Sistema de etiquetas
  const availableTags = ref([
    { id: 1, name: "Importante", color: "#ff4d4d" },
    { id: 2, name: "Personal", color: "#4da6ff" },
    { id: 3, name: "Trabajo", color: "#66cc66" },
    { id: 4, name: "Urgente", color: "#ff9933" },
    { id: 5, name: "Recordatorio", color: "#cc99ff" },
  ]);

  // Para la selección de etiquetas
  const selectedTags = ref([]);
  const selectedTag = ref("");
  
  // Para la creación de nuevas etiquetas
  const newTagName = ref("");
  const newTagColor = ref("#5e72e4");

  function addTag() {
    if (
      selectedTag.value &&
      !selectedTags.value.some((tag) => tag.id === selectedTag.value.id)
    ) {
      selectedTags.value.push(selectedTag.value);
      selectedTag.value = "";
    }
  }

  function removeTag(index) {
    selectedTags.value.splice(index, 1);
  }

  function addNewTag() {
    if (newTagName.value.trim()) {
      const newId =
        availableTags.value.length > 0
          ? Math.max(...availableTags.value.map((tag) => tag.id)) + 1
          : 1;

      availableTags.value.push({
        id: newId,
        name: newTagName.value.trim(),
        color: newTagColor.value,
      });

      // Limpiar el formulario
      newTagName.value = "";
      newTagColor.value = getRandomColor();
    }
  }

  function deleteTag(index) {
    const tagId = availableTags.value[index].id;
    availableTags.value.splice(index, 1);
    return tagId;
  }

  function getRandomColor() {
    const colors = [
      "#4da6ff",
      "#ff4d4d",
      "#66cc66",
      "#ff9933",
      "#cc99ff",
      "#ff6699",
      "#5e72e4",
      "#11cdef",
      "#fb6340",
      "#2dce89",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function saveTagsData() {
    try {
      localStorage.setItem("calendarTags", JSON.stringify(availableTags.value));
    } catch (e) {
      console.error("Error al guardar etiquetas:", e);
    }
  }

  function loadTagsData() {
    try {
      const savedTags = localStorage.getItem("calendarTags");
      if (savedTags) {
        availableTags.value = JSON.parse(savedTags);
      }
    } catch (e) {
      console.error("Error al cargar etiquetas:", e);
    }
  }

  // Guardar automáticamente cuando cambian las etiquetas
  watch(
    availableTags,
    () => {
      saveTagsData();
    },
    { deep: true }
  );

  return {
    availableTags,
    selectedTags,
    selectedTag,
    newTagName,
    newTagColor,
    addTag,
    removeTag,
    addNewTag,
    deleteTag,
    getRandomColor,
    saveTagsData,
    loadTagsData
  };
}