<template>
  <v-container class="search-results-container" fluid>
    <v-row class="justify-center mb-8">
      <v-col cols="12" md="8" class="text-center">
        <h1 class="display-1 font-weight-bold primary--text mb-2">Camping Spots</h1>
        <p class="subtitle-1 grey--text">
          {{ searchSummary }}
        </p>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" v-if="loading" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4">Loading camping spots...</p>
      </v-col>
      <v-col cols="12" v-if="!loading && spots.length === 0" class="text-center">
        <v-alert type="info">No camping spots found for your search.</v-alert>
      </v-col>
      <v-col cols="12" sm="6" md="4" v-for="spot in spots" :key="spot.campspot_id">
        <v-card class="spot-card elevation-2 mb-6">
          <v-img :src="'https://placehold.co/400x200?text=Camping+Spot'" height="180" class="rounded-t"></v-img>
          <v-card-title class="headline">{{ spot.name }}</v-card-title>
          <v-card-subtitle>{{ spot.location.city }}, {{ spot.location.country }}</v-card-subtitle>
          <v-card-text class="mb-2">
            <div class="mb-1">
              <v-icon small class="mr-1">mdi-currency-usd</v-icon>
              ${{ spot.price_per_night }} per night
            </div>
            <div class="mb-1">              <v-icon small class="mr-1">mdi-account-group</v-icon>
              Capacity: {{ spot.capacity }} people
            </div>
            <div class="description">
              <v-icon small class="mr-1">mdi-information</v-icon>
              {{ spot.description }}
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" text :to="`/camp-spot/${spot.campspot_id}`">
              <v-icon left>mdi-eye</v-icon>
              View Details
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { authUtils } from '@/utils/auth'

export default {
  name: 'PageSearchResults',
  data() {
    return {
      spots: [],
      loading: true
    }
  },
  computed: {    searchSummary() {
      const { city, country } = this.$route.query;
      if (city && country) {
        return `Results for city "${city}" in "${country}"`;
      } else if (city) {
        return `Results for city "${city}"`;
      } else if (country) {
        return `Results for country "${country}"`;
      }
      return 'All available camping spots';
    }
  },
  created() {
    this.fetchSpots();
  },
  watch: {
    '$route.query': 'fetchSpots'
  },
  methods: {
    async fetchSpots() {
      this.loading = true;
      let url = new URL('http://localhost:3000/campspots/search');
      const { city, country, minPrice, maxPrice, amenities, minSpots, maxSpots } = this.$route.query;
      if (city) url.searchParams.append('city', city);
      if (country) url.searchParams.append('country', country);
      if (minPrice) url.searchParams.append('minPrice', minPrice);
      if (maxPrice) url.searchParams.append('maxPrice', maxPrice);
      if (amenities) url.searchParams.append('amenities', amenities);
      if (minSpots) url.searchParams.append('minSpots', minSpots);
      if (maxSpots) url.searchParams.append('maxSpots', maxSpots);
      try {
        const res = await fetch(url, {
          headers: {
            ...authUtils.getAuthHeaders()
          }
        });
        if (!res.ok) throw new Error('Failed to fetch spots');
        this.spots = await res.json();
      } catch (e) {
        console.error('Error fetching spots:', e);
        this.spots = [];
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.search-results-container {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 32px;
  padding-bottom: 32px;
}
.spot-card {
  border-radius: 14px;
  transition: box-shadow 0.2s, transform 0.2s;
  min-height: 420px;
  display: flex;
  flex-direction: column;
}
.spot-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.18) !important;
  transform: translateY(-4px) scale(1.02);
}
.description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}
@media (max-width: 960px) {
  .search-results-container {
    padding-top: 12px;
    padding-bottom: 12px;
  }
  .spot-card {
    min-height: 340px;
  }
}
@media (max-width: 600px) {
  .spot-card {
    min-height: 260px;
    border-radius: 8px;
  }
}
</style>
