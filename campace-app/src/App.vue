<template>
  <div id="app">
    <header>
      <h1>Campace</h1>
      <nav>
        <button @click="setActivePage('home')">Home</button>
        <button @click="setActivePage('explore')">Explore</button>
        <button v-if="isLoggedIn" @click="setActivePage('addspot')">Add Spot</button>
        <button v-if="isLoggedIn" @click="setActivePage('mytrips')">My Trips</button>
        <button v-if="isLoggedIn" @click="setActivePage('profile')">Profile</button>
        <button v-if="!isLoggedIn" @click="setActivePage('login')">Login</button>
        <button v-if="!isLoggedIn" @click="setActivePage('create-account')">Sign Up</button>
        <button v-if="isLoggedIn" @click="logout">Logout</button>
      </nav>
    </header>

    <main>
      <!-- Render the active page component based on activePage value -->
      <PageHome v-if="activePage === 'home'" />
      <PageExplore v-else-if="activePage === 'explore'" />
      <PageAddspot v-else-if="activePage === 'addspot'" />
      <PageMyTrips v-else-if="activePage === 'mytrips'" />
      <PageProfile v-else-if="activePage === 'profile'" />
      <PageLogin v-else-if="activePage === 'login'" @login-success="handleLoginSuccess" />
      <PageCreateAccount v-else-if="activePage === 'create-account'" @account-created="handleAccountCreated" />
      <PageCampSpot v-else-if="activePage === 'camp-spot'" :spotId="selectedSpotId" />
      <PageSpotOverview v-else-if="activePage === 'spot-overview'" />
      
      <!-- Default content if no page is selected -->
      <div v-else class="welcome-content">
        <h2>Welcome to Campace!</h2>
        <p>Your ultimate camping companion. Find and share the best camping spots.</p>
        <button class="cta-button" @click="setActivePage('explore')">Start Exploring</button>
      </div>
    </main>

    <footer>
      <p>&copy; 2025 CampAce. All rights reserved.</p>
    </footer>
  </div>
</template>

<script>
import PageAddspot from './pages/PageAddspot.vue';
import PageCampSpot from './pages/PageCampSpot.vue';
import PageCreateAccount from './pages/PageCreateAccount.vue';
import PageExplore from './pages/PageExplore.vue';
import PageHome from './pages/PageHome.vue';
import PageLogin from './pages/PageLogin.vue';
import PageMyTrips from './pages/PageMyTrips.vue';
import PageProfile from './pages/PageProfile.vue';
import PageSpotOverview from './pages/PageSpotOverview.vue';

// Export
export default {
  name: 'App',
  data() {
    return {
      activePage: "", // Default to home page
      isLoggedIn: false,
      selectedSpotId: null
    }
  },
  components: {
    PageAddspot,
    PageCampSpot,
    PageCreateAccount,
    PageExplore,
    PageHome,
    PageLogin,
    PageMyTrips,
    PageProfile,
    PageSpotOverview
  },
  methods: {
    setActivePage(page) {
      this.activePage = page;
    },
    handleLoginSuccess() {
      this.isLoggedIn = true;
      this.setActivePage('home');
    },
    handleAccountCreated() {
      this.setActivePage('login');
    },
    logout() {
      this.isLoggedIn = false;
      this.setActivePage('home');
    },
    viewCampSpot(spotId) {
      this.selectedSpotId = spotId;
      this.setActivePage('camp-spot');
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

header {
  padding: 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eaeaea;
}

nav {
  display: flex;
  gap: 15px;
}

button {
  background-color: #f0f0f0;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #dcdcdc;
}

main {
  min-height: 70vh;
  padding: 30px 0;
}

.welcome-content {
  text-align: center;
  padding: 50px 0;
}

.cta-button {
  background-color: #4CAF50;
  color: white;
  padding: 12px 24px;
  font-size: 16px;
  margin-top: 20px;
}

.cta-button:hover {
  background-color: #45a049;
}

footer {
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid #eaeaea;
  margin-top: 30px;
  color: #666;
}
</style>