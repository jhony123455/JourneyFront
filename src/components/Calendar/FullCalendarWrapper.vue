<template>
  <Transition name="calendar-fade" mode="out-in">
    <el-card
      v-if="calendarReady"
      key="calendar"
      ref="calendarCard"
      class="rounded-xl shadow-lg calendar-container"
      body-style="padding: 0; background: white;"
    >
      <FullCalendar ref="calendarRef" :options="mergedCalendarOptions" />
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
import {
  ref,
  defineProps,
  computed,
  onMounted,
  watch,
  nextTick,
  defineExpose,
} from "vue";
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
const lastEventDateMap = new Map();
// Mapa para almacenar los colores por fecha
const cellColorsMap = new Map();

const calendarRef = ref(null);
const calendarCard = ref(null);

// Colores pastel para eventos
const pastelColors = {
  red: "#ffcccb",
  blue: "#b5d8ff",
  green: "#c1f0c1",
  yellow: "#fff0b3",
  purple: "#e0c3fc",
  orange: "#ffdab9",
  teal: "#b3e0e0",
  pink: "#ffd1dc",
};

// Función mejorada para convertir cualquier color a un tono pastel
const convertToPastelColor = (color) => {
  // Si ya es un color pastel predefinido, lo devolvemos
  if (Object.values(pastelColors).includes(color)) {
    console.log("Color predefinido:", color);
    return color;
  }

  const colorLower = typeof color === "string" ? color.toLowerCase() : "";

  // Si es un nombre de color conocido, devolver su versión pastel
  if (pastelColors[colorLower]) {
    console.log("Nombre de color a pastel:", pastelColors[colorLower]);
    return pastelColors[colorLower];
  }

  // Helper: convierte rgb/rgba a objeto { r, g, b }
  function parseRGB(rgbStr) {
    const matches = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i);
    if (!matches) return null;
    return {
      r: parseInt(matches[1]),
      g: parseInt(matches[2]),
      b: parseInt(matches[3]),
    };
  }

  // Si es rgb o rgba, lo convertimos a pastel
  if (colorLower.startsWith("rgb")) {
    const rgb = parseRGB(colorLower);
    if (rgb) {
      const pastelR = Math.floor((rgb.r + 255) / 2);
      const pastelG = Math.floor((rgb.g + 255) / 2);
      const pastelB = Math.floor((rgb.b + 255) / 2);
      const result = `rgb(${pastelR}, ${pastelG}, ${pastelB})`;
      console.log("Color RGB convertido:", result);
      return result;
    }
  }

  // Si es hex, extraemos los componentes y promediamos con blanco
  if (colorLower.startsWith("#")) {
    let hex = colorLower.replace("#", "");
    if (hex.length === 3) {
      hex = hex.split("").map((h) => h + h).join("");
    }
    if (hex.length === 6) {
      const r = Math.floor((parseInt(hex.substr(0, 2), 16) + 255) / 2);
      const g = Math.floor((parseInt(hex.substr(2, 2), 16) + 255) / 2);
      const b = Math.floor((parseInt(hex.substr(4, 2), 16) + 255) / 2);
      const result = `rgb(${r}, ${g}, ${b})`;
      console.log("Color HEX convertido:", result);
      return result;
    }
  }
  console.warn("Usando color por defecto");
  return "#e0e0e0";
};

const mixCellColors = (dateStr, color) => {
  const cell = document.querySelector(`[data-date='${dateStr}']`);
  if (!cell) return;

  const pastelColor = convertToPastelColor(color);

  let colors = cellColorsMap.get(dateStr) || [];

  if (!colors.includes(pastelColor)) {
    colors.push(pastelColor);
    cellColorsMap.set(dateStr, [...new Set(colors)]); // Prevenir duplicados
  }
  const existingOverlays = cell.querySelectorAll(".color-overlay");
  existingOverlays.forEach((overlay) => overlay.remove());

  if (colors.length === 1) {
    gsap.fromTo(
      cell,
      { backgroundColor: "transparent" },
      {
        backgroundColor: colors[0],
        duration: 0.5,
        ease: "power2.out",
      }
    );
  } else {
    gsap.to(cell, { backgroundColor: "transparent", duration: 0.3 });
    const segmentationType = getSegmentationType(colors.length);
    applySegmentation(cell, colors, segmentationType);
  }
};
const getSegmentationType = (colorCount) => {
  const types = ["diagonal", "horizontal", "vertical", "checkered", "radial"];
  return types[colorCount % types.length];
};

