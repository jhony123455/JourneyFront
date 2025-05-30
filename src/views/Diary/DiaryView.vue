<template>
  <div class="diary-view">
    <div class="scene" ref="scene">
      <!-- Escritorio con elementos -->
      <div class="desk" ref="desk">
        <div class="desk-texture"></div>
        <div class="desk-items">
          <div class="pencil"></div>
          <div class="coffee-cup"></div>
        </div>
        
        <!-- Libro principal -->
        <div class="book" ref="book">
          <div class="book-cover" ref="bookCover">
            <span class="book-title">Mi Diario</span>
            <div class="book-decoration"></div>
          </div>
          
          <!-- Contenido del libro -->
          <div class="book-content" ref="bookContent">
            <div class="page-content" ref="pageContent">
              <h2 class="page-title" ref="pageTitle">¿Qué quieres hacer hoy?</h2>
              <div class="options-container" ref="optionsContainer">
                <button class="diary-option" @click="handleNewEntry">
                  <i class="material-icons-round">edit</i>
                  <span>Nueva Entrada</span>
                </button>
                <button class="diary-option" @click="handleViewEntries">
                  <i class="material-icons-round">book</i>
                  <span>Ver Entradas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <NewEntry 
        v-if="isCreatingEntry" 
        @close="closeNewEntry"
        @entry-saved="onEntrySaved"
      />
    </Transition>

    <Transition name="fade">
      <DiaryEntries 
        v-if="showingEntries"
        @close="closeEntries"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import gsap from 'gsap';
import { useRouter } from 'vue-router';
import NewEntry from './components/NewEntry.vue';
import DiaryEntries from './components/DiaryEntries.vue';

const router = useRouter();
const scene = ref(null);
const desk = ref(null);
const book = ref(null);
const bookCover = ref(null);
const bookContent = ref(null);
const mainOptionsPage = ref(null);
const pageContent = ref(null);
const pageTitle = ref(null);
const optionsContainer = ref(null);

const isCreatingEntry = ref(false);
const showingEntries = ref(false);
const isAnimating = ref(false);

let mainTimeline;

onMounted(() => {
  initializeAnimation();
});

onUnmounted(() => {
  if (mainTimeline) {
    mainTimeline.kill();
  }
});

function initializeAnimation() {
  // Configuración inicial
  gsap.set(scene.value, {
    perspective: 1000
  });

  gsap.set(desk.value, {
    scale: 1.5,
    opacity: 0,
    rotationX: 25,
    y: 100
  });

  gsap.set(book.value, {
    scale: 0.8,
    rotationX: -35,
    y: -100,
    opacity: 0
  });

  gsap.set([pageTitle.value, optionsContainer.value], {
    opacity: 0,
    y: 20
  });

  // Timeline principal
  mainTimeline = gsap.timeline({
    defaults: { ease: 'power3.out' }
  });

  // Entrada del escritorio
  mainTimeline.to(desk.value, {
    scale: 1,
    opacity: 1,
    rotationX: 15,
    y: 0,
    duration: 1.5,
    ease: 'elastic.out(1, 0.8)'
  });

  // Caída del libro
  mainTimeline.to(book.value, {
    scale: 1,
    rotationX: 0,
    y: 0,
    opacity: 1,
    duration: 1,
    ease: 'bounce.out'
  });

  // Abrir el libro
  mainTimeline.to(bookCover.value, {
    rotationY: -180,
    duration: 1.2,
    ease: 'power4.inOut',
    transformOrigin: 'left'
  });

  // Mostrar título
  mainTimeline.to(pageTitle.value, {
    opacity: 1,
    y: 0,
    duration: 0.5
  });

  // Mostrar opciones
  mainTimeline.to(optionsContainer.value, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    ease: 'back.out(1.7)'
  });
}

function handleNewEntry() {
  if (isAnimating.value) return;
  isAnimating.value = true;

  const tl = gsap.timeline({
    onComplete: () => {
      isCreatingEntry.value = true;
      isAnimating.value = false;
    }
  });

  // Ocultamos los botones y el título
  tl.to([optionsContainer.value, pageTitle.value], {
    opacity: 0,
    y: 20,
    duration: 0.3
  });
}

function handleViewEntries() {
  console.log('Click en Ver Entradas');
  if (isAnimating.value) return;
  isAnimating.value = true;

  const tl = gsap.timeline({
    onComplete: () => {
      showingEntries.value = true;
      isAnimating.value = false;
    }
  });

  tl.to([optionsContainer.value, pageTitle.value], {
    opacity: 0,
    y: 20,
    duration: 0.3
  });
}

