<template>
  <v-card class="profile-card pa-4 mx-auto elevation-8" max-width="500">
    <v-card-title class="headline text-h5 font-weight-bold justify-center">
      Account Information
    </v-card-title>

    <v-divider class="my-4"></v-divider>

    <v-form>
      <v-text-field
        v-model="editableFields.user_name.value"
        label="Username"
        :disabled="!editMode"
        outlined
        dense
        class="mb-3"
      ></v-text-field>

      <v-text-field
        v-model="editableFields.email.value"
        label="E-mail"
        :disabled="!editMode"
        outlined
        dense
        class="mb-3"
      ></v-text-field>

      <v-text-field
        :value="formatDate(editableFields.date_joined.value)"
        label="Date Joined"
        disabled
        outlined
        dense
      ></v-text-field>
    </v-form>

    <v-alert v-if="error" type="error" dense class="mt-4">
      {{ error }}
    </v-alert>

    <v-alert v-if="success" type="success" dense class="mt-4">
      {{ success }}
    </v-alert>

    <v-card-actions class="justify-center mt-4">
      <v-btn v-if="!editMode" color="primary" @click="editMode = true">Edit Profile</v-btn>
      <template v-else>
        <v-btn color="success" @click="saveChanges">Save Changes</v-btn>
        <v-btn color="grey darken-1" @click="cancelEdit">Cancel</v-btn>
      </template>
      <v-btn icon class="ml-2" color="error" @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-card-actions>

    <v-progress-circular v-if="loading" indeterminate color="primary" class="ma-3 mx-auto"></v-progress-circular>
  </v-card>
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
.profile-card {
  background: linear-gradient(135deg, #f4f1de, #f2cc8f);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
</style>