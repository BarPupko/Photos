<template>
  <teleport to=".navbar-menu">
    <div class="header-content">
      <div class="header-info">
        <span class="header-title">Photos</span>
      </div>
      <div class="header-actions">
        <button @click="startScan" :disabled="scanning" class="sync-button" :class="{ spinning: scanning }" title="Sync Library">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
          </svg>
        </button>
        <button @click="showSettings = true" class="settings-button" title="Settings">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        </button>
      </div>
    </div>
  </teleport>

  <div v-if="scanStatus" class="scan-status-overlay" :class="{ success: scanStatus.type === 'success', error: scanStatus.type === 'error' }">
    {{ scanStatus.message }}
  </div>

  <div class="photos-view">
    <div v-if="loading" class="loading">
      Loading photos...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="photos.length === 0" class="empty-state">
      <p>No photos found in your library.</p>
      <p class="config-info">Photo library path: {{ config.photoLibraryPath }}</p>
      <button @click="startScan" :disabled="scanning" class="scan-button-large" :class="{ spinning: scanning }">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
        {{ scanning ? 'Syncing...' : 'Sync Library' }}
      </button>
    </div>

    <div v-else class="timeline-container">
      <!-- Selection Toolbar -->
      <transition name="toolbar-slide">
        <div v-if="selectionMode" class="selection-toolbar">
          <div class="toolbar-left">
            <button class="toolbar-close" @click="clearSelection">✕</button>
            <span class="selection-count">{{ selectedPhotos.size }} selected</span>
          </div>
          <div class="toolbar-actions">
            <button class="toolbar-button" @click="selectAll" v-if="selectedPhotos.size < photos.length">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              Select All
            </button>
            <button class="toolbar-button" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l-5.5 9h11z M12 14l-5.5 9h11z"/>
              </svg>
              Add to Album
            </button>
            <button class="toolbar-button" @click="moveToTrash">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Move to Trash
            </button>
          </div>
        </div>
      </transition>

      <!-- Left Sidebar -->
      <div class="left-sidebar">
        <div class="sidebar-menu">
          <div class="menu-item" :class="{ active: !viewingTrash }" @click="viewPhotos">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <span>Photos</span>
          </div>
          <div class="menu-item" :class="{ active: viewingTrash }" @click="viewTrash">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            <span>Trash</span>
            <span v-if="trashCount > 0" class="trash-count">({{ trashCount }})</span>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="storage-info">
            <div class="storage-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="storage-icon">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
              </svg>
              <span class="storage-label">Storage</span>
            </div>
            <div class="storage-size">{{ formatStorageSize(totalStorageSize) }} of {{ formatStorageSize(config.diskCapacity?.total || 0) }} used</div>
            <div class="storage-bar">
              <div class="storage-bar-fill" :style="{ width: storagePercentage + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Content -->
      <div class="timeline-content">
        <div v-for="group in groupedPhotos" :key="group.date" class="date-group" :data-year="group.dateObj.getFullYear()" :data-date="group.date">
          <h3 class="date-header">{{ group.label }} <span class="photo-count">({{ group.photos.length }})</span></h3>
          <div class="photo-grid">
            <div
              v-for="photo in group.photos"
              :key="photo.id"
              class="photo-item"
              :class="{ 'selected': isPhotoSelected(photo.id) }"
              @click="openLightbox(photo)"
            >
              <img :src="getPhotoUrl(photo)" :alt="photo.filename" />
              <div class="photo-checkbox" @click="togglePhotoSelection(photo.id, $event)">
                <svg v-if="isPhotoSelected(photo.id)" width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Timeline Navigation -->
      <div class="timeline-navbar" @mouseenter="expandTimeline" @mouseleave="collapseTimeline">
        <div class="timeline-track" :class="{ expanded: timelineExpanded }">
          <template v-for="(year, index) in uniqueYears" :key="year">
            <div
              class="timeline-year"
              @click="scrollToYear(year)"
              @mouseenter="showYearTooltip(year, $event)"
              @mouseleave="hideYearTooltip"
            >
              {{ year }}
            </div>
            <div v-if="index < uniqueYears.length - 1" class="timeline-dots">
              <div
                v-for="(density, dotIndex) in getYearDensity(year)"
                :key="dotIndex"
                class="timeline-dot"
                :style="{ opacity: density.opacity }"
                @click="scrollToDate(density.date)"
                @mouseenter="showMonthTooltip(density, $event)"
                @mouseleave="hideMonthTooltip"
              ></div>
            </div>
          </template>
        </div>

        <!-- Tooltip -->
        <transition name="tooltip-fade">
          <div
            v-if="tooltip.visible"
            class="timeline-tooltip"
            :style="{ top: tooltip.y + 'px' }"
          >
            {{ tooltip.text }}
          </div>
        </transition>
      </div>
    </div>

    <!-- Settings Modal -->
    <transition name="modal-fade">
      <div v-if="showSettings" class="modal-overlay" @click="closeSettings">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Settings</h2>
            <button @click="closeSettings" class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="setting-group">
              <label for="language-select" class="setting-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                </svg>
                Language
              </label>
              <select id="language-select" v-model="selectedLanguage" class="setting-input">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
              </select>
            </div>

            <div class="setting-group">
              <label for="storage-path" class="setting-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
                </svg>
                Storage Path
              </label>
              <div class="path-input-group">
                <input
                  id="storage-path"
                  type="text"
                  v-model="storagePath"
                  class="setting-input path-input"
                  placeholder="Enter photo library path"
                />
                <button @click="browseFolder" class="btn-browse">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                  </svg>
                  Browse
                </button>
              </div>
              <p class="setting-description">Current path: {{ config.photoLibraryPath }}</p>
            </div>

            <div class="setting-group">
              <label class="setting-label checkbox-label">
                <input
                  type="checkbox"
                  v-model="showVideosOnly"
                  class="setting-checkbox"
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
                Show only videos
              </label>
              <p class="setting-description">Filter to display only video files in your library</p>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeSettings" class="btn-cancel">Cancel</button>
            <button @click="saveSettings" class="btn-save">Save Changes</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Lightbox -->
    <transition name="lightbox-fade">
      <div v-if="lightboxPhoto" class="lightbox" @click="closeLightbox">
        <button class="lightbox-close" @click="closeLightbox">&times;</button>
        <button class="lightbox-nav lightbox-prev" @click.stop="navigatePrevious" v-if="canNavigatePrevious">
          ‹
        </button>
        <button class="lightbox-nav lightbox-next" @click.stop="navigateNext" v-if="canNavigateNext">
          ›
        </button>

        <transition name="image-zoom" mode="out-in">
          <div :key="lightboxPhoto.id" class="lightbox-content" @click.stop>
            <img :src="getLightboxPhotoUrl(lightboxPhoto)" :alt="lightboxPhoto.filename" class="lightbox-image" />

            <button class="lightbox-info-button" @click.stop="toggleInfo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </button>

            <transition name="info-slide">
              <div v-if="showInfo" class="lightbox-info-panel">
                <h3>{{ lightboxPhoto.filename }}</h3>
                <p v-if="lightboxPhoto.taken_at">{{ formatPhotoDate(lightboxPhoto.taken_at) }}</p>
                <p v-if="lightboxPhoto.width && lightboxPhoto.height">{{ lightboxPhoto.width }} × {{ lightboxPhoto.height }}</p>
              </div>
            </transition>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: 'Photos',
  setup() {
    const photos = ref([])
    const groupedPhotos = ref([])
    const config = ref({})
    const loading = ref(true)
    const error = ref(null)
    const scanning = ref(false)
    const scanStatus = ref(null)
    const lightboxPhoto = ref(null)
    const showInfo = ref(false)
    const currentPhotoIndex = ref(-1)
    const totalStorageSize = ref(0)
    const selectedPhotos = ref(new Set())
    const selectionMode = ref(false)
    const showSettings = ref(false)
    const selectedLanguage = ref('en')
    const storagePath = ref('')
    const showVideosOnly = ref(false)
    const timelineExpanded = ref(false)
    const tooltip = ref({
      visible: false,
      text: '',
      y: 0
    })
    const viewingTrash = ref(false)
    const trashCount = ref(0)

    const fetchConfig = async () => {
      try {
        const response = await axios.get('/api/config')
        config.value = response.data
      } catch (err) {
        console.error('Error fetching config:', err)
      }
    }

    const groupPhotosByDate = (photosList) => {
      const groups = {}

      photosList.forEach(photo => {
        // Use taken_at if available, otherwise use created_at
        const dateStr = photo.taken_at || photo.created_at
        if (!dateStr) return

        const date = new Date(dateStr)
        const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD

        if (!groups[dateKey]) {
          groups[dateKey] = {
            date: dateKey,
            dateObj: date,
            photos: []
          }
        }

        groups[dateKey].photos.push(photo)
      })

      // Convert to array and sort by date (newest first)
      const groupArray = Object.values(groups).sort((a, b) =>
        b.dateObj - a.dateObj
      )

      // Add friendly labels
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      groupArray.forEach(group => {
        const groupDate = new Date(group.dateObj)
        groupDate.setHours(0, 0, 0, 0)

        if (groupDate.getTime() === today.getTime()) {
          group.label = 'Today'
        } else if (groupDate.getTime() === yesterday.getTime()) {
          group.label = 'Yesterday'
        } else {
          // Format as "Month Day, Year"
          group.label = groupDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }
      })

      return groupArray
    }

    const fetchPhotos = async () => {
      try {
        const response = await axios.get('/api/photos')
        photos.value = response.data.photos || []
        groupedPhotos.value = groupPhotosByDate(photos.value)

        // Calculate total storage size
        totalStorageSize.value = photos.value.reduce((sum, photo) => sum + (photo.file_size || 0), 0)
      } catch (err) {
        error.value = 'Failed to load photos. Please make sure the server is running.'
        console.error('Error fetching photos:', err)
      } finally {
        loading.value = false
      }
    }

    const startScan = async () => {
      try {
        scanning.value = true
        scanStatus.value = null

        const response = await axios.post('/api/scan/start')

        // Poll for scan completion
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await axios.get('/api/scan/status')

            if (!statusResponse.data.isScanning && statusResponse.data.lastScanResult) {
              clearInterval(pollInterval)
              scanning.value = false

              const result = statusResponse.data.lastScanResult

              if (result.error) {
                scanStatus.value = {
                  type: 'error',
                  message: `Scan failed: ${result.error}`
                }
              } else {
                scanStatus.value = {
                  type: 'success',
                  message: `Scan complete! Processed ${result.processed} photos, ${result.failed} failed.`
                }

                // Refresh photos
                await fetchPhotos()
              }

              // Clear status after 5 seconds
              setTimeout(() => {
                scanStatus.value = null
              }, 5000)
            }
          } catch (err) {
            clearInterval(pollInterval)
            scanning.value = false
            console.error('Error polling scan status:', err)
          }
        }, 2000)

      } catch (err) {
        scanning.value = false
        scanStatus.value = {
          type: 'error',
          message: 'Failed to start scan: ' + (err.response?.data?.error || err.message)
        }
        console.error('Error starting scan:', err)
      }
    }

    const getPhotoUrl = (photo) => {
      return photo.thumbnail_path || `/api/photos/${photo.id}/image`
    }

    const getLightboxPhotoUrl = (photo) => {
      return `/api/photos/${photo.id}/image`
    }

    const togglePhotoSelection = (photoId, event) => {
      event.stopPropagation()
      if (selectedPhotos.value.has(photoId)) {
        selectedPhotos.value.delete(photoId)
      } else {
        selectedPhotos.value.add(photoId)
      }
      // Force reactivity update
      selectedPhotos.value = new Set(selectedPhotos.value)

      // Enter selection mode if any photo is selected
      selectionMode.value = selectedPhotos.value.size > 0
    }

    const isPhotoSelected = (photoId) => {
      return selectedPhotos.value.has(photoId)
    }

    const clearSelection = () => {
      selectedPhotos.value.clear()
      selectedPhotos.value = new Set()
      selectionMode.value = false
    }

    const selectAll = () => {
      photos.value.forEach(photo => selectedPhotos.value.add(photo.id))
      selectedPhotos.value = new Set(selectedPhotos.value)
      selectionMode.value = true
    }

    const closeSettings = () => {
      showSettings.value = false
    }

    const saveSettings = () => {
      // TODO: Implement settings persistence
      console.log('Settings saved:', {
        language: selectedLanguage.value,
        storagePath: storagePath.value,
        showVideosOnly: showVideosOnly.value
      })
      showSettings.value = false
    }

    const browseFolder = () => {
      // Note: Browser file picker doesn't support folder selection in all browsers
      // This would need a backend API or Electron for true folder browsing
      alert('Folder browsing requires a desktop application. Please enter the path manually.')
    }

    const moveToTrash = async () => {
      if (selectedPhotos.value.size === 0) return

      const confirmDelete = confirm(`Are you sure you want to move ${selectedPhotos.value.size} photo(s) to trash?`)
      if (!confirmDelete) return

      try {
        const photoIds = Array.from(selectedPhotos.value)
        const response = await axios.post('/api/photos/trash', { photoIds })

        if (response.data.success) {
          // Remove deleted photos from the list
          photos.value = photos.value.filter(photo => !selectedPhotos.value.has(photo.id))
          groupedPhotos.value = groupPhotosByDate(photos.value)

          // Clear selection
          clearSelection()

          // Show success message
          scanStatus.value = {
            type: 'success',
            message: `${response.data.moved} photo(s) moved to trash`
          }

          setTimeout(() => {
            scanStatus.value = null
          }, 3000)
        }
      } catch (error) {
        console.error('Error moving photos to trash:', error)
        scanStatus.value = {
          type: 'error',
          message: 'Failed to move photos to trash: ' + (error.response?.data?.error || error.message)
        }
      }
    }

    const expandTimeline = () => {
      timelineExpanded.value = true
    }

    const collapseTimeline = () => {
      timelineExpanded.value = false
      hideYearTooltip()
      hideMonthTooltip()
    }

    const showYearTooltip = (year, event) => {
      tooltip.value.visible = true
      tooltip.value.text = `${year}`
      tooltip.value.y = event.clientY
    }

    const hideYearTooltip = () => {
      tooltip.value.visible = false
    }

    const showMonthTooltip = (density, event) => {
      tooltip.value.visible = true
      tooltip.value.text = density.label
      tooltip.value.y = event.clientY
    }

    const hideMonthTooltip = () => {
      tooltip.value.visible = false
    }

    const viewPhotos = () => {
      viewingTrash.value = false
      fetchPhotos()
    }

    const viewTrash = async () => {
      viewingTrash.value = true
      loading.value = true

      try {
        const response = await axios.get('/api/photos/trash')
        photos.value = response.data.photos || []
        groupedPhotos.value = groupPhotosByDate(photos.value)
        trashCount.value = photos.value.length
      } catch (err) {
        error.value = 'Failed to load trash.'
        console.error('Error fetching trash:', err)
      } finally {
        loading.value = false
      }
    }

    const fetchTrashCount = async () => {
      try {
        const response = await axios.get('/api/photos/trash/count')
        trashCount.value = response.data.count || 0
      } catch (err) {
        console.error('Error fetching trash count:', err)
      }
    }

    const openLightbox = (photo) => {
      if (selectionMode.value) return // Don't open lightbox in selection mode

      currentPhotoIndex.value = photos.value.findIndex(p => p.id === photo.id)
      lightboxPhoto.value = photo
      showInfo.value = false
      document.body.style.overflow = 'hidden'
    }

    const closeLightbox = () => {
      lightboxPhoto.value = null
      showInfo.value = false
      currentPhotoIndex.value = -1
      document.body.style.overflow = ''
    }

    const toggleInfo = () => {
      showInfo.value = !showInfo.value
    }

    const canNavigatePrevious = computed(() => {
      return currentPhotoIndex.value > 0
    })

    const canNavigateNext = computed(() => {
      return currentPhotoIndex.value < photos.value.length - 1
    })

    const navigatePrevious = () => {
      if (canNavigatePrevious.value) {
        currentPhotoIndex.value--
        lightboxPhoto.value = photos.value[currentPhotoIndex.value]
        showInfo.value = false
      }
    }

    const navigateNext = () => {
      if (canNavigateNext.value) {
        currentPhotoIndex.value++
        lightboxPhoto.value = photos.value[currentPhotoIndex.value]
        showInfo.value = false
      }
    }

    const formatPhotoDate = (dateStr) => {
      const date = new Date(dateStr)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getYearFromDate = (dateObj) => {
      return dateObj.getFullYear()
    }

    const uniqueYears = computed(() => {
      const years = new Set()
      groupedPhotos.value.forEach(group => {
        years.add(group.dateObj.getFullYear())
      })
      return Array.from(years).sort((a, b) => b - a)
    })

    const storagePercentage = computed(() => {
      if (!config.value.diskCapacity || !config.value.diskCapacity.total) {
        return 0
      }
      return Math.min(100, (totalStorageSize.value / config.value.diskCapacity.total) * 100)
    })

    const formatStorageSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const scrollToYear = (year) => {
      const yearElement = document.querySelector(`[data-year="${year}"]`)
      if (yearElement) {
        yearElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    const scrollToDate = (dateKey) => {
      const dateElement = document.querySelector(`[data-date="${dateKey}"]`)
      if (dateElement) {
        dateElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    const getYearDensity = (year) => {
      // Get all photo groups for this year
      const yearGroups = groupedPhotos.value.filter(group => group.dateObj.getFullYear() === year)

      if (yearGroups.length === 0) return []

      // Group by month
      const monthCounts = new Array(12).fill(0)
      yearGroups.forEach(group => {
        const month = group.dateObj.getMonth()
        monthCounts[month] += group.photos.length
      })

      // Find max count for normalization
      const maxCount = Math.max(...monthCounts)

      // Create density array with opacity based on photo count
      return monthCounts.map((count, month) => {
        const opacity = count > 0 ? Math.max(0.2, count / maxCount) : 0
        const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'short' })

        // Find first date in this month for scrolling
        const monthGroup = yearGroups.find(g => g.dateObj.getMonth() === month)

        return {
          opacity,
          count,
          label: `${monthName} ${year}: ${count} photos`,
          date: monthGroup ? monthGroup.date : null
        }
      }).filter(d => d.count > 0) // Only show dots for months with photos
    }

    onMounted(() => {
      fetchConfig()
      fetchPhotos()
      fetchTrashCount()
    })

    return {
      photos,
      groupedPhotos,
      config,
      loading,
      error,
      scanning,
      scanStatus,
      lightboxPhoto,
      showInfo,
      canNavigatePrevious,
      canNavigateNext,
      uniqueYears,
      totalStorageSize,
      storagePercentage,
      selectedPhotos,
      selectionMode,
      showSettings,
      selectedLanguage,
      storagePath,
      showVideosOnly,
      timelineExpanded,
      tooltip,
      viewingTrash,
      trashCount,
      getPhotoUrl,
      getLightboxPhotoUrl,
      openLightbox,
      closeLightbox,
      toggleInfo,
      navigatePrevious,
      navigateNext,
      formatPhotoDate,
      formatStorageSize,
      scrollToYear,
      scrollToDate,
      getYearDensity,
      getYearFromDate,
      togglePhotoSelection,
      isPhotoSelected,
      clearSelection,
      selectAll,
      closeSettings,
      saveSettings,
      browseFolder,
      moveToTrash,
      expandTimeline,
      collapseTimeline,
      showYearTooltip,
      hideYearTooltip,
      showMonthTooltip,
      hideMonthTooltip,
      viewPhotos,
      viewTrash,
      startScan
    }
  }
}
</script>

<style scoped>
.photos-view {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title {
  font-size: 1rem;
  font-weight: 600;
  color: #202124;
}

.header-subtitle {
  font-size: 0.875rem;
  color: #5f6368;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sync-button {
  background: none;
  border: none;
  color: #1a73e8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: 40px;
  height: 40px;
}

.sync-button:hover:not(:disabled) {
  background-color: #e8f0fe;
}

.sync-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sync-button.spinning svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.sync-button svg {
  width: 24px;
  height: 24px;
}

.settings-button {
  background: none;
  border: none;
  color: #5f6368;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: 40px;
  height: 40px;
}

.settings-button:hover {
  background-color: #f1f3f4;
  color: #202124;
}

.settings-button svg {
  width: 24px;
  height: 24px;
}

.scan-button-large {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #1a73e8;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 24px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1.5rem;
}

.scan-button-large:hover:not(:disabled) {
  background-color: #1765cc;
  transform: scale(1.02);
}

.scan-button-large:disabled {
  background-color: #80868b;
  cursor: not-allowed;
}

.scan-button-large.spinning svg {
  animation: spin 1s linear infinite;
}

.scan-button-large svg {
  width: 32px;
  height: 32px;
}

.scan-status-overlay {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  border-radius: 8px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.scan-status-overlay.success {
  background-color: #e6f4ea;
  color: #1e8e3e;
  border: 1px solid #1e8e3e;
}

.scan-status-overlay.error {
  background-color: #fce8e6;
  color: #d93025;
  border: 1px solid #d93025;
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #5f6368;
  flex: 1;
}

.error {
  color: #d93025;
}

.config-info {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #80868b;
}

.timeline-container {
  display: flex;
  flex: 1;
  position: relative;
}

/* Selection Toolbar */
.selection-toolbar {
  position: fixed;
  top: 80px;
  left: 240px;
  right: 0;
  background-color: #ffffff;
  border-bottom: 1px solid #dadce0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toolbar-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #5f6368;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-close:hover {
  background-color: #f1f3f4;
}

.selection-count {
  font-size: 1rem;
  color: #3c4043;
  font-weight: 500;
}

.toolbar-actions {
  display: flex;
  gap: 0.75rem;
}

.toolbar-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: #f8f9fa;
  border: 1px solid #dadce0;
  border-radius: 24px;
  color: #3c4043;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-button:hover:not(:disabled) {
  background-color: #e8eaed;
  border-color: #bdc1c6;
}

.toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-button svg {
  width: 20px;
  height: 20px;
}

.toolbar-slide-enter-active, .toolbar-slide-leave-active {
  transition: all 0.3s ease;
}

.toolbar-slide-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.toolbar-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Left Sidebar */
.left-sidebar {
  width: 240px;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem 0.75rem;
  position: relative;
  height: 100%;
  border-right: 1px solid #dadce0;
  background-color: #ffffff;
  overflow-y: auto;
}

.sidebar-menu {
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 24px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #3c4043;
  font-weight: 500;
}

.menu-item:hover {
  background-color: #e8eaed;
}

.menu-item.active {
  background-color: #d2e3fc;
  color: #1967d2;
}

.menu-item svg {
  width: 24px;
  height: 24px;
}

.trash-count {
  margin-left: auto;
  font-size: 0.875rem;
  color: #5f6368;
  font-weight: 400;
}

.sidebar-footer {
  padding: 1rem 0 0 0;
  border-top: 1px solid #e8eaed;
  margin-top: 1rem;
}

.storage-info {
  padding: 0.75rem;
}

.storage-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.storage-icon {
  color: #5f6368;
  width: 20px;
  height: 20px;
}

.storage-label {
  font-size: 0.875rem;
  color: #3c4043;
  font-weight: 500;
}

.storage-size {
  font-size: 0.75rem;
  color: #5f6368;
  margin-bottom: 0.5rem;
}

.storage-bar {
  width: 100%;
  height: 8px;
  background-color: #e8eaed;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.storage-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1a73e8 0%, #4285f4 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.timeline-content {
  flex: 1;
  padding: 2rem 2rem;
  padding-right: 100px;
  overflow-y: auto;
}

.timeline-navbar {
  position: fixed;
  right: 0;
  top: 80px;
  bottom: 0;
  width: 20px;
  background-color: transparent;
  z-index: 90;
  transition: width 0.3s ease;
}

.timeline-navbar:hover {
  width: 80px;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.timeline-track {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
  color: #5f6368;
  font-size: 0.875rem;
  font-weight: 500;
  scrollbar-width: none;
}

.timeline-track::-webkit-scrollbar {
  display: none;
}

.timeline-track.expanded {
  padding: 2rem 1rem;
}

.timeline-year {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.5rem 0;
  flex-shrink: 0;
  user-select: none;
}

.timeline-year:hover {
  color: #1a73e8;
  font-weight: 600;
  transform: rotate(180deg) scale(1.1);
}

.timeline-dots {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0;
  margin: 0.5rem 0;
}

.timeline-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #1a73e8;
  cursor: pointer;
  transition: all 0.2s;
}

.timeline-dot:hover {
  transform: scale(1.5);
  background-color: #0d47a1;
}

.timeline-tooltip {
  position: fixed;
  right: 90px;
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
  transform: translateY(-50%);
}

.tooltip-fade-enter-active, .tooltip-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-fade-enter-from, .tooltip-fade-leave-to {
  opacity: 0;
}

.date-group {
  margin-bottom: 3rem;
}

.date-header {
  font-size: 1.25rem;
  font-weight: 500;
  color: #202124;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e8eaed;
}

.photo-count {
  font-size: 0.9rem;
  font-weight: 400;
  color: #5f6368;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.photo-item {
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 16px;
  background-color: #f1f3f4;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  border: 2px solid #e8eaed;
  position: relative;
}

.photo-item:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #dadce0;
}

.photo-item:hover .photo-checkbox {
  opacity: 1;
}

.photo-item.selected {
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px #1a73e8;
}

.photo-item.selected .photo-checkbox {
  opacity: 1;
  background-color: #1a73e8;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  border: 2px solid #dadce0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
  z-index: 2;
}

.photo-checkbox:hover {
  transform: scale(1.1);
  background-color: #f1f3f4;
}

/* Lightbox */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.lightbox-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 90vw;
  max-height: 90vh;
}