function closeNewEntry() {
  isCreatingEntry.value = false;
  resetBookContent();
}

function closeEntries() {
  showingEntries.value = false;
  resetBookContent();
}

function resetBookContent() {
  const tl = gsap.timeline();
  
  // Primero reseteamos la rotación del libro
  tl.to(bookCover.value, {
    rotationY: -180,
    duration: 0.5,
    ease: 'power2.inOut'
  });

  // Mostramos el contenido del libro
  tl.set(bookContent.value, { 
    opacity: 1,
    display: 'flex'
  });

  // Mostramos el título y los botones con animación
  tl.to(pageTitle.value, {
    opacity: 1,
    y: 0,
    duration: 0.5
  });

  tl.to(optionsContainer.value, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    ease: 'back.out(1.7)'
  });
}

function onEntrySaved() {
  closeNewEntry();
  showingEntries.value = true;
}

function startNewEntry() {
  isCreatingEntry.value = true;
  showingEntries.value = false;
}

function showEntries() {
  showingEntries.value = true;
  isCreatingEntry.value = false;
}
</script>

<style scoped>
.diary-view {
  width: 100%;
  height: 100vh;
  background: linear-gradient(to bottom, #1a1a1a, #2d2d2d);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.scene {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transform-style: preserve-3d;
}

.desk {
  position: relative;
  width: 90%;
  max-width: 1200px;
  height: 80vh;
  background: linear-gradient(45deg, #654321, #8B4513);
  transform-style: preserve-3d;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  border-radius: 10px;
  padding: 2rem;
}

.desk-texture {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    repeating-linear-gradient(
      45deg,
      rgba(255,255,255,0.05) 0px,
      rgba(255,255,255,0.05) 2px,
      transparent 2px,
      transparent 20px
    );
  border-radius: 10px;
  pointer-events: none;
}

.book {
  position: relative;
  width: 80%;
  max-width: 800px;
  height: 90%;
  margin: 0 auto;
  transform-style: preserve-3d;
}

.book-cover {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #8B4513, #A0522D);
  border-radius: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  transform-style: preserve-3d;
  box-shadow: -10px 10px 20px rgba(0,0,0,0.3);
  transform-origin: left;
  z-index: 1;
}

.book-title {
  color: #FFD700;
  font-size: 3.5rem;
  font-family: 'Playfair Display', serif;
  text-align: center;
  padding: 20px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  font-weight: bold;
}

.book-content {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 15px;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  transform-style: flat;
  pointer-events: auto;
  z-index: 2;
}

.page-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  z-index: 3;
}

.page-title {
  font-family: 'Playfair Display', serif;
  font-size: 3rem;
  color: #2c3e50;
  margin-bottom: 4rem;
  text-align: center;
  font-weight: bold;
}

.options-container {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: relative;
  z-index: 4;
}

.diary-option {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  padding: 1.5rem;
  background: #fff;
  border: 3px solid #8B4513;
  border-radius: 10px;
  font-size: 1.4rem;
  color: #8B4513;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  transition: all 0.3s ease;
  position: relative;
  z-index: 5;
}

.diary-option:hover {
  background: #8B4513;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(139, 69, 19, 0.2);
}

.diary-option:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.3);
}

.diary-option i {
  font-size: 1.6rem;
  pointer-events: none;
}

.diary-option span {
  pointer-events: none;
}

/* Elementos decorativos del escritorio */
.desk-items {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.pencil {
  position: absolute;
  width: 120px;
  height: 8px;
  background: linear-gradient(90deg, #FFD700, #FFA500);
  right: 50px;
  top: 50px;
  transform: rotate(45deg);
  border-radius: 4px;
}

.coffee-cup {
  position: absolute;
  width: 40px;
  height: 50px;
  background: #fff;
  right: 100px;
  top: 100px;
  border-radius: 0 0 20px 20px;
  box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
}

.coffee-cup::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 12px;
  border: 4px solid #fff;
  right: -15px;
  top: 10px;
  border-radius: 10px;
}

/* Animaciones de transición para router-view */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.diary-menu {
  padding: 2rem;
  text-align: center;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.menu-hidden {
  opacity: 0;
  transform: translateY(-20px);
  pointer-events: none;
}

.diary-title {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.menu-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

.menu-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid #8B4513;
  border-radius: 8px;
  background: transparent;
  color: #8B4513;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-option:hover {
  background: #8B4513;
  color: white;
  transform: translateY(-2px);
}

.menu-option i {
  font-size: 1.4rem;
}
</style>