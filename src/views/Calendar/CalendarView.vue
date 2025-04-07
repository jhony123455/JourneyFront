<template>
  <div>
    <SeasonLoader v-if="showLoader" />
    <div v-else>
      <!-- Tu contenido del calendario -->
      <h1 class="text-center">Calendario</h1>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SeasonLoader from '@/views/components/SeasonLoader.vue'

const showLoader = ref(true)

onMounted(() => {
  setTimeout(() => {
    showLoader.value = false
  }, 3500)
})
</script>
