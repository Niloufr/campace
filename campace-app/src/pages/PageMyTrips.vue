<template>
  <v-container class="pa-4">
    <v-card>
      <v-card-title>My Trips</v-card-title>
      <v-card-text>
        <v-progress-circular v-if="loading" indeterminate color="primary"></v-progress-circular>
        <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
        <div v-if="!loading && !error && trips.length === 0" class="text-center grey--text">No trips to display yet.</div>
        <v-simple-table v-if="trips.length">
          <thead>
            <tr>
              <th>Spot</th>
              <th>Location</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trip in trips" :key="trip.booking_id">
              <td>{{ trip.campspot?.name || trip.campspot_id }}</td>
              <td>{{ trip.campspot?.location ? `${trip.campspot.location.city}, ${trip.campspot.location.country}` : '' }}</td>
              <td>{{ formatDate(trip.startDate) }}</td>
              <td>{{ formatDate(trip.endDate) }}</td>
              <td>{{ trip.status }}</td>
              <td>${{ trip.total_price }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { authUtils } from '../utils/auth';

export default {
  name: 'PageMyTrips',
  data() {
    return {
      trips: [],
      loading: false,
      error: ''
    };
  },
  methods: {
    async fetchTrips() {
      this.loading = true;
      this.error = '';
      try {
        const res = await fetch('http://localhost:3000/bookings/mine', {
          headers: authUtils.getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch trips');
        this.trips = await res.json();
      } catch (e) {
        this.error = e.message || 'Unable to load trips.';
      } finally {
        this.loading = false;
      }
    },
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
    }
  },
  created() {
    this.fetchTrips();
  }
}
</script>

<style scoped>
</style>
