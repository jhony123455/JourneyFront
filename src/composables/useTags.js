import { ref, watch } from 'vue'

export function useTags() {
  const availableTags = ref([])
  const showTagModal = ref(false)
  const newTagName = ref("")
  const newTagColor = ref("#5e72e4")
  const selectedTags = ref([])
  const selectedTag = ref(null)
  
  // Cargar/guardar etiquetas
  const loadTags = () => {
    const saved = localStorage.getItem('calendarTags')
    if (saved) availableTags.value = JSON.parse(saved)
  }
  
  const saveTags = () => {
    localStorage.setItem('calendarTags', JSON.stringify(availableTags.value))
  }
  
  // Watcher para guardar automáticamente
  watch(availableTags, saveTags, { deep: true })
  
  // Generar color aleatorio
  const getRandomColor = () => {
    const colors = [
      "#4da6ff", "#ff4d4d", "#66cc66", "#ff9933", 
      "#cc99ff", "#ff6699", "#5e72e4", "#11cdef"
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }
  
  return {
    availableTags,
    showTagModal,
    newTagName,
    newTagColor,
    selectedTags,
    selectedTag,
    loadTags,
    saveTags,
    getRandomColor
  }
}