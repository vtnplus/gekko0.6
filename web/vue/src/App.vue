<script>

import top from './components/layout/header.vue'
import bottom from './components/layout/footer.vue'
import modal from './components/layout/modal.vue'

export default {
  name: 'app',
  components: {
    top,
    bottom,
    modal
  }
}
</script>

<template lang='pug'>
  #app
    top
    .fill
      router-view.view
    bottom
    modal
</template>

<style>

#app {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

</style>