// Función para aplicar la segmentación según el tipo
const applySegmentation = (cell, colors, type) => {
  const cellRect = cell.getBoundingClientRect();
  const width = cellRect.width;
  const height = cellRect.height;

  // Restauramos el fondo de la celda a transparente
  gsap.set(cell, { backgroundColor: "rgba(255, 255, 255, 0)" });

  switch (type) {
    case "diagonal":
      applyDiagonalSegmentation(cell, colors, width, height);
      break;
    case "horizontal":
      applyHorizontalSegmentation(cell, colors, width, height);
      break;
    case "vertical":
      applyVerticalSegmentation(cell, colors, width, height);
      break;
    case "checkered":
      applyCheckeredSegmentation(cell, colors, width, height);
      break;
    case "radial":
      applyRadialSegmentation(cell, colors, width, height);
      break;
    default:
      applyDiagonalSegmentation(cell, colors, width, height);
  }
};

// Función para aplicar segmentación diagonal
const applyDiagonalSegmentation = (cell, colors, width, height) => {
  colors.forEach((color, index) => {
    const overlay = document.createElement("div");
    overlay.classList.add("color-overlay", "seasonal-element");
    cell.appendChild(overlay);

    const percentage = 100 / colors.length;
    const start = index * percentage;
    const end = (index + 1) * percentage;

    gsap.set(overlay, {
      position: "absolute",
      zIndex: 1,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: `linear-gradient(135deg, 
        ${color} ${start}%, 
        ${color} ${(start + end) / 2}%, 
        transparent ${(start + end) / 2}%, 
        transparent 100%)`,
      opacity: 0,
    });

    gsap.to(overlay, {
      opacity: 1,
      duration: 0.5,
      delay: index * 0.1,
      ease: "power1.inOut",
    });
  });
};

// Función para aplicar segmentación horizontal
const applyHorizontalSegmentation = (cell, colors, width, height) => {
  colors.forEach((color, index) => {
    const overlay = document.createElement("div");
    overlay.classList.add("color-overlay", "seasonal-element");
    cell.appendChild(overlay);

    const segmentHeight = height / colors.length;

    gsap.set(overlay, {
      position: "absolute",
      zIndex: 1,
      top: `${index * (100 / colors.length)}%`,
      left: 0,
      width: "100%",
      height: `${100 / colors.length}%`,
      backgroundColor: color,
      opacity: 0,
    });

    gsap.to(overlay, {
      opacity: 1,
      duration: 0.5,
      delay: index * 0.1,
      ease: "power1.inOut",
    });
  });
};

// Función para aplicar segmentación vertical
const applyVerticalSegmentation = (cell, colors, width, height) => {
  colors.forEach((color, index) => {
    const overlay = document.createElement("div");
    overlay.classList.add("color-overlay", "seasonal-element");
    cell.appendChild(overlay);

    const segmentWidth = width / colors.length;

    gsap.set(overlay, {
      position: "absolute",
      zIndex: 1,
      top: 0,
      left: `${index * (100 / colors.length)}%`,
      width: `${100 / colors.length}%`,
      height: "100%",
      backgroundColor: color,
      opacity: 0,
    });

    gsap.to(overlay, {
      opacity: 1,
      duration: 0.5,
      delay: index * 0.1,
      ease: "power1.inOut",
    });
  });
};

