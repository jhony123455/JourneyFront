<template>
  <div
    ref="sidenav"
    class="w-auto h-auto collapse navbar-collapse max-height-vh-100 h-100"
    id="sidenav-collapse-main"
  >
    <ul class="navbar-nav">
      <!-- Features Section -->
      <li class="mt-3 nav-item">
        <h6
          class="text-xs ps-4 text-uppercase font-weight-bolder text-white"
          :class="$store.state.isRTL ? 'me-4' : 'ms-2'"
        >
          Features
        </h6>
      </li>

      <li
        class="nav-item"
        ref="calendario"
        @mouseenter="hoverAnimation($event)"
        @click="calendarioClick"
      >
        <sidenav-collapse
          url="#"
          :aria-controls="''"
          :collapse="false"
          collapseRef="calendario"
          navText="Calendario"
        >
          <template v-slot:icon>
            <i class="material-icons-round opacity-10 fs-5">calendar_today</i>
          </template>
        </sidenav-collapse>
      </li>

      <li
        class="nav-item"
        ref="diario"
        @mouseenter="hoverAnimation($event)"
      >
        <sidenav-collapse
          url="#"
          :aria-controls="''"
          :collapse="false"
          collapseRef="diario"
          navText="Diario"
        >
          <template v-slot:icon>
            <i class="material-icons-round opacity-10 fs-5">book</i>
          </template>
        </sidenav-collapse>
      </li>

      <li
        class="nav-item"
        ref="configuraciones"
        @mouseenter="hoverAnimation($event)"
      >
        <sidenav-collapse
          url="#"
          :aria-controls="''"
          :collapse="false"
          collapseRef="configuraciones"
          navText="Configuraciones"
        >
          <template v-slot:icon>
            <i class="material-icons-round opacity-10 fs-5">settings</i>
          </template>
        </sidenav-collapse>
      </li>

      <!-- User Section -->
      <li class="mt-3 nav-item">
        <h6
          class="text-xs ps-4 text-uppercase font-weight-bolder text-white"
          :class="$store.state.isRTL ? 'me-4' : 'ms-2'"
        >
          Perfiles
        </h6>
      </li>

      <li
        class="nav-item"
        ref="perfil"
        @mouseenter="hoverAnimation($event)"
      >
        <sidenav-collapse
          url="#"
          :aria-controls="''"
          :collapse="false"
          collapseRef="perfil"
          navText="Perfil"
        >
          <template v-slot:icon>
            <i class="material-icons-round opacity-10 fs-5">person</i>
          </template>
        </sidenav-collapse>
      </li>

      <li
        class="nav-item"
        ref="logout"
        @mouseenter="hoverAnimation($event)"
      >
        <sidenav-collapse
          url="#"
          :aria-controls="''"
          :collapse="false"
          collapseRef="logout"
          navText="Log Out"
        >
          <template v-slot:icon>
            <i class="material-icons-round opacity-10 fs-5">logout</i>
          </template>
        </sidenav-collapse>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue'
import SidenavCollapse from './SidenavCollapse.vue'
import gsap from 'gsap'
import { useStore } from 'vuex'
const store = useStore()
const sidenav = ref(null)

// Refs for animatable items
const calendario = ref(null)
const diario = ref(null)
const configuraciones = ref(null)
const perfil = ref(null)
const logout = ref(null)

onMounted(async () => {
  await nextTick()

  gsap.set([calendario.value, diario.value, configuraciones.value, perfil.value, logout.value], {
    opacity: 0,
    y: 30,
    scale: 0.9,
  })

  gsap.to([calendario.value, diario.value, configuraciones.value, perfil.value, logout.value], {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.6,
    stagger: 0.15,
    ease: 'power4.out',
  })
})


function hoverAnimation(event) {
  const el = event.currentTarget
  const tl = gsap.timeline({ defaults: { duration: 0.3, ease: 'power2.out' } })

  const anims = [
    () => tl.to(el, { scale: 1.1 }).to(el, { scale: 1 }),
    () => tl.to(el, { rotation: 10 }).to(el, { rotation: -10 }).to(el, { rotation: 0 }),
    () => tl.to(el, { x: 10 }).to(el, { x: -10 }).to(el, { x: 0 }),
    () => tl.to(el, { y: -8 }).to(el, { y: 0 }),
    () => tl.to(el, { opacity: 0.5 }).to(el, { opacity: 1 }),
  ]

  const randomAnim = anims[Math.floor(Math.random() * anims.length)]
  randomAnim()
}


function calendarioClick() {
  const el = calendario.value
  const emojis = ['🌸', '☀️', '🍂', '❄️']
  const colors = ['#E1F5FE', '#FFF9C4', '#FFE0B2', '#E0F7FA']
  const timeline = gsap.timeline()

  emojis.forEach((emoji, index) => {
    const temp = document.createElement('div')
    temp.textContent = emoji
    temp.style.position = 'absolute'
    temp.style.fontSize = '24px'
    temp.style.top = `${Math.random() * 80 + 10}%`
    temp.style.left = `${Math.random() * 80 + 10}%`
    temp.style.zIndex = '10000'
    el.appendChild(temp)

    gsap.fromTo(
      temp,
      { scale: 0, opacity: 1 },
      {
        scale: 1.5,
        duration: 0.5,
        opacity: 0,
        ease: 'power2.out',
        delay: index * 0.1,
        onComplete: () => el.removeChild(temp),
      }
    )

    timeline.to(el, {
      backgroundColor: colors[index],
      duration: 0.15,
      ease: 'power1.inOut',
    })
  })

  timeline.to(el, {
    backgroundColor: '',
    duration: 0.3,
    clearProps: 'backgroundColor',
  })
}

</script>

<style scoped>
.nav-item {
  transition: all 0.3s ease-in-out;
  border-radius: 12px;
}

.nav-item:hover {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  background-color: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

</style>
