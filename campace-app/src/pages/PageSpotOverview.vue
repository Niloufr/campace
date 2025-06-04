<template>
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card class="mb-6">
            <v-card-title class="headline primary white--text">
              My Camping Spots
            </v-card-title>
            <v-card-subtitle class="py-2">
              Manage all your registered camping spots
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>
  
      <!-- Loading state -->
      <v-row v-if="loading">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4">Loading your camping spots...</p>
        </v-col>
      </v-row>
  
      <!-- Error message -->
      <v-row v-else-if="error">
        <v-col cols="12">
          <v-alert type="error">
            {{ error }}
          </v-alert>
        </v-col>
      </v-row>
  
      <!-- No camping spots message -->
      <v-row v-else-if="campspots.length === 0">
        <v-col cols="12">
          <v-alert type="info">
            You don't have any camping spots yet. Start by creating your first one!
          </v-alert>
          <v-btn 
            color="primary" 
            class="mt-4" 
            large 
            @click="$router.push('/owner/create-spot')"
          >
            <v-icon left>mdi-plus</v-icon>
            Create New Camping Spot
          </v-btn>
        </v-col>
      </v-row>
  
      <!-- Camping spots grid -->
      <v-row v-else>
        <v-col cols="12" md="4" v-for="spot in campspots" :key="spot.campspot_id">
          <v-card height="100%" class="d-flex flex-column">
            <v-img
              height="160"
              src="https://via.placeholder.com/400x200?text=Camping+Spot"
              class="white--text align-end"
            >
              <v-card-title>{{ spot.name }}</v-card-title>
            </v-img>
  
            <v-card-text>
              <div class="mb-2">
                <v-icon small class="mr-1">mdi-map-marker</v-icon>
                {{ spot.location.city }}, {{ spot.location.country }}
              </div>
              <div class="mb-2">
                <v-icon small class="mr-1">mdi-currency-usd</v-icon>
                ${{ spot.price_per_night }} per night
              </div>
              <div class="mb-2">
                <v-icon small class="mr-1">mdi-account-group</v-icon>
                Capacity: {{ spot.capacity }} people
              </div>
              <div class="text-truncate mb-2">
                <v-icon small class="mr-1">mdi-information</v-icon>
                {{ spot.description }}
              </div>
            </v-card-text>
  
            <v-divider></v-divider>
  
            <v-card-title class="py-2">
              Amenities
              <v-spacer></v-spacer>
              <v-btn
                small
                color="primary"
                class="text-none"
                @click="openAddAmenityDialog(spot)"
              >
                <v-icon small left>mdi-plus</v-icon>
                ADD
              </v-btn>
            </v-card-title>
  
            <v-card-text v-if="spotAmenities[spot.campspot_id] && spotAmenities[spot.campspot_id].length > 0" class="pt-0">
              <v-chip
                v-for="amenity in spotAmenities[spot.campspot_id]"
                :key="amenity.amenity_name"
                class="ma-1"
                close
                @click:close="confirmDeleteAmenity(amenity.amenity_id, spot.campspot_id)"
              >
                {{ amenity.amenity_name }}
              </v-chip>
            </v-card-text>
            <v-card-text v-else class="text-center text-subtitle-2 grey--text pt-0">
              No amenities added yet
            </v-card-text>
  
            <v-spacer></v-spacer>
  
            <v-card-actions class="pt-0">
              <v-btn text color="primary" class="text-none" :to="`/owner/edit-spot/${spot.campspot_id}`">
                <v-icon left small>mdi-pencil</v-icon>
                EDIT
              </v-btn>
              <v-btn text color="success" class="text-none" :to="`/owner/availability/${spot.campspot_id}`">
                <v-icon left small>mdi-calendar</v-icon>
                AVAILABILITY
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn text color="error" class="text-none" @click="confirmDeleteSpot(spot)">
                <v-icon left small>mdi-delete</v-icon>
                DELETE
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
  
      <!-- Add a new camping spot button -->
      <v-btn
        v-if="campspots.length > 0"
        color="primary"
        fab
        fixed
        bottom
        right
        class="mb-4 mr-4"
        @click="$router.push('/owner/create-spot')"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
  
      <!-- Add Amenity Dialog -->
      <v-dialog v-model="addAmenityDialog" max-width="500px">
        <v-card>
          <v-card-title>Add Amenity</v-card-title>
          <v-card-text>
            <v-form ref="amenityForm" v-model="amenityFormValid" @submit.prevent="addAmenity">
              <v-select
                v-model="newAmenity.amenity_name"
                :items="availableAmenities"
                label="Select Amenity"
                required
                :rules="[v => !!v || 'Amenity is required']"
              ></v-select>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text color="error" @click="addAmenityDialog = false">Cancel</v-btn>
            <v-btn 
              color="primary" 
              :disabled="!amenityFormValid || amenityLoading" 
              @click="addAmenity"
            >
              <v-icon v-if="amenityLoading" left>mdi-loading mdi-spin</v-icon>
              <span v-else>Add</span>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <!-- Delete Amenity Confirmation Dialog -->
      <v-dialog v-model="deleteAmenityDialog" max-width="400px">
        <v-card>
          <v-card-title class="headline">Remove Amenity</v-card-title>
          <v-card-text>
            Are you sure you want to remove this amenity? This action cannot be undone.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="deleteAmenityDialog = false">Cancel</v-btn>
            <v-btn 
              color="error" 
              text 
              :loading="amenityLoading"
              @click="deleteAmenity"
            >
              Remove
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <!-- Delete Spot Confirmation Dialog -->
      <v-dialog v-model="deleteSpotDialog" max-width="400px">
        <v-card>
          <v-card-title class="headline">Delete Camping Spot</v-card-title>
          <v-card-text>
            Are you sure you want to delete <strong>{{ spotToDelete?.name }}</strong>? This action cannot be undone and will remove all associated bookings and amenities.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="deleteSpotDialog = false">Cancel</v-btn>
            <v-btn 
              color="error" 
              text 
              :loading="deleteSpotLoading"
              @click="deleteSpot"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <!-- Snackbar for notifications -->
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
  export default {
    name: 'OwnerSpotsOverview',
    data() {
      return {
        // Main data
        campspots: [],
        spotAmenities: {},
        loading: true,
        error: null,
        
        // Available amenities list
        availableAmenities: [
          'Wifi', 'Shower', 'Toilets', 'Electricity', 'Water',
          'Fireplace', 'Picnic Table', 'BBQ Grill', 'Parking',
          'Pet Friendly', 'Kitchen', 'Wheelchair Accessible',
          'Laundry', 'Swimming Pool', 'Playground'
        ],
        
        // Add amenity dialog
        addAmenityDialog: false,
        amenityFormValid: false,
        selectedSpot: null,
        newAmenity: {
          campspot_id: null,
          amenity_name: ''
        },
        amenityLoading: false,
        
        // Delete amenity dialog
        deleteAmenityDialog: false,
        amenityToDelete: null,
        
        // Delete spot dialog
        deleteSpotDialog: false,
        spotToDelete: null,
        deleteSpotLoading: false,
        
        // Snackbar
        snackbar: {
          show: false,
          text: '',
          color: 'success',
          timeout: 3000
        }
      };
    },
    created() {
      this.fetchCampspots();
    },
    methods: {
      async fetchCampspots() {
        this.loading = true;
        this.error = null;
        
        try {
          const response = await fetch("http://localhost:3000/campspots", {credentials: 'include'});
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to load camping spots');
          }
          
          this.campspots = await response.json();
          
          // Fetch amenities for each campspot
          for (const spot of this.campspots) {
            await this.fetchAmenities(spot.campspot_id);
          }
        } catch (error) {
          console.error('Error fetching camping spots:', error);
          this.error = error.message || 'Failed to load camping spots';
        } finally {
          this.loading = false;
        }
      },
      
      async fetchAmenities(campspotId) {
        try {
          const response = await fetch(`http://localhost:3000/amenities/?campspot_id=${campspotId}`, {credentials: 'include'});
          
          if (!response.ok) {
            throw new Error('Failed to fetch amenities');
          }
          
          const amenities = await response.json();
          this.$set(this.spotAmenities, campspotId, amenities);
        } catch (error) {
          console.error(`Error fetching amenities for spot ${campspotId}:`, error);
          // Set empty array in case of error
          this.$set(this.spotAmenities, campspotId, []);
        }
      },
      
      openAddAmenityDialog(spot) {
        this.selectedSpot = spot;
        this.newAmenity = {
          campspot_id: spot.campspot_id,
          amenity_name: ''
        };
        
        // Filter out already added amenities
        const currentAmenities = this.spotAmenities[spot.campspot_id] || [];
        const currentAmenityNames = currentAmenities.map(a => a.amenity_name);
        
        // Only show amenities that haven't been added yet
        this.filteredAvailableAmenities = this.availableAmenities.filter(
          amenity => !currentAmenityNames.includes(amenity)
        );
        
        this.addAmenityDialog = true;
      },
      
      async addAmenity() {
        if (!this.$refs.amenityForm.validate()) return;
        
        this.amenityLoading = true;
        
        try {
          const response = await fetch('http://localhost:3000/amenities', {
            credentials: 'include',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.newAmenity)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add amenity');
          }
          
          // Refresh amenities for this spot
          await this.fetchAmenities(this.newAmenity.campspot_id);
          
          this.showSnackbar('Amenity added successfully', 'success');
          this.addAmenityDialog = false;
        } catch (error) {
          console.error('Error adding amenity:', error);
          this.showSnackbar(
            error.message || 'Failed to add amenity',
            'error'
          );
        } finally {
          this.amenityLoading = false;
        }
      },
      
      confirmDeleteAmenity(id, campspot_id) {
        this.amenityToDelete = {
          amenity_id: id,
          campspot_id: campspot_id
        }
        this.deleteAmenityDialog = true;
      },
      
      async deleteAmenity() {
        this.amenityLoading = true;
        
        try {
          const response = await fetch(`http://localhost:3000/amenities/${this.amenityToDelete.amenity_id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to remove amenity');
          }
          
          // Refresh amenities for this spot
          await this.fetchAmenities(this.amenityToDelete.campspot_id);
          
          this.showSnackbar('Amenity removed successfully', 'success');
          this.deleteAmenityDialog = false;
        } catch (error) {
          console.error('Error removing amenity:', error);
          this.showSnackbar(
            error.message || 'Failed to remove amenity',
            'error'
          );
        } finally {
          this.amenityLoading = false;
        }
      },
      
      confirmDeleteSpot(spot) {
        this.spotToDelete = spot;
        this.deleteSpotDialog = true;
      },
      
      async deleteSpot() {
        this.deleteSpotLoading = true;
        
        try {
          const response = await fetch(`http://localhost:3000/campspots/${this.spotToDelete.campspot_id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete camping spot');
          }
          
          // Remove from local list
          this.campspots = this.campspots.filter(
            spot => spot.campspot_id !== this.spotToDelete.campspot_id
          );
          
          this.showSnackbar('Camping spot deleted successfully', 'success');
          this.deleteSpotDialog = false;
        } catch (error) {
          console.error('Error deleting camping spot:', error);
          this.showSnackbar(
            error.message || 'Failed to delete camping spot',
            'error'
          );
        } finally {
          this.deleteSpotLoading = false;
        }
      },
      
      showSnackbar(text, color = 'success') {
        this.snackbar = {
          show: true,
          text,
          color,
          timeout: 3000
        };
      }
    }
  };
  </script>
  
  <style scoped>
  .v-card {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .v-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
  }
  </style>