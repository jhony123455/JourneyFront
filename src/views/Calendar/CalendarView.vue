<template>
  <div class="relative">
    <SeasonLoader v-if="!calendarReady" />
    <Transition name="calendar-fade" mode="out-in">
      <FullCalendar
        v-if="calendarReady"
        key="calendar"
        ref="calendarRef"
        :options="calendarOptions"
        class="rounded-xl shadow-lg bg-white"
      />
    </Transition>

    <!-- FAB: Botón flotante para agregar actividad -->
    <button
      class="fab fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-500 shadow-lg flex items-center justify-center z-10 hover:bg-blue-600 transition-all"
      @click="openAddActivity"
    >
      <i class="material-icons-round text-white text-lg">add</i>
    </button>

    <!-- Card de actividades arrastrable (posicionada ABAJO) -->
    <div
      class="activities-card fixed bottom-6 left-6 w-72 bg-white rounded-xl shadow-lg p-4 z-10"
    >
      <h3 class="text-lg font-bold mb-3">Mis Actividades</h3>
      <div class="activities-container">
        <div
          v-for="activity in availableActivities"
          :key="activity.id"
          class="draggable-activity fc-event"
          :style="{ borderLeft: `4px solid ${activity.color || '#5e72e4'}` }"
          :data-event="
            JSON.stringify({
              title: activity.title,
              backgroundColor: activity.color || '#f8f9fa',
              textColor: activity.color ? '#ffffff' : '#333333',
              extendedProps: { activity: activity },
            })
          "
          draggable="true"
          @dragstart="handleDragStart($event, activity)"
        >
          <div class="activity-content">
            <span class="activity-title">{{ activity.title }}</span>
            <div
              v-if="activity.tags && activity.tags.length > 0"
              class="activity-tags"
            >
              <span
                v-for="tag in activity.tags"
                :key="tag.id"
                class="activity-tag"
                :style="{ backgroundColor: tag.color }"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="card-actions">
        <button @click="openAddActivity" class="add-activity-btn">
          <i class="material-icons-round text-sm mr-1">add</i> Nueva Actividad
        </button>
        <button @click="openTagManager" class="manage-tags-btn">
          <i class="material-icons-round text-sm mr-1">label</i> Etiquetas
        </button>
      </div>
    </div>

    <!-- Modal para agregar/editar actividad -->
    <div
      v-if="showModal"
      class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
      @click.self="closeModal"
    >
      <div
        class="modal-content bg-white rounded-lg p-6 max-w-md w-full"
        ref="modalRef"
      >
        <h2 class="text-xl font-bold mb-4">
          {{ editMode ? "Editar actividad" : "Agregar nueva actividad" }}
        </h2>
        <form @submit.prevent="saveActivity">
          <div class="mb-3">
            <label class="block mb-1">Título:</label>
            <input
              v-model="newActivity.title"
              class="w-full p-2 border rounded"
              required
            />
          </div>
          <div class="mb-3">
            <label class="block mb-1">Color:</label>
            <input
              type="color"
              v-model="newActivity.color"
              class="p-1 border rounded w-full h-10"
            />
          </div>
          <div class="mb-3">
            <label class="block mb-1">Etiquetas (opcional):</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <div
                v-for="(tag, index) in selectedTags"
                :key="index"
                class="tag flex items-center px-2 py-1 rounded text-white text-xs"
                :style="{ backgroundColor: tag.color }"
              >
                {{ tag.name }}
                <span class="ml-1 cursor-pointer" @click="removeTag(index)"
                  >×</span
                >
              </div>
            </div>
            <div class="flex gap-2">
              <select
                v-model="selectedTag"
                class="p-2 border rounded flex-grow"
              >
                <option value="" disabled>Seleccionar etiqueta</option>
                <option v-for="tag in availableTags" :key="tag.id" :value="tag">
                  {{ tag.name }}
                </option>
              </select>
              <button
                type="button"
                @click="addTag"
                class="px-3 py-1 bg-blue-500 text-white rounded"
                :disabled="!selectedTag"
              >
                Añadir
              </button>
            </div>
          </div>

          <!-- Campos para agregar fecha y hora cuando se crea directamente en el calendario -->
          <div
            v-if="scheduledDate"
            class="schedule-details mb-3 p-3 bg-gray-100 rounded-lg"
          >
            <p class="font-medium">Programar para:</p>
            <p class="date-display text-blue-600">
              {{ formatDate(scheduledDate) }}
            </p>

            <div class="mt-3">
              <label class="block mb-1">Hora de inicio:</label>
              <input
                type="time"
                v-model="scheduleTime"
                class="w-full p-2 border rounded"
              />
            </div>

            <div class="mt-3">
              <label class="block mb-1">Duración (minutos):</label>
              <input
                type="number"
                v-model="eventDuration"
                min="15"
                step="15"
                class="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-5">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal para gestionar etiquetas -->
    <div
      v-if="showTagModal"
      class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
      @click.self="closeTagModal"
    >
      <div
        class="modal-content bg-white rounded-lg p-6 max-w-md w-full"
        ref="tagModalRef"
      >
        <h2 class="text-xl font-bold mb-4">Gestionar etiquetas</h2>
        <div class="mb-4">
          <div
            v-for="(tag, index) in availableTags"
            :key="tag.id"
            class="tag-manager-item"
          >
            <div class="flex items-center">
              <div
                class="color-preview"
                :style="{ backgroundColor: tag.color }"
              ></div>
              <input
                v-model="availableTags[index].name"
                class="flex-grow p-2 border rounded mx-2"
              />
              <input
                v-model="availableTags[index].color"
                type="color"
                class="color-picker"
              />
            </div>
            <button class="delete-btn" @click="deleteTag(index)">
              <i class="material-icons-round">delete</i>
            </button>
          </div>
        </div>
        <div class="mb-4">
          <h3 class="font-bold mb-2">Agregar nueva etiqueta</h3>
          <div class="flex gap-2">
            <input
              v-model="newTagName"
              placeholder="Nombre"
              class="flex-grow p-2 border rounded"
            />
            <input v-model="newTagColor" type="color" class="color-picker" />
            <button
              class="px-3 py-1 bg-blue-500 text-white rounded"
              :disabled="!newTagName"
              @click="addNewTag"
            >
              Agregar
            </button>
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded"
            @click="closeTagModal"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- Menú contextual para eventos del calendario -->
    <div
      v-if="showContextMenu"
      class="context-menu fixed bg-white rounded-lg shadow-lg p-2 z-30"
      :style="{
        top: `${contextMenuPosition.y}px`,
        left: `${contextMenuPosition.x}px`,
      }"
    >
      <button class="context-menu-item" @click="editSelectedEvent">
        <i class="material-icons-round text-sm mr-2">edit</i> Editar
      </button>
      <button class="context-menu-item" @click="duplicateSelectedEvent">
        <i class="material-icons-round text-sm mr-2">content_copy</i> Duplicar
      </button>
      <button
        class="context-menu-item text-red-500"
        @click="deleteSelectedEvent"
      >
        <i class="material-icons-round text-sm mr-2">delete</i> Eliminar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch, onUnmounted } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Draggable } from "@fullcalendar/interaction";
