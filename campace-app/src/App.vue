<template>
  <div id="app">
    Hello world!!  
  </div>
</template>

<script>

  // Export
  export default {
    name: 'App',
    data() {
      return {
        activePage: ""
      }
    },
    components: {

    },
    methods: {
      setActivePage(page) {
        this.activePage = page;
      }
    }
  }
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
