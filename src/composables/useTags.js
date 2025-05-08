import { ref, computed } from "vue";
import useApi from "./useApi";
import useAnimation from "./useAnimation";
import useTagStore from './useTagStore';

export default function useTags() {
  const { availableTags, selectedTags, selectedTag } = useTagStore();
  const {
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    loading,
    error,
  } = useApi();
  const { animateNewTag, animateTagRemove, showNotification } = useAnimation();
  const newTagName = ref("");
  const newTagColor = ref("#5e72e4");
  const tagModalRef = ref(null);

  async function loadTags() {
    try {
      availableTags.value = await fetchTags();
    } catch (err) {
      console.error("Error al cargar etiquetas:", err);
    }
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

  function addTagToSelection() {
    if (
      selectedTag.value &&
      !selectedTags.value.some((tag) => tag.id === selectedTag.value.id)
    ) {
      selectedTags.value.push(selectedTag.value);
      selectedTag.value = "";
      animateNewTag(".tag");
    }
  }

  function removeTagFromSelection(index) {
    const tags = document.querySelectorAll(".tag");
    const tagToRemove = tags[index];

    animateTagRemove(tagToRemove, () => {
      selectedTags.value.splice(index, 1);
    });
  }

  function changeTagValue() {
    newTagName.value = "";
    newTagColor.value = getRandomColor();
  }

  async function createNewTag(){
    if (newTagName.value.trim()) {
      try {
        const tagData = {
          name: newTagName.value.trim(),
          color: newTagColor.value,
        };

        const newTag = await createTag(tagData);
        availableTags.value.push(newTag);

        animateNewTag(".tag-manager-item");
        changeTagValue();

        showNotification("Etiqueta creada correctamente");
      } catch (err) {
        showNotification("Error al crear etiqueta", 3000);
      }
    }
  }

  async function removeTag(index) {
    try {
      const tagId = availableTags.value[index].id;
      await deleteTag(tagId);
      availableTags.value.splice(index, 1);
      showNotification("Etiqueta eliminada correctamente");
    } catch (err) {
      showNotification("Error al eliminar etiqueta", 3000);
    }
  }

  return {
    availableTags,
    selectedTags,
    selectedTag,
    newTagName,
    newTagColor,
    tagModalRef,
    loading,
    error,
    loadTags,
    addTagToSelection,
    removeTagFromSelection,
    createNewTag,
    removeTag,
    getRandomColor,
  };
}
