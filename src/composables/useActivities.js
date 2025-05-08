import { ref, computed } from "vue";
import useApi from "./useApi";
import useAnimation from "./useAnimation";
import useTags from "./useTags";
import dayjs from "dayjs";
import useTagStore from './useTagStore';

export default function useActivities() {
  const { selectedTags } = useTagStore();
  const { fetchActivities, createActivity, updateActivity, deleteActivity } = useApi();
  const { showNotification } = useAnimation();
  const availableActivities = ref([]);
  const scheduledActivities = ref([]);
  const newActivity = ref({
    title: "",
    description: "",
    color: "#5e72e4",
    tags: []
  });
  
  const currentActivity = ref(null);
  const currentActivityId = ref(null);
  const editMode = ref(false);
  const showModal = ref(false);
  const modalRef = ref(null);

  // Fechas y tiempo para programación
  const scheduledDate = ref("");
  const scheduleTime = ref("09:00");
  const activityDuration = ref(60);

  async function loadActivities() {
    try {
      availableActivities.value = await fetchActivities();
    } catch (err) {
      console.error("Error al cargar actividades:", err);
    }
  }

  async function saveActivity() {
    const payload = {
      title: newActivity.value.title,
      description: newActivity.value.description || "",
      color: newActivity.value.color,
      tags: selectedTags.value.map((tag) => tag.id)
    };

    try {
      if (editMode.value && currentActivityId.value) {
        await updateActivity(currentActivityId.value, payload);
        
        // Actualizar la actividad en la lista local
        const index = availableActivities.value.findIndex(
          a => a.id === currentActivityId.value
        );
        
        if (index !== -1) {
          availableActivities.value[index] = {
            ...availableActivities.value[index],
            ...payload,
            tags: selectedTags.value
          };
        }
        
        showNotification("Actividad actualizada correctamente");
      } else {
        const newActivityData = await createActivity(payload);
        
        // Agregar la nueva actividad a la lista local con sus tags
        availableActivities.value.push({
          ...newActivityData,
          tags: selectedTags.value
        });
        
        showNotification("Actividad creada correctamente");
      }
      
      return true;
    } catch (err) {
      showNotification("Error al guardar la actividad", 3000);
      return false;
    }
  }

  async function deleteActivityById(id) {
    try {
      await deleteActivity(id);
      
      // Eliminar la actividad de la lista local
      const index = availableActivities.value.findIndex(a => a.id === id);
      if (index !== -1) {
        availableActivities.value.splice(index, 1);
      }
      
      showNotification("Actividad eliminada correctamente");
      return true;
    } catch (err) {
      showNotification("Error al eliminar la actividad", 3000);
      return false;
    }
  }

  function formatDateTime(date, time) {
    if (!date) return "";
    return dayjs(`${date}T${time}`).format("YYYY-MM-DDTHH:mm:00");
  }

  return {
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
    deleteActivityById,
    formatDateTime
  };
}