// Función para aplicar segmentación tipo tablero de ajedrez
const applyCheckeredSegmentation = (cell, colors, width, height) => {
  const gridSize = Math.ceil(Math.sqrt(colors.length));

  colors.forEach((color, index) => {
    if (index >= gridSize * gridSize) return; // Limitamos al tamaño de la cuadrícula

    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    const overlay = document.createElement("div");
    overlay.classList.add("color-overlay", "seasonal-element");
    cell.appendChild(overlay);

    gsap.set(overlay, {
      position: "absolute",
      zIndex: 1,
      top: `${row * (100 / gridSize)}%`,
      left: `${col * (100 / gridSize)}%`,
      width: `${100 / gridSize}%`,
      height: `${100 / gridSize}%`,
      backgroundColor: color,
      opacity: 0,
    });

    gsap.to(overlay, {
      opacity: 1,
      duration: 0.5,
      delay: index * 0.05,
      ease: "power1.inOut",
    });
  });
};

// Función para aplicar segmentación radial (círculos concéntricos)
const applyRadialSegmentation = (cell, colors, width, height) => {
  const size = Math.min(width, height);

  colors.forEach((color, index) => {
    const overlay = document.createElement("div");
    overlay.classList.add("color-overlay", "seasonal-element");
    cell.appendChild(overlay);

    const percentage = 100 - index * (100 / colors.length);

    gsap.set(overlay, {
      position: "absolute",
      zIndex: colors.length - index, // Asegura que los círculos más pequeños estén encima
      top: "50%",
      left: "50%",
      width: `${percentage}%`,
      height: `${percentage}%`,
      borderRadius: "50%",
      backgroundColor: color,
      transform: "translate(-50%, -50%)",
      opacity: 0,
    });

    gsap.to(overlay, {
      opacity: 1,
      duration: 0.5,
      delay: index * 0.1,
      ease: "power1.inOut",
    });
  });
};

// Función mejorada para limpiar una celda específica
const resetDayCellColor = (dateStr) => {
  console.log(`Limpiando celda ${dateStr}`);

  const cell = document.querySelector(`[data-date='${dateStr}']`);
  if (cell) {
    // Eliminar todos los overlays
    const existingOverlays = cell.querySelectorAll(".color-overlay");
    existingOverlays.forEach((overlay) => {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => overlay.remove(),
      });
    });

    // Eliminar el color de fondo
    gsap.to(cell, {
      backgroundColor: "rgba(255, 255, 255, 0)",
      duration: 0.5,
      ease: "power2.out",
    });

    // Eliminar del mapa
    cellColorsMap.delete(dateStr);
  }
};

// Función mejorada para el manejo de eventos cuando se sueltan en una nueva fecha
const eventDropHandler = (info) => {
  const oldDate = lastEventDateMap.get(info.event.id);
  const newDate = info.event.startStr;
  const color =
    info.event.extendedProps.color || info.event.backgroundColor || "#e0e0e0";

  const pastelColor = convertToPastelColor(color);

  // Eliminar el color antiguo si existe
  if (oldDate && oldDate !== newDate) {
    const oldColors = cellColorsMap.get(oldDate) || [];
    const updatedOldColors = oldColors.filter((c) => c !== pastelColor);

    if (updatedOldColors.length === 0) {
      resetDayCellColor(oldDate);
    } else {
      cellColorsMap.set(oldDate, updatedOldColors);
      const oldCell = document.querySelector(`[data-date='${oldDate}']`);
      if (oldCell) {
        const existingOverlays = oldCell.querySelectorAll(".color-overlay");
        existingOverlays.forEach((overlay) => overlay.remove());
        const segType = getSegmentationType(updatedOldColors.length);
        applySegmentation(oldCell, updatedOldColors, segType);
      }
    }
  }

  // Agregar nuevo color
  mixCellColors(newDate, color);
  lastEventDateMap.set(info.event.id, newDate);
};

