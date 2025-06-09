export const authUtils = {
    getToken() {
        return localStorage.getItem('authToken')
    },

    setToken(token) {
        localStorage.setItem('authToken', token)
    },

    removeToken() {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
    },

    isAuthenticated() {
        return !!this.getToken()
    },

    getAuthHeaders() {
        const token = this.getToken()
        return token ? { 'Authorization': `Bearer ${token}` } : {}
    }
}