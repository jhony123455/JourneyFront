import { ref } from "vue";
import axios from "axios";
import useAuth from "./useAuth";

export default function useApi() {
  const { getAuthHeaders } = useAuth();
  const loading = ref(false);
  const error = ref(null);

  const api = axios.create({
    baseURL: process.env.VUE_APP_API_URL || 'http://127.0.0.1:8000/api',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Interceptor para agregar los headers de autenticación a todas las peticiones
  api.interceptors.request.use(
    (config) => {
      const headers = getAuthHeaders();
      config.headers = {
        ...config.headers,
        ...headers
      };
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor para manejar errores de autenticación
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Aquí puedes disparar alguna acción de logout si es necesario
      }
      return Promise.reject(error);
    }
  );

  async function fetchData(endpoint, options = {}) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (err) {
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
    try {
      // Asegurarse de que los datos estén en el formato correcto
      const formattedData = {
        title: activityData.title.trim(),
        description: activityData.description?.trim() || '',
        color: activityData.color,
        tags: Array.isArray(activityData.tags) ? activityData.tags : []
      };

      const response = await api.post('/activities', formattedData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        throw new Error(Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n'));
      }
      
      throw error;
    }
  }

  async function updateActivity(id, activityData) {
    // Validar que los datos cumplan con las reglas del backend
    if (!activityData.title?.trim()) {
      throw new Error('El título es requerido');
    }
    if (!activityData.color) {
      throw new Error('El color es requerido');
    }

    // Formatear los datos según las reglas del backend
    const formattedData = {
      title: activityData.title.trim(),
      description: activityData.description?.trim() || '',
      color: activityData.color,
      tags: Array.isArray(activityData.tags) ? activityData.tags : []
    };

    const response = await api.put(`/activities/${id}`, formattedData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.data) {
      throw new Error('No se recibió respuesta del servidor');
    }

    return response.data;
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

  async function deleteCalendarEvent(calendarEventId) {
    try {
      const response = await api.delete(`/calendar-events/${calendarEventId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar el evento del calendario:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar el evento del calendario');
    }
  }

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
