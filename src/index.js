/* @flow */

import { install } from './install'
import { START } from './util/route'
import { assign } from './util/util'
import { assert } from './util/warn'
import { inBrowser } from './util/dom'
import { cleanPath } from './util/path'
import { createMatcher } from './create-matcher'
import { normalizeLocation } from './util/location'
import { supportsPushState } from './util/push-state'
import Immutable from 'seamless-immutable'
import { HashHistory } from './history/hash'
import { HTML5History, getDefaultPath} from './history/html5'
import { AbstractHistory } from './history/abstract'

import type { Matcher } from './create-matcher'

export default class NativeVueRouter {
  static install: () => void;
  static version: string;

  app: any;
  apps: Array<any>;
  ready: boolean;
  readyCbs: Array<Function>;
  options: RouterOptions;
  mode: string;
  history: HashHistory | HTML5History | AbstractHistory;
  matcher: Matcher;
  fallback: boolean;
  beforeHooks: Array<?NavigationGuard>;
  resolveHooks: Array<?NavigationGuard>;
  afterHooks: Array<?AfterNavigationHook>;
  historyIndex: number;
  historyStack: Array<HistoryState>;
  routeStack: Array<Route>;

  constructor (options: RouterOptions = {}) {
    this.app = null
    this.apps = []
    this.options = options
    this.beforeHooks = []
    this.resolveHooks = []
    this.afterHooks = []
    this.matcher = createMatcher(options.routes || [], this)
    this.historyIndex = 0 // 历史记录栈Index
    this.historyStack = [] // 历史记录栈
    this.routeStack = [] // 路由栈
    // 默认路由的path，支持在分享后的落地页进行返回操作时退到默认页(一般为首页)
    this.defaultPath = ''

    let mode = options.mode || 'hash'
    this.fallback = mode === 'history' && !supportsPushState && options.fallback !== false
    if (this.fallback) {
      mode = 'hash'
    }
    if (!inBrowser) {
      mode = 'abstract'
    }
    this.mode = mode

    switch (mode) {
      case 'history':
        this.history = new HTML5History(this, options.base)
        break
      case 'hash':
        this.history = new HashHistory(this, options.base, this.fallback)
        break
      case 'abstract':
        this.history = new AbstractHistory(this, options.base)
        break
      default:
        if (process.env.NODE_ENV !== 'production') {
          assert(false, `invalid mode: ${mode}`)
        }
    }
  }

  match (
    method: string,
    raw: RawLocation,
    current?: Route,
    redirectedFrom?: Location
  ): Route {
    return this.matcher.match(method, raw, current, redirectedFrom)
  }

  get currentRoute (): ?Route {
    return this.history && this.history.current
  }
  clearInvalidRoute() {
    while (this.routeStack[this.routeStack.length - 1].valid === false 
            || this.routeStack[this.routeStack.length-1].state === 'pop') {
            this.routeStack.pop()
          }
  }
  updateView() {
    this.app._routeStack = Immutable.asMutable(this.routeStack)
  }
  init (app: any /* Vue component instance */) {
    process.env.NODE_ENV !== 'production' && assert(
      install.installed,
      `not installed. Make sure to call \`Vue.use(NativeVueRouter)\` ` +
      `before creating root instance.`
    )

    this.apps.push(app)

    // main app already initialized.
    if (this.app) {
      return
    }

    this.app = app

    const history = this.history

    if (history instanceof HTML5History) {
      history.transitionTo('init', history.getCurrentLocation())
    } else if (history instanceof HashHistory) {
      const setupHashListener = () => {
        history.setupListeners()
      }
      history.transitionTo(
        history.getCurrentLocation(),
        setupHashListener,
        setupHashListener
      )
    }
    // 如果有默认路由，初始化时把其默认的route添加进routeStack
    if (this.defaultPath !== '') {
        this.routeStack
        .push(assign({
          valid: true,
          state: '',
          show: true
        }, this.match('push', this.defaultPath, this.history.current)))
    }
    // 当前路由对应的route添加进routeStack
    // 上面那个默认路由和这个路由对应的组件是页面一加载
    // 就要显示的(不需要动画效果)，所以设置show:true
    this.routeStack.push(assign({
      valid: true,
      state: '',
      show: true
    }, this.history.current))

    history.listen(route => {
      const method = route.method
      let nextRoute = assign({valid: true, state: ''}, route);

      this.apps.forEach((app) => {
        

        if (method === 'push') {
          this.routeStack.push(nextRoute)
        } else if (method === 'replace') {
          this.routeStack[this.routeStack.length - 1].valid = false
          this.routeStack.push(nextRoute)
        } else if (method === 'back') {
          // 先清空堆积的废页面,只有在back时最适合，其它时刻会用被删掉的dom替换新的dom
          this.clearInvalidRoute()

          const pageCount = this.routeStack.length
          if (pageCount > 1) {
              this.routeStack[this.routeStack.length - 1].state = 'pop'
          } else {
              this.routeStack = [nextRoute]
          }
        }

        app._route = route
        this.updateView()
      })
    })
  }

  beforeEach (fn: Function): Function {
    return registerHook(this.beforeHooks, fn)
  }

  beforeResolve (fn: Function): Function {
    return registerHook(this.resolveHooks, fn)
  }

  afterEach (fn: Function): Function {
    return registerHook(this.afterHooks, fn)
  }

  onReady (cb: Function, errorCb?: Function) {
    this.history.onReady(cb, errorCb)
  }

  onError (errorCb: Function) {
    this.history.onError(errorCb)
  }

  push (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    this.history.push(location, onComplete, onAbort)
  }

  replace (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    this.history.replace(location, onComplete, onAbort)
  }

  go (n: number) {
    this.history.go(n)
  }

  back () {
    this.go(-1)
  }

  forward () {
    this.go(1)
  }

  getMatchedComponents (to?: RawLocation | Route): Array<any> {
    const route: any = to
      ? to.matched
        ? to
        : this.resolve("", to).route
      : this.currentRoute
    if (!route) {
      return []
    }
    return [].concat.apply([], route.matched.map(m => {
      return Object.keys(m.components).map(key => {
        return m.components[key]
      })
    }))
  }

  resolve (
    method: string,
    to: RawLocation,
    current?: Route,
    append?: boolean
  ): {
    location: Location,
    route: Route,
    href: string,
    // for backwards compat
    normalizedTo: Location,
    resolved: Route
  } {
    
    const location = normalizeLocation(
      to,
      current || this.history.current,
      append,
      this
    )
    const route = this.match(method, location, current)
    const fullPath = route.redirectedFrom || route.fullPath
    const base = this.history.base
    const href = createHref(base, fullPath, this.mode)
    return {
      location,
      route,
      href,
      // for backwards compat
      normalizedTo: location,
      resolved: route
    }
  }

  addRoutes (routes: Array<RouteConfig>) {
    this.matcher.addRoutes(routes)
    if (this.history.current !== START) {
      this.history.transitionTo('push', this.history.getCurrentLocation())
    }
  }
}

function registerHook (list: Array<any>, fn: Function): Function {
  list.push(fn)
  return () => {
    const i = list.indexOf(fn)
    if (i > -1) list.splice(i, 1)
  }
}

function createHref (base: string, fullPath: string, mode) {
  var path = mode === 'hash' ? '#' + fullPath : fullPath
  return base ? cleanPath(base + '/' + path) : path
}

NativeVueRouter.install = install
NativeVueRouter.version = '__VERSION__'

if (inBrowser && window.Vue) {
  window.Vue.use(NativeVueRouter)
}
