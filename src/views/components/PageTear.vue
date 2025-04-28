<!-- src/components/PageTear.vue -->
<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 bg-[#fefaf5] animate-tear pointer-events-none"
    @animationend="onAnimationEnd"
  ></div>
</template>

<script setup>
import { ref } from 'vue'
const show = ref(false)

function playAnimation() {
  show.value = true
}
function onAnimationEnd() {
  show.value = false
}
// eslint-disable-next-line
defineExpose({ playAnimation })
</script>

<style scoped>
@keyframes tear {
  0% {
    transform: scaleY(1) rotate(0);
    opacity: 1;
  }
  100% {
    transform: scaleY(0) rotate(-5deg);
    opacity: 0;
  }
}

.animate-tear {
  animation: tear 0.8s ease-in-out forwards;
}
</style>

