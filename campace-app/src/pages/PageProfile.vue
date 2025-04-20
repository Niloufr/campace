<template>
    <v-card
      class="mx-auto"
      max-width="500"
    >
      <v-toolbar
        color="deep-purple accent-4"
        dark
      >
  
        <v-toolbar-title>My Profile</v-toolbar-title>
  
        <v-spacer></v-spacer>
        </v-toolbar>
  
      <v-list subheader>
        <v-subheader>Previous chats</v-subheader>
        
  
        <v-list-item
          v-for="chat in recent"
          :key="chat.title"
        >
          <v-list-item-content>
            <v-list-item-title v-text="chat.title"></v-list-item-title>
          </v-list-item-content>
  
        </v-list-item>
      </v-list>

    </v-card>
  </template>
  <script>
  export default {
    data: () => ({
      recent: [
        {
          active: true,
          title: 'User ID',
        },
        {
          active: true,
          title: 'Username',
        },
        {
          title: 'E-mail',
        },
        {

          title: 'Date Joined',
        },
      ]  
    }),
  }
</script>