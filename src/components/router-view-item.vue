<style lang="scss">

</style>

<<template>
<component v-if="this.route && this.route.matched[0]" v-bind:is="this.route.matched[0].components.default"></component>
</template>

<<script>
export default {
  name: 'router-view-item',
  props: {
    route: {
      type: Object
    }
  },
  beforeCreate() {
    
  },
  beforeMount() {
    
  }
}
</script>
