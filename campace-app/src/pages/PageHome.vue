<!-- Home.vue -->
<template>
  <div>
    <!-- Hero Section -->
    <v-row class="mb-8">
      <v-col cols="12" class="text-center">
        <h1 class="text-h3 mb-4">Find Your Perfect Camping Spot</h1>
        <p class="text-h6 mb-8">Discover unique camping experiences around the world</p>
        
        <!-- Search Form -->
        <v-card class="search-form mx-auto" max-width="800">
          <v-form @submit.prevent="searchCampingSites">            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="city"
                  label="City"
                  placeholder="Enter city name"
                  prepend-inner-icon="mdi-city"
                  outlined
                  dense
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="country"
                  label="Country"
                  placeholder="Enter country name"
                  prepend-inner-icon="mdi-earth"
                  outlined
                  dense
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="minPrice"
                  label="Min Price"
                  type="number"
                  prepend-inner-icon="mdi-currency-usd"
                  outlined
                  dense
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="maxPrice"
                  label="Max Price"
                  type="number"
                  prepend-inner-icon="mdi-currency-usd"
                  outlined
                  dense
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="selectedAmenities"
                  :items="amenityOptions"
                  label="Amenities"
                  multiple
                  prepend-inner-icon="mdi-shower"
                  outlined
                  dense
                ></v-select>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="minSpots"
                  label="Min Number of Spots"
                  type="number"
                  prepend-inner-icon="mdi-counter"
                  outlined
                  dense
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="maxSpots"
                  label="Max Number of Spots"
                  type="number"
                  prepend-inner-icon="mdi-counter"
                  outlined
                  dense
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <!-- <v-col cols="12" sm="6">
                <v-select
                  v-model="guestCount"
                  :items="guestOptions"
                  label="Guests"
                  prepend-inner-icon="mdi-account-group"
                  outlined
                  dense
                ></v-select>
              </v-col> -->
              <v-col cols="12" sm="6" class="d-flex align-center">                <v-btn
                  color="primary"
                  block
                  type="submit"
                  :loading="loadingLocations"
                  :disabled="!city && !country"
                >
                  Search
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-col>
    </v-row>

    <!-- Popular Destinations -->
    <v-row class="mb-8">
      <v-col cols="12" class="text-center">
        <h2 class="section-title">Popular Camping Destinations</h2>
        <v-row>
          <v-col v-for="location in popularLocations" :key="location.location_id" cols="12" sm="6" md="4">
            <v-card class="mx-auto card-hover elevation-hover" max-width="400" @click="navigateToLocation(location)">
              <v-img
                :src="'https://picsum.photos/400/300?random=' + location.location_id"
                height="200"
                cover
              ></v-img>
              <v-card-title>{{ location.city }}, {{ location.country }}</v-card-title>
              <v-card-text>
                <div class="text-subtitle-1">{{ location.campspotCount }} camping spots</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Features Section -->
    <v-row class="mb-8">
      <v-col cols="12" class="text-center">
        <h2 class="section-title">Why Choose CampAce?</h2>
        <v-row>
          <v-col cols="12" md="4">
            <v-card class="mx-auto rounded-card elevation-hover" max-width="400">
              <v-card-text class="text-center">
                <v-icon size="64" color="primary" class="mb-4">mdi-tent</v-icon>
                <h3 class="text-h5 mb-2">Unique Camping Spots</h3>
                <p>Discover handpicked camping locations that offer unforgettable experiences.</p>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="mx-auto rounded-card elevation-hover" max-width="400">
              <v-card-text class="text-center">
                <v-icon size="64" color="primary" class="mb-4">mdi-shield-check</v-icon>
                <h3 class="text-h5 mb-2">Verified Hosts</h3>
                <p>All our hosts are verified to ensure safe and reliable camping experiences.</p>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="mx-auto rounded-card elevation-hover" max-width="400">
              <v-card-text class="text-center">
                <v-icon size="64" color="primary" class="mb-4">mdi-currency-usd</v-icon>
                <h3 class="text-h5 mb-2">Best Price Guarantee</h3>
                <p>We offer competitive prices and a best price guarantee for all our listings.</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { authUtils } from '@/utils/auth'

