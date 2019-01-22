<template lang='pug'>
div
  h3 Type
  template
    label(for='type').wrapper What do you want to do with gekko?
    
    div.form-group.form-check(v-for='(type, i) in types')
      input.form-check-input(type='radio', :value='i', v-model='selectedTypeIndex', :id='i')
      label.form-check-label(:for='i') {{ type }}
</template>

<script>

export default {
  created: function() {
    this.emitType();
  },
  data: () => {
    return {
      types: ['paper trader', 'market watcher', 'tradebot'],
      selectedTypeIndex: 0,
    }
  },
  methods: {
    emitType: function() {
      this.$emit('type', this.type);
    }
  },
  watch: {
    type: function() {
      this.emitType();
    }
  },
  computed: {
    type: function() {
      return this.types[ this.selectedTypeIndex ];
    }
  }
}
</script>

<style>

.radio label {
  margin-top: 0;
}

</style>