// Actualizar la función de colorDayCell para usar el nuevo sistema de mezcla
const colorDayCell = (dateStr, color) => {
  mixCellColors(dateStr, color);
};

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

// Función para limpiar elementos estacionales anteriores
const clearSeasonalElements = (container) => {
  const elements = container.querySelectorAll(
    ".seasonal-element:not(.color-overlay)"
  );
  elements.forEach((el) => {
    gsap.killTweensOf(el);
    el.remove();
  });
};

// Animaciones por estación con emojis posicionados dentro del calendario
const seasonAnimations = {
  primavera: (container) => {
    clearSeasonalElements(container);

    gsap.fromTo(container, { opacity: 0.8 }, { opacity: 1, duration: 0.5 });

    // Flores flotando
    const calendarViewport = container.querySelector(".fc-view-harness");
    if (!calendarViewport) return;

    const viewportRect = calendarViewport.getBoundingClientRect();

    for (let i = 0; i < 15; i++) {
      const flower = document.createElement("div");
      flower.classList.add("seasonal-element");
      flower.innerHTML = "🌸"; // Emoji de flor
      flower.style.fontSize = Math.random() * 10 + 16 + "px";
      container.appendChild(flower);

      gsap.set(flower, {
        position: "absolute",
        zIndex: 1,
        x:
          Math.random() * viewportRect.width +
          viewportRect.left -
          container.getBoundingClientRect().left,
        y:
          viewportRect.height +
          viewportRect.top -
          container.getBoundingClientRect().top,
        opacity: 0.9,
        scale: Math.random() * 0.5 + 0.8,
      });

      gsap.to(flower, {
        y: "-" + (viewportRect.height + 50) + "px",
        x: "+=" + (Math.random() * 100 - 50) + "px",
        rotation: Math.random() * 360,
        duration: Math.random() * 15 + 8,
        ease: "power1.inOut",
        repeat: -1,
        delay: Math.random() * 5,
      });
    }
  },

  verano: (container) => {
    clearSeasonalElements(container);

    gsap.fromTo(container, { opacity: 0.8 }, { opacity: 1, duration: 0.5 });

    const calendarViewport = container.querySelector(".fc-view-harness");
    if (!calendarViewport) return;

    // Sol brillante
    const sun = document.createElement("div");
    sun.classList.add("seasonal-element");
    sun.innerHTML = "☀️";
    sun.style.fontSize = "60px";
    container.appendChild(sun);

    gsap.set(sun, {
      position: "absolute",
      zIndex: 1,
      x:
        calendarViewport.getBoundingClientRect().right -
        container.getBoundingClientRect().left -
        80,
      y:
        calendarViewport.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        20,
    });

    gsap.to(sun, {
      rotation: 360,
      repeat: -1,
      duration: 20,
      ease: "linear",
    });

    // Agregar nubes flotantes
    for (let i = 0; i < 5; i++) {
      const cloud = document.createElement("div");
      cloud.classList.add("seasonal-element");
      cloud.innerHTML = "☁️";
      cloud.style.fontSize = Math.random() * 15 + 25 + "px";
      container.appendChild(cloud);

      const startX = -100;
      const endX = calendarViewport.getBoundingClientRect().width + 100;
      const posY = Math.random() * 100 + 20;

      gsap.set(cloud, {
        position: "absolute",
        zIndex: 1,
        x: startX,
        y: posY,
        opacity: 0.8,
      });

      gsap.to(cloud, {
        x: endX,
        duration: Math.random() * 30 + 20,
        ease: "linear",
        repeat: -1,
        delay: Math.random() * 10,
      });
    }
  },

  otoño: (container) => {
    clearSeasonalElements(container);

    gsap.fromTo(container, { opacity: 0.8 }, { opacity: 1, duration: 0.5 });

    const calendarViewport = container.querySelector(".fc-view-harness");
    if (!calendarViewport) return;

    const viewportRect = calendarViewport.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Hojas cayendo
    const leafEmojis = ["🍂", "🍁", "🍃"];
    for (let i = 0; i < 20; i++) {
      const leaf = document.createElement("div");
      leaf.classList.add("seasonal-element");
      leaf.innerHTML =
        leafEmojis[Math.floor(Math.random() * leafEmojis.length)];
      leaf.style.fontSize = Math.random() * 10 + 16 + "px";
      container.appendChild(leaf);

      const startX =
        Math.random() * viewportRect.width +
        viewportRect.left -
        containerRect.left;

      gsap.set(leaf, {
        position: "absolute",
        zIndex: 1,
        x: startX,
        y: viewportRect.top - containerRect.top - 20,
        opacity: 0.9,
        rotation: Math.random() * 180,
      });

      gsap.to(leaf, {
        y: viewportRect.height + viewportRect.top - containerRect.top + 20,
        x: startX + (Math.random() * 200 - 100),
        rotation: Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
        duration: Math.random() * 10 + 8,
        ease: "power1.inOut",
        repeat: -1,
        delay: Math.random() * 10,
      });
    }
  },

  invierno: (container) => {
    clearSeasonalElements(container);

    gsap.fromTo(container, { opacity: 0.8 }, { opacity: 1, duration: 0.5 });

    const calendarViewport = container.querySelector(".fc-view-harness");
    if (!calendarViewport) return;

    const viewportRect = calendarViewport.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Copos de nieve
    for (let i = 0; i < 25; i++) {
      const snow = document.createElement("div");
      snow.classList.add("seasonal-element");
      snow.innerHTML = "❄️";
      snow.style.fontSize = Math.random() * 8 + 12 + "px";
      container.appendChild(snow);

      const startX =
        Math.random() * viewportRect.width +
        viewportRect.left -
        containerRect.left;

      gsap.set(snow, {
        position: "absolute",
        zIndex: 1,
        x: startX,
        y: viewportRect.top - containerRect.top - 20,
        opacity: Math.random() * 0.5 + 0.5,
      });

      gsap.to(snow, {
        y: viewportRect.height + viewportRect.top - containerRect.top + 20,
        x: startX + (Math.random() * 100 - 50),
        rotation: Math.random() * 360,
        duration: Math.random() * 15 + 10,
        ease: "sine.inOut",
        repeat: -1,
        delay: Math.random() * 8,
      });
    }
  },
};

