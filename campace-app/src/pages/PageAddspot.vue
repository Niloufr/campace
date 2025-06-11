<template>
    <v-container class="pa-4">
      <!-- Location Selection Section -->
      <v-card class="mb-4" flat>
        <v-card-title class="pb-0">
          Select Location
          <v-spacer></v-spacer>
          <v-btn color="primary" small @click="openAddLocationDialog">
            <v-icon small left>mdi-plus</v-icon>
            Add Location
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-simple-table>
            <thead>
              <tr>
                <th class="text-left">Address</th>
                <th class="text-left">City</th>
                <th class="text-left">Country</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="locations.length === 0">
                <td colspan="5" class="text-center py-4">
                  No locations available. Please add a location.
                </td>
              </tr>
              <tr 
                v-for="location in locations" 
                :key="location.location_id"
                :class="{'selected-row': campspot.location_id === location.location_id}"
                style="cursor: pointer"
              >
                <td @click="selectLocation(location.location_id)">{{ location.address }}</td>
                <td @click="selectLocation(location.location_id)">{{ location.city }}</td>
                <td @click="selectLocation(location.location_id)">{{ location.country }}</td>
                <td class="actions-cell">
                  <v-btn icon small color="primary" @click.stop="editLocation(location)">
                    <v-icon small>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn icon small color="error" @click.stop="confirmDeleteLocation(location)">
                    <v-icon small>mdi-delete</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card-text>
      </v-card>
  
      <!-- Campspot Form Section -->
      <v-card>
        <v-card-title>
          Create New Campspot
        </v-card-title>
        <v-card-text>
          <v-form ref="campspotForm" @submit.prevent="submitCampspot">
            <v-alert
              v-if="!campspot.location_id"
              type="warning"
              dense
              class="mb-4"
            >
              Please select a location before creating a campspot
            </v-alert>
            
            <v-text-field label="Campspot Name" v-model="campspot.name" outlined dense required></v-text-field>
            <v-textarea label="Description" v-model="campspot.description" outlined dense required></v-textarea>
            <v-text-field label="Price Per Night" v-model="campspot.price_per_night" type="number" outlined dense required></v-text-field>
            <v-text-field label="Capacity" v-model="campspot.capacity" type="number" outlined dense required></v-text-field>
            
            <v-card-actions class="px-0 pt-4">
              <v-spacer></v-spacer>
              <v-btn text color="grey darken-1" @click="resetCampspot">Cancel</v-btn>
              <v-btn color="success" type="submit" :disabled="!campspot.location_id">Create Campspot</v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
  
      <!-- Dialog to create/update location -->
      <v-dialog v-model="locationDialog" max-width="500">
        <v-card>
          <v-card-title>
            <span class="headline">{{ editMode ? 'Update Location' : 'Create New Location' }}</span>
          </v-card-title>
  
          <v-card-text>
            <v-form ref="locationForm" @submit.prevent="submitLocation">
              <v-text-field label="Address" v-model="newLocation.address" outlined dense required></v-text-field>
              <v-text-field label="City" v-model="newLocation.city" outlined dense required></v-text-field>
              <v-text-field label="Province/State" v-model="newLocation.province_or_state" outlined dense></v-text-field>
              <v-text-field label="Country" v-model="newLocation.country" outlined dense required></v-text-field>
              <v-text-field label="Postal Code" v-model="newLocation.postal_code" outlined dense required></v-text-field>
  
              <v-card-actions class="justify-end pt-4">
                <v-btn text color="grey darken-1" @click="locationDialog = false">Cancel</v-btn>
                <v-btn color="primary" type="submit">{{ editMode ? 'Update' : 'Save' }}</v-btn>
              </v-card-actions>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>
  
      <!-- Confirmation dialog for deletion -->
      <v-dialog v-model="deleteDialog" max-width="400">
        <v-card>
          <v-card-title class="headline">Delete Location</v-card-title>
          <v-card-text>
            Are you sure you want to delete this location?
            <p class="mt-2"><strong>Address:</strong> {{ locationToDelete?.address }}</p>
            <p><strong>City:</strong> {{ locationToDelete?.city }}, {{ locationToDelete?.country }}</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-1" text @click="deleteDialog = false">Cancel</v-btn>
            <v-btn color="error" @click="deleteLocation">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </template>
  
  <script>
  import { authUtils } from '@/utils/auth'

  export default {
    name: 'CampspotCreator',
    data() {
      return {
        campspot: {
          name: '',
          description: '',
          price_per_night: null,
          capacity: null,
          location_id: null
        },
        locations: [],
        locationDialog: false,
        deleteDialog: false,
        editMode: false,
        locationToDelete: null,
        newLocation: {
          location_id: null,
          address: '',
          city: '',
          province_or_state: '',
          country: '',
          postal_code: null
        }
      }
    },
    created() {
      this.fetchLocations();
    },
    mounted() {
      // Make sure the app has the data-app attribute for Vuetify dialogs
      if (!document.querySelector('[data-app]')) {
        const app = document.createElement('div');
        app.setAttribute('data-app', true);
        document.body.appendChild(app);
      }
    },
    methods: {
      async fetchLocations() {
        try {
          const res = await fetch('http://localhost:3000/locations', {
            headers: {
              ...authUtils.getAuthHeaders()
            }
          });
          const data = await res.json();
          this.locations = data;
        } catch (error) {
          console.error(error);
          this.$toast.error('Failed to load locations');
        }
      },
      
      selectLocation(locationId) {
        this.campspot.location_id = locationId;
      },
      
      openAddLocationDialog() {
        this.editMode = false;
        this.resetNewLocation();
        this.locationDialog = true;
      },
      
      editLocation(location) {
        this.editMode = true;
        this.newLocation = { ...location };
        this.locationDialog = true;
      },
      
      confirmDeleteLocation(location) {
        this.locationToDelete = location;
        this.deleteDialog = true;
      },
      
      async deleteLocation() {
        try {
          const res = await fetch(`http://localhost:3000/locations/${this.locationToDelete.location_id}`, {
            method: 'DELETE',
            headers: {
              ...authUtils.getAuthHeaders()
            }
          });
          let result;
          try {
            result = await res.json();
          } catch (e) {
            result = {};
          }
          if (!res.ok) throw result;
          this.locations = this.locations.filter(
            location => location.location_id !== this.locationToDelete.location_id
          );
          if (this.campspot.location_id === this.locationToDelete.location_id) {
            this.campspot.location_id = null;
          }
          this.deleteDialog = false;
          this.$toast.success('Location deleted successfully!');
        } catch (error) {
          this.$toast.error(error.message || 'Error deleting location');
        }
      },
      
      async submitCampspot() {
        try {
          if (!this.campspot.location_id) {
            return this.$toast.error('Please select a location first');
          }
          
          const campspotData = {
            ...this.campspot,
            location_id: Number(this.campspot.location_id),
            price_per_night: Number(this.campspot.price_per_night),
            capacity: Number(this.campspot.capacity)
          };
          
          const res = await fetch('http://localhost:3000/campspots', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...authUtils.getAuthHeaders()
            },
            body: JSON.stringify(campspotData)
          });
          
          if (!res.ok) throw await res.json();
          
          this.$emit('campspotCreated');
          this.$toast.success('Campspot created successfully!');
          this.resetCampspot();
        } catch (error) {
          this.$toast.error(error.message || 'Error creating campspot');
        }
      },
      
      async submitLocation() {
        try {
          const locationData = {
            ...this.newLocation,
            postal_code: String(this.newLocation.postal_code)
          };
          
          let res;
          if (this.editMode) {
            res = await fetch(`http://localhost:3000/locations/${locationData.location_id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                ...authUtils.getAuthHeaders()
              },
              body: JSON.stringify(locationData)
            });
          } else {
            res = await fetch('http://localhost:3000/locations', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...authUtils.getAuthHeaders()
              },
              body: JSON.stringify(locationData)
            });
          }
          
          if (!res.ok) throw await res.json();
          const data = await res.json();
          
          if (this.editMode) {
            const index = this.locations.findIndex(loc => loc.location_id === data.location_id);
            if (index !== -1) {
              this.locations.splice(index, 1, data);
            }
          } else {
            this.locations.push(data);
            this.campspot.location_id = data.location_id;
          }
          
          this.locationDialog = false;
          this.$toast.success(`Location ${this.editMode ? 'updated' : 'created'} successfully!`);
          this.resetNewLocation();
        } catch (error) {
          this.$toast.error(error.message || `Error ${this.editMode ? 'updating' : 'creating'} location`);
        }
      },
      
      resetCampspot() {
        this.campspot = { 
          name: '', 
          description: '', 
          price_per_night: null, 
          capacity: null, 
          location_id: this.campspot.location_id 
        };
      },
      
      resetNewLocation() {
        this.newLocation = { 
          location_id: null,
          address: '', 
          city: '', 
          province_or_state: '', 
          country: '', 
          postal_code: null 
        };
      }
    }
  }
  </script>
  
  <style scoped>
  .mb-4 {
    margin-bottom: 16px;
  }
  
  /* For radio button alignment */
  .v-input--selection-controls {
    margin-top: 0;
    padding-top: 0;
  }
  
  .selected-row {
    background-color: #e3f2fd;
  }
  
  /* Fix alignment of radio in table */
  table .v-input--radio-group__input {
    margin: 0;
  }
  
  /* Prevent action buttons from triggering row selection */
  .actions-cell {
    width: 100px;
  }
  </style>