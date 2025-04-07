<template>
  <aside
    id="sidenav-main"
    ref="sidenav"
    class="sidenav navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-3"
    :class="[isRTL ? 'me-3 rotate-caret fixed-end' : 'fixed-start ms-3', sidebarType, { collapsed: isCollapsed }]"
  >
    <div class="sidenav-header">
      <a href="#" class="m-0 navbar-brand" @click.prevent="toggleCollapse">
        <img
          :src="journeyLogo"
          class="navbar-brand-img h-100"
          alt="main_logo"
        />
      </a>
    </div>

    <hr class="horizontal light mt-0 mb-2" />
    <SidenavList :collapsed="isCollapsed" />
  </aside>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useStore } from 'vuex'
import gsap from 'gsap'
import SidenavList from './SidenavList.vue'
import journeyLogo from '@/assets/img/small-logos/journey_logo.png'

const store = useStore()
const isRTL = computed(() => store.state.isRTL)
const sidebarType = computed(() => store.state.sidebarType)
const isDarkMode = computed(() => store.state.isDarkMode)

const sidenav = ref(null)
const isCollapsed = ref(false)

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value

  nextTick(() => {
    gsap.to(sidenav.value, {
      width: isCollapsed.value ? '80px' : '250px',
      duration: 0.5,
      ease: 'power2.inOut'
    })
  })
}
</script>

<style scoped>
#sidenav-main {
  transition: width 0.3s ease;
  width: 250px;
  overflow: hidden;
}

#sidenav-main.collapsed {
  width: 80px;
}

.navbar-brand-img {
  transition: transform 0.3s ease;
  cursor: pointer;
}
</style>
