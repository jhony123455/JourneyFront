import { ref } from "vue";
import axios from "axios";
import useAuth from "./useAuth";

export default function useApi() {
  const { getAuthHeaders } = useAuth();
  const loading = ref(false);
  const error = ref(null);

  async function fetchData(endpoint, options = {}) {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios({
        url: endpoint,
        headers: getAuthHeaders(),
        ...options,
      });
      return response.data;
    } catch (err) {
      console.error(`Error al realizar petición a ${endpoint}:`, err);
      error.value = err.response?.data?.message || err.message;
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // API para Tags
  async function fetchTags() {
    return fetchData("/tags");
  }

  async function createTag(tagData) {
    return fetchData("/tags", {
      method: "POST",
      data: tagData,
    });
  }

  async function updateTag(id, tagData) {
    return fetchData(`/tags/${id}`, {
      method: "PUT",
      data: tagData,
    });
  }

  async function deleteTag(id) {
    return fetchData(`/tags/${id}`, {
      method: "DELETE",
    });
  }

  // API para Actividades
  async function fetchActivities() {
    return fetchData("/activities");
  }

  async function createActivity(activityData) {
    return fetchData("/activities", {
      method: "POST",
      data: activityData,
    });
  }

  async function updateActivity(id, activityData) {
    return fetchData(`/activities/${id}`, {
      method: "PUT",
      data: activityData,
    });
  }

  async function deleteActivity(id) {
    return fetchData(`/activities/${id}`, {
      method: "DELETE",
    });
  }

  const getCalendarEvents = () => fetchData("/calendar-events");

  const createCalendarEvent = (eventData) =>
    fetchData("/calendar-events", {
      method: "POST",
      data: eventData,
    });

  const updateCalendarEvent = (id, eventData) =>
    fetchData(`/calendar-events/${id}`, {
      method: "PUT",
      data: eventData,
    });

  const deleteCalendarEvent = (id) =>
    fetchData(`/calendar-events/${id}`, {
      method: "DELETE",
    });

  const getEventsByActivity = (activityId) => fetchData(`/calendar-events/activity/${activityId}`);

  return {
    loading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    getCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getEventsByActivity,
  };
}
