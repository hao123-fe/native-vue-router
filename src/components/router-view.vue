<template>
  <div class="haoapp-root">
    <div class="page-stack" ref="pageStackRoot">
      <div :class="{'page-wrap': true, 'hidden': !item.valid, 'show': item.show, 'goback': item.state === 'pop'}" 
        v-for="(item, index) in this.$routeStack" 
        :key="item.path + index" @transitionend="transitionendHandler" v-if="item.valid" v-show="(index + 3 > $routeStack.length) || index === last2Index()">
        <div class="page-viewport">
          <router-view-item :route="item" >{{item.path + index}}</router-view-item>
        </div>
      </div>
    </div>
    <div class="page-wrap-mask" v-if="showMask" @touchstart="maskTouchHandler"></div>
  </div>
</template>

<script>
import RouterViewItem from './router-view-item.vue'
import css3Check from '../util/css3-support-check'

const transitionName = css3Check('transition')
const transitionAttr = 'all 0.3s ease-in'
const transformName = css3Check('transform')
const screenWidth = document.body.offsetWidth

export default {
  name: 'router-view',
  components: {
    RouterViewItem
  },
  data: () => {
    return {
      showMask: false
    }
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
      // 计算倒数第二个valid为true的组件的下标
    last2Index() {
      // 场景描述: 比如当前组件栈形如xxoox，其中x表示valid=true的组件，o为
      // valid=false的组件 那么在渲染上述组件列表的时候，第一个x的组件样式应该变为
      // display:none 第2个x跟最后一个x由于滑屏的原因要保留正常显示，中间的oo由于valid为false
      // 直接不渲染dom即可 这个地方就是要算出这个列表中倒数第二个x在整个列表中的下标并渲染出来
      let lastInex = this.$routeStack.length - 1// 倒数第一项的下标
      let secondIndexFromEnd = lastInex - 1// 倒数第二项下标
      // ox、oo、xo这种形式的组件列表是不会存在的，
      // 而xx这种是正常的，不用判断。综上，当数组中有两项时不用判断
      // 数组中至少有三项才走入下面的判断
      if (secondIndexFromEnd > 0) {
        // 倒数第二项组件无效
        if (!this.$routeStack[secondIndexFromEnd].valid) {
          while (!this.$routeStack[secondIndexFromEnd].valid && secondIndexFromEnd > -1) {// 一直往前找到一个有效的元素
            secondIndexFromEnd = secondIndexFromEnd -1
          }
          return secondIndexFromEnd
        }
        else {// 如果倒数第二项有效，则紧挨着的倒数两项就可以显示了
          // 比如xxoooooxx这种形式直接显示倒数两项就行了
          return -1
        }
      }
      else {
        return -1
      }
    },
    maskTouchHandler(e) {
      e.preventDefault()
    },
    transitionendHandler() {
      if (this.$route.method === 'back') {
        this.$router.clearInvalidRoute()
        this.$router.updateView()
      }
    },
    // 新页面进入动效
    pushPage() {
      const lastChild = this.$refs.pageStackRoot.lastChild
      setTimeout(function() {
        lastChild.style[transformName] = `translate3d(0, 0, 0)`
      }, 0)
    },
    // 当前页面退出动效
    popPage() {
        if (this.$routeStack[this.$routeStack.length - 1].state === 'pop') {
            const lastChild = this.$refs.pageStackRoot.lastChild
            setTimeout(() => {
              lastChild.style[transformName] = 'translate3d(100%, 0, 0)'
            }, 0)
        }
    },
    // touch功能初始化
    initTouchEvent() {
      const self = this
      const rootEl = this.$refs.pageStackRoot
      rootEl.addEventListener('touchstart', (e) => {
        let isLeftToRight = false// 是否在进行从左到右的滑屏操作
        // 是否一开始就被判定为竖直滑动了
        // 主要为了避免的case是在touchmove的过程中，如果一开始就被判定为竖直滑动了
        // 那么在后续touchmove的过程中就不用移动当前层了(详见下面判断)
        let isVertical = false
        e.stopPropagation();
        let touchState = {
          startPoint: null,
          distance: null
        }

        // 获取最顶部活性页面
        let i = self.$routeStack.length - 1
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
          e.stopPropagation()
          const touch = e.touches[0]
          touchState.distance = {
              x: touch.screenX - touchState.startPoint.x,
              y: touch.screenY - touchState.startPoint.y
          }
          let dx = touch.screenX - touchState.startPoint.x
          let dy = touch.screenY - touchState.startPoint.y
          // 这里立即判断是否左/右滑动或者是否已经处于滑屏动画中了
          if (Math.abs(dy) <= Math.abs(dx) || isLeftToRight) {
          // 阻止默认行为，比如UC浏览器默认
          // (实际上这样可以解决95%以上的左右滑动时UC的诡异行为，但有时候还是没用~~)
          // 左滑/右滑会引起前进/后退
            e.preventDefault()
            if (!self.showMask) {// 显示出遮罩
              self.showMask = true
            }
            if (dx > 0 && !isVertical) {// 一开始就是左右滑动
              isLeftToRight = true// 设置左右滑动的标识
              pageViewportEl.style[transformName] = `translate3d(${dx}px, 0, 0)`
            }
          }
          else {
            isVertical = true// 竖直滑动
          }
        }

        function endHandler(e) {
          e.stopPropagation();
          rootEl.removeEventListener('touchmove', moveHandler)
          rootEl.removeEventListener('touchend', endHandler)
          rootEl.removeEventListener('touchcancel', endHandler)
          if (self.showMask) {// 结束的时候总是移除遮罩
            self.showMask = false
          }
          isVertical = false
          if (isLeftToRight) {// 只有在左右滑期间end的时候才有后续判断的必要
            pageViewportEl.style[transitionName] = transitionAttr;
          if (touchState.distance.x > screenWidth / 5) {
              // 执行后退操作
              self.$router.back()
          } else {
              pageViewportEl.style[transformName] = `translate3d(0, 0, 0)`;
          }
          }
        }

        rootEl.addEventListener('touchmove', moveHandler, false)
        rootEl.addEventListener('touchend', endHandler, false);
        // UC浏览器在某些情况下不会触发touchend但是会触发touchcacel
        // 事件，所以也绑定一个touchcancel事件到endHandler
        // 避免touchend不触发的时候无法做一些清理工作的情况
        rootEl.addEventListener('touchcancel', endHandler, false);
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

      &.show {
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
.page-wrap-mask {
      transform: translate3d(0, 0, 0);
      height: 100%;
      width: 100%;
      position: absolute;
      z-index: 10;
      top: 0;
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