// Función para aplicar animaciones según la estación
const applySeasonalAnimation = (season = null) => {
  if (!calendarCard.value) return;

  const container = calendarCard.value.$el;
  if (!container) {
    console.error("Contenedor del calendario no encontrado.");
    return;
  }

  // Obtener el elemento del calendario principal para el fondo
  const fcContainer = container.querySelector(".fc");
  if (!fcContainer) {
    console.error("Contenedor FC del calendario no encontrado.");
    return;
  }

  const seasonToApply = season || getCurrentSeason();

  if (seasonAnimations[seasonToApply]) {
    // Aplicar animación a todo el contenedor del calendario
    seasonAnimations[seasonToApply](container);

    // Aplicar fondo estacional al contenedor principal del FC
    const seasonBackgrounds = {
      primavera: "linear-gradient(to bottom, #c1dfc4, #deecdd)",
      verano: "linear-gradient(to bottom, #fddb92, #d1fdff)",
      otoño: "linear-gradient(to bottom, #d1913c, #ffd194)",
      invierno: "linear-gradient(to bottom, #83a4d4, #b6fbff)",
    };

    gsap.to(fcContainer, {
      background: seasonBackgrounds[seasonToApply],
      duration: 1.5,
      ease: "power1.inOut",
    });
  }
};

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
    eventReceive(info) {
      const color =
        info.event.extendedProps.color ||
        info.event.backgroundColor ||
        "#e0e0e0";
      const dateStr = info.event.startStr;

      // Usar el nuevo sistema de mezcla de colores
      colorDayCell(dateStr, color);
      lastEventDateMap.set(info.event.id, dateStr);
    },
    ...props.calendarOptions,

    eventDrop(info) {
      eventDropHandler(info);
    },

    // Agregar un manejador para cuando se elimina un evento
    eventRemove(info) {
      const dateStr = lastEventDateMap.get(info.event.id);
      if (dateStr) {
        const color =
          info.event.extendedProps.color ||
          info.event.backgroundColor ||
          "#e0e0e0";

        console.log(
          `Eliminando evento con color ${color} de la fecha ${dateStr}`
        );

        // Eliminar este color específico de la celda
        const colorsForDate = cellColorsMap.get(dateStr);
        if (colorsForDate) {
          const pastelColor = convertToPastelColor(color);
          const newColors = colorsForDate.filter((c) => c !== pastelColor);

          if (newColors.length === 0) {
            resetDayCellColor(dateStr);
          } else {
            cellColorsMap.set(dateStr, newColors);

            // Redibujamos la celda con los colores restantes
            const cell = document.querySelector(`[data-date='${dateStr}']`);
            if (cell) {
              const existingOverlays = cell.querySelectorAll(".color-overlay");
              existingOverlays.forEach((overlay) => overlay.remove());

              const segmentationType = getSegmentationType(newColors.length);
              applySegmentation(cell, newColors, segmentationType);
            }
          }
        }

        // Eliminar la referencia del evento
        lastEventDateMap.delete(info.event.id);
      }
    },
  };
});