import gsap from "gsap";
import SeasonLoader from "@/views/components/SeasonLoader.vue";
const calendarReady = ref(false);
const calendarRef = ref(null);
const showModal = ref(false);
const modalRef = ref(null);
const showTagModal = ref(false);
const tagModalRef = ref(null);
const editMode = ref(false);
const currentActivityId = ref(null);
const currentEventId = ref(null);
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const startLeft = ref(0);
const startTop = ref(0);
const activitiesCard = ref(null);

// Nuevo: Para el menú contextual
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const selectedEvent = ref(null);

// Sistema de etiquetas
const availableTags = ref([
  { id: 1, name: "Importante", color: "#ff4d4d" },
  { id: 2, name: "Personal", color: "#4da6ff" },
  { id: 3, name: "Trabajo", color: "#66cc66" },
  { id: 4, name: "Urgente", color: "#ff9933" },
  { id: 5, name: "Recordatorio", color: "#cc99ff" },
]);

// Para la creación de nuevas etiquetas
const newTagName = ref("");
const newTagColor = ref("#5e72e4");

// Actividades disponibles para arrastrar
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

// Eventos programados en el calendario
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

// Datos para agendar actividades
const scheduledDate = ref("");
const scheduleTime = ref("09:00");
const eventDuration = ref(60); // Duración en minutos (por defecto 1 hora)

// Form para nueva actividad
const newActivity = ref({
  title: "",
  color: "#5e72e4",
  tags: [],
});

