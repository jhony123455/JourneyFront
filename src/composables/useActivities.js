import { ref, computed } from "vue";
import useApi from "./useApi";
import useAnimation from "./useAnimation";
import useTags from "./useTags";
import dayjs from "dayjs";
import useTagStore from "./useTagStore";

export default function useActivities() {
  const { selectedTags } = useTagStore();
  const {
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  } = useApi();
  const { showNotification } = useAnimation();
  const availableActivities = ref([]);
  const scheduledActivities = ref([]);
  const newActivity = ref({
    id: null,
    title: "",
    description: "",
    color: "#5e72e4",
    tags: [],
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

  const loading = ref(false);
  const error = ref(null);

  async function loadActivities() {
    try {
      availableActivities.value = await fetchActivities();
    } catch (err) {
      console.error("Error al cargar actividades:", err);
    }
  }

  const saveActivity = async (activityData) => {
    loading.value = true;
    error.value = null;
    
    try {
      const savedActivity = await createActivity({
        title: activityData.title.trim(),
        description: activityData.description?.trim() || '',
        color: activityData.color || '#5e72e4',
        tags: activityData.tags || []
      });

      // En lugar de recargar todas las actividades, solo agregamos la nueva
      if (savedActivity) {
        availableActivities.value = [...availableActivities.value, savedActivity];
      }

      return savedActivity;
    } catch (err) {
      console.error('useActivities - Error:', err.message);
      error.value = err.message || 'Error al guardar la actividad';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateExistingActivity = async (id, activityData) => {
    loading.value = true;
    error.value = null;
    
    try {
      const updatedActivity = await updateActivity(id, {
        title: activityData.title.trim(),
        description: activityData.description?.trim() || '',
        color: activityData.color || '#5e72e4',
        tags: activityData.tags || []
      });

      // Actualizar la actividad en la lista
      if (updatedActivity) {
        const index = availableActivities.value.findIndex(a => a.id === id);
        if (index !== -1) {
          availableActivities.value[index] = updatedActivity;
          availableActivities.value = [...availableActivities.value];
        }
      }

      return updatedActivity;
    } catch (err) {
      error.value = err.message || 'Error al actualizar la actividad';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  async function deleteActivityById(id) {
    try {
      await deleteActivity(id);

      // Eliminar la actividad de la lista local
      const index = availableActivities.value.findIndex((a) => a.id === id);
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
    updateExistingActivity,
    deleteActivityById,
    formatDateTime,
    loading,
    error,
  };
}
