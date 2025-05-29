<template>
  <div class="container-fluid">
    <el-card class="profile-header mb-4">
      <div class="page-header min-height-300 border-radius-xl" :style="{ backgroundImage: `url(${profile.cover_image || defaultCover})` }">
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
            >
              <el-avatar
                :size="100"
                :src="profile.avatar || defaultAvatar"
                class="border-radius-lg shadow-sm"
              />
              <el-icon class="avatar-edit-icon"><Plus /></el-icon>
            </el-upload>
          </div>

          <div class="col">
            <div v-if="!isEditing">
              <h4 class="mb-1">{{ user.name }}</h4>
              <p class="text-sm text-secondary mb-0">{{ profile.position || 'No position set' }}</p>
            </div>
            <div v-else>
              <el-form :model="editForm" label-position="top">
                <el-form-item label="Name">
                  <el-input v-model="editForm.name" placeholder="Your name" />
                </el-form-item>
                <el-form-item label="Position">
                  <el-input v-model="editForm.position" placeholder="Your position" />
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
              <el-descriptions-item label="Full Name">{{ user.name }}</el-descriptions-item>
              <el-descriptions-item label="Mobile">{{ profile.phone }}</el-descriptions-item>
              <el-descriptions-item label="Email">{{ user.email }}</el-descriptions-item>
              <el-descriptions-item label="Location">{{ profile.location }}</el-descriptions-item>
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
              <el-input v-model="editForm.phone" placeholder="Your phone number" />
            </el-form-item>
            <el-form-item label="Location">
              <el-input v-model="editForm.location" placeholder="Your location" />
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
              <el-statistic :title="stat.label" :value="stat.value">
                <template #prefix>
                  <el-icon><component :is="stat.icon" /></el-icon>
                </template>
              </el-statistic>
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
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Edit,
  Check,
  Close,
  Plus,
  User,
  Calendar,
  Document
} from '@element-plus/icons-vue';
import axios from 'axios';

// Estado
const user = ref({});
const profile = ref({});
const stats = ref([]);
const isEditing = ref(false);
const defaultAvatar = '/img/default-avatar.png';
const defaultCover = '/img/default-cover.jpg';

const editForm = reactive({
  name: '',
  position: '',
  bio: '',
  phone: '',
  location: '',
  social_links: {
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: ''
  }
});

// Cargar datos del perfil
const loadProfile = async () => {
  try {
    const [profileResponse, statsResponse] = await Promise.all([
      axios.get('/profile'),
      axios.get('/profile/stats')
    ]);

    user.value = profileResponse.data.user;
    profile.value = profileResponse.data.profile;
    stats.value = [
      { label: 'Total Entries', value: statsResponse.data.total_entries, icon: Document },
      { label: 'Member Since', value: statsResponse.data.member_since, icon: Calendar },
      { label: 'Profile Views', value: statsResponse.data.profile_views, icon: User }
    ];
    
    // Actualizar formulario de edición
    Object.assign(editForm, {
      name: user.value.name,
      position: profile.value.position,
      bio: profile.value.bio,
      phone: profile.value.phone,
      location: profile.value.location,
      social_links: profile.value.social_links || {}
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    ElMessage.error('Could not load profile data');
  }
};

// Manejar cambio de avatar
const handleAvatarChange = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file.raw);
  formData.append('_method', 'PUT');

  try {
    const response = await axios.post('/profile', formData);
    profile.value.avatar = response.data.avatar;
    ElMessage.success('Avatar updated successfully');
  } catch (error) {
    console.error('Error uploading avatar:', error);
    ElMessage.error('Could not upload avatar');
  }
};

// Guardar cambios del perfil
const saveChanges = async () => {
  try {
    const response = await axios.put('/profile', editForm);
    Object.assign(user.value, { name: editForm.name });
    Object.assign(profile.value, {
      position: editForm.position,
      bio: editForm.bio,
      phone: editForm.phone,
      location: editForm.location,
      social_links: editForm.social_links
    });
    
    isEditing.value = false;
    ElMessage.success('Profile updated successfully');
  } catch (error) {
    console.error('Error saving profile:', error);
    ElMessage.error('Could not save profile changes');
  }
};

const startEditing = () => {
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  // Restaurar valores originales
  Object.assign(editForm, {
    name: user.value.name,
    position: profile.value.position,
    bio: profile.value.bio,
    phone: profile.value.phone,
    location: profile.value.location,
    social_links: { ...profile.value.social_links }
  });
};

const getSocialIcon = (platform) => {
  const icons = {
    facebook: 'facebook',
    twitter: 'twitter',
    instagram: 'instagram',
    linkedin: 'linkedin'
  };
  return icons[platform] || 'link';
};

const openSocialLink = (link) => {
  if (link) window.open(link, '_blank');
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
</style> 