<!-- Componente Vue arreglado -->
<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { gsap } from "gsap";
import * as Yup from "yup";
import { Form } from "vee-validate";
import MaterialInputField from "@/components/MaterialInputField.vue";
import MaterialSwitch from "@/components/MaterialSwitch.vue";
import MaterialButton from "@/components/MaterialButton.vue";
import showSwal from "@/composables/showSwal";
import Swal from "sweetalert2";

const router = useRouter();
const store = useStore();
const isLoading = ref(false);
const isRememberMeEnabled = ref(false);
const showPassword = ref(false);

const user = ref({
  name: "",
  password: "",
});

const currentYear = computed(() => new Date().getFullYear());
const loggedIn = computed(() => store.state.auth.loggedIn);

const schema = Yup.object().shape({
  name: Yup.string().required("El nombre de usuario es requerido"),
  password: Yup.string().required("La contraseña es requerida"),
});

onMounted(async () => {
  store.commit("toggleEveryDisplay");
  store.commit("toggleHideConfig");

  await nextTick();

  // Fondo artístico con zoom suave
  gsap.from(".page-header", {
    scale: 1.05,
    opacity: 0,
    duration: 1.5,
    ease: "power2.out",
  });

  // Título con aparición simple
  gsap.fromTo(
    ".header h3",
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" }
  );

  // Formulario flotante con rebote
  gsap.from(".login-card", {
    y: 100,
    opacity: 0,
    duration: 1.4,
    ease: "back.out(1.7)",
  });

  // Elementos internos (inputs/botones) con entrada escalonada
  gsap.from(".login-card .form-element", {
    opacity: 0,
    y: 30,
    stagger: 0.15,
    delay: 0.6,
    duration: 1,
    ease: "power2.out",
  });
});

onUnmounted(() => {
  store.commit("toggleEveryDisplay");
  store.commit("toggleHideConfig");
});

const handleLogin = async (values, { resetForm }) => {
  isLoading.value = true;
  try {
    const response = await store.dispatch("auth/login", {
      name: values.name,
      password: values.password,
      remember_me: isRememberMeEnabled.value,
    });

    // La respuesta del backend incluye { message, token, user }
    await Swal.fire({
      icon: "success",
      title: "Login exitoso",
      text: response.data.message || "Bienvenido a Journey",
      width: 400,
      confirmButtonColor: "#3085d6",
    });

    router.push({ name: "Calendario" });
  } catch (error) {
    console.error("Error en login:", error);

    await Swal.fire({
      icon: "error",
      title: "Error en login",
      text: error.message || "Error al conectar con el servidor",
      width: 500,
      confirmButtonColor: "#d33",
    });
  } finally {
    isLoading.value = false;
  }
};

const rawTitle = "Bienvenido A Journey";
const animatedTitle = ref("");
const animatedTitleEl = ref(null);
const hoverColors = [
  "#e63946",
  "#f1fa8c",
  "#06d6a0",
  "#118ab2",
  "#ff6b6b",
  "#8338ec",
  "#ffbe0b",
];

// Array de animaciones predefinidas
const animations = [
  // Salto
  (char) => {
    return gsap.to(char, {
      y: -15,
      duration: 0.4,
      ease: "bounce.out",
      yoyo: true,
      repeat: 1,
      onComplete: () => gsap.set(char, { y: 0 }),
    });
  },
  // Rotación
  (char) => {
    return gsap.to(char, {
      rotation: gsap.utils.random(-30, 30),
      duration: 0.4,
      yoyo: true,
      repeat: 1,
      onComplete: () => gsap.set(char, { rotation: 0 }),
    });
  },
  // Escala
  (char) => {
    return gsap.to(char, {
      scale: 1.5,
      duration: 0.4,
      yoyo: true,
      repeat: 1,
      onComplete: () => gsap.set(char, { scale: 1 }),
    });
  },
  // Vibración
  (char) => {
    return gsap.to(char, {
      x: "+=5",
      duration: 0.1,
      repeat: 5,
      yoyo: true,
      onComplete: () => gsap.set(char, { x: 0 }),
    });
  },
  // Flip
  (char) => {
    return gsap.to(char, {
      rotationY: 180,
      duration: 0.4,
      yoyo: true,
      repeat: 1,
      onComplete: () => gsap.set(char, { rotationY: 0 }),
    });
  },
  // Desaparecer y aparecer
  (char) => {
    return gsap.to(char, {
      opacity: 0,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      onComplete: () => gsap.set(char, { opacity: 1 }),
    });
  },
  // Onda
  (char) => {
    return gsap.to(char, {
      y: -10,
      x: 5,
      rotation: 15,
      duration: 0.3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: 1,
      onComplete: () => gsap.set(char, { y: 0, x: 0, rotation: 0 }),
    });
  },
  // Latido
  (char) => {
    return gsap.to(char, {
      scale: 1.3,
      duration: 0.15,
      ease: "power1.in",
      yoyo: true,
      repeat: 3,
      onComplete: () => gsap.set(char, { scale: 1 }),
    });
  },
  // Giro 3D
  (char) => {
    return gsap.to(char, {
      rotationX: 360,
      duration: 0.6,
      ease: "power1.inOut",
      onComplete: () => gsap.set(char, { rotationX: 0 }),
    });
  },
  // Temblor
  (char) => {
    return gsap.to(char, {
      x: "random(-3,3)",
      y: "random(-3,3)",
      duration: 0.1,
      repeat: 10,
      yoyo: true,
      ease: "none",
      onComplete: () => gsap.set(char, { x: 0, y: 0 }),
    });
  },
];

