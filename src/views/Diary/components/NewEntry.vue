<template>
  <div class="new-entry-overlay" ref="overlay" v-show="isVisible">
    <!-- Selector de color -->
    <div class="color-selector" ref="colorSelector" v-show="!selectedColor">
      <h3 class="handwritten">Personaliza tu página</h3>

      <div class="color-picker-container">
        <div class="color-preview">
          <div class="preview-split">
            <div
              class="original-color"
              :style="{ backgroundColor: previewColor }"
              @click="selectOriginalColor"
            >
              <span class="preview-label">Original</span>
            </div>
            <div
              class="pastel-color"
              :style="{ backgroundColor: pastelPreviewColor }"
              @click="selectPastelColor"
            >
              <span class="preview-label">Pastel</span>
            </div>
          </div>
        </div>

        <div class="picker-controls">
          <el-color-picker
            v-model="previewColor"
            show-alpha
            @change="updatePreviewColor"
          />
        </div>
      </div>
    </div>

    <!-- Editor de entrada -->
    <div class="entry-editor" v-show="selectedColor" ref="entryEditor">
      <div class="page" :style="{ backgroundColor: selectedColor }">
        <div class="page-content">
          <div class="title-container" :class="{ error: titleError }">
            <input
              ref="titleInput"
              v-model="entryTitle"
              class="entry-title handwritten"
              placeholder="Título de tu entrada..."
              :style="{ color: selectedTextColor }"
              @input="titleError = false"
            />
            <span class="error-message" v-if="titleError"
              >El título es obligatorio</span
            >
          </div>
          <textarea
            ref="contentTextarea"
            v-model="entryContent"
            class="entry-content handwritten"
            placeholder="Comienza a escribir..."
            :style="{ color: selectedTextColor }"
          ></textarea>
        </div>
      </div>
      <!-- Botones de acción -->
      <div class="action-buttons" ref="actionButtons">
        <button class="action-button save" @click="saveEntry">
          <i class="material-icons-round">save</i>
          Guardar
        </button>
        <button class="action-button cancel" @click="cancelEntry">
          <i class="material-icons-round">close</i>
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits, defineProps, onMounted } from "vue";
import { useRouter } from "vue-router";
import gsap from "gsap";
import axios from "axios";
import Swal from "sweetalert2";
import { ElColorPicker, ElButton } from "element-plus";

const props = defineProps({
  entryToEdit: {
    type: Object,
    default: null
  }
});

const router = useRouter();
const emit = defineEmits(["close", "entry-saved"]);

const overlay = ref(null);
const colorSelector = ref(null);
const entryEditor = ref(null);
const titleInput = ref(null);
const contentTextarea = ref(null);
const actionButtons = ref(null);

const isVisible = ref(true);
const selectedColor = ref(null);
const previewColor = ref("#FFFFFF");
const entryTitle = ref("");
const entryContent = ref("");
const titleError = ref(false);
const colorType = ref(null); // 'original' o 'pastel'

// Eliminamos los colores predefinidos ya que vienen del backend
const defaultColors = [];

// Si estamos en modo edición, inicializamos con los valores existentes
onMounted(() => {
  if (props.entryToEdit) {
    entryTitle.value = props.entryToEdit.title;
    entryContent.value = props.entryToEdit.content;
    selectedColor.value = props.entryToEdit.color || "#FFFFFF";
    previewColor.value = props.entryToEdit.color || "#FFFFFF";
  }
});

// Convertir color a versión pastel
function convertToPastel(hexColor) {
  if (!hexColor || hexColor === "transparent") return "#FFFFFF";

  // Si el color viene con formato rgba, extraemos los valores
  if (hexColor.startsWith("rgba")) {
    const rgba = hexColor.match(/[\d.]+/g);
    if (rgba && rgba.length >= 3) {
      const [r, g, b] = rgba.map(Number);
      return convertRGBToPastel(r, g, b);
    }
    return "#FFFFFF";
  }

  // Convertir hex a RGB
  const hex = hexColor.replace("#", "");
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  return convertRGBToPastel(r, g, b);
}

