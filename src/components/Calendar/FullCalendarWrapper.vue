<template>
  <Transition name="calendar-fade" mode="out-in">
    <el-card
      v-if="calendarReady"
      key="calendar"
      ref="calendarCard"
      class="rounded-xl shadow-lg calendar-container"
      body-style="padding: 0; background: white;"
    >
      <FullCalendar
        ref="calendarRef"
        :options="mergedCalendarOptions"
      />
    </el-card>
  </Transition>
</template>

<script setup>
import { ElCard } from "element-plus";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { ref, defineProps, computed, onMounted, watch, nextTick } from "vue";
import { gsap } from "gsap";

const props = defineProps({
  calendarReady: Boolean,
  calendarOptions: {
    type: Object,
    default: () => ({
      droppable: true,
    }),
  },
});

const calendarRef = ref(null);
const calendarCard = ref(null);

// Combinamos las opciones predeterminadas con las proporcionadas
const mergedCalendarOptions = computed(() => {
  return {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: "dayGridMonth",
    locale: esLocale,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    buttonText: {
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      day: "Día",
      list: "Lista",
    },
    ...props.calendarOptions,
  };
});

// Función para determinar la estación actual basada en el mes
const getCurrentSeason = (customDate = null) => {
  const date = customDate ? new Date(customDate) : new Date();
  const month = date.getMonth();

  // Hemisferio norte
  if (month >= 2 && month <= 4) return "primavera";
  if (month >= 5 && month <= 7) return "verano";
  if (month >= 8 && month <= 10) return "otoño";
  return "invierno";
};


// Animaciones por estación
// Animaciones por estación
const seasonAnimations = {
  primavera: (el) => {
    clearSeasonalElements(el);

    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    gsap.to(el, {
      duration: 3,
      background: "linear-gradient(to top, #c1dfc4, #deecdd)",
    });

    // Flores flotando (Emoji 🌸)
    for (let i = 0; i < 10; i++) {
      const flower = document.createElement("div");
      flower.classList.add("flower", "seasonal-element");
      flower.textContent = "🌸"; // Emoji de flor
      el.appendChild(flower);

      gsap.fromTo(
        flower,
        {
          x: Math.random() * window.innerWidth + "px",
          y: window.innerHeight + "px",
          opacity: 1,
          scale: Math.random() * 0.5 + 0.5,
        },
        {
          y: "-10vh",
          duration: Math.random() * 3 + 2,
          ease: "linear",
          repeat: -1,
          delay: Math.random() * 2,
        }
      );
    }
  },

  verano: (el) => {
    clearSeasonalElements(el);

    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    gsap.to(el, {
      duration: 3,
      background: "linear-gradient(to top, #fddb92, #d1fdff)",
    });

    // Sol brillante (Emoji ☀️)
    const sun = document.createElement("div");
    sun.classList.add("sun", "seasonal-element");
    sun.textContent = "☀️"; // Emoji de sol
    el.appendChild(sun);

    gsap.to(sun, {
      rotation: 360,
      repeat: -1,
      duration: 10,
      ease: "linear",
    });
  },

  otoño: (el) => {
    clearSeasonalElements(el);

    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    gsap.to(el, {
      duration: 3,
      background: "linear-gradient(to top, #d1913c, #ffd194)",
    });

    // Hojas cayendo (Emoji 🍂)
    for (let i = 0; i < 15; i++) {
      const leaf = document.createElement("div");
      leaf.classList.add("leaf", "seasonal-element");
      leaf.textContent = "🍂"; // Emoji de hoja
      el.appendChild(leaf);

      gsap.fromTo(
        leaf,
        {
          x: Math.random() * window.innerWidth + "px",
          y: "-10vh",
          rotation: 0,
        },
        {
          y: window.innerHeight + 10 + "px",
          rotation: 360,
          duration: Math.random() * 4 + 2,
          ease: "sine.inOut",
          repeat: -1,
          delay: Math.random() * 3,
        }
      );
    }
  },

  invierno: (el) => {
    clearSeasonalElements(el);

    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    gsap.to(el, {
      duration: 3,
      background: "linear-gradient(to top, #83a4d4, #b6fbff)",
    });

    // Copos de nieve (Emoji ❄️)
    for (let i = 0; i < 20; i++) {
      const snow = document.createElement("div");
      snow.classList.add("snowflake", "seasonal-element");
      snow.textContent = "❄️"; // Emoji de copo de nieve
      el.appendChild(snow);

      gsap.fromTo(
        snow,
        {
          x: Math.random() * window.innerWidth + "px",
          y: "-10vh",
          opacity: 0.8,
        },
        {
          y: window.innerHeight + 10 + "px",
          opacity: 0,
          duration: Math.random() * 5 + 3,
          repeat: -1,
          delay: Math.random() * 2,
        }
      );
    }
  },
};