.lightbox-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.lightbox-close {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  font-size: 2.5rem;
  cursor: pointer;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 1001;
}

.lightbox-close:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.lightbox-nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  font-size: 3rem;
  cursor: pointer;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 1001;
}

.lightbox-nav:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: translateY(-50%) scale(1.1);
}

.lightbox-prev {
  left: 2rem;
}

.lightbox-next {
  right: 2rem;
}

.lightbox-info-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  cursor: pointer;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 1001;
}

.lightbox-info-button:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.lightbox-info-panel {
  position: fixed;
  bottom: 2rem;
  right: 6rem;
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  max-width: 300px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1001;
}

.lightbox-info-panel h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  word-break: break-word;
}

.lightbox-info-panel p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

/* Transitions */
.lightbox-fade-enter-active, .lightbox-fade-leave-active {
  transition: opacity 0.3s ease;
}

.lightbox-fade-enter-from, .lightbox-fade-leave-to {
  opacity: 0;
}

.image-zoom-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.image-zoom-leave-active {
  transition: all 0.2s ease;
}

.image-zoom-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.image-zoom-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.info-slide-enter-active, .info-slide-leave-active {
  transition: all 0.3s ease;
}

.info-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.info-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Settings Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background-color: #ffffff;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e8eaed;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: #202124;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #5f6368;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background-color: #f1f3f4;
}

