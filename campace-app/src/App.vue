<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar app>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>
        <router-link to="/" class="white--text text-decoration-none">
          <img src="@/assets/campace-logo.png" alt="CampAce Logo" style="height:40px;vertical-align:middle;margin-right:8px;" />
          Campace
        </router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text v-if="!isLoggedIn" @click="$router.push('/login')">Login</v-btn>
      <v-btn text v-if="!isLoggedIn" @click="$router.push('/create-account')">Sign Up</v-btn>
      <v-btn text v-if="isLoggedIn" @click="logout">Logout</v-btn>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" app>
      <v-list>
        <v-list-item to="/" exact>
          <v-list-item-icon><v-icon>mdi-home</v-icon></v-list-item-icon>
          <v-list-item-content><v-list-item-title>Home</v-list-item-title></v-list-item-content>
        </v-list-item>

        <v-list-item to="/spot-overview" v-if="isLoggedIn">
          <v-list-item-icon><v-icon>mdi-tent</v-icon></v-list-item-icon>
          <v-list-item-content><v-list-item-title>My Spots</v-list-item-title></v-list-item-content>
        </v-list-item>

        <v-list-item to="/my-trips" v-if="isLoggedIn">
          <v-list-item-icon><v-icon>mdi-calendar</v-icon></v-list-item-icon>
          <v-list-item-content><v-list-item-title>My Trips</v-list-item-title></v-list-item-content>
        </v-list-item>

        <v-list-item to="/owner/bookings" v-if="isLoggedIn">
          <v-list-item-icon><v-icon>mdi-book-open</v-icon></v-list-item-icon>
          <v-list-item-content><v-list-item-title>Owner Bookings</v-list-item-title></v-list-item-content>
        </v-list-item>

        <v-list-item to="/profile" v-if="isLoggedIn">
          <v-list-item-icon><v-icon>mdi-account</v-icon></v-list-item-icon>
          <v-list-item-content><v-list-item-title>Profile</v-list-item-title></v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-4">
        <router-view @login-success="handleLoginSuccess" @account-created="handleAccountCreated"></router-view>
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer app>
      <v-row justify="center" no-gutters>
        <v-col class="text-center" cols="12">
          © {{ new Date().getFullYear() }} — <strong>Campace</strong>. All rights reserved.
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script>
import { authUtils } from './utils/auth';

export default {
  name: 'App',
  data() {
    return {
      drawer: false,
      isLoggedIn: false,
      currentUser: null,
      refreshIntervalId: null
    }
  },
  methods: {
    handleLoginSuccess(userData) {
      if (!userData || !userData.token) {
        console.error('Login failed: No token received');
        this.$toast.error('Login failed: Please try again');
        return;
      }
      
      this.isLoggedIn = true;
      this.currentUser = userData;
      authUtils.setToken(userData.token); // store token
      localStorage.setItem('user', JSON.stringify(userData)); // optional, in case you want user info
      
      console.log('Token stored:', authUtils.getToken()); // Debug log
      
      this.$toast.success(`Welcome back, ${userData.user_name}!`);
      this.setTokenRefresh();
      this.$router.push('/');
    },
    handleAccountCreated() {
      this.$toast.success('Account created successfully! Please log in.');
      this.$router.push('/login');
    },
    logout() {
      authUtils.removeToken();
      localStorage.removeItem('user');
      this.isLoggedIn = false;
      this.currentUser = null;
      if (this.refreshIntervalId) {
        clearInterval(this.refreshIntervalId);
        this.refreshIntervalId = null;
      }
      this.$toast.info('Logged out');
      if (this.$route.path !== '/') {
        this.$router.push('/');
      }
    },
    async refreshTokenSilently() {
      try {
        const response = await fetch('http://localhost:3000/users/refresh-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authUtils.getAuthHeaders()
          }
        });
        if (response.ok) {
          const data = await response.json();
          authUtils.setToken(data.token);
          this.$toast.info('Session refreshed');
        }
      } catch (err) {
        console.error('Silent token refresh failed:', err);
        // Optionally logout on failure
        this.logout();
      }
    },
    setTokenRefresh() {
      // Refresh token every 23 hours (23 * 60 * 60 * 1000 ms)
      if (this.refreshIntervalId) clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = setInterval(() => {
        this.refreshTokenSilently();
      }, 23 * 60 * 60 * 1000);
    },
    checkAuthStatus() {
      if (authUtils.isAuthenticated()) {
        const user = authUtils.getUser();
        if (user) {
          this.isLoggedIn = true;
          this.currentUser = user;
          this.setTokenRefresh();
        } else {
          this.logout();
        }
      }
    }
  },
  created() {
    // Check for JWT token in localStorage or via authUtils on app load
    const token = authUtils.getToken();
    if (token) {
      const user = authUtils.getUser();
      this.isLoggedIn = true;
      this.currentUser = user;
      this.setTokenRefresh();
    } else {
      this.isLoggedIn = false;
      this.currentUser = null;
    }
  }
}
</script>

<style>
:root {
  --primary: #adc178;
  --secondary: #a98467;
  --accent: #dde5b6;
  --background: #f0ead2;
  --surface: #fff;
  --text: #6c584c;
}

.v-application {
  font-family: 'Roboto', sans-serif !important;
  background-color: var(--background) !important;
  color: var(--text) !important;
}

.v-app-bar {
  background-color: var(--secondary) !important;
  color: var(--background) !important;
}

.v-navigation-drawer {
  background-color: var(--accent) !important;
  color: var(--text) !important;
}

.v-list-item {
  color: var(--text) !important;
}

.v-list-item--active {
  background-color: var(--primary) !important;
  color: var(--surface) !important;
}

.v-btn[color="primary"], .v-btn.primary {
  background-color: var(--primary) !important;
  color: var(--surface) !important;
}

.v-btn[color="secondary"], .v-btn.secondary {
  background-color: var(--secondary) !important;
  color: var(--surface) !important;
}

.v-footer {
  background-color: var(--secondary) !important;
  color: var(--background) !important;
}

.v-card {
  background-color: var(--surface) !important;
  color: var(--text) !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 16px rgba(172, 193, 120, 0.08);
}

.v-icon {
  color: var(--primary) !important;
}

.page-title {
  font-size: 2rem;
  font-weight: 500;
  margin-bottom: 2rem;
  color: var(--primary);
}

.card-hover {
  transition: transform 0.2s;
  cursor: pointer;
}

.card-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(172, 193, 120, 0.18) !important;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  color: var(--secondary);
}

.form-container {
  max-width: 600px;
  margin: 0 auto;
  background: var(--accent);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(172, 193, 120, 0.08);
}

.list-container {
  max-width: 800px;
  margin: 0 auto;
}

.detail-container {
  max-width: 1000px;
  margin: 0 auto;
}

.text-primary {
  color: var(--primary) !important;
}

.text-secondary {
  color: var(--secondary) !important;
}

.bg-light {
  background-color: var(--background) !important;
}

.rounded-card {
  border-radius: 8px !important;
}

.elevation-hover {
  transition: box-shadow 0.3s;
}

.elevation-hover:hover {
  box-shadow: 0 4px 8px rgba(172, 193, 120, 0.18) !important;
}
</style>
