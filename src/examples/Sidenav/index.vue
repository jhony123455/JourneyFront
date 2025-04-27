<template>
  <aside
    id="sidenav-main"
    ref="sidenav"
    class="sidenav navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-3"
    :class="[
      isRTL ? 'me-3 rotate-caret fixed-end' : 'fixed-start ms-3',
      sidebarType,
      { collapsed: isCollapsed },
    ]"
    @mouseenter="expandOnHover"
    @mouseleave="collapseOnLeave"
  >
    <div class="sidenav-header">
      <a href="#" class="navbar-brand m-0" @click.prevent="toggleCollapse">
        <img
          :src="journeyLogo"
          class="navbar-brand-img h-100"
          :class="{ 'collapsed-logo': isCollapsed }"
          alt="main_logo"
        />
      </a>
    </div>

    <hr class="horizontal light mt-0 mb-2" />
    <SidenavList :collapsed="isCollapsed" />
  </aside>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import { useStore } from "vuex";
import gsap from "gsap";
import SidenavList from "./SidenavList.vue";
import journeyLogo from "@/assets/img/small-logos/journey_logo.png";

const store = useStore();

const isRTL = computed(() => store.state.isRTL);
const sidebarType = computed(() => store.state.sidebarType);

const sidenav = ref(null);
const isCollapsed = ref(false);
const isHovering = ref(false)
const isLocked = ref(false)

function toggleCollapse() {
  isLocked.value = !isLocked.value 

  isCollapsed.value = !isCollapsed.value
  nextTick(() => {
    gsap.to(sidenav.value, {
      width: isCollapsed.value ? '80px' : '250px',
      duration: 0.5,
      ease: 'power2.inOut'
    })
    store.commit('SET_SIDENAV_COLLAPSED', isCollapsed.value)
  })
}

function expandOnHover() {
  if (!isLocked.value && isCollapsed.value && !isHovering.value) { 
    isHovering.value = true
    gsap.to(sidenav.value, {
      width: '250px',
      duration: 0.3,
      ease: 'power2.out'
    })
  }
}

function collapseOnLeave() {
  if (!isLocked.value && isHovering.value) { 
    isHovering.value = false
    gsap.to(sidenav.value, {
      width: '80px',
      duration: 0.3,
      ease: 'power2.in'
    })
  }
}

function animateSidenav(collapsed) {
  if (!sidenav.value) return;

  gsap.to(sidenav.value, {
    width: collapsed ? "80px" : "250px",
    duration: 0.5,
    ease: "power2.inOut",
  });
}
</script>

<style scoped>
#sidenav-main {
  width: 250px;
  overflow: hidden;
  transition: width 0.5s ease, overflow 0.5s ease;
}

#sidenav-main.collapsed {
  width: 80px;
}

.navbar-brand-img {
  transition: transform 0.5s ease;
  cursor: pointer;
}

.collapsed-logo {
  transform: scale(0.8);
}
</style>
