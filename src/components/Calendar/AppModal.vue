<template>
  <Transition name="modal-fade">
    <div
      v-if="show"
      class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
      @click.self="close"
    >
      <div
        ref="modalContent"
        class="modal-content bg-white rounded-lg p-6 max-w-md w-full"
        :class="{'max-w-lg': size === 'large'}"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">{{ title }}</h2>
          <button 
            class="text-gray-500 hover:text-gray-700" 
            @click="close"
          >
            <i class="material-icons-round">close</i>
          </button>
        </div>
        
        <div class="modal-body">
          <slot></slot>
        </div>
        
        <div v-if="!hideActions" class="flex justify-end gap-3 mt-5">
          <slot name="actions">
            <button
              type="button"
              class="px-4 py-2 border rounded hover:bg-gray-100"
              @click="close"
            >
              {{ cancelText }}
            </button>
            <button
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              @click="confirm"
            >
              {{ confirmText }}
            </button>
          </slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick, defineEmits, defineProps } from 'vue';
import gsap from 'gsap';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Modal'
  },
  confirmText: {
    type: String,
    default: 'Aceptar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  },
  hideActions: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'default' // 'default', 'large'
  }
});

const emit = defineEmits(['close', 'confirm']);
const modalContent = ref(null);

function close() {
  animateClose();
}

function confirm() {
  emit('confirm');
}

function animateOpen() {
  if (modalContent.value) {
    gsap.fromTo(
      modalContent.value,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
    );
  }
}

function animateClose() {
  if (modalContent.value) {
    gsap.to(modalContent.value, {
      y: 50,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        emit('close');
      }
    });
  } else {
    emit('close');
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      animateOpen();
    });
  }
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-content {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}
</style>