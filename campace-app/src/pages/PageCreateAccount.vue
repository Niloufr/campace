<template>
    <validation-observer
      ref="observer"
      v-slot="{ invalid }"
    >
      <form @submit.prevent="submit">
        <validation-provider
          v-slot="{ errors }"
          name="username"
          rules="required"
        >
          <v-text-field
            v-model="username"
            :error-messages="errors"
            label="Username"
            required
          ></v-text-field>
        </validation-provider>
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
        <validation-provider
          v-slot="{ errors }"
          name="repeatPassword"
          rules="required"
        >
          <v-text-field
            v-model="repeatPassword"
            :error-messages="errors"
            label="Repeat password"
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
      <v-alert
        v-if="error"
        type="error"
        dismissible
        @click:close="error = false"
        transition="scale-transition"
        class="mt-4"
      >
        {{ error }}
    </v-alert>
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
      username: '',
      email: '',
      password: '',
      repeatPassword: '',
      error: '',
    }),

    methods: {
      submit () {
        this.$refs.observer.validate()
        // TODO check repeatPassword
        fetch("http://localhost:3000/users", {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_name: this.username,
                        email: this.email,
                        password: this.password
                    })
                })
                .then(async (data) => {
                    if (data.status < 300) {
                        this.$emit('account-created')
                    } else {
                        this.error = (await data.json()).message ?? 'Unknown error'
                    }
                })
      },
      clear () {
        this.username = ''
        this.email = ''
        this.password = ''
        this.repeatPassword = ''
        this.$refs.observer.reset()
      },
    },
  }
</script>