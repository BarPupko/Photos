<template>
  <div id="app">
    <nav class="navbar">
      <div class="navbar-brand">
        <router-link to="/photos" class="brand-link">
          <h1>Popko Library</h1>
        </router-link>
      </div>
      <div class="navbar-menu">
        <router-view name="header" />
      </div>
    </nav>

    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand .brand-link {
  text-decoration: none;
  color: inherit;
}

.navbar-brand h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a73e8;
  cursor: pointer;
  transition: color 0.2s;
}

.navbar-brand h1:hover {
  color: #1557b0;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 0;
  padding: 0;
}
</style>
