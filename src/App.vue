<template>
  <sidenav
    v-if="showSidenav"
    :custom_class="color"
    :class="[isRTL ? 'fixed-end' : 'fixed-start']"
  />
  <main
    class="main-content position-relative max-height-vh-100 h-100 overflow-x-hidden"
  >
    <!-- nav -->
    <navbar
      v-if="showNavbar"
      :class="[isNavFixed ? navbarFixed : '', isAbsolute ? absolute : '']"
      :color="isAbsolute ? 'text-white opacity-8' : ''"
      :min-nav="navbarMinimize"
    />
    <router-view />
    <app-footer v-show="showFooter" />
    <configurator
      :toggle="toggleConfigurator"
      :class="[showConfig ? 'show' : '', hideConfigButton ? 'd-none' : '']"
    />
  </main>
</template>

<script setup>
import { onBeforeMount, computed } from 'vue';
import { useStore } from 'vuex';
import Sidenav from "./examples/Sidenav";
import Configurator from "@/examples/Configurator.vue";

// Store
const store = useStore();

// Computed properties
const isRTL = computed(() => store.state.isRTL);
const color = computed(() => store.state.color);
const isAbsolute = computed(() => store.state.isAbsolute);
const isNavFixed = computed(() => store.state.isNavFixed);
const navbarFixed = computed(() => store.state.navbarFixed);
const absolute = computed(() => store.state.absolute);
const showSidenav = computed(() => store.state.showSidenav);
const showNavbar = computed(() => store.state.showNavbar);
const showFooter = computed(() => store.state.showFooter);
const showConfig = computed(() => store.state.showConfig);
const hideConfigButton = computed(() => store.state.hideConfigButton);

// Methods
const toggleConfigurator = () => store.commit('toggleConfigurator');
const navbarMinimize = () => store.commit('navbarMinimize');

// Lifecycle hooks
onBeforeMount(() => {
  store.state.isTransparent = "bg-transparent";

  const sidenav = document.getElementsByClassName("g-sidenav-show")[0];

  if (window.innerWidth > 1200) {
    sidenav.classList.add("g-sidenav-pinned");
  }
});
</script>
