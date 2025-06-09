<template>
  <v-container class="camp-spot-container" fluid>
    <v-row class="justify-center mb-8">
      <v-col cols="12" md="8" class="text-center">
        <h1 class="display-1 font-weight-bold primary--text mb-2">Camping Spot Details</h1>
        <p class="subtitle-1 grey--text">
          All the details about this camping spot.
        </p>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="8" class="mx-auto">
        <v-card v-if="loading" class="pa-8 text-center">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4">Loading spot details...</p>
        </v-card>
        <v-card v-else-if="!spot" class="pa-8 text-center">
          <v-alert type="error">Camping spot not found.</v-alert>
        </v-card>
        <v-card v-else class="camp-spot-card elevation-2">
          <v-img :src="spot.imageUrl || 'https://placehold.co/600x300?text=Camping+Spot'" height="300" class="rounded-t mb-4"></v-img>
          <v-card-title class="headline">{{ spot.name }}</v-card-title>
          <v-card-subtitle>{{ spot.location.city }}, {{ spot.location.country }}</v-card-subtitle>
          <v-card-text>
            <div class="mb-2">
              <v-icon small class="mr-1">mdi-currency-usd</v-icon>
              ${{ spot.price_per_night }} per night
            </div>
            <div class="mb-2">
              <v-icon small class="mr-1">mdi-account-group</v-icon>
              Capacity: {{ spot.capacity }} people
            </div>
            <div class="mb-2">
              <v-icon small class="mr-1">mdi-information</v-icon>
              {{ spot.description }}
            </div>
            <div class="mb-2" v-if="spot.amenities && spot.amenities.length">
              <v-icon small class="mr-1">mdi-star</v-icon>
              <span>Amenities:</span>
              <v-chip v-for="amenity in spot.amenities" :key="amenity.amenity_id" class="ma-1" small>{{ amenity.amenity_name }}</v-chip>
            </div>
            <div class="mb-2" v-if="spot.owner">
              <v-icon small class="mr-1">mdi-account</v-icon>
              <span>Owner:</span>
              <span class="font-weight-bold">{{ spot.owner.user_name }}</span>
              <span class="ml-2 grey--text">({{ spot.owner.email }})</span>
            </div>
            <div v-if="isOwner">
              <v-divider class="my-4"></v-divider>
              <div class="font-weight-bold mb-2">Owner Controls</div>
              <v-btn color="primary" class="mr-2" @click="editSpot">Edit Spot</v-btn>
              <v-btn color="error" @click="deleteSpot">Delete Spot</v-btn>
              <v-divider class="my-4"></v-divider>
              <div class="font-weight-bold mb-2">Bookings for this spot</div>
              <v-simple-table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="booking in bookings" :key="booking.booking_id">
                    <td>{{ booking.user_name || booking.user_id }}</td>
                    <td>{{ formatDate(booking.startDate) }}</td>
                    <td>{{ formatDate(booking.endDate) }}</td>
                    <td>{{ booking.status }}</td>
                  </tr>
                  <tr v-if="!bookings.length">
                    <td colspan="4" class="text-center">No bookings yet.</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </div>
            <div v-else>
              <v-divider class="my-4"></v-divider>
              <div class="font-weight-bold mb-2">Availability</div>
              <v-form @submit.prevent="bookSpot">
                <v-row>
                  <v-col cols="12" md="5">
                    <v-menu ref="startMenu" v-model="startMenu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                      <template v-slot:activator="{ on, attrs }">
                        <v-text-field v-model="bookingForm.startDate" label="Start Date" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="bookingForm.startDate"
                        :allowed-dates="allowedStartDates"
                        :min="today"
                        @input="startMenu = false"
                      ></v-date-picker>
                    </v-menu>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-menu ref="endMenu" v-model="endMenu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                      <template v-slot:activator="{ on, attrs }">
                        <v-text-field v-model="bookingForm.endDate" label="End Date" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="bookingForm.endDate"
                        :allowed-dates="allowedEndDates"
                        :min="bookingForm.startDate || today"
                        @input="endMenu = false"
                      ></v-date-picker>
                    </v-menu>
                  </v-col>
                  <v-col cols="12" md="2" class="d-flex align-end">
                    <v-btn color="success" type="submit" :loading="bookingLoading">Book</v-btn>
                  </v-col>
                </v-row>
                <v-alert v-if="bookingError" type="error" dense>{{ bookingError }}</v-alert>
                <v-alert v-if="bookingSuccess" type="success" dense>{{ bookingSuccess }}</v-alert>
              </v-form>
            </div>
          </v-card-text>
        </v-card>
        <v-dialog v-model="reviewDialog" max-width="500">
          <v-card>
            <v-card-title>Leave a Review</v-card-title>
            <v-card-text>
              <v-form @submit.prevent="submitReview">
                <v-rating v-model="reviewForm.rating" background-color="grey lighten-2" color="amber" large></v-rating>
                <v-textarea v-model="reviewForm.comment" label="Comment" outlined dense required></v-textarea>
                <v-alert v-if="reviewError" type="error" dense>{{ reviewError }}</v-alert>
                <v-alert v-if="reviewSuccess" type="success" dense>{{ reviewSuccess }}</v-alert>
                <v-card-actions class="justify-end">
                  <v-btn text color="grey darken-1" @click="reviewDialog = false">Cancel</v-btn>
                  <v-btn color="primary" type="submit" :loading="reviewLoading">Submit</v-btn>
                </v-card-actions>
              </v-form>
            </v-card-text>
          </v-card>
        </v-dialog>
        <v-divider class="my-4"></v-divider>
        <div class="font-weight-bold mb-2">Reviews</div>
        <v-simple-table v-if="reviews.length">
          <thead>
            <tr>
              <th>User</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
              <th v-if="canDeleteReview">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="review in reviews" :key="review.review_id">
              <td>{{ review.user?.user_name || 'Anonymous' }}</td>
              <td>
                <v-rating :value="review.rating" color="amber" dense readonly size="16"></v-rating>
              </td>
              <td>{{ review.comment }}</td>
              <td>{{ formatDate(review.date_posted) }}</td>
              <td v-if="canDeleteReview && review.user_id === currentUserId">
                <v-btn icon small color="error" @click="deleteReview(review.review_id)">
                  <v-icon small>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-simple-table>
        <div v-else class="text-center grey--text">No reviews yet.</div>
        <v-btn color="secondary" class="mt-4" @click="openReviewDialog" v-if="!isOwner">Leave a Review</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { authUtils } from '@/utils/auth'

