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
  defineEmits,
} from "vue";
import { gsap } from "gsap";
import useApi from "@/composables/useApi";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(timezone);
dayjs.extend(utc);

const emit = defineEmits(['date-selected', 'show-context-menu', 'show-event-details']);

const {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = useApi();
const props = defineProps({
  calendarReady: Boolean,
  calendarOptions: {
    type: Object,
    default: () => ({
      droppable: true,
    }),
  },
  availableActivities: {
    type: Array,
    default: () => [],
  },
});
const lastEventDateMap = new Map();
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
  if (Object.values(pastelColors).includes(color)) {
    return color;
  }
  const colorLower = typeof color === "string" ? color.toLowerCase() : "";
  if (pastelColors[colorLower]) {
    return pastelColors[colorLower];
  }

  // Helper: convierte rgb/rgba a objeto { r, g, b }
  function parseRGB(rgbStr) {
    const matches = rgbStr.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i
    );
    if (!matches) return null;
    return {
      r: parseInt(matches[1]),
      g: parseInt(matches[2]),
      b: parseInt(matches[3]),
    };
  }
  if (colorLower.startsWith("rgb")) {
    const rgb = parseRGB(colorLower);
    if (rgb) {
      const pastelR = Math.floor((rgb.r + 255) / 2);
      const pastelG = Math.floor((rgb.g + 255) / 2);
      const pastelB = Math.floor((rgb.b + 255) / 2);
      return `rgb(${pastelR}, ${pastelG}, ${pastelB})`;
    }
  }
  if (colorLower.startsWith("#")) {
    let hex = colorLower.replace("#", "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((h) => h + h)
        .join("");
    }
    if (hex.length === 6) {
      const r = Math.floor((parseInt(hex.substr(0, 2), 16) + 255) / 2);
      const g = Math.floor((parseInt(hex.substr(2, 2), 16) + 255) / 2);
      const b = Math.floor((parseInt(hex.substr(4, 2), 16) + 255) / 2);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return "#e0e0e0";
};

const mixCellColors = (dateStr, color) => {
  nextTick(() => {
    const cell = document.querySelector(`[data-date='${dateStr}']`);
    if (!cell) return;

    const pastelColor = convertToPastelColor(color);

    let colors = cellColorsMap.get(dateStr) || [];

    if (!colors.includes(pastelColor)) {
      colors.push(pastelColor);
      cellColorsMap.set(dateStr, [...new Set(colors)]); // Prevenir duplicados
    }
    
    // Limitar las animaciones para mejorar el rendimiento
    const existingOverlays = cell.querySelectorAll(".color-overlay");
    existingOverlays.forEach((overlay) => overlay.remove());

    if (colors.length === 1) {
      // Simplificar: usar estilo directo en lugar de animación para un solo color
      cell.style.backgroundColor = colors[0];
    } else {
      cell.style.backgroundColor = 'transparent';
      // Usar requestAnimationFrame para operaciones de animación
      requestAnimationFrame(() => {
        const segmentationType = getSegmentationType(colors.length);
        applySegmentation(cell, colors, segmentationType);
      });
    }
  });
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
    if (index >= gridSize * gridSize) return;

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
      zIndex: colors.length - index,
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

const resetDayCellColor = (dateStr) => {
  const cell = document.querySelector(`[data-date='${dateStr}']`);

  if (!cell) {
    return;
  }
  const existingOverlays = cell.querySelectorAll(".color-overlay");
  if (existingOverlays.length > 0) {
    existingOverlays.forEach((overlay) => {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => overlay.remove(),
      });
    });
  }
  gsap.to(cell, {
    backgroundColor: "transparent",
    duration: 0.5,
    ease: "power2.out",
  });
  cell.classList.remove("has-color", "has-multiple-colors");
  if (cellColorsMap) {
    cellColorsMap.delete(dateStr);
  }
};

const eventDropHandler = (info) => {
  const oldDate = lastEventDateMap.get(info.event.id);
  const newDate = info.event.startStr;
  const color =
    info.event.extendedProps.color || info.event.backgroundColor || "#e0e0e0";
  const pastelColor = convertToPastelColor(color);
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
  mixCellColors(newDate, color);
  lastEventDateMap.set(info.event.id, newDate);
};

const colorDayCell = (dateStr, color) => {
  mixCellColors(dateStr, color);
};

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
// Agregar un control para habilitar/deshabilitar animaciones
const enableAnimations = ref(true); // Puedes hacer esto configurable

