<template>
  <v-container class="edit-spot-container" fluid>
    <v-row class="justify-center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-6 elevation-2">
          <v-card-title class="headline primary--text mb-2">
            Edit Camping Spot
          </v-card-title>
          <v-card-subtitle class="mb-4">
            Update the details of your camping spot below.
          </v-card-subtitle>
          <v-form ref="editSpotForm" v-model="formValid" @submit.prevent="submitEdit">
            <v-text-field
              v-model="form.name"
              label="Spot Name"
              :rules="[v => !!v || 'Name is required']"
              required
              outlined
              dense
              class="mb-3"
            />
            <v-textarea
              v-model="form.description"
              label="Description"
              :rules="[v => !!v || 'Description is required']"
              required
              outlined
              dense
              rows="3"
              class="mb-3"
            />
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.price_per_night"
                  label="Price per Night ($)"
                  type="number"
                  :rules="[v => v > 0 || 'Price must be positive']"
                  required
                  outlined
                  dense
                  class="mb-3"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.capacity"
                  label="Capacity (people)"
                  type="number"
                  :rules="[v => v > 0 || 'Capacity must be positive']"
                  required
                  outlined
                  dense
                  class="mb-3"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.location.city"
                  label="City"
                  :rules="[v => !!v || 'City is required']"
                  required
                  outlined
                  dense
                  class="mb-3"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.location.country"
                  label="Country"
                  :rules="[v => !!v || 'Country is required']"
                  required
                  outlined
                  dense
                  class="mb-3"
                />
              </v-col>
            </v-row>
            <v-select
              v-model="form.amenities"
              :items="availableAmenities"
              label="Amenities"
              multiple
              chips
              outlined
              dense
              class="mb-3"
            />
            <v-row class="mt-4">
              <v-col cols="12" sm="6">
                <v-btn
                  color="primary"
                  block
                  :loading="loading"
                  :disabled="!formValid || loading"
                  type="submit"
                >
                  <v-icon left>mdi-content-save</v-icon>
                  Save Changes
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6">
                <v-btn block text color="grey" @click="cancelEdit">
                  Cancel
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout">
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar.show = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { authUtils } from '@/utils/auth';

export default {
  name: 'PageEditSpot',
  data() {
    return {
      form: {
        name: '',
        description: '',
        price_per_night: 0,
        capacity: 1,
        location: {
          city: '',
          country: ''
        },
        imageUrl: '',
        amenities: []
      },
      availableAmenities: [
        'Wifi', 'Shower', 'Toilets', 'Electricity', 'Water',
        'Fireplace', 'Picnic Table', 'BBQ Grill', 'Parking',
        'Pet Friendly', 'Kitchen', 'Wheelchair Accessible',
        'Laundry', 'Swimming Pool', 'Playground'
      ],
      formValid: false,
      loading: false,
      snackbar: {
        show: false,
        text: '',
        color: 'success',
        timeout: 3000
      }
    }
  },
  created() {
    this.loadSpot();
  },
  methods: {
    async loadSpot() {
      // Get spot ID from route
      const id = this.$route.params.id;
      this.loading = true;      try {
        const res = await fetch(`http://localhost:3000/campspots/${id}`, {
          headers: {
            ...authUtils.getAuthHeaders()
          }
        });
        if (!res.ok) throw new Error('Failed to load spot');
        const spot = await res.json();
        this.form = {
          name: spot.name,
          description: spot.description,
          price_per_night: spot.price_per_night,
          capacity: spot.capacity,
          location: {
            city: spot.location.city,
            country: spot.location.country
          },
          imageUrl: spot.imageUrl || '',
          amenities: (spot.amenities || []).map(a => a.amenity_name)
        };
      } catch (e) {
        this.showSnackbar('Could not load spot details', 'error');
      } finally {
        this.loading = false;
      }
    },
    async submitEdit() {
      if (!this.$refs.editSpotForm.validate()) return;
      this.loading = true;
      const id = this.$route.params.id;
      try {
        // Update spot main info
        const res = await fetch(`http://localhost:3000/campspots/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authUtils.getAuthHeaders()
          },
          body: JSON.stringify({
            name: this.form.name,
            description: this.form.description,
            price_per_night: this.form.price_per_night,
            capacity: this.form.capacity,
            location: this.form.location,
          })
        });
        if (!res.ok) throw new Error('Failed to update spot');
        
        // Update amenities (optional: you may want to sync with backend)
        await fetch(`http://localhost:3000/amenities/bulk-update/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authUtils.getAuthHeaders()
          },
          body: JSON.stringify({ amenities: this.form.amenities })
        });
        this.showSnackbar('Spot updated successfully', 'success');
        setTimeout(() => this.$router.push('/owner/spots'), 1200);
      } catch (e) {
        this.showSnackbar('Failed to update spot', 'error');
      } finally {
        this.loading = false;
      }
    },
    cancelEdit() {
      this.$router.back();
    },
    showSnackbar(text, color = 'success') {
      this.snackbar = { show: true, text, color, timeout: 3000 };
    }
  }
}
</script>

<style scoped>
.edit-spot-container {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 32px;
  padding-bottom: 32px;
}
@media (max-width: 960px) {
  .edit-spot-container {
    padding-top: 12px;
    padding-bottom: 12px;
  }
}
</style>