export default {
  name: 'PageCampSpot',
  data() {
    return {
      spot: null,
      bookings: [],
      loading: true,
      isOwner: false,
      bookingForm: {
        startDate: '',
        endDate: ''
      },
      bookingLoading: false,
      bookingError: '',
      bookingSuccess: '',
      startMenu: false,
      endMenu: false,
      reviewDialog: false,
      reviewForm: {
        rating: 0,
        comment: ''
      },
      reviewLoading: false,
      reviewError: '',
      reviewSuccess: '',
      reviews: [],
      currentUserId: null,
      today: new Date().toISOString().substr(0, 10),
    }
  },
  created() {
    this.fetchSpot();
  },
  computed: {
    bookedDateRanges() {
      // Only consider non-cancelled bookings
      return this.bookings
        .filter(b => b.status !== 'cancelled')
        .map(b => ({
          start: b.startDate ? b.startDate.substr(0, 10) : '',
          end: b.endDate ? b.endDate.substr(0, 10) : ''
        }));
    }
  },
  methods: {
    async fetchSpot() {
      this.loading = true;
      const id = this.$route.params.id;
      try {
        // Get spot details
        const res = await fetch(`http://localhost:3000/campspots/${id}`, {
          headers: {
            ...authUtils.getAuthHeaders()
          }
        });
        if (!res.ok) throw new Error('Not found');
        this.spot = await res.json();
        await this.fetchBookings();
        await this.fetchReviews();
        
        // Get current user to check owner
        const userRes = await fetch('http://localhost:3000/users/me', {
          headers: {
            ...authUtils.getAuthHeaders()
          }
        });
        if (userRes.ok) {
          const user = await userRes.json();
          this.isOwner = user.user_id === this.spot.owner_id;
          this.currentUserId = user.user_id;
        } else {
          this.isOwner = false;
          this.currentUserId = null;
        }
      } catch (e) {
        this.spot = null;
      } finally {
        this.loading = false;
      }
    },
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
    },
    async bookSpot() {
      this.bookingLoading = true;
      this.bookingError = '';
      this.bookingSuccess = '';
      try {
        if (!this.bookingForm.startDate || !this.bookingForm.endDate) {
          this.bookingError = 'Please select both start and end dates.';
          return;
        }
        const res = await fetch('http://localhost:3000/bookings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...authUtils.getAuthHeaders()
          },
          body: JSON.stringify({
            campspot_id: this.spot.campspot_id,
            startDate: this.bookingForm.startDate,
            endDate: this.bookingForm.endDate
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          this.bookingError = err.message || 'Booking failed.';
          return;
        }
        this.bookingSuccess = 'Booking successful!';
        this.bookingForm.startDate = '';
        this.bookingForm.endDate = '';
        await this.fetchBookings();
      } catch (e) {
        this.bookingError = 'Booking failed.';
      } finally {
        this.bookingLoading = false;
      }
    },
    async fetchBookings() {
      const id = this.spot.campspot_id;
      try {
        const bookingsRes = await fetch(`http://localhost:3000/bookings?campspot_id=${id}`, {
          headers: {
            ...authUtils.getAuthHeaders()
          }
        });
        if (bookingsRes.ok) {
          this.bookings = await bookingsRes.json();
        } else {
          this.bookings = [];
        }
      } catch (e) {
        this.bookings = [];
      }
    },
    async fetchReviews() {
      try {
        const res = await fetch(`http://localhost:3000/reviews?campspot_id=${this.spot.campspot_id}`);
        if (res.ok) {
          this.reviews = await res.json();
        } else {
          this.reviews = [];
        }
      } catch (e) {
        this.reviews = [];
      }
    },
    editSpot() {
      this.$router.push(`/owner/edit-spot/${this.spot.campspot_id}`);
    },
    deleteSpot() {
      // Implement delete logic if needed
      alert('Delete not implemented');
    },
    openReviewDialog() {
      this.reviewDialog = true;
      this.reviewForm = { rating: 0, comment: '' };
      this.reviewError = '';
      this.reviewSuccess = '';
    },
    async submitReview() {
      this.reviewLoading = true;
      this.reviewError = '';
      this.reviewSuccess = '';
      try {
        if (!this.reviewForm.rating || !this.reviewForm.comment) {
          this.reviewError = 'Please provide a rating and comment.';
          this.reviewLoading = false;
          return;
        }
        const res = await fetch('http://localhost:3000/reviews', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...authUtils.getAuthHeaders()
          },
          body: JSON.stringify({
            campspot_id: this.spot.campspot_id,
            rating: this.reviewForm.rating,
            comment: this.reviewForm.comment
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          this.reviewError = err.message || 'Failed to submit review.';
          this.reviewLoading = false;
          return;
        }
        this.reviewSuccess = 'Review submitted!';
        this.reviewDialog = false;
        await this.fetchReviews();
      } catch (e) {
        this.reviewError = 'Failed to submit review.';
      } finally {
        this.reviewLoading = false;
      }
    },
    get canDeleteReview() {
      return !!this.currentUserId;
    },
    async deleteReview(reviewId) {
      if (!confirm('Are you sure you want to delete this review?')) return;
      try {
        const res = await fetch(`http://localhost:3000/reviews/${reviewId}`, {
          method: 'DELETE',
          headers: {
            ...authUtils.getAuthHeaders()
          }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          this.$toast?.error?.(err.message || 'Failed to delete review.');
          return;
        }
        this.$toast?.success?.('Review deleted!');
        await this.fetchReviews();
      } catch (e) {
        this.$toast?.error?.('Failed to delete review.');
      }
    },
    allowedStartDates(date) {
      // Only allow today or later, and not in any booked range
      if (date < this.today) return false;
      for (const range of this.bookedDateRanges) {
        if (date >= range.start && date <= range.end) return false;
      }
      return true;
    },
    allowedEndDates(date) {
      // Only allow end date after start date, not in any booked range
      if (!this.bookingForm.startDate) return false;
      if (date < this.bookingForm.startDate) return false;
      for (const range of this.bookedDateRanges) {
        if (date >= range.start && date <= range.end) return false;
      }
      return true;
    },
  }
}
</script>

<style scoped>
.camp-spot-container {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 32px;
  padding-bottom: 32px;
}
.camp-spot-card {
  border-radius: 14px;
  transition: box-shadow 0.2s, transform 0.2s;
}
.camp-spot-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.18) !important;
  transform: translateY(-4px) scale(1.02);
}
</style>
