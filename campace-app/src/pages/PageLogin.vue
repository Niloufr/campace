<template>
    <validation-observer
      ref="observer"
      v-slot="{ invalid }"
    >
      <form @submit.prevent="submit">
        
        <validation-provider
          v-slot="{ errors }"
          name="email"
          rules="required|email"
        >
          <v-text-field
            v-model="email"
            :error-messages="errors"
            label="E-mail"
            required
          ></v-text-field>
        </validation-provider>
        <validation-provider
          v-slot="{ errors }"
          name="password"
          rules="required"
        >
          <v-text-field
            v-model="password"
            :error-messages="errors"
            label="Password"
            required
          ></v-text-field>
        </validation-provider>
  
        <v-btn
          class="mr-4"
          type="submit"
          :disabled="invalid"
        >
          submit
        </v-btn>
      </form>
    </validation-observer>
  </template>
  <script>
  import { required, email } from 'vee-validate/dist/rules'
  import { extend, ValidationObserver, ValidationProvider, setInteractionMode } from 'vee-validate'

  setInteractionMode('eager')

  extend('required', {
    ...required,
    message: '{_field_} can not be empty',
  })

  extend('email', {
    ...email,
    message: 'Email must be valid',
  })

  export default {
    components: {
      ValidationProvider,
      ValidationObserver,
    },
    data: () => ({
      
      email: '',
      password: ''
      
    }),

    methods: {
      submit () {

        this.$refs.observer.validate()
        fetch("http://localhost:3000/users/login", {
                    method: "POST",
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: this.email,
                        password: this.password
                    })
                })
                .then((data) => {
                    if (data.status < 300) {
                        this.$emit('login-success')
                    } else {
                        // TODO show error
                    }
                })
      },
      clear () {
        
        this.email = ''
        this.password = ''
        this.$refs.observer.reset()
      },
    },
  }
</script>