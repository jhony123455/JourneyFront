<template>
  <div class="new-entry-overlay" ref="overlay" v-show="isVisible">
    <!-- Selector de color y estilo -->
    <div class="style-selector" ref="colorSelector" v-show="!selectedColor">
      <h3 class="handwritten">Personaliza tu página</h3>

      <div class="customization-options">
        <!-- Pestañas de navegación -->
        <div class="style-tabs">
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'color' }"
            @click="activeTab = 'color'"
          >
            <i class="material-icons-round">palette</i>
            Color
          </button>
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'font' }"
            @click="activeTab = 'font'"
          >
            <i class="material-icons-round">text_format</i>
            Letra
          </button>
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'lines' }"
            @click="activeTab = 'lines'"
          >
            <i class="material-icons-round">border_all</i>
            Líneas
          </button>
        </div>

        <div class="options-content">
          <!-- Panel de Color -->
          <div v-show="activeTab === 'color'" class="tab-panel">
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

              <!-- Plantillas predeterminadas -->
              <div class="template-entries" v-if="templateEntries.length > 0">
                <h4 class="handwritten">Colores predeterminados</h4>
                <div class="templates-grid">
                  <div
                    v-for="template in templateEntries"
                    :key="template.id"
                    class="template-card"
                    :style="{
                      backgroundColor: template.color,
                      color: getContrastColor(template.color)
                    }"
                    @click="useTemplate(template)"
                  >
                    <span class="template-name">{{ template.title.replace('Plantilla ', '') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel de Fuentes -->
          <div v-show="activeTab === 'font'" class="tab-panel">
            <div class="font-options">
              <div 
                v-for="font in availableFonts" 
                :key="font.name"
                class="font-option"
                :class="{ active: selectedFont === font.name }"
                :style="{ fontFamily: font.name }"
                @click="selectFont(font.name)"
              >
                <span class="font-preview">{{ font.preview }}</span>
                <span class="font-name">{{ font.label }}</span>
              </div>
            </div>
          </div>

          <!-- Panel de Líneas -->
          <div v-show="activeTab === 'lines'" class="tab-panel">
            <div class="lines-options">
              <div 
                v-for="style in lineStyles" 
                :key="style.name"
                class="line-option"
                :class="{ active: selectedLineStyle === style.name }"
                @click="selectLineStyle(style.name)"
              >
                <div class="line-preview" :class="style.name">
                  <span class="line-name">{{ style.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="style-actions">
          <button class="action-button continue" @click="continueToEditor">
            <i class="material-icons-round">arrow_forward</i>
            Continuar
          </button>
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
              class="entry-title"
              :class="{ [selectedFont]: true }"
              placeholder="Título de tu entrada..."
              :style="{ color: selectedTextColor }"
              @input="titleError = false"
            />
            <span class="error-message" v-if="titleError">El título es obligatorio</span>
          </div>
          <textarea
            ref="contentTextarea"
            v-model="entryContent"
            class="entry-content"
            :class="{ [selectedFont]: true, [selectedLineStyle]: true }"
            placeholder="Comienza a escribir..."
            :style="{ color: selectedTextColor }"
          ></textarea>
        </div>
      </div>
      <!-- Botones de acción -->
      <div class="action-buttons" ref="actionButtons">
        <button class="action-button edit-style" @click="backToStyleSelector">
          <i class="material-icons-round">style</i>
          Editar Estilo
        </button>
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

const templateEntries = ref([]);

// Nuevas importaciones y refs
const activeTab = ref('color');
const selectedFont = ref('handwritten');
const selectedLineStyle = ref('lined');

// Fuentes disponibles
const availableFonts = [
  { name: 'handwritten', label: 'Manuscrita', preview: 'Querido diario...' },
  { name: 'elegant', label: 'Elegante', preview: 'Querido diario...' },
  { name: 'modern', label: 'Moderna', preview: 'Querido diario...' },
  { name: 'typewriter', label: 'Máquina de escribir', preview: 'Querido diario...' },
  { name: 'casual', label: 'Casual', preview: 'Querido diario...' }
];

// Estilos de líneas disponibles
const lineStyles = [
  { name: 'lined', label: 'Rayado' },
  { name: 'dotted', label: 'Punteado' },
  { name: 'squared', label: 'Cuadriculado' }
];

// Funciones para selección de estilos
function selectFont(fontName) {
  selectedFont.value = fontName;
}

function selectLineStyle(styleName) {
  selectedLineStyle.value = styleName;
}

function continueToEditor() {
  if (!selectedColor.value) {
    selectOriginalColor();
  }
  animateToEditor();
}

function backToStyleSelector() {
  gsap.to(entryEditor.value, {
    opacity: 0,
    scale: 0.9,
    duration: 0.3,
    onComplete: () => {
      selectedColor.value = null;
      gsap.to(colorSelector.value, {
        opacity: 1,
        scale: 1,
        duration: 0.3
      });
    }
  });
}

// Cargar las entradas plantilla
async function loadTemplateEntries() {
  try {
    // Usamos el método index y filtramos las plantillas por el título
    const response = await axios.get('/diary-entries');
    // Filtramos las entradas que son plantillas (comienzan con "Plantilla")
    templateEntries.value = response.data.filter(entry => 
      entry.title.startsWith('Plantilla')
    );
  } catch (error) {
    console.error('Error loading template entries:', error);
  }
}

onMounted(async () => {
  await loadTemplateEntries();
  
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
    const finalColor = selectedColor.value || "#FFFFFF";
    
    const payload = {
      title: entryTitle.value.trim(),
      content: entryContent.value.trim(),
      color: finalColor,
      text_color: getContrastColor(finalColor),
      font_style: selectedFont.value,
      line_style: selectedLineStyle.value,
      entry_date: props.entryToEdit?.entry_date || new Date().toISOString().split('T')[0]
    };

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

function useTemplate(template) {
  selectedColor.value = template.color;
  previewColor.value = template.color;
  animateToEditor();
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

.style-selector {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.handwritten {
  font-family: "Caveat", cursive;
}

.customization-options {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.style-tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 1rem;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.tab-button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.tab-button.active {
  background: #8B4513;
  color: white;
}

.tab-button:hover {
  transform: translateY(-2px);
}

.options-content {
  flex: 1;
  min-height: 400px;
}

.tab-panel {
  padding: 1rem;
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

.template-entries {
  margin-top: 2rem;
  text-align: center;
}

.template-entries h4 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.template-card {
  padding: 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Caveat', cursive;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.template-name {
  word-break: break-word;
  line-height: 1.2;
}

/* Estilos para las opciones de fuente */
.font-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.font-option {
  padding: 1.5rem;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.font-option.active {
  border-color: #8B4513;
  background: rgba(139, 69, 19, 0.1);
}

.font-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.font-preview {
  display: block;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.font-name {
  display: block;
  font-size: 0.9rem;
  color: #666;
}

/* Estilos para el scroll */
.style-selector::-webkit-scrollbar {
  width: 8px;
}

.style-selector::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.style-selector::-webkit-scrollbar-thumb {
  background: #8B4513;
  border-radius: 4px;
}

.style-selector::-webkit-scrollbar-thumb:hover {
  background: #654321;
}

/* Estilos para las fuentes */
.elegant {
  font-family: 'Playfair Display', serif;
}

.modern {
  font-family: 'Roboto', sans-serif;
}

.typewriter {
  font-family: 'Courier Prime', monospace;
}

.casual {
  font-family: 'Comic Neue', cursive;
}

/* Botón de continuar */
.style-actions {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 1rem 0;
  display: flex;
  justify-content: flex-end;
}

.action-button.continue {
  background: #8B4513;
  color: white;
}

.action-button.edit-style {
  background: #666;
  color: white;
}

/* Mantener los estilos originales de la hoja */
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

/* Estilos para las opciones de líneas */
.lines-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.line-option {
  cursor: pointer;
  transition: all 0.3s ease;
}

.line-option.active .line-preview {
  border-color: #8B4513;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.line-preview {
  width: 100%;
  height: 150px;
  border: 2px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
  position: relative;
  background: white;
}

.line-preview.lined {
  background-image: repeating-linear-gradient(transparent, transparent 31px, #ccc 32px);
}

.line-preview.dotted {
  background-image: radial-gradient(circle, #ccc 1px, transparent 1px);
  background-size: 20px 20px;
}

.line-preview.squared {
  background-image: 
    repeating-linear-gradient(transparent, transparent 31px, #ccc 32px),
    repeating-linear-gradient(90deg, transparent, transparent 31px, #ccc 32px);
}

.line-name {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #666;
}

/* Estilos para el contenido con diferentes líneas */
.entry-content.lined {
  background-image: repeating-linear-gradient(transparent, transparent 31px, #ccc 32px);
}

.entry-content.dotted {
  background-image: radial-gradient(circle, #ccc 1px, transparent 1px);
  background-size: 20px 20px;
}

.entry-content.squared {
  background-image: 
    repeating-linear-gradient(transparent, transparent 31px, #ccc 32px),
    repeating-linear-gradient(90deg, transparent, transparent 31px, #ccc 32px);
}
</style>
