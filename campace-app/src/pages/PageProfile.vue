<template>
  <div class="profile-page-bg">
    <v-card class="profile-card elevation-10" max-width="380">
      <div class="profile-avatar-wrapper">
        <v-avatar size="96" class="profile-avatar elevation-6">
          <v-icon size="80" color="secondary">mdi-account-circle</v-icon>
        </v-avatar>
      </div>
      <v-card-title class="profile-title justify-center">My Profile</v-card-title>
      <v-divider class="my-2"></v-divider>
      <v-form>
        <v-text-field
          v-model="editableFields.user_name.value"
          label="Username"
          :disabled="!editMode"
          outlined
          dense
          class="mb-3"
          prepend-inner-icon="mdi-account"
        ></v-text-field>
        <v-text-field
          v-model="editableFields.email.value"
          label="E-mail"
          :disabled="!editMode"
          outlined
          dense
          class="mb-3"
          prepend-inner-icon="mdi-email"
        ></v-text-field>
        <v-text-field
          :value="formatDate(editableFields.date_joined.value)"
          label="Date Joined"
          disabled
          outlined
          dense
          class="mb-3"
          prepend-inner-icon="mdi-calendar"
        ></v-text-field>
      </v-form>
      <v-alert v-if="error" type="error" dense class="mt-2 mb-0">
        {{ error }}
      </v-alert>
      <v-alert v-if="success" type="success" dense class="mt-2 mb-0">
        {{ success }}
      </v-alert>
      <v-card-actions class="justify-center mt-3">
        <v-btn v-if="!editMode" color="primary" @click="editMode = true" class="px-6 profile-btn">Edit Profile</v-btn>
        <template v-else>
          <v-btn color="success" @click="saveChanges" class="px-6 profile-btn">Save</v-btn>
          <v-btn color="grey lighten-1" @click="cancelEdit" class="px-6 profile-btn">Cancel</v-btn>
        </template>
      </v-card-actions>
      <v-progress-circular v-if="loading" indeterminate color="primary" class="ma-3 mx-auto"></v-progress-circular>
    </v-card>
  </div>
</template>

<script>
export default {
  data: () => ({
    editableFields: {
      user_name: { label: 'Username', value: '' },
      email: { label: 'E-mail', value: '' },
      date_joined: { label: 'Date Joined', value: '' }
    },
    originalFields: {},
    loading: false,
    error: '',
    success: '',
    editMode: false,
  }),

  mounted() {
    this.fetchUserProfile();
  },

  methods: {
    async fetchUserProfile() {
      this.loading = true;
      this.error = '';
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!token || !user) {
        this.error = 'Please log in to view your profile';
        this.loading = false;
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          this.error = 'Failed to load profile. Please re-login.';
          this.loading = false;
          return;
        }

        const data = await response.json();

        this.editableFields.user_name.value = data.user_name;
        this.editableFields.email.value = data.email;
        this.editableFields.date_joined.value = data.date_joined;
        this.originalFields = JSON.parse(JSON.stringify(this.editableFields));
      } catch (err) {
        console.error(err);
        this.error = 'Network error while loading profile';
      } finally {
        this.loading = false;
      }
    },

    async saveChanges() {
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.user_id;

      if (!token || !userId) {
        this.error = 'Session expired. Please log in again.';
        return;
      }

      try {
        const payload = {
          user_name: this.editableFields.user_name.value,
          email: this.editableFields.email.value
        };

        const response = await fetch(`http://localhost:3000/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          this.error = data.message || 'Update failed';
          return;
        }

        this.success = 'Profile updated successfully';
        this.editMode = false;
        this.originalFields = JSON.parse(JSON.stringify(this.editableFields));
      } catch (err) {
        console.error(err);
        this.error = 'Network error. Please try again.';
      }
    },

    cancelEdit() {
      this.editableFields = JSON.parse(JSON.stringify(this.originalFields));
      this.editMode = false;
      this.success = '';
      this.error = '';
    },

    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      this.$emit('user-logged-out');
      this.$router.push('/login');
    },

    formatDate(date) {
      if (!date) return '';
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date(date));
    }
  }
}
</script>

<style scoped>
.profile-page-bg {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  background: transparent;
}
.profile-card {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(172, 193, 120, 0.18);
  padding: 32px 28px 24px 28px;
  margin-top: 40px;
  margin-left: 40px;
  margin-bottom: 40px;
  position: relative;
}
.profile-avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-top: -60px;
  margin-bottom: 8px;
}
.profile-avatar {
  background: #fff;
  border: 4px solid #adc178;
}
.profile-title {
  color: #6c584c;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 0;
}
.v-text-field {
  background: #f8fafc !important;
  border-radius: 8px !important;
}
.profile-btn {
  border-radius: 24px !important;
  font-weight: 600;
  letter-spacing: 0.5px;
  min-width: 120px;
}
.v-alert {
  border-radius: 10px;
  font-weight: 500;
}
</style>