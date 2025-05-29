<template>
  <div class="container-fluid">
    <el-card class="profile-header mb-4">
      <div
        class="page-header min-height-300 border-radius-xl"
        :style="{
          backgroundImage: `url(${profile.cover_image || defaultCover})`,
        }"
      >
        <span class="mask bg-gradient-success opacity-6"></span>
      </div>

      <div class="card-body position-relative mt-n6 mx-4">
        <div class="row">
          <!-- Avatar y información básica -->
          <div class="col-auto">
            <el-upload
              class="avatar-uploader"
              action="/profile"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleAvatarChange"
              accept="image/*"
            >
              <el-avatar
                :size="100"
                :src="avatarSrc"
                class="border-radius-lg shadow-sm"
              />
              <el-icon class="avatar-edit-icon"><Plus /></el-icon>
            </el-upload>
          </div>

          <div class="col">
            <div v-if="!isEditing">
              <h4 class="mb-1">{{ profile.name }}</h4>
              <p class="text-sm text-secondary mb-0">
                {{ profile.position || "No position set" }}
              </p>
              <p class="text-sm text-secondary mb-0">
                Profile Completion: {{ profile.profile_completion }}%
              </p>
            </div>
            <div v-else>
              <el-form :model="editForm" label-position="top">
                <el-form-item label="Name">
                  <el-input v-model="editForm.name" placeholder="Your name" />
                </el-form-item>
                <el-form-item label="Position">
                  <el-input
                    v-model="editForm.position"
                    placeholder="Your position"
                  />
                </el-form-item>
              </el-form>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="col-auto">
            <el-button v-if="!isEditing" type="primary" @click="startEditing">
              <el-icon><Edit /></el-icon>
              Edit Profile
            </el-button>
            <template v-else>
              <el-button type="success" @click="saveChanges">
                <el-icon><Check /></el-icon>
                Save
              </el-button>
              <el-button @click="cancelEditing">
                <el-icon><Close /></el-icon>
                Cancel
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </el-card>

    <div class="row">
      <!-- Información del perfil -->
      <div class="col-md-8">
        <el-card>
          <template #header>
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Profile Information</h5>
            </div>
          </template>

          <div v-if="!isEditing">
            <p class="text-sm">{{ profile.bio }}</p>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Full Name">{{
                profile.name
              }}</el-descriptions-item>
              <el-descriptions-item label="Mobile">{{
                profile.phone
              }}</el-descriptions-item>
              <el-descriptions-item label="Email">{{
                user.email
              }}</el-descriptions-item>
              <el-descriptions-item label="Location">{{
                profile.location
              }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <el-form v-else :model="editForm" label-position="top">
            <el-form-item label="Bio">
              <el-input
                v-model="editForm.bio"
                type="textarea"
                :rows="4"
                placeholder="Write something about yourself..."
              />
            </el-form-item>
            <el-form-item label="Phone">
              <el-input
                v-model="editForm.phone"
                placeholder="Your phone number"
              />
            </el-form-item>
            <el-form-item label="Location">
              <el-input
                v-model="editForm.location"
                placeholder="Your location"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- Estadísticas -->
        <el-card class="mt-4">
          <template #header>
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Statistics</h5>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="8" v-for="(stat, index) in stats" :key="index">
              <el-card shadow="hover" class="stat-card mb-3">
                <template #header>
                  <div class="d-flex align-items-center">
                    <el-icon
                      class="me-2"
                      :class="{ [`text-${stat.color}`]: stat.color }"
                    >
                      <component :is="stat.icon" />
                    </el-icon>
                    <span>{{ stat.label }}</span>
                  </div>
                </template>
                <div class="text-center">
                  <h3
                    class="mb-0"
                    :class="{ [`text-${stat.color}`]: stat.color }"
                  >
                    {{ stat.value }}{{ stat.suffix || "" }}
                  </h3>
                  <small v-if="stat.secondaryValue" class="text-secondary">
                    {{ stat.secondaryValue }}
                  </small>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- Social Links -->
      <div class="col-md-4">
        <el-card>
          <template #header>
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Social Links</h5>
            </div>
          </template>

          <div v-if="!isEditing">
            <el-space direction="vertical" fill class="w-100">
              <el-button
                v-for="(link, platform) in profile.social_links"
                :key="platform"
                :type="platform"
                :icon="getSocialIcon(platform)"
                link
                @click="openSocialLink(link)"
              >
                {{ platform }}
              </el-button>
            </el-space>
          </div>
          <el-form v-else :model="editForm.social_links" label-position="top">
            <el-form-item
              v-for="(link, platform) in editForm.social_links"
              :key="platform"
              :label="platform"
            >
              <el-input
                v-model="editForm.social_links[platform]"
                :prefix-icon="getSocialIcon(platform)"
                :placeholder="`Your ${platform} profile`"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { ElMessage } from "element-plus";
import {
  Edit,
  Check,
  Close,
  Plus,
  User,
  Calendar,
  Document,
  Collection,
} from "@element-plus/icons-vue";
import axios from "axios";
import dayjs from "dayjs";

// Estado
const user = ref({});
const profile = ref({});
const originalAvatarSrc = ref(user.value?.avatar || ''); // Backup de la imagen original
const stats = ref([
  {
    label: "Profile Completion",
    value: 0,
    icon: User,
    suffix: "%",
    color: "success",
  },
  {
    label: "Total Activities",
    value: 0,
    icon: Document,
    secondaryValue: "0 colors used",
  },
  {
    label: "Calendar Events",
    value: 0,
    icon: Calendar,
    secondaryValue: "0 unique days",
  },
  {
    label: "Total Tags",
    value: 0,
    icon: Collection,
  },
  {
    label: "Diary Entries",
    value: 0,
    icon: Edit,
    secondaryValue: "0 unique dates",
  },
]);
const isEditing = ref(false);
const defaultAvatar = "/img/default-avatar.png";
const defaultCover = "/img/default-cover.jpg";

// Computed property for avatar source
const avatarSrc = computed(() => {
  if (!profile.value?.avatar) return defaultAvatar;

  // Si ya es una URL de datos, devolverla directamente
  if (profile.value.avatar.startsWith("data:image")) {
    return profile.value.avatar;
  }

  // Si es una cadena base64, convertirla a URL de datos
  if (profile.value.avatar.match(/^[A-Za-z0-9+/=]+$/)) {
    return `data:image/jpeg;base64,${profile.value.avatar}`;
  }

  // Si es una URL, usarla directamente
  return profile.value.avatar;
});

const editForm = reactive({
  name: "",
  position: "",
  bio: "",
  phone: "",
  location: "",
  social_links: {
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
  },
});

// Cargar datos del perfil
const loadProfile = async () => {
  try {
    const [profileResponse, statsResponse] = await Promise.all([
      axios.get("/profile"),
      axios.get("/profile/stats"),
    ]);

    await nextTick(() => {
      // Actualizar el perfil
      profile.value = profileResponse.data;
      
      // Actualizar estadísticas con datos reales
      if (statsResponse.data) {
        stats.value = [
          { 
            label: "Profile Completion",
            value: statsResponse.data.profile_completion || 0,
            icon: User,
            suffix: "%",
            color: getCompletionColor(statsResponse.data.profile_completion),
          },
          { 
            label: "Total Activities",
            value: statsResponse.data.activities?.total || 0,
            icon: Document,
            secondaryValue: `${
              statsResponse.data.activities?.unique_colors || 0
            } colors used`,
          },
          { 
            label: "Calendar Events",
            value: statsResponse.data.calendar?.total_events || 0,
            icon: Calendar,
            secondaryValue: `${
              statsResponse.data.calendar?.unique_days || 0
            } unique days`,
          },
          { 
            label: "Total Tags",
            value: statsResponse.data.tags?.total || 0,
            icon: Collection,
          },
          { 
            label: "Diary Entries",
            value: statsResponse.data.diary?.total_entries || 0,
            icon: Edit,
            secondaryValue: `${
              statsResponse.data.diary?.unique_dates || 0
            } unique dates, ${
              statsResponse.data.diary?.unique_colors || 0
            } colors`,
          },
        ];
      }
      
      // Actualizar formulario de edición
      Object.assign(editForm, {
        name: profile.value.name,
        position: profile.value.position || "",
        bio: profile.value.bio,
        phone: profile.value.phone,
        location: profile.value.location,
        social_links: { ...profile.value.social_links } || {},
      });
    });
  } catch (error) {
    console.error("Error loading profile:", error);
    ElMessage.error("Could not load profile data");
  }
};

// Función para determinar el color basado en el porcentaje de completitud
const getCompletionColor = (percentage) => {
  if (percentage >= 80) return "success";
  if (percentage >= 50) return "warning";
  return "danger";
};

// Manejar cambio de avatar
const handleAvatarChange = async (file) => {
  // Validar que el archivo existe y tiene las propiedades necesarias
  if (!file || !file.raw) {
    ElMessage.error("No valid file provided");
    return false;
  }

  // Validar el tipo y tamaño del archivo
  const fileType = file.raw.type || file.type;
  if (!fileType || !fileType.startsWith("image/")) {
    ElMessage.error("Avatar must be an image file!");
    return false;
  }

  const fileSize = file.raw.size || file.size;
  const isLt2M = fileSize / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error("Avatar image size can not exceed 2MB!");
    return false;
  }

  // Guardar la imagen original antes de cualquier cambio
  const previousAvatar = profile.value?.avatar;

  try {
    // Convertir la imagen a base64
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file.raw);
    });

    // Actualizar la vista previa del avatar de manera segura
    await nextTick(() => {
      if (profile.value) {
        const updatedProfile = { ...profile.value, avatar: base64 };
        profile.value = updatedProfile;
      }
    });

    // Enviar al backend usando PUT en lugar de POST
    const response = await axios.put("/profile", {
      ...profile.value,
      avatar: base64
    });

    if (response.data) {
      ElMessage.success("Avatar updated successfully");
    } else {
      throw new Error("No response data received");
    }
  } catch (error) {
    console.error("Error updating avatar:", error);
    ElMessage.error("Failed to update avatar");
    // Revertir la vista previa si falla
    await nextTick(() => {
      if (profile.value) {
        const revertedProfile = { ...profile.value, avatar: previousAvatar };
        profile.value = revertedProfile;
      }
    });
  }
};