function convertRGBToPastel(r, g, b) {
  // Hacer el color más pastel
  r = Math.floor((r + 255) / 2);
  g = Math.floor((g + 255) / 2);
  b = Math.floor((b + 255) / 2);

  // Convertir de vuelta a hex
  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Color pastel para la vista previa
const pastelPreviewColor = computed(() => {
  return convertToPastel(previewColor.value);
});

// Color del texto basado en el color de fondo
const selectedTextColor = computed(() => {
  return getContrastColor(selectedColor.value);
});

function getContrastColor(bgColor) {
  if (!bgColor || bgColor === "transparent") return "#000000";

  // Si el color es en formato rgba
  if (bgColor.startsWith("rgba")) {
    const rgba = bgColor.match(/[\d.]+/g);
    if (rgba && rgba.length >= 3) {
      const [r, g, b] = rgba.map(Number);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.7 ? "#2c3e50" : "#000000";
    }
    return "#000000";
  }

  // Para colores hex
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7 ? "#2c3e50" : "#000000";
}

function updatePreviewColor(color) {
  previewColor.value = color || "#FFFFFF";
}

function selectOriginalColor() {
  selectedColor.value = previewColor.value || "#FFFFFF";
  animateToEditor();
}

function selectPastelColor() {
  selectedColor.value = pastelPreviewColor.value || "#FFFFFF";
  animateToEditor();
}

function animateToEditor() {
  gsap.to(colorSelector.value, {
    opacity: 0,
    scale: 0.9,
    duration: 0.3,
    onComplete: () => {
      gsap.fromTo(
        entryEditor.value,
        {
          opacity: 0,
          scale: 0.9,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
        }
      );
    },
  });
}

function cancelEntry() {
  gsap.to(overlay.value, {
    opacity: 0,
    duration: 0.3,
    onComplete: () => {
      isVisible.value = false;
      selectedColor.value = null;
      emit("close");
    },
  });
}

async function saveEntry() {
  if (!entryTitle.value.trim()) {
    titleError.value = true;
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "El título es obligatorio",
    });
    return;
  }

  try {
    // Asegurarnos de que siempre tengamos un color válido
    const finalColor = selectedColor.value || "#FFFFFF";
    
    const payload = {
      title: entryTitle.value.trim(),
      content: entryContent.value.trim(),
      color: finalColor,
      text_color: getContrastColor(finalColor),
      entry_date: props.entryToEdit?.entry_date || new Date().toISOString().split('T')[0]
    };

    console.log('Guardando entrada:', payload);

    let response;
    if (props.entryToEdit) {
      response = await axios.put(`/diary-entries/${props.entryToEdit.id}`, payload);
    } else {
      response = await axios.post("/diary-entries", payload);
    }

    await Swal.fire({
      icon: "success",
      title: "¡Guardado!",
      text: `Tu entrada ha sido ${props.entryToEdit ? 'actualizada' : 'guardada'} exitosamente`,
      showConfirmButton: false,
      timer: 1500,
    });

    emit("entry-saved", response.data);
  } catch (error) {
    console.error('Error saving entry:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo guardar la entrada. Por favor, intenta de nuevo.",
    });
  }
}
</script>

<style scoped>
.new-entry-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.color-selector {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 500px;
  width: 90%;
}

.handwritten {
  font-family: "Caveat", cursive;
}

.color-picker-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 2rem;
}

.color-preview {
  width: 100%;
  height: 200px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.preview-split {
  display: flex;
  width: 100%;
  height: 100%;
}

.original-color,
.pastel-color {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preview-label {
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.picker-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.color-suggestions {
  width: 100%;
  margin-top: 1rem;
}

.preset-colors {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.preset-color {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.preset-color:hover {
  transform: scale(1.1);
}

.entry-editor {
  width: 90%;
  max-width: 800px;
  height: 80vh;
}

.page {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  padding: 2rem;
  position: relative;
}

.page-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.entry-title {
  font-size: 2rem;
  border: none;
  background: transparent;
  width: 100%;
  padding: 0.5rem;
  outline: none;
}

.entry-content {
  flex: 1;
  font-size: 1.5rem;
  border: none;
  background: transparent;
  width: 100%;
  padding: 0.5rem;
  resize: none;
  outline: none;
  line-height: 1.6;
  background-image: repeating-linear-gradient(
    transparent,
    transparent 31px,
    #ccc 32px
  );
}

.action-buttons {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  gap: 1rem;
}

.action-button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.3s ease;
}

.action-button:hover {
  transform: translateY(-2px);
}

.action-button.save {
  background: #4caf50;
  color: white;
}

.action-button.cancel {
  background: #f44336;
  color: white;
}

.action-button i {
  font-size: 1.2rem;
}

.title-container {
  position: relative;
  width: 100%;
}

.title-container.error .entry-title {
  border-bottom: 2px solid #f56c6c;
}

.error-message {
  position: absolute;
  bottom: -20px;
  left: 0;
  color: #f56c6c;
  font-size: 0.8rem;
}

.preview-split > div {
  cursor: pointer;
  transition: all 0.3s ease;
}

.preview-split > div:hover {
  transform: scale(1.05);
}

.preview-split > div:active {
  transform: scale(0.98);
}
</style>