// Función para aplicar animaciones según la estación
const applySeasonalAnimation = (season = null) => {
  if (!calendarCard.value) return;

  const container = calendarCard.value.$el.querySelector(".fc");
  if (!container) {
    console.error("Contenedor del calendario no encontrado.");
    return;
  }

  const seasonToApply = season || getCurrentSeason();

  if (seasonAnimations[seasonToApply]) {
    seasonAnimations[seasonToApply](container);
  }
};

// Función para limpiar elementos estacionales anteriores
const clearSeasonalElements = (container) => {
  const elements = container.querySelectorAll(".seasonal-element");
  elements.forEach((el) => {
    gsap.killTweensOf(el);
    el.remove();
  });
};

onMounted(() => {
  if (props.calendarReady && calendarCard.value) {
    nextTick(() => {
      applySeasonalAnimation(getCurrentSeason("2025-03-21")); // Forzar verano

    });
  }
});

watch(
  () => props.calendarReady,
  (newVal) => {
    if (newVal && calendarCard.value) {
      setTimeout(() => {
        applySeasonalAnimation();
      }, 100);
    }
  }
);
</script>

<style scoped>
.calendar-fade-enter-active,
.calendar-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.calendar-fade-enter-from,
.calendar-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.calendar-container {
  position: relative;
  overflow: hidden;
  min-height: 500px;
}

/* Estilos para elementos estacionales */
.flower {
  position: absolute;
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, #ff9cee 0%, #ff69b4 100%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
}

.flower::after {
  content: "";
  position: absolute;
  top: -5px;
  left: -5px;
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, transparent 0%, transparent 60%, #ff69b4 100%);
  border-radius: 50%;
  opacity: 0.5;
}

.sun {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, #ffef5a 0%, #ffb300 100%);
  border-radius: 50%;
  box-shadow: 0 0 30px 10px rgba(255, 214, 0, 0.7);
  pointer-events: none;
  z-index: 1;
}

.leaf {
  position: absolute;
  width: 25px;
  height: 25px;
  background: linear-gradient(135deg, #ff7b00 0%, #ff9e5a 100%);
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12,21C7,17 2,12.5 2,8C2,4.5 5,2 8,2C9.4,2 10.8,2.6 12,3.5C13.2,2.6 14.6,2 16,2C19,2 22,4.5 22,8C22,12.5 17,17 12,21Z'/%3E%3C/svg%3E");
  mask-size: cover;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12,21C7,17 2,12.5 2,8C2,4.5 5,2 8,2C9.4,2 10.8,2.6 12,3.5C13.2,2.6 14.6,2 16,2C19,2 22,4.5 22,8C22,12.5 17,17 12,21Z'/%3E%3C/svg%3E");
  -webkit-mask-size: cover;
  transform-origin: center;
  pointer-events: none;
  z-index: 1;
}

.snowflake {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: white;
  border-radius: 50%;
  filter: blur(1px);
  pointer-events: none;
  z-index: 1;
}
</style>