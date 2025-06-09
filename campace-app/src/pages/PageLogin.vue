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
          type="password"
          required
        ></v-text-field>
      </validation-provider>

      <v-btn
        class="mr-4"
        type="submit"
        :disabled="invalid || loading"
        :loading="loading"
      >
        Login
      </v-btn>
      
      <v-btn
        text
        color="primary"
        @click="showForgotPassword = true"
      >
        Forgot Password?
      </v-btn>
    </form>

    <!-- Error Alert -->
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

    <!-- Success Alert -->
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

    <!-- Forgot Password Dialog -->
    <v-dialog v-model="showForgotPassword" max-width="500px" persistent>
      <v-card>
        <v-card-title>Reset Password</v-card-title>
        <v-card-text>
          <div v-if="resetStep === 1">
            <p class="mb-3">Enter your email address to get your security question:</p>
            <v-text-field
              v-model="resetEmail"
              label="Enter your email"
              type="email"
              outlined
              :error-messages="resetError ? [resetError] : []"
            ></v-text-field>
          </div>
          
          <div v-if="resetStep === 2">
            <p class="mb-3"><strong>Security Question:</strong></p>
            <p class="mb-3 text-body-1">{{ securityQuestion }}</p>
            <v-text-field
              v-model="securityAnswer"
              label="Your answer"
              outlined
              hint="Answer is case-insensitive"
              :error-messages="resetError ? [resetError] : []"
            ></v-text-field>
            <v-text-field
              v-model="newPassword"
              label="New password"
              type="password"
              outlined
              hint="Minimum 6 characters"
            ></v-text-field>
            <v-text-field
              v-model="confirmNewPassword"
              label="Confirm new password"
              type="password"
              outlined
              :error-messages="passwordMismatch ? ['Passwords do not match'] : []"
            ></v-text-field>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeForgotPassword">Cancel</v-btn>
          <v-btn 
            color="primary" 
            @click="resetStep === 1 ? getSecurityQuestion() : resetPassword()"
            :loading="resetLoading"
            :disabled="resetStep === 2 && (!securityAnswer || !newPassword || !confirmNewPassword || passwordMismatch)"
          >
            {{ resetStep === 1 ? 'Next' : 'Reset Password' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </validation-observer>
</template>

<script>
import { required, email } from 'vee-validate/dist/rules'
import { extend, ValidationObserver, ValidationProvider, setInteractionMode } from 'vee-validate'
import { authUtils } from '@/utils/auth'

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
    password: '',
    error: '',
    success: '',
    loading: false,
    
    // Forgot password data
    showForgotPassword: false,
    resetStep: 1,
    resetEmail: '',
    securityQuestion: '',
    securityAnswer: '',
    newPassword: '',
    confirmNewPassword: '',
    resetLoading: false,
    resetError: '',
  }),

  computed: {
    passwordMismatch() {
      if (!this.newPassword || !this.confirmNewPassword) return false
      return this.newPassword !== this.confirmNewPassword
    }
  },

  methods: {
    async submit() {
      const isValid = await this.$refs.observer.validate()
      if (!isValid) return

      this.loading = true
      this.error = ''
      this.success = ''

      try {
        const response = await fetch("http://localhost:3000/users/login", {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password
          })
        })

        const data = await response.json()
        console.log('Login response:', data)
        
        if (response.ok) {
          if (!data.token) {
            throw new Error('No token received from server')
          }
          
          // Store JWT token using authUtils
          console.log('Storing token:', data.token)
          authUtils.setToken(data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          
          // Include token in the emitted data
          this.$emit('login-success', { ...data.user, token: data.token })
        } else {
          this.error = data.message || 'Login failed'
        }
      } catch (error) {
        console.error('Login error:', error)
        this.error = error.message || 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    async getSecurityQuestion() {
      if (!this.resetEmail) {
        this.resetError = 'Please enter your email'
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(this.resetEmail)) {
        this.resetError = 'Please enter a valid email address'
        return
      }

      this.resetLoading = true
      this.resetError = ''

      try {
        const response = await fetch("http://localhost:3000/users/forgot-password/question", {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.resetEmail
          })
        })

        const data = await response.json()

        if (response.ok) {
          this.securityQuestion = data.security_question
          this.resetStep = 2
          this.resetError = ''
        } else {
          this.resetError = data.message || 'User not found'
        }
      } catch (error) {
        console.error('Security question error:', error)
        this.resetError = 'Network error. Please try again.'
      } finally {
        this.resetLoading = false
      }
    },

    async resetPassword() {
      // Validate all fields
      if (!this.securityAnswer || !this.newPassword || !this.confirmNewPassword) {
        this.resetError = 'Please fill in all fields'
        return
      }

      if (this.newPassword !== this.confirmNewPassword) {
        this.resetError = 'Passwords do not match'
        return
      }

      if (this.newPassword.length < 6) {
        this.resetError = 'Password must be at least 6 characters long'
        return
      }

      this.resetLoading = true
      this.resetError = ''

      try {
        const response = await fetch("http://localhost:3000/users/forgot-password/reset", {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.resetEmail,
            security_answer: this.securityAnswer,
            new_password: this.newPassword
          })
        })

        const data = await response.json()

        if (response.ok) {
          this.showForgotPassword = false
          this.success = 'Password reset successfully! You can now login with your new password.'
          this.resetError = ''
          this.clearResetForm()
          this.$emit('password-reset-success')
        } else {
          this.resetError = data.message || 'Password reset failed'
        }
      } catch (error) {
        console.error('Password reset error:', error)
        this.resetError = 'Network error. Please try again.'
      } finally {
        this.resetLoading = false
      }
    },

    closeForgotPassword() {
      this.showForgotPassword = false
      this.clearResetForm()
    },

    clearResetForm() {
      this.resetStep = 1
      this.resetEmail = ''
      this.securityQuestion = ''
      this.securityAnswer = ''
      this.newPassword = ''
      this.confirmNewPassword = ''
      this.resetError = ''
    },

    clear() {
      this.email = ''
      this.password = ''
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
:root {
  --cream: #F4F1DE;
  --coral: #E07A5F;
  --indigo: #3D405B;
  --sage: #81B29A;
  --sand: #F2CC8F;
}

/* Form Container */
form {
  background-color: var(--cream);
  max-width: 500px;
  margin: 40px auto;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(61, 64, 91, 0.15);
}

/* Text Fields & Select */
.v-text-field,
.v-select {
  margin-bottom: 20px;
}

/* Login Button */
.v-btn[type="submit"] {
  background-color: var(--coral) !important;
  color: white !important;
  border-radius: 25px;
  font-weight: 600;
  padding: 10px 24px;
  text-transform: none;
  box-shadow: 0 4px 10px rgba(224, 122, 95, 0.4);
}

.v-btn[type="submit"]:hover {
  background-color: #d95d4f !important;
}

/* Forgot Password Link Button */
.v-btn[color="primary"] {
  color: var(--coral) !important;
  font-weight: 500;
  text-transform: none;
  margin-top: 12px;
}

/* Alerts */
.v-alert {
  border-radius: 10px;
  font-weight: 500;
}

.v-alert[type="error"] {
  background-color: #fdecea !important;
  color: #b00020 !important;
  border: 1px solid #e07a5f50;
}

.v-alert[type="success"] {
  background-color: #e7f5ed !important;
  color: var(--sage) !important;
  border: 1px solid #81b29a40;
}

/* Dialog Card */
.v-dialog .v-card {
  background-color: var(--cream);
  border-radius: 12px;
}

.v-card-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--indigo);
}

.v-card-actions {
  padding-bottom: 24px;
}

.v-btn[outlined] {
  color: var(--coral) !important;
  border-color: var(--coral) !important;
}

.v-btn[color="primary"] {
  background-color: var(--coral) !important;
  color: white !important;
  text-transform: none;
  font-weight: 600;
  border-radius: 25px;
}

/* Responsive */
@media (max-width: 600px) {
  form {
    padding: 20px;
    margin: 20px;
  }

  .v-dialog .v-card {
    padding: 16px;
  }
}
</style>