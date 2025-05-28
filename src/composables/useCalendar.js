import { ref, computed, onMounted, onUnmounted, nextTick, watch, h } from "vue";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Draggable } from "@fullcalendar/interaction";
import gsap from "gsap";
import { ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";

import useAnimation from "./useAnimation";
import useTags from "./useTags";
import useActivities from "./useActivities";
import useApi from "./useApi";

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

  const router = useRouter();
  const api = useApi();

  // Estado del calendario
  const calendarReady = ref(false);
  const calendarRef = ref(null);
  const showContextMenu = ref(false);
  const contextMenuPosition = ref({ x: 0, y: 0 });
  const selectedActivity = ref(null);
  const showTagModal = ref(false);
  
  // Control de inicialización
  const initializationStatus = {
    state: 'idle',
    promise: null
  };

  // Estado para el diálogo de detalles
  const showEventDetails = ref(false);
  const selectedEventDetails = ref(null);

  const lastEventDateMap = new Map();
  const cellColorsMap = new Map();

  // Computed
  const formattedActivities = computed(() => {
    console.log('Formateando actividades. scheduledActivities:', scheduledActivities.value);
    
    return scheduledActivities.value.map((calendarEvent) => {
      const activity = calendarEvent.activity || {};
      console.log('Formateando evento:', {
        calendarEventId: calendarEvent.id,
        activityId: calendarEvent.activity_id,
        activity: activity
      });
      
      return {
        id: calendarEvent.id,
        title: activity.title,
        start: calendarEvent.start_date,
        end: calendarEvent.end_date,
        backgroundColor: activity.color || "#5e72e4",
        textColor: "#ffffff",
        borderColor: activity.color || "#5e72e4",
        allDay: calendarEvent.all_day,
        extendedProps: {
          calendarEventId: calendarEvent.id,
          activityId: calendarEvent.activity_id,
          activity: activity,
          description: activity.description,
          tags: activity.tags || []
        }
      };
    });
  });

  // Inicialización única
  async function initialize() {
    // Si ya hay una promesa de inicialización, retornarla
    if (initializationStatus.promise) {
      return initializationStatus.promise;
    }

    // Si ya está completado, no hacer nada
    if (initializationStatus.state === 'completed') {
      return Promise.resolve();
    }

    // Crear nueva promesa de inicialización
    initializationStatus.promise = (async () => {
      try {
        initializationStatus.state = 'loading';

        // Cargar datos en paralelo
        const [activitiesResult, tagsResult] = await Promise.all([
          loadActivities().catch(error => {
            console.error('Error cargando actividades:', error);
            return null;
          }),
          loadTags().catch(error => {
            console.error('Error cargando tags:', error);
            return null;
          })
        ]);

        // Verificar si ambas cargas fueron exitosas
        if (activitiesResult === null && tagsResult === null) {
          throw new Error('Error durante la inicialización de datos');
        }

        calendarReady.value = true;
        initializationStatus.state = 'completed';
      } catch (error) {
        console.error('Error durante la inicialización:', error);
        initializationStatus.state = 'error';
        throw error;
      } finally {
        // Limpiar la promesa cuando termine
        initializationStatus.promise = null;
      }
    })();

    return initializationStatus.promise;
  }

  // Cleanup al desmontar
  onUnmounted(() => {
    initializationStatus.state = 'idle';
    initializationStatus.promise = null;
    calendarReady.value = false;
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
    events: function(info, successCallback, failureCallback) {
      successCallback(formattedActivities.value);
    },
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
    eventDidMount: function(info) {
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
    eventDestroy: function(info) {
      // Limpiar tooltip al destruir evento
      if (info.event.extendedProps.tooltip) {
        info.event.extendedProps.tooltip.remove();
      }
    }
  };

  // Métodos
  function refreshCalendar() {
    if (!calendarRef.value || !calendarRef.value.getApi) return;
    
    const calendarApi = calendarRef.value.getApi();
    calendarApi.refetchEvents();
  }

  function formatDate(date) {
    if (!date) return "";
    return dayjs(date).tz("America/Bogota").format("DD/MM/YYYY");
  }

  function handleActivityClick(info) {
    const event = info.event;
    const activity = event.extendedProps?.activity || {};
    
    console.log('Click en evento:', {
      event: event,
      extendedProps: event.extendedProps,
      activity: activity
    });
    
    // Guardar los detalles del evento seleccionado
    selectedEventDetails.value = {
      id: event.extendedProps?.calendarEventId || event.id,
      title: activity.title || event.title,
      description: activity.description || event.extendedProps?.description || '',
      color: activity.color || event.backgroundColor,
      tags: event.extendedProps?.tags || [],
      start: event.start,
      end: event.end,
      activity: activity,
      extendedProps: event.extendedProps
    };

    console.log('Detalles del evento seleccionado:', selectedEventDetails.value);

    // Mostrar el diálogo
    showEventDetails.value = true;
    info.jsEvent.preventDefault();
  }

  function handleDateClick(info) {
    // Convertir la fecha de FullCalendar (UTC) a la zona horaria de Colombia
    const colombiaDate = dayjs(info.date)
      .tz("America/Bogota")
      .format("YYYY-MM-DD");

    // Asignar la fecha ajustada y hora actual redondeada a 30 minutos
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? "00" : "30";
    const hours = now.getHours().toString().padStart(2, "0");
    
    scheduledDate.value = colombiaDate;
    scheduleTime.value = `${hours}:${roundedMinutes}`;
    activityDuration.value = 60;

    // Abrir el modal de agregar actividad con la fecha seleccionada
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

      // Establecer fecha y hora solo si se proporciona una fecha
      if (date) {
        scheduledDate.value = date;
      } else {
        scheduledDate.value = "";
        scheduleTime.value = "09:00";
      }
      activityDuration.value = 60;
    }

    showModal.value = true;
    animateModalOpen(modalRef);
  }

  function closeModal() {
    showModal.value = false;
    editMode.value = false;
    currentActivity.value = null;
  }

  function editSelectedActivity(activity) {
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
      scheduledDate.value = activity.scheduledDate || "";
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

      // Establecer fecha y hora solo si se proporciona una fecha
      if (scheduledDate.value) {
        scheduledDate.value = "";
        scheduleTime.value = "09:00";
      }
      activityDuration.value = 60;
    }

    showModal.value = true;
    animateModalOpen(modalRef);
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

  async function deleteSelectedActivity() {
    if (selectedActivity.value) {
      try {
        // Si es un evento del calendario
        if (selectedActivity.value.events) {
          const event = selectedActivity.value.events[0];
          if (event && event.id) {
            await deleteCalendarEvent(event.id);
            showNotification("Actividad eliminada del calendario");
          }
        } else {
          // Si es una actividad de la lista
          const activityId = selectedActivity.value.id;
          if (activityId) {
            // Eliminar la actividad de la lista
            availableActivities.value = availableActivities.value.filter(
              (a) => a.id !== activityId
            );
            
            // Eliminar todos los eventos relacionados del calendario
            const eventsToDelete = scheduledActivities.value.filter(
              (event) => event.extendedProps?.activityId === activityId
            );
            
            // Eliminar cada evento individualmente
            for (const event of eventsToDelete) {
              await deleteCalendarEvent(event.id);
            }
            
            showNotification("Actividad eliminada completamente");
          }
        }
      } catch (error) {
        console.error('Error al eliminar la actividad:', error);
        showNotification("Error al eliminar la actividad", "error");
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

  function closeEventDetails() {
    showEventDetails.value = false;
    selectedEventDetails.value = null;
  }

  function handleEditActivity() {
    if (selectedEventDetails.value?.activity) {
      editSelectedActivity(selectedEventDetails.value.activity);
      closeEventDetails();
    }
  }

  // Función para editar una actividad específica
  function editActivity(activity) {
    if (!activity) return;
    
    try {
      // Si la actividad tiene un tipo específico, redirigir a su página de edición
      if (activity.type) {
        router.push(`/activities/${activity.type}/${activity.id}/edit`);
        return;
      }
      
      // Si no tiene tipo, usar el modal genérico de edición
      editMode.value = true;
      currentActivity.value = { ...activity };
      currentActivityId.value = activity.id;
      
      // Asegurarse de que el color se pase correctamente
      const activityColor = activity.color || activity.backgroundColor || "#5e72e4";
      
      newActivity.value = {
        title: activity.title || "",
        color: activityColor,
        description: activity.description || "",
        tags: activity.tags || [],
      };

      // Cargar etiquetas seleccionadas
      selectedTags.value = activity.tags || [];

      // Cargar fecha y hora si existen
      if (activity.start) {
        const startDate = dayjs(activity.start);
        scheduledDate.value = startDate.format('YYYY-MM-DD');
        scheduleTime.value = startDate.format('HH:mm');
        
        if (activity.end) {
          const duration = dayjs(activity.end).diff(startDate, 'minutes');
          activityDuration.value = duration || 60;
        } else {
          activityDuration.value = 60;
        }
      }

      showModal.value = true;
      if (modalRef.value) {
        animateModalOpen(modalRef.value);
      }
    } catch (error) {
      console.error('Error al editar la actividad:', error);
      showNotification('Error al editar la actividad: ' + (error.message || 'Error desconocido'), 'error');
    }
  }

  // Función para manejar la edición desde los detalles del evento
  async function handleEventEdit(event) {
    try {
      if (!event) return;
      
      // Cerrar el diálogo de detalles
      showEventDetails.value = false;
      
      // Si el evento tiene una actividad asociada
      if (event.extendedProps?.activity) {
        editActivity(event.extendedProps.activity);
      }
    } catch (error) {
      console.error('Error al editar desde detalles:', error);
      showNotification('Error al editar la actividad: ' + (error.message || 'Error desconocido'), 'error');
    }
  }

  // Función para convertir a color pastel (si no existe)
  const convertToPastelColor = (color) => {
    if (!color) return "#e0e0e0";
    // Si ya es un color pastel, devolverlo
    if (color.match(/^rgba?\(\d+,\s*\d+,\s*\d+,\s*0\.\d+\)/)) return color;
    
    // Convertir a RGB si es HEX
    let r, g, b;
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else if (color.startsWith("rgb")) {
      const matches = color.match(/\d+/g);
      [r, g, b] = matches;
    } else {
      return "#e0e0e0";
    }
    
    // Convertir a pastel
    r = Math.floor((parseInt(r) + 255) / 2);
    g = Math.floor((parseInt(g) + 255) / 2);
    b = Math.floor((parseInt(b) + 255) / 2);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Función para obtener el tipo de segmentación
  const getSegmentationType = (colorCount) => {
    const types = ["diagonal", "horizontal", "vertical", "checkered", "radial"];
    return types[colorCount % types.length];
  };

  // Función para aplicar segmentación
  const applySegmentation = (cell, colors, type) => {
    if (!cell || !colors || !type) return;
    
    const cellRect = cell.getBoundingClientRect();
    const width = cellRect.width;
    const height = cellRect.height;
    
    // Limpiar overlays existentes
    const existingOverlays = cell.querySelectorAll(".color-overlay");
    existingOverlays.forEach(overlay => overlay.remove());
    
    // Aplicar nuevo color
    colors.forEach((color, index) => {
      const overlay = document.createElement("div");
      overlay.classList.add("color-overlay");
      overlay.style.position = "absolute";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = color;
      overlay.style.opacity = "0.5";
      cell.appendChild(overlay);
    });
  };

  // Función para resetear el color de una celda
  const resetDayCellColor = (dateStr) => {
    const cell = document.querySelector(`[data-date='${dateStr}']`);
    if (!cell) return;
    
    const existingOverlays = cell.querySelectorAll(".color-overlay");
    existingOverlays.forEach(overlay => {
      overlay.remove();
    });
    
    cell.style.backgroundColor = "";
    if (cellColorsMap.has(dateStr)) {
      cellColorsMap.delete(dateStr);
    }
  };

  // Función para eliminar un evento del calendario
  async function deleteCalendarEvent(calendarEventId) {
    try {
      // Primero eliminar del backend
      await api.deleteCalendarEvent(calendarEventId);
      
      // Actualizar el estado local inmediatamente
      scheduledActivities.value = scheduledActivities.value.filter(
        event => event.id !== calendarEventId
      );

      // Obtener la instancia del calendario y actualizar directamente
      if (calendarRef.value && calendarRef.value.getApi) {
        const calendarApi = calendarRef.value.getApi();
        
        // Encontrar y eliminar el evento específico
        const eventToRemove = calendarApi.getEventById(calendarEventId);
        if (eventToRemove) {
          // Guardar la fecha del evento antes de eliminarlo para limpiar los colores
          const eventDate = dayjs(eventToRemove.start).format('YYYY-MM-DD');
          
          // Eliminar el evento del calendario
          eventToRemove.remove();
          
          // Limpiar los colores de la celda si es necesario
          if (lastEventDateMap.has(calendarEventId)) {
            const dateStr = lastEventDateMap.get(calendarEventId);
            const colorsForDate = cellColorsMap.get(dateStr);
            if (colorsForDate) {
              const color = eventToRemove.backgroundColor || eventToRemove.color || "#e0e0e0";
              const pastelColor = convertToPastelColor(color);
              const newColors = colorsForDate.filter(c => c !== pastelColor);
              
              if (newColors.length === 0) {
                resetDayCellColor(dateStr);
              } else {
                cellColorsMap.set(dateStr, newColors);
                const cell = document.querySelector(`[data-date='${dateStr}']`);
                if (cell) {
                  const existingOverlays = cell.querySelectorAll(".color-overlay");
                  existingOverlays.forEach(overlay => overlay.remove());
                  const segmentationType = getSegmentationType(newColors.length);
                  applySegmentation(cell, newColors, segmentationType);
                }
              }
            }
            lastEventDateMap.delete(calendarEventId);
          }
        }
        
        // Forzar una actualización completa del calendario
        await nextTick(() => {
          calendarApi.refetchEvents();
        });
      }
      
      showNotification('Evento eliminado del calendario correctamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar el evento:', error);
      showNotification('Error al eliminar el evento', 'error');
      throw error;
    }
  }

  // Función para cargar los eventos del calendario
  async function loadCalendarEvents() {
    try {
      const events = await api.getCalendarEvents();
      scheduledActivities.value = events || [];

      if (calendarRef.value && calendarRef.value.getApi) {
        const calendarApi = calendarRef.value.getApi();
        calendarApi.removeAllEvents();
        calendarApi.addEventSource(formattedActivities.value);
      }
    } catch (error) {
      showNotification('Error al cargar los eventos del calendario', 'error');
    }
  }

  // Watcher para actualizar el calendario cuando cambian las actividades
  watch(scheduledActivities, () => {
    if (calendarRef.value && calendarRef.value.getApi) {
      const calendarApi = calendarRef.value.getApi();
      calendarApi.removeAllEvents();
      calendarApi.addEventSource(formattedActivities.value);
    }
  }, { deep: true });

  // Lifecycle hooks
  onMounted(() => {
    // Iniciar carga de datos
    initialize().then(() => {
      loadCalendarEvents(); // Cargar los eventos del calendario después de la inicialización
    }).catch(error => {
      console.error('Error en la inicialización del calendario:', error);
    });

    setTimeout(() => {
      nextTick(() => {
        if (initializationStatus.state === 'completed') {
          refreshCalendar();
          animateCalendarLoad(".calendar-fade-enter-active");
          initDraggableActivities();
        }
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

    // Estado para el diálogo de detalles
    showEventDetails,
    selectedEventDetails,
    closeEventDetails,
    handleEditActivity,

    // Nuevo estado
    currentActivity,

    // Función para manejar la edición desde los detalles del evento
    handleEventEdit,

    // Función para editar una actividad específica
    editActivity,

    // Función para eliminar un evento del calendario
    deleteCalendarEvent,

    // Función para cargar los eventos del calendario
    loadCalendarEvents,
  };
}
