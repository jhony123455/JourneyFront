import { ref, watch } from 'vue';
import gsap from 'gsap';

export default function useActivities() {
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

  // Form para nueva actividad
  const newActivity = ref({
    title: "",
    color: "#5e72e4",
    tags: [],
  });

  const editMode = ref(false);
  const currentActivityId = ref(null);
  const currentEventId = ref(null);

  function createActivity(activityData, tags) {
    const newId = `activity-${Date.now()}`;
    const activityToAdd = {
      id: newId,
      title: activityData.title,
      color: activityData.color,
      tags: tags || [],
    };

    availableActivities.value.push(activityToAdd);
    return activityToAdd;
  }

  function updateActivity(activityId, activityData, tags) {
    const activityIndex = availableActivities.value.findIndex(
      (activity) => activity.id === activityId
    );
    if (activityIndex !== -1) {
      availableActivities.value[activityIndex].title = activityData.title;
      availableActivities.value[activityIndex].color = activityData.color;
      availableActivities.value[activityIndex].tags = tags || [];
      return availableActivities.value[activityIndex];
    }
    return null;
  }

  function getActivityById(id) {
    return availableActivities.value.find(activity => activity.id === id);
  }

  function handleDragStart(event, activity) {
    // Añadir una clase para estilar durante el arrastre
    event.target.classList.add("dragging");

    // Para FullCalendar, necesitamos establecer los datos correctamente
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

    // Establecer los datos de transferencia
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

    // Agregar evento para cuando termine el arrastre
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

  function saveActivitiesData() {
    try {
      localStorage.setItem(
        "calendarActivities",
        JSON.stringify(availableActivities.value)
      );
    } catch (e) {
      console.error("Error al guardar actividades:", e);
    }
  }

  function loadActivitiesData() {
    try {
      const savedActivities = localStorage.getItem("calendarActivities");
      if (savedActivities) {
        availableActivities.value = JSON.parse(savedActivities);
      }
    } catch (e) {
      console.error("Error al cargar actividades:", e);
    }
  }

  // Guardar automáticamente cuando cambian las actividades
  watch(
    availableActivities,
    () => {
      saveActivitiesData();
    },
    { deep: true }
  );

  return {
    availableActivities,
    newActivity,
    editMode,
    currentActivityId,
    currentEventId,
    createActivity,
    updateActivity,
    getActivityById,
    handleDragStart,
    saveActivitiesData,
    loadActivitiesData
  };
}