const selectedTags = ref([]);
const selectedTag = ref("");

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
  },
  eventClick(info) {
    // Mostrar menú contextual en lugar de editar directamente
    selectedEvent.value = info.event;

    // Posicionar y mostrar el menú contextual
    const rect = info.el.getBoundingClientRect();
    contextMenuPosition.value = {
      x: rect.right + 5,
      y: rect.top,
    };

    showContextMenu.value = true;

    // Prevenir el comportamiento predeterminado
    info.jsEvent.preventDefault();
  },
  dateClick(info) {
    scheduledDate.value = info.dateStr;
    scheduleTime.value = "09:00";
    eventDuration.value = 60; // 1 hora por defecto
    openAddActivity(null, info.dateStr);
  },
  // Para arrastrar y soltar actividades en el calendario
  drop(info) {
    const droppedActivityData = JSON.parse(
      info.draggedEl.getAttribute("data-event")
    );
    const activityObj = droppedActivityData.extendedProps.activity;


    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? "00" : "30";
    const hours = now.getHours().toString().padStart(2, "0");

    // Crear el evento directamente
    const eventStart = `${info.dateStr}T${hours}:${roundedMinutes}:00`;
    const startDate = new Date(eventStart);
    const endDate = new Date(startDate);
    endDate.setMinutes(startDate.getMinutes() + 60); // 1 hora por defecto

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
      `${activityObj.title} añadido al ${formatDate(info.dateStr)}`
    );

    nextTick(() => {
      refreshCalendar();
    });
  },
  eventDrop(info) {
    const eventId = info.event.id;
    const eventIndex = scheduledEvents.value.findIndex((e) => e.id === eventId);

    if (eventIndex !== -1) {
      scheduledEvents.value[eventIndex].start = info.event.startStr;
      scheduledEvents.value[eventIndex].end = info.event.endStr;

      // Mostrar una notificación
      showNotification(
        `Evento movido a ${formatDate(info.event.startStr.split("T")[0])}`
      );
    }
  },
  eventResize(info) {
    const eventId = info.event.id;
    const eventIndex = scheduledEvents.value.findIndex((e) => e.id === eventId);

    if (eventIndex !== -1) {
      scheduledEvents.value[eventIndex].end = info.event.endStr;
      const startDate = new Date(info.event.start);
      const endDate = new Date(info.event.end);
      const durationMinutes = Math.round((endDate - startDate) / (1000 * 60));

      showNotification(`Duración actualizada a ${durationMinutes} minutos`);
    }
  },
};

function showNotification(message, duration = 3000) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  // Animar entrada
  gsap.fromTo(
    notification,
    { y: -50, opacity: 0 },
    { y: 20, opacity: 1, duration: 0.3, ease: "power2.out" }
  );

  // Desaparecer después de duración
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

function refreshCalendar() {
  if (calendarRef.value && calendarRef.value.getApi) {
    const calendarApi = calendarRef.value.getApi();
    calendarApi.refetchEvents();
  }
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

function openAddActivity(activity = null, date = null) {
  if (activity) {
    editMode.value = true;
    currentActivityId.value = activity.id;
    newActivity.value.title = activity.title;
    newActivity.value.color = activity.color || "#5e72e4";
    selectedTags.value = [...(activity.tags || [])];
  } else {
    editMode.value = false;
    currentActivityId.value = null;
    newActivity.value = {
      title: "",
      color: "#5e72e4",
      tags: [],
    };
    selectedTags.value = [];
  }

  if (date) {
    scheduledDate.value = date;
  } else {
    scheduledDate.value = "";
  }

  showModal.value = true;

  nextTick(() => {
    gsap.fromTo(
      modalRef.value,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
    );
  });
}

function closeModal() {
  // Animación de salida
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
  // Animar eliminación de la etiqueta
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
      availableActivities.value[activityIndex].title = newActivity.value.title;
      availableActivities.value[activityIndex].color = newActivity.value.color;
      availableActivities.value[activityIndex].tags = [...selectedTags.value];
    }

    scheduledEvents.value.forEach((event, index) => {
      if (event.extendedProps.activityId === currentActivityId.value) {
        scheduledEvents.value[index].title = newActivity.value.title;
        scheduledEvents.value[index].backgroundColor = newActivity.value.color;
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
        scheduledEvents.value[eventIndex].borderColor = newActivity.value.color;
        scheduledEvents.value[eventIndex].extendedProps.tags = [
          ...selectedTags.value,
        ];
      }
    }

    showNotification("Actividad actualizada");
  } else {
    // Crear nueva actividad
    const newId = `activity-${Date.now()}`;
    const activityToAdd = {
      id: newId,
      title: newActivity.value.title,
      color: newActivity.value.color,
      tags: [...selectedTags.value],
    };

    // Agregar a la lista de actividades disponibles
    availableActivities.value.push(activityToAdd);

    // Si hay fecha programada, agregar al calendario también
    if (scheduledDate.value) {
      const eventStart = `${scheduledDate.value}T${scheduleTime.value}:00`;

      // Calcular fecha fin basada en la duración
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

  // Actualizar el calendario
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

    // Eliminar evento del calendario
    const eventIndex = scheduledEvents.value.findIndex((e) => e.id === eventId);
    if (eventIndex !== -1) {
      scheduledEvents.value.splice(eventIndex, 1);
      refreshCalendar();
      showNotification("Evento eliminado");
    }

    showContextMenu.value = false;
  }
}

// Funciones para gestionar etiquetas
function openTagManager() {
  showTagModal.value = true;

  // Animación de entrada
  nextTick(() => {
    gsap.fromTo(
      tagModalRef.value,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
    );
  });
}

function closeTagModal() {
  // Animación de salida
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

    // Animar la nueva etiqueta
    nextTick(() => {
      const tagItems = document.querySelectorAll(".tag-manager-item");
      const lastItem = tagItems[tagItems.length - 1];

      gsap.fromTo(
        lastItem,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
      );
    });

    // Limpiar el formulario
    newTagName.value = "";
    newTagColor.value = getRandomColor();
  }
}

