import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue'; // Update path
import LoginView from '../views/LoginView.vue'; // Update path
import RegisterView from '../views/RegisterView.vue'; // Update path
import PatientForm from '../views/PatientForm.vue'; // Update path
import MainLayout from '../views/MainLayout.vue'; // Update path
import MyPatientsView from '../views/MyPatientsView.vue'; // Update path
import LogsView from '../views/LogsView.vue'; // Update path
// Auth guard for protected routes
const requireAuth = (to, from, next) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    // No token found, redirect to login
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
  } else {
    next();
  }
};

// Guard for analysis - requires patient data
const requirePatient = (to, from, next) => {
  const token = localStorage.getItem('authToken');
  const currentPatient = localStorage.getItem('currentPatient');

  if (!token) {
    // Not logged in, redirect to login
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
  } else if (!currentPatient) {
    // No patient selected, redirect to patient dashboard
    next({ path: '/dashboard' });
  } else {
    next();
  }
};

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView
  },
  {
    path: '/dashboard',
    name: 'PatientDashboard',
    component: PatientForm,
    beforeEnter: requireAuth
  },
  {
    path: '/analysis',
    name: 'Analysis',
    component: MainLayout,
    beforeEnter: requirePatient
  },
  {
    path: '/my-patients',
    name: 'MyPatients',
    component: MyPatientsView,
    beforeEnter: requireAuth
  },
  {
    path: '/logs',
    name: 'Logs',
    component: LogsView,
    beforeEnter: requireAuth
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/CeraChat.vue'),
    beforeEnter: requireAuth
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Global navigation guard
router.beforeEach((to, from, next) => {
  // Get the page title from the route meta data
  const title = to.meta.title || 'CeraMD AI';
  document.title = title;

  next();
});

export default router;
