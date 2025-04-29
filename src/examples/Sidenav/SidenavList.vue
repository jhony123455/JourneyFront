<template>
  <div
    id="sidenav-collapse-main"
    ref="sidenav"
    class="w-auto h-auto collapse navbar-collapse max-height-vh-100 h-100"
    :class="{'collapsed': !$store.state.isPinned}"
  >
    <ul class="navbar-nav">
      <!-- Features Section -->
      <li v-if="$store.state.isPinned" class="mt-3 nav-item">
        <h6
          class="text-xs ps-4 text-uppercase font-weight-bolder text-white"
          :class="$store.state.isRTL ? 'me-4' : 'ms-2'"
        >
          Features
        </h6>
      </li>
      <li v-else class="mt-3 nav-item text-center">
        <div class="separator-mini"></div>
      </li>

      <li
        ref="calendario"
        class="nav-item"
        @mouseenter="hoverAnimation($event)"
        @click="calendarioClick"
      >
        <sidenav-collapse
          nav-text="Calendario"
          url="#"
          :aria-controls="''"
          :collapse="false"
          collapse-ref="calendario"
        >
          <template #icon>
            <i class="material-icons-round opacity-10 fs-5">calendar_today</i>
          </template>
        </sidenav-collapse>
      </li>

      <li
        ref="diario"
        class="nav-item"
        @mouseenter="hoverAnimation($event)"
      >
        <sidenav-collapse
          url="#"
          :aria-controls="''"
          :collapse="false"
          collapse-ref="diario"
          nav-text="Diario"
        >
          <template #icon>
            <i class="material-icons-round opacity-10 fs-5">book</i>
          </template>
        </sidenav-collapse>
      </li>


      <!-- User Section -->
      <li v-if="$store.state.isPinned" class="mt-3 nav-item">
        <h6
          class="text-xs ps-4 text-uppercase font-weight-bolder text-white"
          :class="$store.state.isRTL ? 'me-4' : 'ms-2'"
        >
          Perfiles
        </h6>
      </li>
      <li v-else class="mt-3 nav-item text-center">
        <div class="separator-mini"></div>
      </li>

      <li
        ref="perfil"
        class="nav-item"
        @mouseenter="hoverAnimation($event)"
      >
        <sidenav-collapse
          url="#"
          :aria-controls="''"
          :collapse="false"
          collapse-ref="perfil"
          nav-text="Perfil"
        >
          <template #icon>
            <i class="material-icons-round opacity-10 fs-5">person</i>
          </template>
        </sidenav-collapse>
      </li>

      <li
        ref="logout"
        class="nav-item"
        @mouseenter="hoverAnimation($event)"
        @click.prevent="handleLogout"
      >
        <sidenav-collapse
          url="#"
          :aria-controls="''"
          :collapse="false"
          collapse-ref="logout"
          nav-text="Log Out"
        >
          <template #icon>
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
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const store = useStore()
const sidenav = ref(null)

// Refs for animatable items
const calendario = ref(null)
const diario = ref(null)
const configuraciones = ref(null)
const perfil = ref(null)
const logout = ref(null)
const router = useRouter();

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

async function handleLogout() {
  try {
    // Confirmación con SweetAlert
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que deseas salir?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      // Llamada al servicio de logout
      await store.dispatch('auth/logout'); // Ajusta según tu estructura de Vuex
      
      // Limpieza y redirección
      localStorage.removeItem('user_free');
      await router.push('/login');
      
      // Animación opcional al cerrar sesión
      gsap.to(logout.value, {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
      });
    }
  } catch (error) {
    Swal.fire({
      title: 'Error',
      text: error.message || 'No se pudo cerrar la sesión',
      icon: 'error',
    });
  }
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

#sidenav-collapse-main {
  transition: width 0.3s ease-in-out;
  width: 250px;
  overflow-x: hidden;
}

#sidenav-collapse-main.collapsed {
  width: 80px;
}

.separator-mini {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  width: 60%;
  margin: 10px auto;
}
</style>