function deleteTag(index) {
  // Animar eliminación
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

  // Animar el elemento
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


function moveCard(e) {
  if (!isDragging.value) return;

  const newLeft = startLeft.value + (e.clientX - startX.value);
  const newTop = startTop.value + (e.clientY - startY.value);

  activitiesCard.value.style.left = `${newLeft}px`;
  activitiesCard.value.style.top = `${newTop}px`;
  activitiesCard.value.style.bottom = "auto";
}

function stopDragging() {
  isDragging.value = false;
  document.removeEventListener("mousemove", moveCard);
  document.removeEventListener("mouseup", stopDragging);
}

// Guardar/cargar datos desde localStorage
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

// Observar cambios y guardar automáticamente
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
  }, 1000);

  document.addEventListener("click", handleDocumentClick);
  const activitiesCard = document.querySelector(".activities-card");
  if (activitiesCard.value) {
    // Hacer la tarjeta arrastrable
    const cardHeader = document.createElement("div");
    cardHeader.className = "card-drag-handle";
    cardHeader.style.cursor = "move";
    cardHeader.style.padding = "4px";
    cardHeader.style.marginBottom = "10px";
    cardHeader.innerHTML = "⋮⋮";
    activitiesCard.value.insertBefore(
      cardHeader,
      activitiesCard.value.firstChild
    );

    cardHeader.addEventListener("mousedown", (e) => {
      isDragging.value = true;
      startX.value = e.clientX;
      startY.value = e.clientY;
      const computedStyle = window.getComputedStyle(activitiesCard.value);
      startLeft.value = parseInt(computedStyle.left) || 0;
      startTop.value = parseInt(computedStyle.top) || 0;

      document.addEventListener("mousemove", moveCard);
      document.addEventListener("mouseup", stopDragging);
    });
    
  }
});

onUnmounted(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<style>
.calendar-main {
  position: relative;
  height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;
  font-family: Arial, sans-serif;
}

/* Estilos del cargador */
.loader {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.loader-animation {
  width: 50px;
  height: 50px;
  margin-bottom: 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Estilos del contenedor del calendario */
.calendar-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.main-calendar {
  flex: 1;
  min-width: 60%;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: white;
  padding: 20px;
}

/* Estilos del panel de actividades */
.activities-panel {
  width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.activities-container {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.draggable-activity {
  padding: 10px;
  margin-bottom: 8px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  cursor: grab;
  transition: all 0.2s ease;
}

.draggable-activity:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.activity-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.activity-duration {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.activity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.activity-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  color: white;
  white-space: nowrap;
}

.add-activity-btn {
  width: 100%;
  padding: 8px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-activity-btn:hover {
  background-color: #45a049;
}

/* Estilos del modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.modal-content {
  width: 400px;
  max-width: 90%;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  position: relative;
  z-index: 1010;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

/* Estilos del formulario */
.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.tag-option {
  padding: 4px 8px;
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-option.selected {
  background-color: #f0f0f0;
  font-weight: bold;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.form-actions button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.form-actions button[type="button"] {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
}

.form-actions button[type="submit"] {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.form-actions button:hover {
  opacity: 0.9;
}

/* Estilos responsive */
@media (max-width: 768px) {
  .calendar-container {
    flex-direction: column;
  }
  
  .main-calendar {
    min-width: 100%;
  }
  
  .activities-panel {
    width: 100%;
  }
}
</style>