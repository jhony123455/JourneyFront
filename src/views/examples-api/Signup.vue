<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { Form } from "vee-validate";
import * as Yup from "yup";
import { gsap } from "gsap";
import MaterialInputField from "@/components/MaterialInputField.vue";
import MaterialButton from "@/components/MaterialButton.vue";
import showSwal from "@/composables/showSwal";
import Swal from "sweetalert2";
import AuthService from '@/services/auth.service'; 

// Referencias para animaciones
const headerRef = ref(null);
const illustrationRef = ref(null);
const submitButtonRef = ref(null);

const router = useRouter();
const store = useStore();

// Datos reactivos
const user = reactive({
  name: "",
  password: "",
  confirmPassword: "",
});

// Esquema de validación
const schema = Yup.object().shape({
  name: Yup.string().required("El usuario es requerido"),
  password: Yup.string()
    .required("La contraseña es requerida")
    .min(8, "Mínimo 6 caracteres"),
  confirmPassword: Yup.string()
    .required("Debes confirmar la contraseña")
    .oneOf([Yup.ref("password")], "Las contraseñas no coinciden."),
});

// Efectos visuales para la ilustración
const illustrationEffects = [
  () => {
    return gsap.to(illustrationRef.value, {
      backgroundSize: "110%",
      duration: 15,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  },
  // Efecto de desplazamiento panorámico
  () => {
    return gsap.to(illustrationRef.value, {
      backgroundPosition: "100% 0%",
      duration: 20,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  },
  // Efecto de pulso con brillo
  () => {
    const overlay = document.createElement("div");
    overlay.classList.add("illustration-glow");
    illustrationRef.value.appendChild(overlay);

    return gsap.to(overlay, {
      opacity: 0.3,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  },
];

onMounted(async () => {
  store.commit("toggleEveryDisplay");
  store.commit("toggleHideConfig");
  document.body.classList.remove("bg-gray-100");

  await nextTick();
  gsap.from(headerRef.value, {
    y: -30,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
  });
  gsap.from(illustrationRef.value, {
    x: -100,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out",
  });
  const randomEffectIndex = Math.floor(
    Math.random() * illustrationEffects.length
  );
  illustrationEffects[randomEffectIndex]();

  gsap.from(".input-wrapper", {
    y: 30,
    opacity: 0,
    stagger: 0.1,
    duration: 0.8,
    ease: "power2.out",
    delay: 0.3,
  });
  gsap.from(submitButtonRef.value, {
    scale: 0.8,
    opacity: 0,
    duration: 0.8,
    ease: "back.out(1.7)",
    delay: 0.8,
  });
});

onBeforeUnmount(() => {
  store.commit("toggleEveryDisplay");
  store.commit("toggleHideConfig");
  document.body.classList.add("bg-gray-100");
});

const handleInputFocus = (event) => {
  const wrapper = event.target.closest(".input-wrapper");

  gsap.to(wrapper, {
    scale: 1.02,
    duration: 0.3,
    ease: "power2.out",
  });

  gsap.to(event.target, {
    boxShadow: "0 0 8px rgba(66, 153, 225, 0.5)",
    duration: 0.3,
  });
};

const handleInputBlur = (event) => {
  const wrapper = event.target.closest(".input-wrapper");

  gsap.to(wrapper, {
    scale: 1,
    duration: 0.3,
    ease: "power2.out",
  });

  gsap.to(event.target, {
    boxShadow: "none",
    duration: 0.3,
  });
};

const handleButtonHover = () => {
  gsap.to(submitButtonRef.value, {
    scale: 1.05,
    duration: 0.3,
    ease: "power1.out",
  });
};

const handleButtonLeave = () => {
     console.log("handleSignup function called");
  gsap.to(submitButtonRef.value, {
    scale: 1,
    duration: 0.3,
    ease: "power1.out",
  });
};

const handleSignup = async (values) => {
  // Animación de carga
  const submitButton = submitButtonRef.value.$el;
  gsap.to(submitButton, {
    scale: 0.95,
    duration: 0.2,
    ease: "power2.inOut"
  });

  try {
    // Validación de vee-validate ya se hace antes de ejecutar esta función
    // Puedes revisar si los datos son válidos
    if (!values || !values.name || !values.password || !values.confirmPassword) {
      // Manejar el caso en que los campos estén vacíos o inválidos
      return;
    }

    // Verificar si las contraseñas coinciden
    if (values.password !== values.confirmPassword) {
      await Swal.fire({
        icon: 'error',
        title: 'Las contraseñas no coinciden',
        text: 'Por favor verifica que las contraseñas sean iguales',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    // Realizar el registro llamando a AuthService
    const response = await AuthService.register({
      name: values.name,
      password: values.password,
      password_confirmation: values.confirmPassword,
    });

    // Si el registro es exitoso, redirigir
    await Swal.fire({
      icon: 'success',
      title: '¡Registro exitoso!',
      text: 'Tu cuenta ha sido creada correctamente',
      confirmButtonColor: '#3085d6',
    });
    router.push({ name: 'Calendario' }); 

  } catch (error) {
    // Manejo de errores
    Swal.fire({
      icon: 'error',
      title: 'Error de registro',
      text: error.message || 'Ocurrió un error al registrar tu cuenta',
      confirmButtonColor: '#3085d6',
    });
  } finally {
    // Restaurar animación del botón
    gsap.to(submitButton, {
      scale: 1,
      duration: 0.3,
      ease: "elastic.out(1, 0.5)"
    });
  }
};

</script>
<template>
  <div class="bg-white">
    <div class="container top-0 position-sticky z-index-sticky">
      <div class="row"></div>
    </div>
    <main class="mt-0 main-content">
      <section>
        <div class="page-header min-vh-100">
          <div class="container">
            <div class="row">
              <div
                class="col-6 d-lg-flex d-none h-100 my-auto pe-0 ps-0 position-absolute top-0 start-0 text-center justify-content-center flex-column"
              >
                <div
                  ref="illustrationRef"
                  class="position-relative h-100 m-3 px-7 border-radius-lg d-flex flex-column justify-content-center illustration-container"
                  :style="{
                    backgroundImage:
                      'url(' +
                      require('@/assets/img/illustrations/illustration-signin.jpg') +
                      ')',
                  }"
                >
                  <div class="illustration-overlay"></div>
                </div>
              </div>
              <div
                class="col-xl-4 col-lg-5 col-md-7 d-flex flex-column ms-auto me-auto ms-lg-auto me-lg-5"
              >
                <div class="card card-plain">
                  <div
                    ref="headerRef"
                    class="pb-0 card-header bg-transparent mb-4"
                  >
                    <h4 class="font-weight-bolder">Registrate</h4>
                    <p class="mb-0">
                      Ingresa tu usuario y contraseña para iniciar tu
                      experiencia
                    </p>
                  </div>
                  <div class="card-body">
                    <Form
                      role="form"
                      :validation-schema="schema"
                      @submit="handleSignup"
                    >
                      <div class="mb-3 input-wrapper">
                        <material-input-field
                          id="name"
                          v-model="user.name"
                          label="Usuario"
                          name="name"
                          variant="static"
                          @focus="handleInputFocus"
                          @blur="handleInputBlur"
                        />
                      </div>
                      <div class="mb-3 input-wrapper">
                        <material-input-field
                          id="password"
                          v-model="user.password"
                          type="password"
                          label="Contraseña"
                          name="password"
                          variant="static"
                          @focus="handleInputFocus"
                          @blur="handleInputBlur"
                        />
                      </div>
                      <div class="mb-3 input-wrapper">
                        <material-input-field
                          id="confirmPassword"
                          v-model="user.confirmPassword"
                          type="password"
                          label="Confirma Tu Contraseña"
                          name="confirmPassword"
                          variant="static"
                          @focus="handleInputFocus"
                          @blur="handleInputBlur"
                        />
                      </div>
                      <div class="text-center">
                        <material-button
                          ref="submitButtonRef"
                          color="dark"
                          variant="gradient"
                          full-width
                          class="mt-4"
                          style="margin-bottom: 22px"
                          type="submit"
                          @mouseenter="handleButtonHover"
                          @mouseleave="handleButtonLeave"
                        >
                          Confirmar
                        </material-button>
                      </div>
                    </Form>
                  </div>
                  <div class="px-1 pt-0 text-center card-footer px-lg-2">
                    <p class="mx-auto mb-4 text-sm">
                      Ya tienes una cuenta?
                      <router-link
                        :to="{ name: 'Login' }"
                        class="text-dark text-gradient font-weight-bold"
                        >Inicia Sesion
                      </router-link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
<style scoped>
.illustration-container {
  overflow: hidden;
  background-size: cover;
  background-position: center;
  transition: transform 0.5s ease;
  position: relative;
}

.illustration-container:hover {
  transform: scale(1.02);
}

.illustration-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0) 100%
  );
  pointer-events: none;
}

.illustration-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0) 70%
  );
  pointer-events: none;
  opacity: 0;
}

.input-wrapper {
  transition: transform 0.3s ease;
}

.card-plain {
  transition: all 0.5s ease;
  backface-visibility: hidden;
}

.card-plain:hover {
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

/* Efecto para el link de Sign In */
.text-gradient {
  transition: all 0.3s ease;
}

.text-gradient:hover {
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}
</style>
