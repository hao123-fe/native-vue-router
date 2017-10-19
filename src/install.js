import View from './components/router-view.vue'
// import View from './components/view.1.js'
import Link from './components/link'

export let _Vue

export function install (Vue) {
  if (install.installed) return
  install.installed = true

  _Vue = Vue

  const isDef = v => v !== undefined

  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }

  Vue.mixin({
    beforeCreate () {
      if (isDef(this.$options.router)) {
        this._routerRoot = this
        this._router = this.$options.router
        this._router.init(this)
        Vue.util.defineReactive(this, '_route', this._router.history.current)
        Vue.util.defineReactive(this, '_routeStack', this._router.routeStack)
      } else {
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this);
    },
    mounted() {
     let parent = this.$parent;
     parent && (parent = parent.$vnode) && (parent = parent.tag);
     // 为router-view-item下面的route-record注册组件实例，保证
     // 触发组件上的路由钩子
     if (parent && parent.indexOf('router-view-item') > -1) {
        this.$route.matched[0].instances.default = this;
     } 
    },
    destroyed () {
      registerInstance(this)
      // this.$route.matched[0].instances.default = undefined;// 组件销毁的时候
    }
  })

  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })

  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })

  Object.defineProperty(Vue.prototype, '$routeStack', {
    get () { return this._routerRoot._routeStack}
  })

  Vue.component('router-view', View)
  Vue.component('router-link', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
