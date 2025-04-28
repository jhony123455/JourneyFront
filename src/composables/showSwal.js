import Swal from "sweetalert2";

export default {
  methods: {
    // Notificación tipo "toast" moderna
    showSwal(options) {
      Swal.fire({
        position: "top-end",          // Más moderno que "top-right"
        icon: options.type || "info", // success/error/warning/info/question
        title: options.title || "",   // Título opcional
        text: options.message,        // Mensaje principal
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        backdrop: false,              // Sin fondo oscuro
        toast: true,                  // Estilo toast compacto
        background: "#fff",           // Fondo blanco (mejor legibilidad)
        color: "#333",                // Texto oscuro
        customClass: {
          popup: "modern-swal-popup", // Clase CSS personalizable
        },
      });
    },

    // Confirmación de eliminación moderna
    showSwalConfirmationDelete() {
      return Swal.fire({
        title: "¿Estás seguro?",
        text: "¡Esta acción no se puede deshacer!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#3085d6", // Azul moderno
        cancelButtonColor: "#d33",     // Rojo moderno
        reverseButtons: true,
        customClass: {
          confirmButton: "modern-confirm-btn", // Clases CSS personalizadas
          cancelButton: "modern-cancel-btn",
        },
      });
    },
  },
};