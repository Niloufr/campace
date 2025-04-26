<template>
    <v-card
      class="mx-auto"
      max-width="500"
    >
      <v-toolbar
        color="deep-purple accent-4"
        dark
      >
        <v-toolbar-title>Account Information</v-toolbar-title>
        <v-spacer></v-spacer>
      </v-toolbar>
  
      <v-list v-if="!loading && !error">
        <v-list-item
          v-for="item in profileInfo"
          :key="item.label"
        >
          <v-list-item-content>
            <v-list-item-subtitle class="text-subtitle-2 mb-1">{{ item.label }}</v-list-item-subtitle>
            <v-list-item-title v-text="item.value"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      
      <v-progress-circular v-if="loading" indeterminate color="purple"></v-progress-circular>
      
      <v-alert v-if="error" type="error" class="ma-3">
        {{ error }}
        <v-btn v-if="isAuthError" color="info" class="mt-2" @click="goToLogin">Go to Login</v-btn>
      </v-alert>
    </v-card>
  </template>
  
  <script>
  export default {
    data: () => ({
      profileInfo: [
        {
          label: 'User ID',
          value: ''
        },
        {
          label: 'Username',
          value: ''
        },
        {
          label: 'E-mail',
          value: ''
        },
        {
          label: 'Date Joined',
          value: ''
        },
      ],  
      
      loading: false,
      error: null,
      isAuthError: false
    }),
    
    mounted() {
      this.fetchUserProfile();
    },
    
    methods: {
      async fetchUserProfile() {
        this.loading = true;
        this.error = null;
        this.isAuthError = false;
        
        try {
          
          const response = await fetch('http://localhost:3000/users/profile', {
            credentials: 'include'
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              this.error = 'Please log in to view your profile';
              this.isAuthError = true;
              return;
            }
            throw new Error('Failed to fetch user profile');
          }
          
          const userData = await response.json();
          
          this.profileInfo = [
            {
              label: 'User ID',
              value: userData.user_id || 'N/A'
            },
            {
              label: 'Username',
              value: userData.user_name || 'N/A'
            },
            {
              label: 'E-mail',
              value: userData.email || 'N/A'
            },
            {
              label: 'Date Joined',
              value: this.formatDate(userData.date_joined) || 'N/A'
            },
          ];
        } catch (error) {
          console.error('Error fetching user profile:', error);
          this.error = 'Unable to load profile data. Please try again later.';
        } finally {
          this.loading = false;
        }
      },
      
      formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(date);
      },
      
      goToLogin() {

        this.$router.push('/login');
      }
    }
  }
  </script>