// Guardar cambios del perfil
const saveChanges = async () => {
  try {
    const currentProfileData = {
      ...editForm,
      avatar: profile.value?.avatar || null,
    };

    const response = await axios.put("/profile", currentProfileData);
    
    if (response.data) {
      await nextTick(() => {
        const newProfileData = response.data;
        // Actualizar tanto el perfil como el formulario de edición
        profile.value = newProfileData;
        Object.assign(editForm, {
          name: newProfileData.name,
          position: newProfileData.position || "",
          bio: newProfileData.bio,
          phone: newProfileData.phone,
          location: newProfileData.location,
          social_links: { ...newProfileData.social_links } || {},
        });
        isEditing.value = false;
      });
      
      // Recargar las estadísticas después de actualizar el perfil
      await loadProfile();
      
      ElMessage.success("Profile updated successfully");
    }
  } catch (error) {
    console.error("Error saving profile:", error);
    ElMessage.error("Could not save profile changes");
  }
};

const startEditing = () => {
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  // Restaurar valores originales
  Object.assign(editForm, {
    name: profile.value.name,
    position: profile.value.position,
    bio: profile.value.bio,
    phone: profile.value.phone,
    location: profile.value.location,
    social_links: { ...profile.value.social_links },
  });
};

const getSocialIcon = (platform) => {
  const icons = {
    facebook: "facebook",
    twitter: "twitter",
    instagram: "instagram",
    linkedin: "linkedin",
  };
  return icons[platform] || "link";
};

const openSocialLink = (link) => {
  if (link) window.open(link, "_blank");
};

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.profile-header {
  position: relative;
  overflow: hidden;
}

.page-header {
  background-size: cover;
  background-position: center;
}

.avatar-uploader {
  position: relative;
  display: inline-block;
}

.avatar-edit-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--el-color-primary);
  color: white;
  padding: 4px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-descriptions) {
  margin-top: 20px;
}

.social-button {
  width: 100%;
  margin-bottom: 10px;
  text-transform: capitalize;
}

.stats-card {
  text-align: center;
  padding: 20px;
}

.mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.text-success {
  color: var(--el-color-success);
}

.text-warning {
  color: var(--el-color-warning);
}

.text-danger {
  color: var(--el-color-danger);
}

:deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

:deep(.el-card__body) {
  padding: 16px;
}
</style>
