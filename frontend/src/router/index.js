import { createRouter, createWebHistory } from 'vue-router'
import Photos from '../views/Photos.vue'

const routes = [
  {
    path: '/',
    redirect: '/photos'
  },
  {
    path: '/photos',
    name: 'Photos',
    component: Photos
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