const applySeasonalAnimation = (season = null) => {
  if (!calendarCard.value || !enableAnimations.value) return;

  const container = calendarCard.value.$el;
  if (!container) {
    return;
  }
  const fcContainer = container.querySelector(".fc");
  if (!fcContainer) {
    return;
  }
  const seasonToApply = season || getCurrentSeason();
  if (seasonAnimations[seasonToApply]) {
    // Limitar la cantidad de elementos animados
    const MAX_ELEMENTS = 10; // Reducir este número para mejorar rendimiento
    
    // Modificar las funciones de animación para usar MAX_ELEMENTS
    const originalAnimation = seasonAnimations[seasonToApply];
    const limitedAnimation = (cont) => {
      clearSeasonalElements(cont);
      originalAnimation(cont);
      
      // Limitar el número de elementos animados
      const elements = cont.querySelectorAll('.seasonal-element:not(.color-overlay)');
      if (elements.length > MAX_ELEMENTS) {
        for (let i = MAX_ELEMENTS; i < elements.length; i++) {
          elements[i].remove();
        }
      }
    };
    
    limitedAnimation(container);
    
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
const mergedCalendarOptions = computed(() => ({
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
  selectable: true,
  editable: true,
  droppable: true,
  dateClick(info) {
    // Emitir un evento para que el componente padre pueda mostrar el formulario de actividad
    emit('date-selected', {
      date: info.dateStr,
      jsEvent: info.jsEvent,
      view: info.view
    });
  },
  eventDidMount(info) {
    // Agregar tooltip con descripción
    if (info.event.extendedProps.description) {
      const tooltip = document.createElement('div');
      tooltip.className = 'calendar-tooltip';
      tooltip.innerHTML = info.event.extendedProps.description;
      document.body.appendChild(tooltip);

      const eventEl = info.el;
      eventEl.addEventListener('mouseover', function() {
        const rect = eventEl.getBoundingClientRect();
        tooltip.style.display = 'block';
        tooltip.style.left = rect.left + window.scrollX + 'px';
        tooltip.style.top = rect.bottom + window.scrollY + 'px';
      });

      eventEl.addEventListener('mouseout', function() {
        tooltip.style.display = 'none';
      });

      info.event.setExtendedProp('tooltip', tooltip);
    }
  },
  eventWillUnmount(info) {
    // Limpiar tooltip al desmontar evento
    if (info.event.extendedProps.tooltip) {
      info.event.extendedProps.tooltip.remove();
    }
  },
  eventClick(info) {
    // Prevenir la acción por defecto
    info.jsEvent.preventDefault();

    // Si es clic derecho, mostrar menú contextual
    if (info.jsEvent.button === 2) {
      info.el.addEventListener('contextmenu', (e) => e.preventDefault(), { once: true });
      
      emit('show-context-menu', {
        x: info.jsEvent.clientX,
        y: info.jsEvent.clientY,
        event: info.event
      });
    } else {
      // Para clic izquierdo, mostrar detalles del evento
      emit('show-event-details', {
        id: info.event.id,
        title: info.event.title,
        description: info.event.extendedProps?.description || '',
        color: info.event.backgroundColor || info.event.color,
        tags: info.event.extendedProps?.tags || [],
        start: info.event.start,
        end: info.event.end,
        activity: info.event.extendedProps?.activity
      });
    }
  },
    eventReceive(info) {
      // Prevenir cualquier otro manejador de eventos
      info.jsEvent?.preventDefault();
      info.jsEvent?.stopPropagation();

      const dateStr = info.event.startStr;
      const extendedProps = info.event.extendedProps || {};
      const activity = extendedProps.activity || {};

      // Obtener el ID de la actividad
      const activityId = extendedProps.activityId || activity.id;

      if (!activityId) {
        info.revert();
        return false;
      }

      // Buscar la actividad en las disponibles
      const foundActivity = props.availableActivities.find(act => act.id === activityId);

      if (!foundActivity) {
        info.revert();
        return false;
      }

      // Convertir el color a pastel
      const pastelColor = convertToPastelColor(foundActivity.color);

      // Convertir la fecha a formato local sin Z al final
      const localStartDate = dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
      const localEndDate = info.event.endStr ? 
        dayjs(info.event.endStr).format('YYYY-MM-DD HH:mm:ss') : null;

      const eventData = {
        title: foundActivity.title,
        start_date: localStartDate,
        end_date: localEndDate,
        color: pastelColor,
        activity_id: activityId,
        tags: foundActivity.tags || [],
        all_day: true,
        description: foundActivity.description || ''
      };

      // Actualizar el evento visual inmediatamente
      info.event.setProp('title', foundActivity.title);
      info.event.setProp('backgroundColor', pastelColor);
      info.event.setProp('borderColor', pastelColor);

      // Guardar el evento en la base de datos
      createCalendarEvent(eventData)
        .then(response => {
          // Actualizar el ID del evento con el retornado por el servidor
          info.event.setProp('id', response.id.toString());
          
          // Actualizar el color de la celda
          mixCellColors(dateStr, pastelColor);
          lastEventDateMap.set(response.id.toString(), dateStr);
        })
        .catch(() => {
          info.revert(); // Revertir el evento si hay error
        });

      return false; // Evitar que el evento se propague
    },
    eventDrop(info) {
      eventDropHandler(info);
      const updatedEventData = {
        id: info.event.id,
        start_date: info.event.startStr,
        end_date: info.event.endStr || null,
      activity_id: info.event.extendedProps.activityId,
    };

    updateCalendarEvent(updatedEventData.id, updatedEventData)
      .catch((error) => {
        info.revert(); // Revertir el evento si hay error
      });
  },
  ...props.calendarOptions,
}));

onMounted(async () => {
  if (!calendarRef.value) {
    console.error('Calendar reference not found');
    return;
  }

  try {
    const api = calendarRef.value.getApi();
    if (!api) {
      console.error('Calendar API not initialized');
      return;
    }

    const apiEvents = await getCalendarEvents();
    if (!Array.isArray(apiEvents)) {
      console.error('Invalid events data received');
      return;
    }

    // Mapear los campos a lo que espera FullCalendar
    const fcEvents = apiEvents.map((event) => {
      const activity = props.availableActivities.find(
        (act) => act.id === event.activity_id
      );

      // Procesar las fechas quitando la Z del final y ajustando al formato correcto
      const startStr = event.start_date.replace('.000000Z', '');
      const endStr = event.end_date ? event.end_date.replace('.000000Z', '') : null;

      // Usar el color pastel guardado o convertir el color de la actividad
      const eventColor = event.color || (activity ? convertToPastelColor(activity.color) : "#e0e0e0");

      return {
        id: event.id.toString(),
        title: activity ? activity.title : event.title,
        start: startStr,
        end: endStr,
        allDay: event.all_day || false,
        color: eventColor,
        backgroundColor: eventColor,
        borderColor: eventColor,
        extendedProps: {
          activityId: event.activity_id,
          activity: activity,
          description: activity?.description || event.description || '',
          tags: activity ? activity.tags : (event.tags || []),
        },
      };
    });

    // Filtrar eventos inválidos
    const validEvents = fcEvents.filter(event => event.title && event.start);
    
    // Limpiar eventos existentes
    api.removeAllEvents();
    
    // Agregar nuevos eventos
    validEvents.forEach(eventData => {
      api.addEvent(eventData);
      
      // Actualizar los colores de las celdas
      const dateStr = dayjs(eventData.start).format('YYYY-MM-DD');
      colorDayCell(dateStr, eventData.color);
      lastEventDateMap.set(eventData.id, dateStr);
    });

    } catch (error) {
      console.error("No se pudieron cargar los eventos:", error);
    }

    nextTick(() => {
      setTimeout(() => {
        applySeasonalAnimation();
      }, 500);
    });
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

:deep(.color-overlay) {
  pointer-events: none;
  transition: opacity 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

:deep(.fc-daygrid-day) {
  position: relative !important;
  overflow: hidden !important;
}

:deep(.fc-daygrid-day:hover .color-overlay) {
  opacity: 0.85 !important;
  transition: opacity 0.2s !important;
}

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
  filter: brightness(1.1) !important;
}

:deep(.fc) {
  height: 100%;
  overflow: hidden;
  position: relative;
  border-radius: 0.5rem;
}

:deep(.fc-view) {
  z-index: 2;
}

:deep(.fc-header-toolbar) {
  position: relative;
  z-index: 3;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 0.5rem 0.5rem 0 0;
}

:deep(.calendar-tooltip) {
  position: absolute;
  z-index: 9999;
  background: white;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: none;
  max-width: 200px;
  word-wrap: break-word;
  font-size: 12px;
  pointer-events: none;
}
</style>
