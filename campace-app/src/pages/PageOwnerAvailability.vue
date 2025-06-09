<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="10" offset-md="1">
        <v-card>
          <v-card-title class="primary white--text">
            <v-icon left class="mr-2">mdi-calendar</v-icon>
            All Bookings for This Spot
          </v-card-title>
          <v-card-text>
            <div v-if="loading" class="text-center my-8">
              <v-progress-circular indeterminate color="primary" size="48" />
              <div class="mt-2">Loading bookings...</div>
            </div>
            <div v-else>
              <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
              <v-alert v-if="!spot" type="info" class="mb-4">Camping spot not found.</v-alert>
              <div v-if="spot">
                <div class="mb-4">
                  <strong>{{ spot.name }}</strong> — {{ spot.location?.city }}, {{ spot.location?.country }}
                </div>
                <v-simple-table v-if="bookings.length > 0">
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="booking in bookings" :key="booking.booking_id">
                      <td>
                        <span v-if="booking.user && (booking.user.user_name || booking.user.email)">
                          {{ booking.user.user_name }}<br>
                          <small class="grey--text">{{ booking.user.email }}</small>
                        </span>
                        <span v-else-if="booking.user_id">
                          <template v-if="userCache[booking.user_id]">
                            {{ userCache[booking.user_id].user_name }}<br>
                            <small class="grey--text">{{ userCache[booking.user_id].email }}</small>
                          </template>
                          <template v-else>
                            <v-progress-circular indeterminate color="primary" size="16" />
                          </template>
                        </span>
                        <span v-else>N/A</span>
                      </td>
                      <td>{{ formatDate(booking.start_date) }}</td>
                      <td>{{ formatDate(booking.end_date) }}</td>
                      <td>
                        <v-chip :color="statusColor(booking.status)" dark small>{{ booking.status }}</v-chip>
                      </td>
                    </tr>
                  </tbody>
                </v-simple-table>
                <v-alert v-else type="info">No bookings found for this spot.</v-alert>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout">
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { authUtils } from '@/utils/auth';

export default {
  name: 'PageOwnerAvailability',
  data() {
    return {
      spot: null,
      bookings: [],
      loading: true,
      error: null,
      snackbar: {
        show: false,
        text: '',
        color: 'success',
        timeout: 3000
      },
      userCache: {},
    };
  },
  created() {
    this.fetchSpot();
  },
  methods: {
    async fetchSpot() {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch(`http://localhost:3000/campspots/${this.$route.params.id}`, {
          headers: { ...authUtils.getAuthHeaders() }
        });
        if (!res.ok) throw new Error('Failed to load camping spot');
        this.spot = await res.json();
        await this.fetchBookings();
      } catch (e) {
        this.error = e.message || 'Failed to load camping spot';
      } finally {
        this.loading = false;
      }
    },
    async fetchBookings() {
      try {
        const res = await fetch(`http://localhost:3000/bookings?campspot_id=${this.$route.params.id}`, {
          headers: { ...authUtils.getAuthHeaders() }
        });
        if (!res.ok) throw new Error('Failed to load bookings');
        const data = await res.json();
        // For each booking, fetch user info if not present
        const bookingsWithUser = await Promise.all(
          data.map(async booking => {
            let user = booking.user;
            if (!user && booking.user_id) {
              // Always fetch user with correct fields (user_name, email)
              try {
                const userRes = await fetch(`http://localhost:3000/users/${booking.user_id}`, {
                  headers: { ...authUtils.getAuthHeaders() }
                });
                if (userRes.ok) {
                  user = await userRes.json();
                  this.$set(this.userCache, booking.user_id, user);
                }
              } catch (e) { /* ignore user fetch error */ }
            }
            return {
              ...booking,
              user,
              start_date: booking.startDate || booking.start_date,
              end_date: booking.endDate || booking.end_date
            };
          })
        );
        this.bookings = bookingsWithUser;
      } catch (e) {
        this.showSnackbar(e.message || 'Failed to load bookings', 'error');
      }
    },
    formatDate(date) {
      if (!date) return '';
      // Parse ISO string and format as local date
      const d = new Date(date);
      if (isNaN(d)) return date;
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    },
    statusColor(status) {
      switch (status) {
        case 'confirmed': return 'success';
        case 'pending': return 'warning';
        case 'cancelled': return 'error';
        default: return 'grey';
      }
    },
    showSnackbar(text, color = 'success') {
      this.snackbar = { show: true, text, color, timeout: 3000 };
    }
  }
};
</script>

<style scoped>
.v-card-title {
  align-items: center;
}
</style>
