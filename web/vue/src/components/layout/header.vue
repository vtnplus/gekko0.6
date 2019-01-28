<template lang='pug'>
  div
    #top
    header
      nav.navbar.navbar-expand-lg.navbar-dark.bg-primary.navbar-theme
          a.navbar-brand AI BOTS
          button.navbar-toggler(type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation")
            span.navbar-toggler-icon

          div.collapse.navbar-collapse
            ul.navbar-nav.mr-auto
              li.nav-item
                router-link(to='/home').nav-link Home
              li.nav-item
                router-link(to='/live-gekkos').nav-link Tasks UI
              li.nav-item
                router-link(to='/backtest').nav-link Backtest
              li.nav-item
                router-link(to='/data').nav-link Local data
              li.nav-item
                router-link(to='/config').nav-link Config
              li.nav-item
                router-link(to='/makeconfig').nav-link Make Config
              li.nav-item
                router-link(to='/symbols').nav-link Symbol
            ul.navbar-nav
              li.nav-item
                router-link(to='/contacts').nav-link Contacts
              li.nav-item
                router-link(to='/forums').nav-link Forums

</template>

<script>
export default {}
</script>
