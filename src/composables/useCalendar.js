import { ref, onMounted, nextTick, computed, watch, onUnmounted } from "vue";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc"; // Plugin para manejar UTC
import timezone from "dayjs/plugin/timezone";

import { Draggable } from "@fullcalendar/interaction";
import gsap from "gsap";

export default function useCalendar() {
  // Estados
  const calendarReady = ref(false);
  const calendarRef = ref(null);
  const showModal = ref(false);
  const showTagModal = ref(false);
  const editMode = ref(false);
  const currentActivityId = ref(null);
  const currentEventId = ref(null);
  const showContextMenu = ref(false);
  const contextMenuPosition = ref({ x: 0, y: 0 });
  const selectedEvent = ref(null);
  const scheduledDate = ref("");
  const scheduleTime = ref("09:00");
  const eventDuration = ref(60);
  const modalRef = ref(null);
  const tagModalRef = ref(null);
  const currentActivity = ref(null);
  dayjs.extend(utc);
  dayjs.extend(timezone);
 

  // Datos
  const availableTags = ref([
    { id: 1, name: "Importante", color: "#ff4d4d" },
    { id: 2, name: "Personal", color: "#4da6ff" },
    { id: 3, name: "Trabajo", color: "#66cc66" },
    { id: 4, name: "Urgente", color: "#ff9933" },
    { id: 5, name: "Recordatorio", color: "#cc99ff" },
  ]);

  const availableActivities = ref([
    {
      id: "1",
      title: "Reunión de equipo",
      color: "#4da6ff",
      tags: [{ id: 3, name: "Trabajo", color: "#66cc66" }],
    },
    {
      id: "2",
      title: "Llamada con cliente",
      color: "#ff9933",
      tags: [
        { id: 3, name: "Trabajo", color: "#66cc66" },
        { id: 4, name: "Urgente", color: "#ff9933" },
      ],
    },
    {
      id: "3",
      title: "Enviar informe",
      color: "#ff4d4d",
      tags: [{ id: 1, name: "Importante", color: "#ff4d4d" }],
    },
  ]);

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

  const newActivity = ref({
    title: "",
    color: "#5e72e4",
    tags: [],
  });

  const selectedTags = ref([]);
  const selectedTag = ref("");
  const newTagName = ref("");
  const newTagColor = ref("#5e72e4");

  // Computed
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
      let arrayOfDomNodes = [];

      const titleEl = document.createElement("div");
      titleEl.innerHTML = event.title;
      titleEl.className = "fc-event-title";
      arrayOfDomNodes.push(titleEl);

      if (tags.length > 0) {
        const tagsContainer = document.createElement("div");
        tagsContainer.className = "event-tags-container";

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
    },
    eventClick: handleEventClick,
    dateClick: handleDateClick,
    drop: handleDrop,
    eventDrop: handleEventDrop,
    eventResize: handleEventResize,
  };

  // Métodos
  function showNotification(message, duration = 3000) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    gsap.fromTo(
      notification,
      { y: -50, opacity: 0 },
      { y: 20, opacity: 1, duration: 0.3, ease: "power2.out" }
    );

    setTimeout(() => {
      gsap.to(notification, {
        y: -50,
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          document.body.removeChild(notification);
        },
      });
    }, duration);
  }

  function animateTearSheet() {
    nextTick(() => {
      const el = document.querySelector(".fc");
      if (!el) return;

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

  function refreshCalendar() {
    if (calendarRef.value && calendarRef.value.getApi) {
      const calendarApi = calendarRef.value.getApi();
      calendarApi.refetchEvents();
    }
  }

  function formatDate(date) {
    if (!date) return "";
    return dayjs(date).tz("America/Bogota").format("DD/MM/YYYY");
  }
  function handleEventClick(info) {
    selectedEvent.value = info.event;
    const rect = info.el.getBoundingClientRect();
    contextMenuPosition.value = {
      x: rect.right + 5,
      y: rect.top,
    };
    showContextMenu.value = true;
    info.jsEvent.preventDefault();
  }

  function handleDateClick(info) {
    // Convertir la fecha de FullCalendar (UTC) a la zona horaria de Colombia
    const colombiaDate = dayjs(info.date).tz("America/Bogota").format("YYYY-MM-DD");
  
    // Asignar la fecha ajustada
    scheduledDate.value = colombiaDate;
    scheduleTime.value = "09:00";
    eventDuration.value = 60;
  
    // Abrir el modal de agregar actividad
    openAddActivity(null, colombiaDate);
  }
  function handleDrop(info) {
    const droppedActivityData = JSON.parse(
      info.draggedEl.getAttribute("data-event")
    );
    const activityObj = droppedActivityData.extendedProps.activity;
  
    // Ajustar la fecha de inicio a la zona horaria de Colombia
    const colombiaDate = dayjs(info.date).tz("America/Bogota").format("YYYY-MM-DD");
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? "00" : "30";
    const hours = now.getHours().toString().padStart(2, "0");
  
    const eventStart = `${colombiaDate}T${hours}:${roundedMinutes}:00`;
    const startDate = new Date(eventStart);
    const endDate = new Date(startDate);
    endDate.setMinutes(startDate.getMinutes() + 60);
  
    const eventToAdd = {
      id: `event-${Date.now()}`,
      title: activityObj.title,
      start: eventStart,
      end: endDate.toISOString(),
      backgroundColor: activityObj.color || "#5e72e4",
      textColor: "#ffffff",
      extendedProps: {
        tags: activityObj.tags || [],
        activityId: activityObj.id,
      },
    };
  
    scheduledEvents.value.push(eventToAdd);
    showNotification(
      `${activityObj.title} añadido al ${formatDate(colombiaDate)}`
    );
  
    nextTick(() => {
      refreshCalendar();
    });
  }

  function handleEventDrop(info) {
    const eventId = info.event.id;
    const eventIndex = scheduledEvents.value.findIndex((e) => e.id === eventId);

    if (eventIndex !== -1) {
      scheduledEvents.value[eventIndex].start = info.event.startStr;
      scheduledEvents.value[eventIndex].end = info.event.endStr;
      showNotification(
        `Evento movido a ${formatDate(info.event.startStr.split("T")[0])}`
      );
    }
  }

  function handleEventResize(info) {
    const eventId = info.event.id;
    const eventIndex = scheduledEvents.value.findIndex((e) => e.id === eventId);

    if (eventIndex !== -1) {
      scheduledEvents.value[eventIndex].end = info.event.endStr;
      const startDate = new Date(info.event.start);
      const endDate = new Date(info.event.end);
      const durationMinutes = Math.round((endDate - startDate) / (1000 * 60));
      showNotification(`Duración actualizada a ${durationMinutes} minutos`);
    }
  }

  function openAddActivity(activity = null) {
    if (activity) {
      editMode.value = true;
      currentActivity.value = activity; // Asigna la actividad actual
      scheduledDate.value = activity.scheduledDate || '';
      scheduleTime.value = activity.scheduleTime || '09:00';
      eventDuration.value = activity.duration || 60;
    } else {
      editMode.value = false;
      currentActivity.value = null; // Reinicia currentActivity
      scheduledDate.value = '';
      scheduleTime.value = '09:00';
      eventDuration.value = 60;
    }
  
    showModal.value = true;
  }

  function closeModal() {
    gsap.to(modalRef.value, {
      y: 50,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        showModal.value = false;
        editMode.value = false;
        currentActivityId.value = null;
        currentEventId.value = null;
        scheduledDate.value = "";
      },
    });
  }

  function addTag() {
    if (
      selectedTag.value &&
      !selectedTags.value.some((tag) => tag.id === selectedTag.value.id)
    ) {
      selectedTags.value.push(selectedTag.value);
      selectedTag.value = "";

      nextTick(() => {
        const tags = document.querySelectorAll(".tag");
        const lastTag = tags[tags.length - 1];

        gsap.fromTo(
          lastTag,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );
      });
    }
  }

  function removeTag(index) {
    const tags = document.querySelectorAll(".tag");
    const tagToRemove = tags[index];

    gsap.to(tagToRemove, {
      scale: 0,
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        selectedTags.value.splice(index, 1);
      },
    });
  }

  function saveActivity() {
    if (editMode.value && currentActivityId.value) {
      const activityIndex = availableActivities.value.findIndex(
        (activity) => activity.id === currentActivityId.value
      );
      if (activityIndex !== -1) {
        availableActivities.value[activityIndex].title =
          newActivity.value.title;
        availableActivities.value[activityIndex].color =
          newActivity.value.color;
        availableActivities.value[activityIndex].tags = [...selectedTags.value];
      }

      scheduledEvents.value.forEach((event, index) => {
        if (event.extendedProps.activityId === currentActivityId.value) {
          scheduledEvents.value[index].title = newActivity.value.title;
          scheduledEvents.value[index].backgroundColor =
            newActivity.value.color;
          scheduledEvents.value[index].borderColor = newActivity.value.color;
          scheduledEvents.value[index].extendedProps.tags = [
            ...selectedTags.value,
          ];
        }
      });

      if (currentEventId.value) {
        const eventIndex = scheduledEvents.value.findIndex(
          (event) => event.id === currentEventId.value
        );
        if (eventIndex !== -1) {
          scheduledEvents.value[eventIndex].title = newActivity.value.title;
          scheduledEvents.value[eventIndex].backgroundColor =
            newActivity.value.color;
          scheduledEvents.value[eventIndex].borderColor =
            newActivity.value.color;
          scheduledEvents.value[eventIndex].extendedProps.tags = [
            ...selectedTags.value,
          ];
        }
      }

      showNotification("Actividad actualizada");
    } else {
      const newId = `activity-${Date.now()}`;
      const activityToAdd = {
        id: newId,
        title: newActivity.value.title,
        color: newActivity.value.color,
        tags: [...selectedTags.value],
      };

      availableActivities.value.push(activityToAdd);

      if (scheduledDate.value) {
        const eventStart = `${scheduledDate.value}T${scheduleTime.value}:00`;
        const startDate = new Date(eventStart);
        const endDate = new Date(startDate);
        endDate.setMinutes(
          startDate.getMinutes() + parseInt(eventDuration.value)
        );

        const eventToAdd = {
          id: `event-${Date.now()}`,
          title: newActivity.value.title,
          start: eventStart,
          end: endDate.toISOString(),
          backgroundColor: newActivity.value.color,
          textColor: "#ffffff",
          extendedProps: {
            tags: [...selectedTags.value],
            activityId: newId,
          },
        };
        scheduledEvents.value.push(eventToAdd);
        showNotification("Actividad programada en el calendario");
      } else {
        showNotification("Nueva actividad creada");
      }
    }

    nextTick(() => {
      refreshCalendar();
    });

    closeModal();
  }

  function editSelectedEvent() {
    if (selectedEvent.value) {
      const event = selectedEvent.value;
      const activityId = event.extendedProps.activityId;

      currentEventId.value = event.id;

      if (activityId) {
        const activity = availableActivities.value.find(
          (a) => a.id === activityId
        );
        if (activity) {
          openAddActivity(activity);
        } else {
          const eventActivity = {
            id: activityId,
            title: event.title,
            color: event.backgroundColor,
            tags: event.extendedProps.tags || [],
          };
          openAddActivity(eventActivity);
        }
      } else {
        const eventActivity = {
          id: `temp-${Date.now()}`,
          title: event.title,
          color: event.backgroundColor,
          tags: event.extendedProps.tags || [],
        };
        openAddActivity(eventActivity);
      }

      showContextMenu.value = false;
    }
  }

  function duplicateSelectedEvent() {
    if (selectedEvent.value) {
      const event = selectedEvent.value;

      const newEvent = {
        id: `event-${Date.now()}`,
        title: `${event.title} (copia)`,
        start: event.startStr,
        end: event.endStr,
        backgroundColor: event.backgroundColor,
        textColor: event.textColor,
        extendedProps: { ...event.extendedProps },
      };

      scheduledEvents.value.push(newEvent);
      refreshCalendar();
      showContextMenu.value = false;
      showNotification("Evento duplicado");
    }
  }

  function deleteSelectedEvent() {
    if (selectedEvent.value) {
      const eventId = selectedEvent.value.id;
      const eventIndex = scheduledEvents.value.findIndex(
        (e) => e.id === eventId
      );
      if (eventIndex !== -1) {
        scheduledEvents.value.splice(eventIndex, 1);
        refreshCalendar();
        showNotification("Evento eliminado");
      }
      showContextMenu.value = false;
    }
  }

  function openTagManager() {
  showTagModal.value = true;
  // Usa un timeout más largo para asegurar que el DOM se actualice completamente
  setTimeout(() => {
    const modalElement = document.querySelector(".dialog-content");
    if (modalElement) {
      gsap.fromTo(
        modalElement,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    }
  }, 50);
}

  function closeTagModal() {
    gsap.to(tagModalRef.value, {
      y: 50,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        showTagModal.value = false;
      },
    });
  }

  function addNewTag() {
    if (newTagName.value.trim()) {
      const newId =
        availableTags.value.length > 0
          ? Math.max(...availableTags.value.map((tag) => tag.id)) + 1
          : 1;

      availableTags.value.push({
        id: newId,
        name: newTagName.value.trim(),
        color: newTagColor.value,
      });

      nextTick(() => {
        const tagItems = document.querySelectorAll(".tag-manager-item");
        const lastItem = tagItems[tagItems.length - 1];

        gsap.fromTo(
          lastItem,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );
      });

      newTagName.value = "";
      newTagColor.value = getRandomColor();
    }
  }

  function deleteTag(index) {
    const tagItems = document.querySelectorAll(".tag-manager-item");
    const itemToRemove = tagItems[index];

    gsap.to(itemToRemove, {
      height: 0,
      opacity: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
      duration: 0.3,
      onComplete: () => {
        const tagId = availableTags.value[index].id;
        availableTags.value.splice(index, 1);
        availableActivities.value.forEach((activity) => {
          if (activity.tags && activity.tags.length) {
            activity.tags = activity.tags.filter((tag) => tag.id !== tagId);
          }
        });

        scheduledEvents.value.forEach((event) => {
          if (event.extendedProps.tags && event.extendedProps.tags.length) {
            event.extendedProps.tags = event.extendedProps.tags.filter(
              (tag) => tag.id !== tagId
            );
          }
        });

        refreshCalendar();
      },
    });
  }

  function handleDragStart(event, activity) {
    event.target.classList.add("dragging");

    const eventData = {
      title: activity.title,
      backgroundColor: activity.color || "#5e72e4",
      textColor: "#ffffff",
      extendedProps: {
        activity: activity,
        tags: activity.tags || [],
        activityId: activity.id,
      },
    };

    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", JSON.stringify(eventData));
      event.dataTransfer.effectAllowed = "copy";
    }

    gsap.to(event.target, {
      scale: 0.95,
      boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
      duration: 0.2,
    });

    event.target.addEventListener(
      "dragend",
      () => {
        event.target.classList.remove("dragging");
        gsap.to(event.target, {
          scale: 1,
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
          duration: 0.2,
        });
      },
      { once: true }
    );
  }

  function getRandomColor() {
    const colors = [
      "#4da6ff",
      "#ff4d4d",
      "#66cc66",
      "#ff9933",
      "#cc99ff",
      "#ff6699",
      "#5e72e4",
      "#11cdef",
      "#fb6340",
      "#2dce89",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function handleDocumentClick(event) {
    if (showContextMenu.value) {
      const contextMenuEl = document.querySelector(".context-menu");
      if (contextMenuEl && !contextMenuEl.contains(event.target)) {
        showContextMenu.value = false;
      }
    }
  }

  function saveData() {
    try {
      localStorage.setItem(
        "calendarActivities",
        JSON.stringify(availableActivities.value)
      );
      localStorage.setItem(
        "calendarEvents",
        JSON.stringify(scheduledEvents.value)
      );
      localStorage.setItem("calendarTags", JSON.stringify(availableTags.value));
    } catch (e) {
      console.error("Error al guardar datos:", e);
    }
  }

  function loadData() {
    try {
      const savedActivities = localStorage.getItem("calendarActivities");
      const savedEvents = localStorage.getItem("calendarEvents");
      const savedTags = localStorage.getItem("calendarTags");

      if (savedActivities) {
        availableActivities.value = JSON.parse(savedActivities);
      }

      if (savedEvents) {
        scheduledEvents.value = JSON.parse(savedEvents);
      }

      if (savedTags) {
        availableTags.value = JSON.parse(savedTags);
      }
    } catch (e) {
      console.error("Error al cargar datos:", e);
    }
  }

  function initDraggableActivities() {
    nextTick(() => {
      const containerEl = document.querySelector(".activities-container");
      if (containerEl) {
        new Draggable(containerEl, {
          itemSelector: ".draggable-activity",
          eventData: function (eventEl) {
            const data = eventEl.getAttribute("data-event");
            try {
              return JSON.parse(data);
            } catch (e) {
              console.error("Invalid event data", e);
              return {};
            }
          }
        });
      }
    });
  }
  

  // Observadores y ciclo de vida
  watch(
    [availableActivities, scheduledEvents, availableTags],
    () => {
      saveData();
    },
    { deep: true }
  );
  

  onMounted(() => {
    loadData();
    setTimeout(() => {
      calendarReady.value = true;
      nextTick(() => {
        const calendarEl = document.querySelector(".calendar-fade-enter-active");
        refreshCalendar();
        if (calendarEl) {
          gsap.fromTo(
            calendarEl,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
          );
        }
        
        // Inicializar Draggable para las actividades
        initDraggableActivities();
      });
    }, 1000);
  
    document.addEventListener("click", handleDocumentClick);
  });

  onUnmounted(() => {
    document.removeEventListener("click", handleDocumentClick);
  });

  return {
    calendarReady,
    calendarRef,
    showModal,
    showTagModal,
    editMode,
    currentActivityId,
    currentEventId,
    showContextMenu,
    contextMenuPosition,
    selectedEvent,
    scheduledDate,
    scheduleTime,
    eventDuration,
    availableTags,
    availableActivities,
    scheduledEvents,
    newActivity,
    selectedTags,
    selectedTag,
    newTagName,
    newTagColor,
    formattedEvents,
    calendarOptions,
    openAddActivity,
    closeModal,
    addTag,
    removeTag,
    saveActivity,
    editSelectedEvent,
    duplicateSelectedEvent,
    deleteSelectedEvent,
    openTagManager,
    closeTagModal,
    addNewTag,
    deleteTag,
    handleDragStart,
    formatDate,
    refreshCalendar,
  };
}
