import { createRouter, createWebHistory } from "vue-router";
import Profile from "../views/Profile.vue";
import SignIn from "../views/SignIn.vue";
import SignUp from "../views/SignUp.vue";
import Login from "../views/examples-api/Login.vue";
import Signup from "../views/examples-api/Signup.vue";
import UserProfile from "../views/examples-api/profile/UserProfile.vue";
import Users from "../views/examples-api/users/UsersList.vue";
import CalendarView from "../views/Calendar/CalendarView.vue";
import DiaryView from "../views/Diary/DiaryView.vue";
import NewEntry from "../views/Diary/components/NewEntry.vue";
import { authGuard } from "./guard.js";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/calendario",
    name: "Calendario",
    component: CalendarView,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: "/sign-in",
    name: "SignIn",
    component: SignIn,
  },
  {
    path: "/sign-up",
    name: "SignUp",
    component: SignUp,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
  },
  {
    path: "/user-profile",
    name: "User Profile",
    component: UserProfile,
    meta: { requiresAuth: true },
  },
  {
    path: "/users",
    name: "Users",
    component: Users,
    meta: { requiresAuth: true },
  },
  {
    path: "/diary",
    name: "Diary",
    component: DiaryView,
    meta: { requiresAuth: true },
    children: [
      {
        path: "new",
        name: "NewEntry",
        component: NewEntry
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  linkActiveClass: "active",
});

router.beforeEach(authGuard);

export default router;
