/* @flow */

import type Router from '../index'
import { inBrowser } from './dom'
import { saveScrollPosition } from './scroll'

export const supportsPushState = inBrowser && (function () {
  const ua = window.navigator.userAgent

  if (
    (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
    ua.indexOf('Mobile Safari') !== -1 &&
    ua.indexOf('Chrome') === -1 &&
    ua.indexOf('Windows Phone') === -1
  ) {
    return false
  }

  return window.history && 'pushState' in window.history
})()

// use User Timing api (if present) for more accurate key precision
const Time = inBrowser && window.performance && window.performance.now
  ? window.performance
  : Date

let _key: string = genKey()

function genKey (): string {
  return Time.now().toFixed(3)
}

export function getStateKey () {
  return _key
}

export function setStateKey (key: string) {
  _key = key
}

export function pushState (router: Router, url: string, replace?: boolean) {
  saveScrollPosition()
  // try...catch the pushState call to get around Safari
  // DOM Exception 18 where it limits to 100 pushState calls
  const history = window.history
  try {
    _key = genKey()
    const state = {
      key: _key,
      path: url
    }
    console.log('replace=======' + replace + '====url====' + url)
    console.log(state)
    if (replace) {
      history.replaceState(state, '', url)

      router.historyStack[router.historyIndex] = state
    } else {
      history.pushState(state, '', url)

      // 更新historyStack
      router.historyIndex++
      router.historyStack.splice(router.historyIndex)
      router.historyStack.push(state)
    }
  } catch (e) {
    window.location[replace ? 'replace' : 'assign'](url)
  }
}

export function replaceState (router: Router, url: string) {
  pushState(router, url, true)
}
