<template>
  <v-container class="owner-bookings-container" fluid>
    <v-row class="justify-center mb-8">
      <v-col cols="12" md="8" class="text-center">
        <h1 class="display-1 font-weight-bold primary--text mb-2">Pending Bookings</h1>
        <p class="subtitle-1 grey--text">
          Review, confirm, or cancel pending bookings for your camping spots.
        </p>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="10" class="mx-auto">
        <v-card class="elevation-2 pa-4">
          <v-simple-table>
            <thead>
              <tr>
                <th>Spot</th>
                <th>User</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="booking in bookings" :key="booking.booking_id">
                <td>{{ booking.campspot?.name || booking.campspot_id }}</td>
                <td>{{ booking.user?.user_name || booking.user_id }}</td>
                <td>{{ formatDate(booking.startDate) }}</td>
                <td>{{ formatDate(booking.endDate) }}</td>
                <td>{{ booking.status }}</td>
                <td>
                  <v-btn small color="success" @click="updateBooking(booking.booking_id, 'CONFIRMED')" :disabled="booking.status !== 'PENDING'">Confirm</v-btn>
                  <v-btn small color="error" @click="updateBooking(booking.booking_id, 'CANCELLED')" :disabled="booking.status !== 'PENDING'">Cancel</v-btn>
                </td>
              </tr>
              <tr v-if="!bookings.length">
                <td colspan="6" class="text-center pa-8">
                  <v-icon size="64" color="grey lighten-1" class="mb-4">mdi-calendar-blank</v-icon>
                  <div class="text-h6 mb-2">No bookings yet</div>
                  <p class="text-body-1 grey--text mb-4">
                    You haven't received any bookings for your camping spots yet.
                  </p>
                  <v-btn
                    color="primary"
                    to="/owner/create-spot"
                    class="text-none"
                  >
                    <v-icon left>mdi-plus</v-icon>
                    Create a Camping Spot
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { authUtils } from '@/utils/auth';

export default {
  name: 'PageOwnerBookings',
  data() {
    return {
      bookings: [],
      loading: true,
    }
  },
  created() {
    this.fetchBookings();
  },
  methods: {    async fetchBookings() {
      this.loading = true;
      try {
        const res = await fetch('http://localhost:3000/bookings/owner', {
          headers: {
            ...authUtils.getAuthHeaders()
          }
        });
        if (res.ok) {
          this.bookings = await res.json();
        } else {
          this.bookings = [];
        }
      } catch (e) {
        this.bookings = [];
      } finally {
        this.loading = false;
      }
    },
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
    },
    async updateBooking(bookingId, status) {
      if (!confirm(`Are you sure you want to set this booking to ${status}?`)) return;      try {
        const res = await fetch(`http://localhost:3000/bookings/${bookingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authUtils.getAuthHeaders()
          },
          body: JSON.stringify({ status })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          this.$toast?.error?.(err.message || 'Failed to update booking.');
          return;
        }
        this.$toast?.success?.('Booking updated!');
        await this.fetchBookings();
      } catch (e) {
        this.$toast?.error?.('Failed to update booking.');
      }
    }
  }
}
</script>

<style scoped>
.owner-bookings-container {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 32px;
  padding-bottom: 32px;
}
</style>
