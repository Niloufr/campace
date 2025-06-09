import Vue from 'vue'
import VueRouter from 'vue-router'
import { authUtils } from '@/utils/auth'

// Import all page components
import PageHome from './pages/PageHome.vue'
import PageLogin from './pages/PageLogin.vue'
import PageCreateAccount from './pages/PageCreateAccount.vue'
import PageProfile from './pages/PageProfile.vue'
import PageAddspot from './pages/PageAddspot.vue'
import PageSpotOverview from './pages/PageSpotOverview.vue'
import PageCampSpot from './pages/PageCampSpot.vue'
import PageMyTrips from './pages/PageMyTrips.vue'
import PageEditSpot from './pages/PageEditSpot.vue'
import PageSearchResults from './pages/PageSearchResults.vue'

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'Home',
        component: PageHome
    },
    {
        path: '/login',
        name: 'Login',
        component: PageLogin
    },
    {
        path: '/create-account',
        name: 'CreateAccount',
        component: PageCreateAccount
    },
    {
        path: '/profile',
        name: 'Profile',
        component: PageProfile,
        meta: { requiresAuth: true }
    },
    {
        path: '/owner/create-spot',
        name: 'AddSpot',
        component: PageAddspot,
        meta: { requiresAuth: true }
    },
    {
        path: '/spot-overview',
        name: 'SpotOverview',
        component: PageSpotOverview,
        meta: { requiresAuth: true }
    },
    {
        path: '/camp-spot/:id',
        name: 'CampSpot',
        component: PageCampSpot,
        props: true
    },
    {
        path: '/my-trips',
        name: 'MyTrips',
        component: PageMyTrips,
        meta: { requiresAuth: true }
    },
    {
        path: '/owner/edit-spot/:id',
        name: 'EditSpot',
        component: PageEditSpot,
        meta: { requiresAuth: true }
    },
    {
        path: '/search',
        name: 'SearchResults',
        component: PageSearchResults
    },
    {
        path: '/owner/bookings',
        name: 'OwnerBookings',
        component: () => import('./pages/PageOwnerBookings.vue'),
        meta: { requiresAuth: true, requiresOwner: true }
    },
    {
        path: '/owner/availability/:id',
        name: 'OwnerAvailability',
        component: () => import('./pages/PageOwnerAvailability.vue'),
        meta: { requiresAuth: true, requiresOwner: true }
    }
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})

// Navigation guard for protected routes
router.beforeEach(async (to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        // Check backend session using JWT token
        try {
            const res = await fetch('http://localhost:3000/users/me', {
                headers: {
                    ...authUtils.getAuthHeaders()
                }
            });
            console.log(res)
            if (res.ok) {
                const userData = await res.json();
                localStorage.setItem('user', JSON.stringify(userData));
                return next();
            } else {
                localStorage.removeItem('user');
                return next({ path: '/login', query: { redirect: to.fullPath } });
            }
        } catch (e) {
            localStorage.removeItem('user');
            return next({ path: '/login', query: { redirect: to.fullPath } });
        }
    } else {
        next();
    }
})

export default router



