<template>
  <li class="nav-item">
    <a
      class="nav-link text-white"
      data-bs-toggle="collapse"
      :aria-expanded="isExpanded"
      :href="`#${refer}`"
      @click="toggleExpand"
    >
      <span class="sidenav-mini-icon"> {{ miniIcon }} </span>
      <span class="sidenav-normal me-3 ms-2 ps-1">
        {{ text }} <b class="caret"></b>
      </span>
    </a>
    <div 
      ref="collapseContent"
      class="collapse" 
      :class="{ 'show': isExpanded }"
    >
      <ul class="nav nav-sm flex-column">
        <slot name="nav-child-item" />
      </ul>
    </div>
  </li>
</template>

<script setup>
import { ref, watch, nextTick, defineProps } from 'vue'
import gsap from 'gsap'

const props = defineProps({
  refer: {
    type: String,
    required: true,
  },
  miniIcon: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
})

const isExpanded = ref(false)
const collapseContent = ref(null)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

// Animation for collapsible content
watch(isExpanded, async (expanded) => {
  await nextTick()
  if (!collapseContent.value) return

  if (expanded) {
    gsap.to(collapseContent.value, {
      height: 'auto',
      duration: 0.3,
      ease: 'power2.out',
      opacity: 1,
    })
  } else {
    gsap.to(collapseContent.value, {
      height: 0,
      duration: 0.3,
      ease: 'power2.in',
      opacity: 0,
    })
  }
})
</script>

<style scoped>
.nav-link {
  transition: all 0.3s ease;
}

.sidenav-mini-icon {
  display: block;
  text-align: center;
  transition: all 0.3s ease;
}

.sidenav-normal {
  transition: opacity 0.3s ease;
  white-space: nowrap;
}

.collapse {
  transition: all 0.3s ease;
}
</style>