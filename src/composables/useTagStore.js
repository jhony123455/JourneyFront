import { ref } from 'vue';

const availableTags = ref([]);
const selectedTags = ref([]);
const selectedTag = ref("");

export default function useTagStore() {
  return {
    availableTags,
    selectedTags,
    selectedTag
  };
}
