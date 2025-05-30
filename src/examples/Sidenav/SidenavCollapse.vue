<template>
  <router-link
    :to="collapse ? `#${collapseRef}` : collapseRef"
    class="nav-link d-flex align-items-center"
    :class="[
      isActive ? `active bg-gradient-${color}` : '',
      isSidenavCollapsed ? 'justify-content-center py-3' : ''
    ]"
    v-bind="$attrs"
    :aria-expanded="isExpanded"
    :aria-controls="collapseRef"
    @click="toggleExpand"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div 
      class="icon-wrapper"
      :class="[
        isRTL ? 'ms-2' : 'me-2',
        isSidenavCollapsed ? 'mx-auto icon-enlarged' : ''
      ]"
    >
      <slot name="icon" />
    </div>

    <span
      v-if="!isSidenavCollapsed"
      class="nav-link-text"
      :class="isRTL ? 'me-1' : 'ms-1'"
    >
      {{ navText }}
    </span>
    
    <div 
      v-if="isSidenavCollapsed && showTooltip" 
      class="sidenav-tooltip"
      :class="{ show: showTooltip }"
      :style="{ top: tooltipTop + 'px' }"
    >
      {{ navText }}
    </div>
  </router-link>

  <div v-show="isExpanded && !isSidenavCollapsed" class="collapse" ref="submenuRef">
    <slot name="list" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick,defineProps } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import gsap from 'gsap'

const props = defineProps({
  collapseRef: {
    type: String,
    required: true
  },
  navText: {
    type: String,
    required: true
  },
  collapse: {
    type: Boolean,
    default: true
  }
})

const route = useRoute()
const store = useStore()

const isExpanded = ref(false)
const submenuRef = ref(null)
const showTooltip = ref(false)
const tooltipTop = ref(0)

const toggleExpand = () => {
  if (!isSidenavCollapsed.value) {
    isExpanded.value = !isExpanded.value
  }
}

const isRTL = computed(() => store.state.isRTL)
const color = computed(() => store.state.color)
const isSidenavCollapsed = computed(() => store.state.isSidenavCollapsed)

const isActive = computed(() => {
  const routeArr = route.path.split('/')
  return routeArr[1] === props.collapseRef
})

// GSAP animation for collapse
watch(isExpanded, async (expanded) => {
  await nextTick()
  if (!submenuRef.value) return

  if (expanded) {
    gsap.to(submenuRef.value, {
      height: 'auto',
      duration: 0.3,
      ease: 'power2.out',
      opacity: 1,
      display: 'block'
    })
  } else {
    gsap.to(submenuRef.value, {
      height: 0,
      duration: 0.3,
      ease: 'power2.in',
      opacity: 0,
      display: 'none'
    })
  }
})

function handleMouseEnter(event) {
  if (isSidenavCollapsed.value) {
    tooltipTop.value = event.target.getBoundingClientRect().top
    showTooltip.value = true
  }
}

function handleMouseLeave() {
  showTooltip.value = false
}
</script>

<style scoped>
.icon-wrapper {
  min-width: 2rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-enlarged {
  transform: scale(1.2);
}

.nav-link {
  transition: all 0.3s ease;
  position: relative;
  white-space: nowrap;
  padding: 0.75rem 1rem;
}

.nav-link-text {
  transition: opacity 0.3s ease;
  white-space: nowrap;
  opacity: 1;
}

.sidenav-tooltip {
  position: fixed;
  left: 85px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  white-space: nowrap;
  z-index: 1000;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.sidenav-tooltip.show {
  opacity: 1;
  visibility: visible;
}

.collapse {
  transition: height 0.3s ease-in-out;
  overflow: hidden;
}

.nav-link.active {
  background-color: var(--bs-primary);
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>