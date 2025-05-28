import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Draggable } from "@fullcalendar/interaction";
import gsap from "gsap";

import useAnimation from "./useAnimation";
import useTags from "./useTags";
import useActivities from "./useActivities";

export default function useCalendar() {
  dayjs.extend(utc);
  dayjs.extend(timezone);

  const {
    animateTearSheet,
    showNotification,
    animateModalOpen,
    animateModalClose,
    animateCalendarLoad,
  } = useAnimation();

  const {
    availableTags,
    selectedTags,
    selectedTag,
    loadTags,
    addTagToSelection,
    removeTagFromSelection,
  } = useTags();

  const {
    availableActivities,
    scheduledActivities,
    newActivity,
    currentActivity,
    currentActivityId,
    editMode,
    showModal,
    modalRef,
    scheduledDate,
    scheduleTime,
    activityDuration,
    loadActivities,
    saveActivity,
    formatDateTime,
  } = useActivities();

  // Estado del calendario
  const calendarReady = ref(false);
  const calendarRef = ref(null);
  const showContextMenu = ref(false);
  const contextMenuPosition = ref({ x: 0, y: 0 });
  const selectedActivity = ref(null);
  const showTagModal = ref(false);

  // Computed
  const formattedActivities = computed(() => {
    return scheduledActivities.value.map((activity) => {
      return {
        id: activity.id,
        title: activity.title,
        start: activity.start,
        end: activity.end,
        backgroundColor: activity.backgroundColor || "#5e72e4",
        textColor: activity.textColor || "#ffffff",
        borderColor: activity.backgroundColor || "#5e72e4",
        extendedProps: activity.extendedProps || {},
      };
    });
  });

  function openTagManager() {
    showTagModal.value = true;
    // Si estás utilizando animaciones
    if (typeof animateModalOpen === "function") {
      nextTick(() => {
        const modalElement = document.querySelector(".tag-manager-dialog");
        if (modalElement) {
          animateModalOpen(modalElement);
        }
      });
    }
  }

  function closeTagModal() {
    // Si estás utilizando animaciones
    if (typeof animateModalClose === "function") {
      const modalElement = document.querySelector(".tag-manager-dialog");
      if (modalElement) {
        animateModalClose(modalElement, () => {
          showTagModal.value = false;
        });
      } else {
        showTagModal.value = false;
      }
    } else {
      showTagModal.value = false;
    }
  }

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
    events: formattedActivities,
    datesSet() {
      animateTearSheet();
    },
    eventContent: function (arg) {
      const activity = arg.event;
      const tags = activity.extendedProps.tags || [];
      let arrayOfDomNodes = [];

      const titleEl = document.createElement("div");
      titleEl.innerHTML = activity.title;
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
    eventClick: handleActivityClick,
    dateClick: handleDateClick,
    drop: handleDrop,
    eventDrop: handleActivityDrop,
    eventResize: handleActivityResize,
  };

  // Métodos
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

  function handleActivityClick(info) {
    selectedActivity.value = info.event;
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
    const colombiaDate = dayjs(info.date)
      .tz("America/Bogota")
      .format("YYYY-MM-DD");

    // Asignar la fecha ajustada
    scheduledDate.value = colombiaDate;
    scheduleTime.value = "09:00";
    activityDuration.value = 60;

    // Abrir el modal de agregar actividad
    openAddActivity(null, colombiaDate);
  }

  function handleDrop(info) {
    const droppedActivityData = JSON.parse(
      info.draggedEl.getAttribute("data-event")
    );
    const activityObj = droppedActivityData.extendedProps.activity;

    // Ajustar la fecha de inicio a la zona horaria de Colombia
    const colombiaDate = dayjs(info.date)
      .tz("America/Bogota")
      .format("YYYY-MM-DD");
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? "00" : "30";
    const hours = now.getHours().toString().padStart(2, "0");

    const activityStart = `${colombiaDate}T${hours}:${roundedMinutes}:00`;
    const startDate = new Date(activityStart);
    const endDate = new Date(startDate);
    endDate.setMinutes(startDate.getMinutes() + 60);

    const activityToAdd = {
      id: `activity-${Date.now()}`,
      title: activityObj.title,
      start: activityStart,
      end: endDate.toISOString(),
      backgroundColor: activityObj.color || "#5e72e4",
      textColor: "#ffffff",
      extendedProps: {
        tags: activityObj.tags || [],
        activityId: activityObj.id,
      },
    };

    scheduledActivities.value.push(activityToAdd);
    showNotification(
      `${activityObj.title} añadido al ${formatDate(colombiaDate)}`
    );

    nextTick(() => {
      refreshCalendar();
    });
  }

  function handleActivityDrop(info) {
    const activityId = info.event.id;
    const activityIndex = scheduledActivities.value.findIndex(
      (e) => e.id === activityId
    );

    if (activityIndex !== -1) {
      scheduledActivities.value[activityIndex].start = info.event.startStr;
      scheduledActivities.value[activityIndex].end = info.event.endStr;
      showNotification(
        `Actividad movida a ${formatDate(info.event.startStr.split("T")[0])}`
      );
    }
  }

  function handleActivityResize(info) {
    const activityId = info.event.id;
    const activityIndex = scheduledActivities.value.findIndex(
      (e) => e.id === activityId
    );

    if (activityIndex !== -1) {
      scheduledActivities.value[activityIndex].end = info.event.endStr;
      const startDate = new Date(info.event.start);
      const endDate = new Date(info.event.end);
      const durationMinutes = Math.round((endDate - startDate) / (1000 * 60));
      showNotification(`Duración actualizada a ${durationMinutes} minutos`);
    }
  }

  function openAddActivity(activity = null, date = null) {
    if (activity) {
      editMode.value = true;
      currentActivity.value = activity;
      currentActivityId.value = activity.id;
      newActivity.value = {
        title: activity.title || "",
        color: activity.color || "#5e72e4",
        tags: [],
      };

      // Cargar etiquetas seleccionadas
      selectedTags.value = activity.tags || [];

      // Cargar fecha y hora si existen
      scheduledDate.value = activity.scheduledDate || date || "";
      scheduleTime.value = activity.scheduleTime || "09:00";
      activityDuration.value = activity.duration || 60;
    } else {
      editMode.value = false;
      currentActivity.value = null;
      currentActivityId.value = null;
      newActivity.value = {
        id: null,
        title: "",
        color: "#5e72e4",
        tags: [],
      };
      selectedTags.value = [];

      // Establecer fecha si se proporciona
      scheduledDate.value = date || "";
      scheduleTime.value = "09:00";
      activityDuration.value = 60;
    }

    showModal.value = true;
    animateModalOpen(modalRef);
  }

  function closeModal() {
    animateModalClose(modalRef, () => {
      showModal.value = false;
      editMode.value = false;
      currentActivityId.value = null;
      scheduledDate.value = "";
    });
  }

  function editSelectedActivity() {
    if (selectedActivity.value) {
      const activity = selectedActivity.value;
      const activityId = activity.extendedProps.activityId;

      if (activityId) {
        const activityObj = availableActivities.value.find(
          (a) => a.id === activityId
        );
        if (activityObj) {
          openAddActivity(activityObj);
        } else {
          const activityData = {
            id: activityId,
            title: activity.title,
            color: activity.backgroundColor,
            tags: activity.extendedProps.tags || [],
          };
          openAddActivity(activityData);
        }
      } else {
        const activityData = {
          id: `temp-${Date.now()}`,
          title: activity.title,
          color: activity.backgroundColor,
          tags: activity.extendedProps.tags || [],
        };
        openAddActivity(activityData);
      }

      showContextMenu.value = false;
    }
  }

  function duplicateSelectedActivity() {
    if (selectedActivity.value) {
      const activity = selectedActivity.value;

      const newActivity = {
        id: `activity-${Date.now()}`,
        title: `${activity.title} (copia)`,
        start: activity.startStr,
        end: activity.endStr,
        backgroundColor: activity.backgroundColor,
        textColor: activity.textColor,
        extendedProps: { ...activity.extendedProps },
      };

      scheduledActivities.value.push(newActivity);
      refreshCalendar();
      showContextMenu.value = false;
      showNotification("Actividad duplicada");
    }
  }

  function deleteSelectedActivity() {
    if (selectedActivity.value) {
      const activityId = selectedActivity.value.id;
      const activityIndex = scheduledActivities.value.findIndex(
        (e) => e.id === activityId
      );
      if (activityIndex !== -1) {
        scheduledActivities.value.splice(activityIndex, 1);
        refreshCalendar();
        showNotification("Actividad eliminada");
      }
      showContextMenu.value = false;
    }
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

    // Animación
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

  function handleDocumentClick(event) {
    if (showContextMenu.value) {
      const contextMenuEl = document.querySelector(".context-menu");
      if (contextMenuEl && !contextMenuEl.contains(event.target)) {
        showContextMenu.value = false;
      }
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
          },
        });
      }
    });
  }

  // Lifecycle hooks
  onMounted(() => {
    // Cargar datos
    loadTags();
    loadActivities();

    setTimeout(() => {
      calendarReady.value = true;
      nextTick(() => {
        refreshCalendar();
        animateCalendarLoad(".calendar-fade-enter-active");
        initDraggableActivities();
      });
    }, 1000);

    document.addEventListener("click", handleDocumentClick);
  });

  onUnmounted(() => {
    document.removeEventListener("click", handleDocumentClick);
  });

  return {
    // Estado del calendario
    calendarReady,
    calendarRef,
    showContextMenu,
    contextMenuPosition,
    selectedActivity,
    formattedActivities,
    calendarOptions,

    // Métodos del calendario
    refreshCalendar,
    formatDate,
    handleDragStart,

    // Acciones de actividades
    openAddActivity,
    closeModal,
    editSelectedActivity,
    duplicateSelectedActivity,
    deleteSelectedActivity,

    // Referencias de estado
    showModal,
    modalRef,
    editMode,
    currentActivityId,

    // Datos de actividades
    availableActivities,
    scheduledActivities,
    newActivity,

    // Programación
    scheduledDate,
    scheduleTime,
    activityDuration,

    // Tags
    availableTags,
    selectedTags,
    selectedTag,
    addTagToSelection,
    removeTagFromSelection,
    showTagModal,
    openTagManager,
    closeTagModal,

    // Acciones de actividad
    saveActivity,
  };
}
