<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { Form } from 'vee-validate';
import * as Yup from 'yup';
import { gsap } from 'gsap';
import MaterialInputField from "@/components/MaterialInputField.vue";
import MaterialButton from "@/components/MaterialButton.vue";
import showSwal from "@/mixins/showSwal";

// Referencias para animaciones
const headerRef = ref(null);
const illustrationRef = ref(null);
const submitButtonRef = ref(null);

// Router y store
const router = useRouter();
const store = useStore();

// Datos reactivos
const user = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
});

// Esquema de validación
const schema = Yup.object().shape({
    name: Yup.string().required("Name is a required input"),
    email: Yup.string().email("Email has to be a valid email address").required("Email is a required input"),
    password: Yup.string().required("Password is a required input").min(8, "Password must have at least 8 characters"),
    confirmPassword: Yup.string().required("Confirm password is a required input").oneOf([Yup.ref('password')], 'Your passwords do not match.')
});

// Efectos visuales para la ilustración
const illustrationEffects = [
    // Efecto de zoom suave
    () => {
        return gsap.to(illustrationRef.value, {
            backgroundSize: "110%",
            duration: 15,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
        });
    },
    // Efecto de desplazamiento panorámico
    () => {
        return gsap.to(illustrationRef.value, {
            backgroundPosition: "100% 0%",
            duration: 20,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
        });
    },
    // Efecto de pulso con brillo
    () => {
        // Primero creamos un overlay con brillo
        const overlay = document.createElement('div');
        overlay.classList.add('illustration-glow');
        illustrationRef.value.appendChild(overlay);
        
        return gsap.to(overlay, {
            opacity: 0.3,
            duration: 2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
        });
    }
];

// Ciclo de vida del componente
onMounted(async () => {
    store.commit('toggleEveryDisplay');
    store.commit('toggleHideConfig');
    document.body.classList.remove("bg-gray-100");
    
    await nextTick();
    
    // Animación inicial de entrada para el header
    gsap.from(headerRef.value, {
        y: -30,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    });
    
    // Animación inicial para la ilustración
    gsap.from(illustrationRef.value, {
        x: -100,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out"
    });
    
    // Seleccionar un efecto aleatorio para la ilustración
    const randomEffectIndex = Math.floor(Math.random() * illustrationEffects.length);
    illustrationEffects[randomEffectIndex]();
    
    // Animación para los inputs del formulario
    gsap.from(".input-wrapper", {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.3
    });
    
    // Animación para el botón
    gsap.from(submitButtonRef.value, {
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        ease: "back.out(1.7)",
        delay: 0.8
    });
});

onBeforeUnmount(() => {
    store.commit('toggleEveryDisplay');
    store.commit('toggleHideConfig');
    document.body.classList.add("bg-gray-100");
});

// Manejadores de eventos para animaciones interactivas
const handleInputFocus = (event) => {
    const wrapper = event.target.closest('.input-wrapper');
    
    gsap.to(wrapper, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
    });
    
    // Efecto de brillo alrededor del input
    gsap.to(event.target, {
        boxShadow: "0 0 8px rgba(66, 153, 225, 0.5)",
        duration: 0.3
    });
};

const handleInputBlur = (event) => {
    const wrapper = event.target.closest('.input-wrapper');
    
    gsap.to(wrapper, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
    });
    
    // Quitar el efecto de brillo
    gsap.to(event.target, {
        boxShadow: "none",
        duration: 0.3
    });
};

const handleButtonHover = () => {
    gsap.to(submitButtonRef.value, {
        scale: 1.05,
        duration: 0.3,
        ease: "power1.out"
    });
};

const handleButtonLeave = () => {
    gsap.to(submitButtonRef.value, {
        scale: 1,
        duration: 0.3,
        ease: "power1.out"
    });
};

// Manejo del formulario
const handleSignup = async () => {
    try {
        await store.dispatch('auth/register', user);
        showSwal({
            type: "success",
            message: "Successfully registered!",
            width: 500
        });
        router.push({ name: 'Profile' });
    } catch (error) {
        showSwal({
            type: "error",
            message: "Oops, something went wrong!",
            width: 500
        });
    }
};
</script>
<template>
    <div class="bg-white">
        <div class="container top-0 position-sticky z-index-sticky">
            <div class="row">
               
            </div>
        </div>
        <main class="mt-0 main-content">
            <section>
                <div class="page-header min-vh-100">
                    <div class="container">
                        <div class="row">
                            <div
                                class="col-6 d-lg-flex d-none h-100 my-auto pe-0 ps-0 position-absolute top-0 start-0 text-center justify-content-center flex-column">
                                <div 
                                    ref="illustrationRef"
                                    class="position-relative h-100 m-3 px-7 border-radius-lg d-flex flex-column justify-content-center illustration-container"
                                    :style="{
                                        backgroundImage:
                                            'url(' +
                                            require('@/assets/img/illustrations/illustration-signin.jpg') +
                                            ')',
                                    }">
                                    <div class="illustration-overlay"></div>
                                </div>
                            </div>
                            <div
                                class="col-xl-4 col-lg-5 col-md-7 d-flex flex-column ms-auto me-auto ms-lg-auto me-lg-5">
                                <div class="card card-plain">
                                    <div ref="headerRef" class="pb-0 card-header bg-transparent mb-4">
                                        <h4 class="font-weight-bolder">Registrate</h4>
                                        <p class="mb-0">
                                           Ingresa tu usuario y contraseña para iniciar tu experiencia
                                        </p>
                                    </div>
                                    <div class="card-body">
                                        <Form role="form" :validation-schema="schema" @submit="handleSignup">
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
                                                    style="margin-bottom:22px;"
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
                                            <router-link :to="{ name: 'Login' }"
                                                class="text-dark text-gradient font-weight-bold">Inicia Sesion
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
    background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%);
    pointer-events: none;
}

.illustration-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
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
    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
}

/* Efecto para el link de Sign In */
.text-gradient {
    transition: all 0.3s ease;
}

.text-gradient:hover {
    text-shadow: 0 0 5px rgba(0,0,0,0.2);
    transform: translateY(-1px);
}
</style>