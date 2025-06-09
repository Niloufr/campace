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
        rules="required|min:6"
      >
        <v-text-field
          v-model="password"
          :error-messages="errors"
          label="Password"
          type="password"
          hint="Minimum 6 characters"
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
          :error-messages="[...errors, ...passwordMatchErrors]"
          label="Repeat password"
          type="password"
          required
        ></v-text-field>
      </validation-provider>

      <!-- Security Question Section -->
      <v-divider class="my-4"></v-divider>
      <v-subheader>Security Question (for password recovery)</v-subheader>
      
      <validation-provider
        v-slot="{ errors }"
        name="security_question"
        rules="required"
      >
        <v-select
          v-model="securityQuestion"
          :items="securityQuestions"
          :error-messages="errors"
          label="Choose a security question"
          required
        ></v-select>
      </validation-provider>
      
      <validation-provider
        v-slot="{ errors }"
        name="security_answer"
        rules="required"
      >
        <v-text-field
          v-model="securityAnswer"
          :error-messages="errors"
          label="Your answer"
          hint="This will be used to recover your password"
          required
        ></v-text-field>
      </validation-provider>

      <v-btn
        class="mr-4 mt-4"
        type="submit"
        :disabled="invalid || loading || !passwordsMatch"
        :loading="loading"
        color="primary"
      >
        Create Account
      </v-btn>
    </form>
    
    <v-alert
      v-if="error"
      type="error"
      dismissible
      @click:close="error = ''"
      transition="scale-transition"
      class="mt-4"
    >
      {{ error }}
    </v-alert>

    <v-alert
      v-if="success"
      type="success"
      dismissible
      @click:close="success = ''"
      transition="scale-transition"
      class="mt-4"
    >
      {{ success }}
    </v-alert>
  </validation-observer>
</template>

<script>
import { required, email, min } from 'vee-validate/dist/rules'
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

extend('min', {
  ...min,
  message: '{_field_} must be at least {length} characters',
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
    securityQuestion: '',
    securityAnswer: '',
    error: '',
    success: '',
    loading: false,
    
    securityQuestions: [
      'What was the name of your first pet?',
      'What is your mother\'s maiden name?',
      'What was the name of your elementary school?',
      'What city were you born in?',
      'What is your favorite book?',
      'What was your childhood nickname?',
      'What is the name of your favorite teacher?',
      'What was the first concert you attended?',
      'What is your favorite movie?',
      'What was the make of your first car?'
    ]
  }),

  computed: {
    passwordsMatch() {
      if (!this.password || !this.repeatPassword) return true
      return this.password === this.repeatPassword
    },
    
    passwordMatchErrors() {
      if (!this.repeatPassword) return []
      if (!this.passwordsMatch) {
        return ['Passwords do not match']
      }
      return []
    }
  },

  methods: {
    async submit() {
      console.log('Submit called')
      console.log('Password:', this.password)
      console.log('Repeat Password:', this.repeatPassword)
      console.log('Passwords match:', this.passwordsMatch)
      
      const isValid = await this.$refs.observer.validate()
      if (!isValid) {
        console.log('Form validation failed')
        return
      }

      // Check if passwords match
      if (!this.passwordsMatch) {
        this.error = 'Passwords do not match'
        console.log('Password match check failed')
        return
      }

      // Check if security question and answer are provided
      if (!this.securityQuestion || !this.securityAnswer) {
        this.error = 'Please provide a security question and answer'
        return
      }

      this.loading = true
      this.error = ''
      this.success = ''

      try {
        console.log('Sending registration request...')
        const response = await fetch("http://localhost:3000/users", {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_name: this.username,
            email: this.email,
            password: this.password,
            security_question: this.securityQuestion,
            security_answer: this.securityAnswer
          })
        })

        const data = await response.json()
        console.log('Registration response:', data)

        if (response.ok) {
          this.success = 'Account created successfully! You can now log in.'
          this.clear()
          this.$emit('account-created', data)
          // Removed redundant router.push('/login') to avoid navigation duplication error
        } else {
          this.error = data.message || 'Failed to create account'
        }
      } catch (error) {
        console.error('Registration error:', error)
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    clear() {
      this.username = ''
      this.email = ''
      this.password = ''
      this.repeatPassword = ''
      this.securityQuestion = ''
      this.securityAnswer = ''
      this.error = ''
      this.success = ''
      if (this.$refs.observer) {
        this.$refs.observer.reset()
      }
    },
  },
}
</script>

<style scoped>
/* Color palette */
:root {
  --cream: #F4F1DE;
  --coral: #E07A5F;
  --indigo: #3D405B;
  --sage: #81B29A;
  --sand: #F2CC8F;
}

form {
  max-width: 600px;
  margin: 0 auto;
  background-color: var(--cream);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(61, 64, 91, 0.1);
}

.v-text-field,
.v-select {
  margin-bottom: 20px;
}

.v-subheader {
  font-weight: 600;
  color: var(--indigo);
  margin-bottom: 10px;
}

.v-btn {
  font-weight: bold;
  border-radius: 30px;
  padding: 12px 24px;
  text-transform: none;
}

.v-btn[color="primary"] {
  background-color: var(--coral) !important;
  color: white !important;
  box-shadow: 0 4px 10px rgba(224, 122, 95, 0.3);
}

.v-btn[color="primary"]:hover {
  background-color: #d35e4f !important;
}

.v-alert {
  border-radius: 10px;
  font-weight: 500;
}

.v-alert[type="error"] {
  background-color: #fdecea !important;
  color: #c62828 !important;
  border: 1px solid #e07a5f40;
}

.v-alert[type="success"] {
  background-color: #e6f4ea !important;
  color: #2e7d32 !important;
  border: 1px solid #81b29a40;
}

/* Responsive tweaks */
@media (max-width: 600px) {
  form {
    padding: 20px;
  }
}
</style>