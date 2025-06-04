<!-- Home.vue -->
<template>
    <div>
      <v-container fluid class="hero-section pa-0">
        <v-img src="https://source.unsplash.com/random/1600x800/?camping" height="500">
          <v-row class="fill-height" align="center" justify="center">
            <v-col cols="12" md="8" lg="6">
              <v-card elevation="8" class="pa-6">
                <h1 class="text-center mb-6 display-1 font-weight-bold primary--text">
                  Find Your Perfect Camping Adventure
                </h1>
                
                <!-- Search Form -->
                <v-form @submit.prevent="searchCampingSites">
                  <v-row>
                    <v-col cols="12">
                      <v-autocomplete
                        v-model="location"
                        :items="locationSuggestions"
                        label="Where are you going?"
                        placeholder="Search destinations"
                        prepend-inner-icon="mdi-map-marker"
                        outlined
                        dense
                        @input="fetchLocationSuggestions"
                        hide-no-data
                      ></v-autocomplete>
                    </v-col>
                  </v-row>
                  
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-menu
                        ref="checkInMenu"
                        v-model="checkInMenu"
                        :close-on-content-click="false"
                        transition="scale-transition"
                        offset-y
                        min-width="auto"
                      >
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field
                            v-model="checkInDate"
                            label="Check in"
                            prepend-inner-icon="mdi-calendar"
                            readonly
                            outlined
                            dense
                            v-bind="attrs"
                            v-on="on"
                          ></v-text-field>
                        </template>
                        <v-date-picker
                          v-model="checkInDate"
                          @input="checkInMenu = false"
                          :min="new Date().toISOString().substr(0, 10)"
                        ></v-date-picker>
                      </v-menu>
                    </v-col>
                    
                    <v-col cols="12" sm="6">
                      <v-menu
                        ref="checkOutMenu"
                        v-model="checkOutMenu"
                        :close-on-content-click="false"
                        transition="scale-transition"
                        offset-y
                        min-width="auto"
                      >
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field
                            v-model="checkOutDate"
                            label="Check out"
                            prepend-inner-icon="mdi-calendar"
                            readonly
                            outlined
                            dense
                            v-bind="attrs"
                            v-on="on"
                          ></v-text-field>
                        </template>
                        <v-date-picker
                          v-model="checkOutDate"
                          @input="checkOutMenu = false"
                          :min="checkInDate || new Date().toISOString().substr(0, 10)"
                        ></v-date-picker>
                      </v-menu>
                    </v-col>
                  </v-row>
                  
                  <v-row>
                    <v-col cols="12">
                      <v-select
                        v-model="guestCount"
                        :items="guestOptions"
                        label="Guests"
                        prepend-inner-icon="mdi-account-group"
                        outlined
                        dense
                      ></v-select>
                    </v-col>
                  </v-row>
                  
                  <v-row>
                    <v-col cols="12">
                      <v-btn
                        block
                        color="primary"
                        x-large
                        rounded
                        type="submit"
                        class="white--text"
                      >
                        <v-icon left>mdi-tent</v-icon>
                        Find Camping Spots
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </v-card>
            </v-col>
          </v-row>
        </v-img>
      </v-container>
  
      <!-- Popular Destinations Section -->
      <v-container class="mt-12 mb-12">
        <h2 class="text-center mb-8 display-1">Popular Camping Destinations</h2>
        <v-row>
          <v-col v-for="destination in popularDestinations" :key="destination.id" cols="12" sm="6" md="4">
            <v-card class="mx-auto" max-width="400" hover>
              <v-img
                :src="destination.image"
                height="200px"
              ></v-img>
              <v-card-title>{{ destination.name }}</v-card-title>
              <v-card-subtitle>{{ destination.country }}</v-card-subtitle>
              <v-card-actions>
                <v-btn text color="primary">Explore</v-btn>
                <v-spacer></v-spacer>
                <v-btn icon>
                  <v-icon>mdi-heart-outline</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
  
      <!-- Features Section -->
      <v-container class="grey lighten-4 py-12">
        <h2 class="text-center mb-8 display-1">Why Book With Us</h2>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-card flat class="transparent">
              <div class="text-center">
                <v-icon color="primary" size="64">mdi-map-search</v-icon>
              </div>
              <v-card-title class="justify-center">Epic Spots, No Sweat</v-card-title>
              <v-card-text class="text-center">
                Discover and book cool camping spots with just a few clicks.
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card flat class="transparent">
              <div class="text-center">
                <v-icon color="primary" size="64">mdi-forest</v-icon>
              </div>
              <v-card-title class="justify-center">Variety is the Spice</v-card-title>
              <v-card-text class="text-center">
                From cozy parks to hidden gems in the woods - we've got it all.
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card flat class="transparent">
              <div class="text-center">
                <v-icon color="primary" size="64">mdi-calendar-check</v-icon>
              </div>
              <v-card-title class="justify-center">Booking Made Easy</v-card-title>
              <v-card-text class="text-center">
                A super simple booking process because who needs the hassle?
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card flat class="transparent">
              <div class="text-center">
                <v-icon color="primary" size="64">mdi-star</v-icon>
              </div>
              <v-card-title class="justify-center">Real Talk Reviews</v-card-title>
              <v-card-text class="text-center">
                Honest opinions from fellow adventurers to guide your choice.
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </template>
  
  <script>
  export default {
    name: 'HomePage',
    data() {
      return {
        // Search form data
        location: '',
        locationSuggestions: [],
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
        
        // Popular destinations
        popularDestinations: [
          { 
            id: 1, 
            name: 'Yosemite National Park', 
            country: 'United States',
            image: 'https://source.unsplash.com/random/400x300/?yosemite,camping'
          },
          { 
            id: 2, 
            name: 'Lake District', 
            country: 'United Kingdom',
            image: 'https://source.unsplash.com/random/400x300/?lake,camping'
          },
          { 
            id: 3, 
            name: 'Black Forest', 
            country: 'Germany',
            image: 'https://source.unsplash.com/random/400x300/?forest,camping'
          },
          { 
            id: 4, 
            name: 'Banff National Park', 
            country: 'Canada',
            image: 'https://source.unsplash.com/random/400x300/?banff,camping'
          },
          { 
            id: 5, 
            name: 'Great Ocean Road', 
            country: 'Australia',
            image: 'https://source.unsplash.com/random/400x300/?australia,camping'
          },
          { 
            id: 6, 
            name: 'Kruger National Park', 
            country: 'South Africa',
            image: 'https://source.unsplash.com/random/400x300/?safari,camping'
          }
        ]
      }
    },
    methods: {
      searchCampingSites() {
        // In a real application, this would navigate to a search results page
        // or call an API to fetch results
        console.log('Searching for camping sites with criteria:', {
          location: this.location,
          checkIn: this.checkInDate,
          checkOut: this.checkOutDate,
          guests: this.guestCount
        });
        
        // You would typically use Vue Router to navigate:
        // this.$router.push({
        //   name: 'search-results',
        //   query: {
        //     location: this.location,
        //     checkIn: this.checkInDate,
        //     checkOut: this.checkOutDate,
        //     guests: this.guestCount
        //   }
        // });
      },
      
      fetchLocationSuggestions() {
        // Example of using fetch instead of axios
        if (this.location && this.location.length > 2) {
          // In a real app, this would be an API call to get location suggestions
          // For example: /api/locations?q=${this.location}
          
          // Simulate API call with setTimeout
          setTimeout(() => {
            // This is just example data - in a real app this would come from your API
            this.locationSuggestions = [
              `${this.location}, United States`,
              `${this.location}, Canada`,
              `${this.location}, United Kingdom`,
              `${this.location}, Australia`,
              `${this.location}, Germany`
            ];
          }, 300);
          
          // A real fetch implementation would look like this:
          /*
          fetch(`/api/locations?q=${encodeURIComponent(this.location)}`)
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.json();
            })
            .then(data => {
              this.locationSuggestions = data;
            })
            .catch(error => {
              console.error('Error fetching location suggestions:', error);
            });
          */
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .hero-section {
    position: relative;
  }
  </style>