export default {
  name: 'HomePage',
  data() {
    return {
      // Search form data
      city: '',
      country: '',
      minPrice: null,
      maxPrice: null,
      selectedAmenities: [],
      amenityOptions: [
        { text: 'Wifi', value: 'Wifi' },
        { text: 'Shower', value: 'Shower' },
        { text: 'Toilets', value: 'Toilets' },
        { text: 'Electricity', value: 'Electricity' },
        { text: 'Water', value: 'Water' },
        { text: 'Fireplace', value: 'Fireplace' },
        { text: 'Picnic Table', value: 'Picnic Table' },
        { text: 'BBQ Grill', value: 'BBQ Grill' },
        { text: 'Parking', value: 'Parking' },
        { text: 'Pet Friendly', value: 'Pet Friendly' },
        { text: 'Kitchen', value: 'Kitchen' },
        { text: 'Wheelchair Accessible', value: 'Wheelchair Accessible' },
        { text: 'Laundry', value: 'Laundry' },
        { text: 'Swimming Pool', value: 'Swimming Pool' },
        { text: 'Playground', value: 'Playground' }
      ],
      minSpots: null,
      maxSpots: null,
      loadingLocations: false,
      checkInDate: '',
      checkOutDate: '',
      checkInMenu: false,
      checkOutMenu: false,
      guestCount: 1,
      guestOptions: [
        { text: '1 Guest', value: 1 },
        { text: '2 Guests', value: 2 },
        { text: '3 Guests', value: 3 },
        { text: '4 Guests', value: 4 },
        { text: '5 Guests', value: 5 },
        { text: '6+ Guests', value: 6 }
      ],
      popularLocations: [],
      loadingPopularLocations: false
    }
  },
  methods: {
    searchCampingSites() {
      if (!this.city && !this.country && !this.minPrice && !this.maxPrice && !this.selectedAmenities.length && !this.minSpots && !this.maxSpots) {
        this.$toast.error('Please enter at least one search criteria');
        return;
      }
      const queryParams = new URLSearchParams();
      if (this.city) queryParams.append('city', this.city);
      if (this.country) queryParams.append('country', this.country);
      if (this.minPrice !== null) queryParams.append('minPrice', this.minPrice); // backend expects min_price
      if (this.maxPrice !== null) queryParams.append('maxPrice', this.maxPrice); // backend expects max_price
      if (this.selectedAmenities.length) queryParams.append('amenities', this.selectedAmenities.join(',')); // backend expects amenities as comma-separated
      if (this.minSpots !== null) queryParams.append('minCapacity', this.minSpots); // backend expects min_capacity
      if (this.maxSpots !== null) queryParams.append('maxCapacity', this.maxSpots); // backend expects max_capacity
      this.$router.push({
        path: '/search',
        query: Object.fromEntries(queryParams)
      });
    },
    async fetchPopularLocations() {
      this.loadingPopularLocations = true;
      try {
        const res = await fetch('http://localhost:3000/locations/popular', {
          headers: {
            ...authUtils.getAuthHeaders()
          }
        });
        if (!res.ok) throw new Error('Failed to fetch popular locations');
        this.popularLocations = await res.json();
      } catch (error) {
        console.error('Error fetching popular locations:', error);
        this.$toast.error('Failed to load popular destinations');
      } finally {
        this.loadingPopularLocations = false;
      }
    },    navigateToLocation(location) {
      this.$router.push({
        path: '/search',
        query: {
          city: location.city,
          country: location.country
        }
      });
    }
  },
  created() {
    this.fetchPopularLocations();
  }
}
</script>

<style scoped>
.search-form {
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.v-icon {
  margin-bottom: 1rem;
}
</style>