.modal-body {
  padding: 2rem;
}

.setting-group {
  margin-bottom: 2rem;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #202124;
  margin-bottom: 0.75rem;
}

.setting-label svg {
  color: #5f6368;
}

.checkbox-label {
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.path-input-group {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.path-input {
  flex: 1;
}

.setting-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 0.95rem;
  color: #202124;
  background-color: #ffffff;
  transition: border-color 0.2s;
}

.setting-input:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.btn-browse {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: #f8f9fa;
  border: 1px solid #dadce0;
  border-radius: 4px;
  color: #3c4043;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-size: 0.95rem;
}

.btn-browse:hover {
  background-color: #e8eaed;
  border-color: #bdc1c6;
}

.btn-browse svg {
  width: 20px;
  height: 20px;
}

.setting-checkbox {
  width: 18px;
  height: 18px;
  margin-right: 0.5rem;
  cursor: pointer;
  accent-color: #1a73e8;
}

.setting-description {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #5f6368;
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e8eaed;
}

.btn-cancel, .btn-save {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background-color: #f8f9fa;
  color: #3c4043;
  border: 1px solid #dadce0;
}

.btn-cancel:hover {
  background-color: #e8eaed;
}

.btn-save {
  background-color: #1a73e8;
  color: white;
}

.btn-save:hover {
  background-color: #1765cc;
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content {
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive improvements */
@media (max-width: 768px) {
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.5rem;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .scan-button {
    width: 100%;
  }

  .left-sidebar {
    display: none;
  }

  .timeline-navbar {
    display: none;
  }

  .timeline-content {
    padding: 0;
  }

  .lightbox-nav {
    width: 3rem;
    height: 3rem;
    font-size: 2rem;
  }

  .lightbox-prev {
    left: 0.5rem;
  }

  .lightbox-next {
    right: 0.5rem;
  }

  .lightbox-close {
    top: 0.5rem;
    right: 0.5rem;
  }

  .lightbox-info-button {
    bottom: 1rem;
    right: 1rem;
  }

  .lightbox-info-panel {
    right: 5rem;
    bottom: 1rem;
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  h2 {
    font-size: 1.5rem;
  }

  .date-header {
    font-size: 1.1rem;
  }

  .lightbox-image {
    max-width: 100vw;
    max-height: 80vh;
  }
}
</style>
