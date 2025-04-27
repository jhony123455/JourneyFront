<template>
  <el-button
    class="fab fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-999"
    type="primary"
    circle
    @click="$emit('click')"
  >
    <i class="material-icons-round text-white text-lg">add</i>
  </el-button>
</template>

<style scoped>
.fab {
  background-color: #3b82f6; /* Azul similar a bg-blue-500 */
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 999; /* Asegúrate de que esté por encima de otros elementos */
}
.fab:hover {
  background-color: #2563eb; /* Azul más oscuro similar a hover:bg-blue-600 */
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}
</style>