onMounted(() => {
  if (props.calendarReady && calendarCard.value) {
    nextTick(() => {
      setTimeout(() => {
        applySeasonalAnimation();
      }, 500); // Aumentamos el tiempo de espera para asegurar renderizado completo
    });
  }
});

watch(
  () => props.calendarReady,
  (newVal) => {
    if (newVal && calendarCard.value) {
      setTimeout(() => {
        applySeasonalAnimation();
      }, 500);
    }
  }
);

const changeSeasonManually = (season) => {
  if (["primavera", "verano", "otoño", "invierno"].includes(season)) {
    applySeasonalAnimation(season);
  }
};

// Exportar la función para poder usarla desde componentes padre
defineExpose({
  changeSeasonManually,
});
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
  max-height: 800px;
  height: 800px;
}

.seasonal-element {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  user-select: none;
}

/* Estilos para la segmentación de colores */
:deep(.color-overlay) {
  pointer-events: none; /* Para que los clicks pasen a través */
  transition: opacity 0.3s ease;
}

/* Animación para los overlays */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Asegurar que la celda pueda posicionar elementos internos correctamente */
:deep(.fc-daygrid-day) {
  position: relative !important;
  overflow: hidden !important;
}

/* Mejora para las celdas del día cuando se pasa el mouse */
:deep(.fc-daygrid-day:hover .color-overlay) {
  opacity: 0.85 !important; /* Aumenta ligeramente la opacidad al pasar el mouse */
  transition: opacity 0.2s !important;
}

/* Estilos adicionales para mejorar la visualización de los emojis */
:deep(.fc-daygrid-day) {
  position: relative;
  transition: background-color 0.3s;
}

:deep(.fc-daygrid-day:hover) {
  z-index: 5;
}

:deep(.fc-day-today) {
  background-color: rgba(255, 220, 40, 0.15) !important;
}

:deep(.fc-day-today .color-overlay) {
  filter: brightness(
    1.1
  ) !important; /* Hace que los colores brillen un poco más en el día actual */
}

:deep(.fc) {
  height: 100%;
  overflow: hidden;
  position: relative;
  border-radius: 0.5rem;
  /* Este overflow hidden mantiene los gradientes dentro del contenedor */
}

:deep(.fc-view) {
  z-index: 2;
  /* Asegura que la vista del calendario esté por encima del fondo */
}

:deep(.fc-header-toolbar) {
  /* Asegura que la barra de herramientas sea visible */
  position: relative;
  z-index: 3;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 0.5rem 0.5rem 0 0;
}
</style>
