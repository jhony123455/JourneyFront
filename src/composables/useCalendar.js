import { ref, computed, nextTick } from 'vue';
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import gsap from "gsap";

export default function useCalendar(activities, tags) {
  const calendarReady = ref(false);
  const calendarRef = ref(null);
  const scheduledEvents = ref([
    {
      id: "event-1",
      title: "Reunión de equipo",
      start: new Date().toISOString().slice(0, 10) + "T10:00:00",
      end: new Date().toISOString().slice(0, 10) + "T11:30:00",
      backgroundColor: "#4da6ff",
      textColor: "#ffffff",
      extendedProps: {
        tags: [{ id: 3, name: "Trabajo", color: "#66cc66" }],
        activityId: "1",
      },
    },
  ]);
  
  // Menú contextual
  const showContextMenu = ref(false);
  const contextMenuPosition = ref({ x: 0, y: 0 });
  const selectedEvent = ref(null);
  
  // Datos para agendar actividades
  const scheduledDate = ref("");
  const scheduleTime = ref("09:00");
  const eventDuration = ref(60); // Duración en minutos (por defecto 1 hora)

  // Crear eventos formateados para FullCalendar
  const formattedEvents = computed(() => {
    return scheduledEvents.value.map((event) => {
      return {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        backgroundColor: event.backgroundColor || "#5e72e4",
        textColor: event.textColor || "#ffffff",
        borderColor: event.backgroundColor || "#5e72e4",
        extendedProps: event.extendedProps || {},
      };
    });
  });

  const calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: "dayGridMonth",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    editable: true,
    selectable: true,
    dayMaxEvents: true,
    droppable: true,
    events: formattedEvents,
    datesSet() {
      animateTearSheet();
    },
    eventContent: function (arg) {
      const event = arg.event;
      const tags = event.extendedProps.tags || [];

      // Crear elementos para el contenido del evento personalizado
      let arrayOfDomNodes = [];

      // Título del evento
      const titleEl = document.createElement("div");
      titleEl.innerHTML = event.title;
      titleEl.className = "fc-event-title";
      arrayOfDomNodes.push(titleEl);

      // Contenedor de etiquetas
      if (tags.length > 0) {
        const tagsContainer = document.createElement("div");
        tagsContainer.className = "event-tags-container";

        // Crear elementos para cada etiqueta
        tags.forEach((tag) => {
          const tagEl = document.createElement("span");
          tagEl.className = "event-tag";
          tagEl.textContent = tag.name;
          tagEl.style.backgroundColor = tag.color;
          tagsContainer.appendChild(tagEl);
        });

        arrayOfDomNodes.push(tagsContainer);
      }

      return { domNodes: arrayOfDomNodes };
    }
  };

  function refreshCalendar() {
    if (calendarRef.value && calendarRef.value.getApi) {
      const calendarApi = calendarRef.value.getApi();
      calendarApi.refetchEvents();
    }
  }

  function animateTearSheet() {
    nextTick(() => {
      const el = document.querySelector(".fc"); // FullCalendar root
      if (!el) return;

      // Animación mejorada de cambio de mes
      const timeline = gsap.timeline();

      timeline
        .to(el, {
          duration: 0.4,
          opacity: 0,
          scale: 0.95,
          transformOrigin: "top center",
          ease: "power2.in",
        })
        .to(el, {
          duration: 0.5,
          opacity: 1,
          scale: 1,
          ease: "elastic.out(1, 0.5)",
        });
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function addEventToCalendar(eventData) {
    scheduledEvents.value.push(eventData);
    nextTick(() => {
      refreshCalendar();
    });
  }

  function updateEventInCalendar(eventId, updatedData) {
    const eventIndex = scheduledEvents.value.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
      scheduledEvents.value[eventIndex] = {
        ...scheduledEvents.value[eventIndex],
        ...updatedData
      };
      nextTick(() => {
        refreshCalendar();
      });
    }
  }

  function deleteEventFromCalendar(eventId) {
    const eventIndex = scheduledEvents.value.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
      scheduledEvents.value.splice(eventIndex, 1);
      nextTick(() => {
        refreshCalendar();
      });
    }
  }

  function saveCalendarData() {
    try {
      localStorage.setItem("calendarEvents", JSON.stringify(scheduledEvents.value));
    } catch (e) {
      console.error("Error al guardar datos de calendario:", e);
    }
  }

  function loadCalendarData() {
    try {
      const savedEvents = localStorage.getItem("calendarEvents");
      if (savedEvents) {
        scheduledEvents.value = JSON.parse(savedEvents);
      }
    } catch (e) {
      console.error("Error al cargar datos del calendario:", e);
    }
  }

  return {
    calendarReady,
    calendarRef,
    calendarOptions,
    scheduledEvents,
    formattedEvents,
    showContextMenu,
    contextMenuPosition,
    selectedEvent,
    scheduledDate,
    scheduleTime,
    eventDuration,
    refreshCalendar,
    animateTearSheet,
    formatDate,
    addEventToCalendar,
    updateEventInCalendar,
    deleteEventFromCalendar,
    saveCalendarData,
    loadCalendarData,
  };
}