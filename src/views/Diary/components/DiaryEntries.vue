<template>
  <div class="entries-overlay" ref="overlay">
    <div class="entries-container">
      <h2 class="entries-title handwritten">Mis Entradas</h2>
      
      <div class="entries-grid">
        <div 
          v-for="entry in entries" 
          :key="entry.id" 
          class="entry-note"
          :style="{ backgroundColor: entry.color || '#fff' }"
          @click="editEntry(entry)"
        >
          <!-- Chinchetas -->
          <div class="pin pin1"></div>
          <div class="pin pin2" v-if="entry.content.length > 100"></div>
          
          <!-- Contenido -->
          <h3 class="entry-title handwritten" :style="{ color: entry.text_color || '#000' }">
            {{ entry.title }}
          </h3>
          <p class="entry-preview handwritten" :style="{ color: entry.text_color || '#000' }">
            {{ entry.content.substring(0, 100) }}{{ entry.content.length > 100 ? '...' : '' }}
          </p>
          
          <!-- Fecha -->
          <span class="entry-date handwritten" :style="{ color: entry.text_color || '#000' }">
            {{ formatDate(entry.created_at) }}
          </span>
        </div>
      </div>

      <!-- Botón de cerrar -->
      <button class="close-button" @click="closeEntries">
        <i class="material-icons-round">close</i>
      </button>
    </div>

    <!-- Modal de edición -->
    <NewEntry 
      v-if="showEditModal"
      :entry-to-edit="selectedEntry"
      @close="closeEditModal"
      @entry-saved="onEntryUpdated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from 'vue';
import gsap from 'gsap';
import axios from 'axios';
import NewEntry from './NewEntry.vue';

const emit = defineEmits(['close']);
const overlay = ref(null);
const entries = ref([]);
const showEditModal = ref(false);
const selectedEntry = ref(null);

onMounted(async () => {
  try {
    const response = await axios.get('/diary-entries');
    entries.value = response.data;
    animateEntries();
  } catch (error) {
    console.error('Error fetching entries:', error);
  }
});

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function animateEntries() {
  gsap.from('.entry-note', {
    opacity: 0,
    y: 50,
    rotation: 'random(-10, 10)',
    duration: 0.8,
    stagger: {
      amount: 1,
      from: 'random'
    },
    ease: 'back.out(1.2)'
  });
}

function editEntry(entry) {
  selectedEntry.value = entry;
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
  selectedEntry.value = null;
}

function onEntryUpdated(updatedEntry) {
  // Actualizar la entrada en la lista
  const index = entries.value.findIndex(e => e.id === updatedEntry.id);
  if (index !== -1) {
    entries.value[index] = updatedEntry;
  }
  closeEditModal();
}

function closeEntries() {
  gsap.to(overlay.value, {
    opacity: 0,
    duration: 0.3,
    onComplete: () => emit('close')
  });
}
</script>

<style scoped>
.entries-overlay {
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
}

.entries-container {
  width: 90%;
  max-width: 1200px;
  height: 80vh;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 2rem;
  position: relative;
  overflow-y: auto;
}

.entries-title {
  font-size: 2.5rem;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 2rem;
}

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  padding: 1rem;
}

.entry-note {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  position: relative;
  min-height: 200px;
  cursor: pointer;
  transition: transform 0.3s ease;
  transform-origin: center;
}

.entry-note:hover {
  transform: scale(1.02) rotate(1deg);
}

.pin {
  width: 12px;
  height: 12px;
  background: #ff4444;
  border-radius: 50%;
  position: absolute;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.pin::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(255,255,255,0.5);
  border-radius: 50%;
  top: 2px;
  left: 2px;
}

.pin1 {
  top: 10px;
  left: 10px;
}

.pin2 {
  top: 10px;
  right: 10px;
}

.entry-title {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  margin-top: 1rem;
  word-break: break-word;
}

.entry-preview {
  font-size: 1.2rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.entry-date {
  font-size: 1rem;
  opacity: 0.7;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #2c3e50;
  cursor: pointer;
  padding: 0.5rem;
  transition: transform 0.3s ease;
}

.close-button:hover {
  transform: scale(1.1);
}

.close-button i {
  font-size: 2rem;
}

.handwritten {
  font-family: 'Caveat', cursive;
}

/* Scrollbar personalizado */
.entries-container::-webkit-scrollbar {
  width: 8px;
}

.entries-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.entries-container::-webkit-scrollbar-thumb {
  background: #8B4513;
  border-radius: 4px;
}

.entries-container::-webkit-scrollbar-thumb:hover {
  background: #654321;
}
</style> 