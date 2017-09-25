<template>
  <div class="haoapp-root">
    <div class="page-stack" ref="pageStackRoot">
      <div :class="{'page-wrap': true, 'hidden': !item.valid, 'first': !index, 'goback': item.state === 'pop'}" 
        v-for="(item, index) in this.$routeStack" 
        :key="item.path + index">
        <div class="page-viewport">
          <router-view-item :route="item">{{item.path + index}}</router-view-item>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RouterViewItem from './router-view-item.vue'
import css3Check from '../util/css3-support-check'

const transitionName = css3Check('transition')
const transitionAttr = 'all 0.3s ease-in'
const transformName = css3Check('transform')
const screenWidth = document.body.offsetWidth

let pageTransitionLock = false

export default {
  name: 'router-view',
  components: {
    RouterViewItem
  },
  beforeCreate() {
    // console.log('beforeCreate')
  },
  created() {
    // console.log("created")
  },
  beforeMount() {
    // console.log('beforeMount')
  },
  beforeUpdate() {
    // console.log('beforeUpdate')
  },
  mounted() {
    // console.log('mounted')
    // 滑屏事件初始化
    this.initTouchEvent()
  },
  updated() {
    const method = this.$route.method;
    // console.log(method)
    if (method === 'push' || method === 'replace') {
      this.pushPage()
    } else if (method === 'back') {
      this.popPage()
    }
  },
  methods: {
    // 新页面进入动效
    pushPage() {
      const lastChild = this.$refs.pageStackRoot.lastChild
      setTimeout(function() {
        lastChild.style[transformName] = 'translate3d(0, 0, 0)'
      }, 0)
    },
    // 当前页面退出动效
    popPage() {
        if (this.$routeStack[this.$routeStack.length - 1].state === 'pop') {
            const lastChild = this.$refs.pageStackRoot.lastChild
            lastChild.style[transformName] = 'translate3d(100%, 0, 0)'
        }
    },
    // touch功能初始化
    initTouchEvent() {
      const self = this
      const rootEl = this.$refs.pageStackRoot

      rootEl.addEventListener('touchstart', (e) => {
        if (pageTransitionLock) {
          return
        }

        e.stopPropagation();

        let touchState = {
          startPoint: null,
          distance: null
        }

        // 获取最顶部活性页面
        let i = self.$routeStack.length - 1
        while(self.$routeStack[i].valid === false
            || self.$routeStack[i].state === 'pop') {
            i--
        }

        // 如果在首页则取消滑动后退
        if (i === 0) {
          return
        }

        const pageIndex = i
        const pageWrapEl = rootEl.childNodes[pageIndex]
        const pageViewportEl = pageWrapEl.firstChild

        pageViewportEl.style[transitionName] = 'none'
        touchState.distance = null

        const touch = e.touches[0]
        touchState.startPoint = {
            x: touch.screenX,
            y: touch.screenY
        }

        function moveHandler(e) {
          if (touchState.startPoint === null) {
            return 
          }
          
          e.stopPropagation()

          const touch = e.touches[0]
          touchState.distance = {
              x: touch.screenX - touchState.startPoint.x,
              y: touch.screenY - touchState.startPoint.y
          }
          
          if (touchState.distance.x < 0) {
              return;
          }

          pageViewportEl.style[transformName] = `translate3d(${touchState.distance.x}px, 0, 0)`
        }

        function endHandler(e) {
          rootEl.removeEventListener('touchmove', moveHandler)
          rootEl.removeEventListener('touchend', endHandler)
          
          if (!touchState.distance || touchState.distance.x === 0)  {
              return
          }

          e.stopPropagation();

          // 加上操作锁
          // pageTransitionLock = true

          pageViewportEl.style[transitionName] = transitionAttr;
          if (touchState.distance.x > screenWidth / 5) {
              // 执行后退操作
              self.$router.back()
          } else {
              pageViewportEl.style[transformName] = `translate3d(0, 0, 0)`;
          }
        }

        rootEl.addEventListener('touchmove', moveHandler, false)
        rootEl.addEventListener('touchend', endHandler, false)
      }, false)
    }
  }
}
</script>

<style lang="scss">
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-overflow-scrolling: touch;
}

$transform-transition: transform 0.3s ease-out;
.haoapp-root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;

  .page-stack {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;

    .page-wrap {
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: absolute;
      top: 0;
      left: 0; // background-color: rgba(0, 0, 0, 0.5);
      transform: translate3d(100%, 0, 0);
      transition: $transform-transition;

      &.hidden {
        display: none;
      }

      &.first {
        transform: translate3d(0, 0, 0);
      }

      .page-viewport {
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: #ffffff;
        box-shadow: -5px 0 20px #ccc;
      }
    }
  }

  .panel-mask {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 1000;
    top: 0;
    left: 0;
    display: none;

    &.show-panel {
      display: block;
    }
  }

  $app-panel-width: 260px;
  .app-panel {
    width: $app-panel-width;
    height: 100%;
    overflow: auto;
    position: absolute;
    z-index: 2000;
    top: 0;
    background-color: #fff;
    transition: $transform-transition;

    &.left-panel {
      left: 0;
      transform: translate3d(-$app-panel-width, 0, 0);
    }

    &.right-panel {
      right: 0;
      transform: translate3d($app-panel-width, 0, 0);
    }

    &.show-panel {
      transform: translate3d(0, 0, 0);
      box-shadow: 0 0 20px rgba(0, 0, 0, .5);
    }
  }
}
</style>


