import Vue from 'vue'
import NativeVueRouter from 'native-vue-router'

// 1. Use plugin.
// This installs <router-view> and <router-link>,
// and injects $router and $route to all router-enabled child components
Vue.use(NativeVueRouter)
const timer = {
  template: '<span>timer</span>',
  beforeRouteLeave: function () {
  }
}
// 2. Define route components
const Home = {
  data: () => {
    return {
      name: 'Home'
    }
  },
  methods: {
    sayHello() {
      console.log('Hello');
    }
  },
  beforeRouteLeave: function (to, from, next) {
    next();
  },
  template: `
    <div class="main-page">
    <timer></timer>
      <div>
          <router-link to="/second/123/haomeizi" class="top-menu-btn btn"><h2>Second</h2></router-link>
      </div>
      <ul class="list" style="height: 200px;overflow: auto;">
          <li>1</li>
          <li>2</li>
          <li>3</li>
          <li>4</li>
          <li>5</li>
          <li>6</li>
          <li>7</li>
          <li>8</li>
          <li>9</li>
          <li>10</li>
          <li>11</li>
          <li>12</li>
          <li>13</li>
          <li>14</li>
          <li>15</li>
          <li>16</li>
          <li>17</li>
          <li>18</li>
          <li>19</li>
          <li>20</li>
      </ul>
    </div>
  `,
   'beforeRouteEnter': (to, from, next) => {
    next();
   },
   components: {
    timer: timer
   }
}
const Second = {
  data: () => {
    return {
      name: 'Second'
    }
  },
  template: `
    <div class="main-page">
      <router-link method="back"><h1>返回上一级</h1></router-link>
      
      <div>
        <router-link to="/third" class="top-menu-btn btn"><h2>Third</h2></router-link>
      </div>
      <ul class="list" style="height: 200px;overflow:auto; width: 200px;">
          <li v-for="n in 1000" style="float: left">
          {{n}}
          </li>
      </ul>
    </div>
  ` ,
  beforeRouteLeave(to, from, next) {
    next();
  },
  'beforeRouteEnter': (to, from, next) => {
    next();
   }
}
const Third = { 
  template: `
    <div class="main-page">
      <router-link method="back"><h1>返回上一级</h1></router-link>
      <h1>Third Page</h1>
      <div>
        <router-link to="/four/158" class="top-menu-btn btn"><h2>Four</h2></router-link>
      </div>
    </div>
  `
}
const Four = { 
  template: `
    <div class="main-page">
      <router-link method="back"><h1>返回上一级</h1></router-link>
      <router-link to="/"><h1>第一页</h1></router-link>
      <router-link :to="to" method="replace"><h1>替换当前route</h1></router-link>
      <h1>FourPage Page</h1>
      <div><button v-on:click="doThis">Button</button></div>
      <h2>{{this.count}}</h2>
    </div>
  `,
  data() {
    return {
      to: '/four/' + parseInt(Math.random() * 1000),
      count: 0
    }
  },
  methods: {
    doThis() {
      this.count++
    }
  }
}

// 3. Create the router
const router = new NativeVueRouter({
  mode: 'history',
  base: __dirname,
  routes: [
    { 
      path: '/', 
      component: Home,
      default: true
    },
    { 
      path: '/second/:num/:title', 
      component: Second 
    },
    { 
      path: '/third', 
      component: Third 
    },
    {
      path: '/four/:page',
      component: Four
    }
  ]
})

// 4. Create and mount root instance.
// Make sure to inject the router.
// Route components will be rendered inside <router-view>.
new Vue({
  router,
  template: `
    <div id="app">
      <router-view></router-view>
    </div>
  `
}).$mount('#app')