onMounted(() => {
  nextTick(() => {
    // Crear span para cada letra
    const title = rawTitle;
    let htmlTitle = "";
    for (let i = 0; i < title.length; i++) {
      htmlTitle += `<span class="char">${title[i]}</span>`;
    }
    if (animatedTitleEl.value) {
      animatedTitleEl.value.innerHTML = htmlTitle;
      const chars = animatedTitleEl.value.querySelectorAll(".char");

      // Animación inicial
      gsap.from(chars, {
        opacity: 0,
        y: 20,
        rotateX: 90,
        transformOrigin: "top center",
        ease: "back.out(1.7)",
        duration: 0.6,
        stagger: {
          each: 0.03,
          from: "start",
        },
      });
      chars.forEach((char) => {
        char.addEventListener("mouseenter", () => {
          const randomColor =
            hoverColors[Math.floor(Math.random() * hoverColors.length)];

          gsap.to(chars, {
            color: randomColor,
            duration: 0.3,
            ease: "power2.out",
          });

          // Seleccionar una animación aleatoria del arreglo para esta letra
          const randomAnimIndex = Math.floor(Math.random() * animations.length);
          animations[randomAnimIndex](char);
        });
      });

      // Restaurar color original al salir del título completo
      animatedTitleEl.value.addEventListener("mouseleave", () => {
        gsap.to(chars, {
          color: "black",
          duration: 0.4,
          ease: "power3.out",
        });
      });
    }
  });
});

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};
</script>
<template>
  <navbar btn-background="bg-gradient-dark" />

  <div class="login-page d-flex align-items-center min-vh-100">
    <div class="container">
      <div class="row justify-content-end align-items-center">
        <!-- Columna izquierda (texto + formulario) -->
        <div class="col-lg-6 col-md-8 col-12">
          <div class="mb-5">
            <h3
              ref="animatedTitleEl"
              class="login-title"
              v-html="animatedTitle"
            ></h3>
            <p class="text-muted">
              Inicia sesión para acceder a tu calendario personalizado.
            </p>
          </div>

          <div class="card login-card shadow">
            <div class="card-body">
              <Form
                role="form"
                class="text-start mt-3"
                :validation-schema="schema"
                @submit="handleLogin"
              >
                <div class="mb-3 form-element">
                  <material-input-field
                    id="user"
                    v-model="user.name"
                    label="Usuario"
                    name="name"
                    variant="static"
                    placeholder="Ingrese su usuario"
                  />
                </div>
                <div class="mb-3 form-element password-field">
                  <material-input-field
                    id="password"
                    v-model="user.password"
                    :type="showPassword ? 'text' : 'password'"
                    label="Contraseña"
                    name="password"
                    variant="static"
                    placeholder="Ingrese su Contraseña"
                  />
                  <button 
                    type="button"
                    class="password-toggle"
                    @click="togglePasswordVisibility"
                    :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  >
                    <i class="material-icons-round">
                      {{ showPassword ? 'visibility_off' : 'visibility' }}
                    </i>
                  </button>
                </div>
                <div class="form-element">
                  <material-switch
                    id="rememberMe"
                    :checked="isRememberMeEnabled"
                    name="Remember Me"
                    @change="isRememberMeEnabled = $event.target.checked"
                  >
                    Recuerdame
                  </material-switch>
                </div>
                <div class="text-center form-element">
                  <material-button
                    class="my-4 mb-2"
                    variant="gradient"
                    color="dark"
                    full-width
                  >
                    <span v-if="!isLoading">Ingresa</span>
                    <span v-else>
                      <span
                        class="spinner-border spinner-border-sm"
                        role="status"
                      ></span>
                      Procesando...
                    </span>
                  </material-button>
                </div>
                <p class="mt-4 text-sm text-center form-element">
                  No tienes cuenta?
                  <router-link
                    :to="{ name: 'Signup' }"
                    class="text-dark text-gradient font-weight-bold"
                  >
                    Create una cuenta
                  </router-link>
                </p>
              </Form>
            </div>
          </div>
        </div>
        <!-- Columna izquierda con logo -->
        <div
          class="col-lg-4 d-none d-lg-flex justify-content-center align-items-center order-lg-first"
        >
          <img
            src="@/assets/img/small-logos/journey_logo.png"
            alt="Logo App"
            class="img-fluid logo-img"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.char {
  display: inline-block;
  cursor: pointer;
  color: black;
  position: relative;
  transform-style: preserve-3d;
  backface-visibility: visible;
  perspective: 1000px;
  transform-origin: center center;
  transition: color 0.3s ease;
  will-change: transform, opacity; /* Optimización de rendimiento */
}

h3 {
  transform-style: preserve-3d;
  perspective: 1000px;
  display: inline-block;
  user-select: none; /* Evita selección de texto durante animaciones */
}

.login-page {
  background-color: #f8f4ef; /* Beige claro */
  padding: 2rem 0;
}

.login-title {
  font-size: 2rem;
  font-weight: bold;
  color: #2d2d2d;
}

.login-card {
  border-radius: 1rem;
  background-color: #fff;
  padding: 2rem;
}

.logo-img {
  max-width: 300px;
  height: auto;
}

.password-field {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.3s ease;
  border-radius: 50%;
}

.password-toggle:hover {
  background-color: rgba(108, 117, 125, 0.1);
  color: #2d2d2d;
}

.password-toggle:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(108, 117, 125, 0.25);
}

.password-toggle i {
  font-size: 20px;
  transition: transform 0.3s ease;
}

.password-toggle:hover i {
  transform: scale(1.1);
}
</style>
