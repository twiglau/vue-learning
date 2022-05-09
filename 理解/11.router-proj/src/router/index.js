import Vue from 'vue'
import VueRouter from '@/vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'

Vue.use(VueRouter); // Vue.use => 当前对象的 install 方法

  const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: About,
    children:[
      {
        path:'me',
        component:{
          render(h) {
            return <h1> About me</h1>
          },
        }
      },
      {
        path:'other',
        component:{
          render(h){
            return <h1>About other</h1>
          }
        }
      }
    ]
  }
]

const router = new VueRouter({
  routes
})

export default router
