<template>
  <teleport to=".navbar-menu">
    <div class="header-content">
      <div class="header-info">
        <div class="view-toggle">
          <button
            @click="viewPhotos"
            class="view-toggle-button"
            :class="{ active: currentView === 'photos' }"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
              />
            </svg>
            <span>Photos</span>
          </button>
          <button
            @click="viewAlbums"
            class="view-toggle-button"
            :class="{ active: currentView === 'albums' }"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"
              />
            </svg>
            <span>Albums</span>
          </button>
          <button
            @click="viewTrash"
            class="view-toggle-button"
            :class="{ active: currentView === 'trash' }"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
              />
            </svg>
            <span>Trash</span>
            <span v-if="trashCount > 0" class="badge">{{ trashCount }}</span>
          </button>
        </div>
      </div>
      <div class="header-actions">
        <button
          @click="startScan"
          :disabled="scanning"
          class="sync-button"
          :class="{ spinning: scanning }"
          title="Sync Library"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
            />
          </svg>
        </button>
        <button
          @click="showSettings = true"
          class="settings-button"
          title="Settings"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
            />
          </svg>
        </button>
      </div>
    </div>
  </teleport>

  <div
    v-if="scanStatus"
    class="scan-status-overlay"
    :class="{
      success: scanStatus.type === 'success',
      error: scanStatus.type === 'error',
    }"
  >
    {{ scanStatus.message }}
  </div>

  <div class="photos-view">
    <div v-if="loading" class="loading">Loading photos...</div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div
      v-else-if="currentView === 'albums' && albums.length === 0"
      class="empty-state"
    >
      <p>No albums yet. Create your first album!</p>
      <button @click="showAlbumModal = true" class="scan-button-large">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        Create Album
      </button>
    </div>

    <div v-else-if="photos.length === 0" class="empty-state">
      <p>No photos found in your library.</p>
      <p class="config-info">
        Photo library path: {{ config.photoLibraryPath }}
      </p>
      <button
        @click="startScan"
        :disabled="scanning"
        class="scan-button-large"
        :class="{ spinning: scanning }"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
          />
        </svg>
        {{ scanning ? "Syncing..." : "Sync Library" }}
      </button>
    </div>

    <!-- Albums Grid View -->
    <div v-else-if="currentView === 'albums'" class="albums-grid-container">
      <div class="albums-header">
        <h2>Albums</h2>
        <button @click="showAlbumModal = true" class="create-album-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          New Album
        </button>
      </div>
      <div class="albums-grid">
        <div v-for="album in albums" :key="album.id" class="album-card">
          <div class="album-cover" @click="viewAlbumDetail(album.id)">
            <img
              v-if="album.cover_thumbnail"
              :src="album.cover_thumbnail"
              :alt="album.name"
            />
            <div v-else class="album-placeholder">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"
                />
              </svg>
            </div>
          </div>
          <div class="album-info" @click="viewAlbumDetail(album.id)">
            <h3>{{ album.name }}</h3>
            <p>{{ album.photo_count || 0 }} photos</p>
          </div>
          <button
            class="album-delete-button"
            @click="deleteAlbum(album.id)"
            title="Delete Album"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="timeline-container">
      <!-- Selection Toolbar -->
      <transition name="toolbar-slide">
        <div v-if="selectionMode" class="selection-toolbar">
          <div class="toolbar-left">
            <button class="toolbar-close" @click="clearSelection">✕</button>
            <span class="selection-count"
              >{{ selectedPhotos.size }} selected</span
            >
          </div>
          <div class="toolbar-actions">
            <button
              class="toolbar-button"
              @click="selectAll"
              v-if="selectedPhotos.size < photos.length"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Select All
            </button>
            <template v-if="currentView === 'photos'">
              <button class="toolbar-button" @click="openAddToAlbumModal">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"
                  />
                </svg>
                Add to Album
              </button>
              <button class="toolbar-button" @click="moveToTrash">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                  />
                </svg>
                Move to Trash
              </button>
            </template>
            <template v-else>
              <button class="toolbar-button" @click="restoreFromTrash">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
                  />
                </svg>
                Restore
              </button>
              <button
                class="toolbar-button toolbar-button-danger"
                @click="permanentlyDelete"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"
                  />
                </svg>
                Delete Forever
              </button>
            </template>
          </div>
        </div>
      </transition>

      <!-- Trash Header with Empty Trash Button -->
      <div
        v-if="viewingTrash && !selectionMode && trashCount > 0"
        class="trash-header"
      >
        <button class="empty-trash-button" @click="emptyTrash">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
            />
          </svg>
          Empty Trash
        </button>
      </div>

      <!-- Timeline Content -->
      <div class="timeline-content">
        <div
          v-for="group in groupedPhotos"
          :key="group.date"
          class="date-group"
          :data-year="group.dateObj.getFullYear()"
          :data-date="group.date"
        >
          <h3 class="date-header">
            <span>
              {{ group.label }}
              <span class="photo-count">({{ group.photos.length }})</span>
            </span>
            <button
              class="select-date-button"
              @click="selectAllInDate(group.photos)"
              :title="
                areAllSelectedInDate(group.photos)
                  ? 'Deselect all photos in this date'
                  : 'Select all photos in this date'
              "
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  v-if="areAllSelectedInDate(group.photos)"
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
                <path
                  v-else
                  d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                />
              </svg>
              {{
                areAllSelectedInDate(group.photos)
                  ? "Deselect All"
                  : "Select All"
              }}
            </button>
          </h3>
          <div class="photo-grid">
            <div
              v-for="photo in group.photos"
              :key="photo.id"
              class="photo-item"
              :class="{ selected: isPhotoSelected(photo.id) }"
              @click="openLightbox(photo)"
            >
              <img :src="getPhotoUrl(photo)" :alt="photo.filename" />
              <div
                class="photo-checkbox"
                @click="togglePhotoSelection(photo.id, $event)"
              >
                <svg
                  v-if="isPhotoSelected(photo.id)"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
              <div
                v-if="photo.albums && photo.albums.length > 0"
                class="photo-album-indicator"
                :title="photo.albums.map((a) => a.name).join(', ')"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path
                    d="M20 4v12H8V4h12m0-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 9.67l1.69 2.26 2.48-3.1L19 15H9zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"
                  />
                </svg>
                <span v-if="photo.albums.length > 1" class="album-count">{{
                  photo.albums.length
                }}</span>
              </div>
              <div
                class="photo-file-type"
                :class="'file-type-' + getFileType(photo).toLowerCase()"
              >
                {{ getFileType(photo) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Loading More Indicator with Skeleton -->
        <transition name="fade">
          <div v-if="loadingMore" class="loading-more">
            <div class="loading-skeleton">
              <div class="skeleton-grid">
                <div v-for="i in 8" :key="i" class="skeleton-item"></div>
              </div>
            </div>
            <div class="loading-text">
              <div class="spinner"></div>
              <p>Loading more photos...</p>
            </div>
          </div>
        </transition>

        <!-- Sentinel element for intersection observer -->
        <div
          ref="sentinel"
          class="scroll-sentinel"
          v-if="hasMorePhotos && !loadingMore"
        ></div>

        <!-- End of Results Message -->
        <transition name="fade">
          <div v-if="!hasMorePhotos && photos.length > 0" class="end-message">
            <p>✓ All photos loaded ({{ photos.length }} total)</p>
          </div>
        </transition>
      </div>

      <!-- Right Timeline Navigation -->
      <div
        class="timeline-navbar"
        @mouseenter="expandTimeline"
        @mouseleave="collapseTimeline"
      >
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
            <div class="setting-group statistics-group">
              <h3 class="statistics-header">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
                  />
                </svg>
                Library Statistics
              </h3>
              <div class="statistics-grid">
                <div class="stat-card">
                  <div class="stat-label">Total Photos</div>
                  <div class="stat-value">
                    {{ statistics.totalPhotos.toLocaleString() }}
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Total Size</div>
                  <div class="stat-value">
                    {{ formatStorageSize(statistics.totalSize) }}
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">In Trash</div>
                  <div class="stat-value">{{ statistics.trashedPhotos }}</div>
                </div>
                <div class="stat-card" v-if="statistics.oldestPhotoDate">
                  <div class="stat-label">Oldest Photo</div>
                  <div class="stat-value stat-date">
                    {{ statistics.oldestPhotoDate.toLocaleDateString() }}
                  </div>
                </div>
                <div class="stat-card" v-if="statistics.newestPhotoDate">
                  <div class="stat-label">Newest Photo</div>
                  <div class="stat-value stat-date">
                    {{ statistics.newestPhotoDate.toLocaleDateString() }}
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Date Range</div>
                  <div
                    class="stat-value stat-date"
                    v-if="
                      statistics.oldestPhotoDate && statistics.newestPhotoDate
                    "
                  >
                    {{
                      Math.floor(
                        (statistics.newestPhotoDate -
                          statistics.oldestPhotoDate) /
                          (1000 * 60 * 60 * 24)
                      )
                    }}
                    days
                  </div>
                  <div class="stat-value" v-else>-</div>
                </div>
              </div>
            </div>

            <div class="setting-group">
              <label for="language-select" class="setting-label">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"
                  />
                </svg>
                Language
              </label>
              <select
                id="language-select"
                v-model="selectedLanguage"
                class="setting-input"
              >
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
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"
                  />
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
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
                    />
                  </svg>
                  Browse
                </button>
              </div>
              <p class="setting-description">
                Current path: {{ config.photoLibraryPath }}
              </p>
            </div>

            <div class="setting-group">
              <label class="setting-label checkbox-label">
                <input
                  type="checkbox"
                  v-model="showVideosOnly"
                  class="setting-checkbox"
                />
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
                  />
                </svg>
                Show only videos
              </label>
              <p class="setting-description">
                Filter to display only video files in your library
              </p>
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
        <button
          class="lightbox-nav lightbox-prev"
          @click.stop="navigatePrevious"
          v-if="canNavigatePrevious"
        >
          ‹
        </button>
        <button
          class="lightbox-nav lightbox-next"
          @click.stop="navigateNext"
          v-if="canNavigateNext"
        >
          ›
        </button>

        <transition name="image-zoom" mode="out-in">
          <div :key="lightboxPhoto.id" class="lightbox-content" @click.stop>
            <img
              :src="getLightboxPhotoUrl(lightboxPhoto)"
              :alt="lightboxPhoto.filename"
              class="lightbox-image"
            />

            <button class="lightbox-info-button" @click.stop="toggleInfo">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                />
              </svg>
            </button>

            <transition name="info-slide">
              <div v-if="showInfo" class="lightbox-info-panel">
                <h3>{{ lightboxPhoto.filename }}</h3>
                <p v-if="lightboxPhoto.taken_at">
                  {{ formatPhotoDate(lightboxPhoto.taken_at) }}
                </p>
                <p v-if="lightboxPhoto.width && lightboxPhoto.height">
                  {{ lightboxPhoto.width }} × {{ lightboxPhoto.height }}
                </p>
              </div>
            </transition>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Create Album Modal -->
    <transition name="modal-fade">
      <div
        v-if="showAlbumModal"
        class="modal-overlay"
        @click="showAlbumModal = false"
      >
        <div class="modal-content modal-small" @click.stop>
          <div class="modal-header">
            <h2>Create New Album</h2>
            <button @click="showAlbumModal = false" class="modal-close">
              &times;
            </button>
          </div>
          <div class="modal-body">
            <div class="setting-group">
              <label for="album-name" class="setting-label">Album Name</label>
              <input
                id="album-name"
                type="text"
                v-model="newAlbumName"
                class="setting-input"
                placeholder="Enter album name"
                @keyup.enter="createAlbum"
              />
            </div>
            <div class="setting-group">
              <label for="album-description" class="setting-label"
                >Description (Optional)</label
              >
              <textarea
                id="album-description"
                v-model="newAlbumDescription"
                class="setting-input"
                placeholder="Enter album description"
                rows="3"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showAlbumModal = false" class="btn-cancel">
              Cancel
            </button>
            <button
              @click="createAlbum"
              class="btn-save"
              :disabled="!newAlbumName.trim()"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Add to Album Modal -->
    <transition name="modal-fade">
      <div
        v-if="showAddToAlbumModal"
        class="modal-overlay"
        @click="showAddToAlbumModal = false"
      >
        <div class="modal-content modal-small" @click.stop>
          <div class="modal-header">
            <h2>Add to Album</h2>
            <button @click="showAddToAlbumModal = false" class="modal-close">
              &times;
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-description">
              Select an album to add {{ selectedPhotos.size }} photo(s) to:
            </p>
            <div class="album-list">
              <div
                v-for="album in albums"
                :key="album.id"
                class="album-list-item"
                @click="addPhotosToAlbum(album.id)"
              >
                <div class="album-list-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"
                    />
                  </svg>
                </div>
                <div class="album-list-info">
                  <h4>{{ album.name }}</h4>
                  <p>{{ album.photo_count || 0 }} photos</p>
                </div>
              </div>
            </div>
            <button
              @click="
                showAlbumModal = true;
                showAddToAlbumModal = false;
              "
              class="btn-create-new"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Create New Album
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Console Panel -->
    <div class="console-panel" :class="{ open: consoleOpen }">
      <div class="console-header" @click="toggleConsole">
        <div class="console-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V5h16v14zM7 15h10v2H7zm0-4h10v2H7zm0-4h7v2H7z"
            />
          </svg>
          <span>Console</span>
          <span class="console-badge" v-if="consoleLogs.length > 0">{{
            consoleLogs.length
          }}</span>
        </div>
        <div class="console-actions">
          <button
            @click.stop="clearConsoleLogs"
            class="console-button"
            v-if="consoleLogs.length > 0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
              />
            </svg>
            Clear
          </button>
          <button class="console-toggle">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              :style="{
                transform: consoleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
              }"
            >
              <path
                d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
              />
            </svg>
          </button>
        </div>
      </div>
      <div class="console-content">
        <div v-if="consoleLogs.length === 0" class="console-empty">
          No logs yet. Start a scan to see progress here.
        </div>
        <div
          v-for="(log, index) in consoleLogs"
          :key="index"
          class="console-log"
          :class="'log-' + log.type"
        >
          <span class="log-timestamp">{{ log.timestamp }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import axios from "axios";

export default {
  name: "Photos",
  setup() {
    const photos = ref([]);
    const groupedPhotos = ref([]);
    const config = ref({});
    const loading = ref(true);
    const error = ref(null);
    const scanning = ref(false);
    const scanStatus = ref(null);
    const lightboxPhoto = ref(null);
    const showInfo = ref(false);
    const currentPhotoIndex = ref(-1);
    const totalStorageSize = ref(0);
    const selectedPhotos = ref(new Set());
    const selectionMode = ref(false);
    const showSettings = ref(false);
    const selectedLanguage = ref("en");
    const storagePath = ref("");
    const showVideosOnly = ref(false);
    const timelineExpanded = ref(false);
    const tooltip = ref({
      visible: false,
      text: "",
      y: 0,
    });
    const currentView = ref("photos"); // 'photos', 'albums', 'trash', or 'album-detail'
    const trashCount = ref(0);
    const consoleOpen = ref(false);
    const consoleLogs = ref([]);
    const statistics = ref({
      totalPhotos: 0,
      totalSize: 0,
      trashedPhotos: 0,
      oldestPhotoDate: null,
      newestPhotoDate: null,
    });

    // Pagination for infinite scroll
    const currentPage = ref(1);
    const hasMorePhotos = ref(true);
    const loadingMore = ref(false);
    const sentinel = ref(null);
    let observer = null;
    const timelineContentRef = ref(null);

    // Albums
    const albums = ref([]);
    const currentAlbum = ref(null);
    const showAlbumModal = ref(false);
    const showAddToAlbumModal = ref(false);
    const newAlbumName = ref("");
    const newAlbumDescription = ref("");

    const addConsoleLog = (message, type = "info") => {
      const timestamp = new Date().toLocaleTimeString();
      consoleLogs.value.push({ message, type, timestamp });
      // Auto-scroll to bottom
      setTimeout(() => {
        const consoleContent = document.querySelector(".console-content");
        if (consoleContent) {
          consoleContent.scrollTop = consoleContent.scrollHeight;
        }
      }, 50);
    };

    const clearConsoleLogs = () => {
      consoleLogs.value = [];
    };

    const toggleConsole = () => {
      consoleOpen.value = !consoleOpen.value;
    };

    const fetchStatistics = async () => {
      try {
        // Fetch all photos to calculate statistics
        const response = await axios.get("/api/photos", {
          params: { limit: 999999 },
        });
        const allPhotos = response.data.photos || [];

        statistics.value.totalPhotos = allPhotos.length;
        statistics.value.totalSize = allPhotos.reduce(
          (sum, photo) => sum + (photo.file_size || 0),
          0
        );

        // Find oldest and newest photos
        if (allPhotos.length > 0) {
          const dates = allPhotos
            .map((p) => new Date(p.taken_at || p.created_at))
            .filter((d) => !isNaN(d.getTime()))
            .sort((a, b) => a - b);

          if (dates.length > 0) {
            statistics.value.oldestPhotoDate = dates[0];
            statistics.value.newestPhotoDate = dates[dates.length - 1];
          }
        }

        statistics.value.trashedPhotos = trashCount.value;
      } catch (err) {
        console.error("Error fetching statistics:", err);
      }
    };

    const fetchConfig = async () => {
      try {
        const response = await axios.get("/api/config");
        config.value = response.data;
      } catch (err) {
        console.error("Error fetching config:", err);
      }
    };

    const groupPhotosByDate = (photosList) => {
      const groups = {};

      photosList.forEach((photo) => {
        // Use taken_at if available, otherwise use created_at
        const dateStr = photo.taken_at || photo.created_at;
        if (!dateStr) return;

        const date = new Date(dateStr);
        const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

        if (!groups[dateKey]) {
          groups[dateKey] = {
            date: dateKey,
            dateObj: date,
            photos: [],
          };
        }

        groups[dateKey].photos.push(photo);
      });

      // Convert to array and sort by date (newest first)
      const groupArray = Object.values(groups).sort(
        (a, b) => b.dateObj - a.dateObj
      );

      // Add friendly labels
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      groupArray.forEach((group) => {
        const groupDate = new Date(group.dateObj);
        groupDate.setHours(0, 0, 0, 0);

        if (groupDate.getTime() === today.getTime()) {
          group.label = "Today";
        } else if (groupDate.getTime() === yesterday.getTime()) {
          group.label = "Yesterday";
        } else {
          // Format as "Month Day, Year"
          group.label = groupDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
      });

      return groupArray;
    };

    const fetchPhotos = async () => {
      loading.value = true;
      currentPage.value = 1;
      hasMorePhotos.value = true;

      try {
        const response = await axios.get("/api/photos", {
          params: {
            page: 1,
            limit: 50,
          },
        });
        photos.value = response.data.photos || [];
        groupedPhotos.value = groupPhotosByDate(photos.value);

        // If we got less than 50 photos, there are no more
        if (photos.value.length < 50) {
          hasMorePhotos.value = false;
        }

        // Calculate total storage size
        totalStorageSize.value = photos.value.reduce(
          (sum, photo) => sum + (photo.file_size || 0),
          0
        );
      } catch (err) {
        error.value =
          "Failed to load photos. Please make sure the server is running.";
        console.error("Error fetching photos:", err);
      } finally {
        loading.value = false;
      }
    };

    const loadMorePhotos = async () => {
      if (!hasMorePhotos.value || loadingMore.value) return;

      loadingMore.value = true;
      currentPage.value++;

      try {
        const response = await axios.get("/api/photos", {
          params: {
            page: currentPage.value,
            limit: 50,
          },
        });

        const newPhotos = response.data.photos || [];

        if (newPhotos.length === 0 || newPhotos.length < 50) {
          hasMorePhotos.value = false;
        }

        if (newPhotos.length > 0) {
          photos.value = [...photos.value, ...newPhotos];
          groupedPhotos.value = groupPhotosByDate(photos.value);

          // Update storage size
          totalStorageSize.value = photos.value.reduce(
            (sum, photo) => sum + (photo.file_size || 0),
            0
          );

          // Reattach observer to sentinel after DOM updates
          setTimeout(() => {
            setupIntersectionObserver();
          }, 100);
        }
      } catch (error) {
        console.error("Error loading more photos:", error);
      } finally {
        loadingMore.value = false;
      }
    };
    const startScan = async () => {
      try {
        scanning.value = true;
        scanStatus.value = null;
        consoleOpen.value = true;
        addConsoleLog("Starting photo library scan...", "info");

        const response = await axios.post("/api/scan/start");
        addConsoleLog(
          `Scan initiated for: ${response.data.libraryPath}`,
          "info"
        );

        // Poll for scan completion
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await axios.get("/api/scan/status");

            if (
              !statusResponse.data.isScanning &&
              statusResponse.data.lastScanResult
            ) {
              clearInterval(pollInterval);
              scanning.value = false;

              const result = statusResponse.data.lastScanResult;

              if (result.error) {
                addConsoleLog(`Scan failed: ${result.error}`, "error");
                scanStatus.value = {
                  type: "error",
                  message: `Scan failed: ${result.error}`,
                };
              } else {
                // Build detailed success message
                let message = `Scan complete! Found ${result.total} images. `;

                addConsoleLog(
                  `Scan complete! Found ${result.total} total images`,
                  "success"
                );
                addConsoleLog(`New images: ${result.new}`, "info");
                addConsoleLog(`Updated images: ${result.updated}`, "info");
                addConsoleLog(
                  `Skipped (already up-to-date): ${result.skipped}`,
                  "info"
                );

                if (result.failed > 0) {
                  addConsoleLog(
                    `Failed to process: ${result.failed}`,
                    "warning"
                  );
                }

                if (result.new > 0 || result.updated > 0) {
                  const parts = [];
                  if (result.new > 0) parts.push(`${result.new} new`);
                  if (result.updated > 0)
                    parts.push(`${result.updated} updated`);
                  message += parts.join(", ") + ". ";
                }

                if (result.skipped > 0) {
                  message += `${result.skipped} already up-to-date.`;
                }

                scanStatus.value = {
                  type: "success",
                  message: message,
                };

                // Refresh photos only if there were changes
                if (result.new > 0 || result.updated > 0) {
                  addConsoleLog("Refreshing photo library...", "info");
                  await fetchPhotos();
                  await fetchStatistics();
                  addConsoleLog(
                    "Photo library refreshed successfully",
                    "success"
                  );
                }
              }

              // Clear status after 5 seconds
              setTimeout(() => {
                scanStatus.value = null;
              }, 5000);
            }
          } catch (err) {
            clearInterval(pollInterval);
            scanning.value = false;
            addConsoleLog(`Error polling scan status: ${err.message}`, "error");
            console.error("Error polling scan status:", err);
          }
        }, 2000);
      } catch (err) {
        scanning.value = false;
        addConsoleLog(
          `Failed to start scan: ${err.response?.data?.error || err.message}`,
          "error"
        );
        scanStatus.value = {
          type: "error",
          message:
            "Failed to start scan: " +
            (err.response?.data?.error || err.message),
        };
        console.error("Error starting scan:", err);
      }
    };

    const getPhotoUrl = (photo) => {
      // Use on-demand thumbnail endpoint - generates thumbnail only when needed
      return `/api/photos/${photo.id}/thumbnail`;
    };

    const getFileType = (photo) => {
      if (!photo.filename) return "IMG";
      const ext = photo.filename.split(".").pop().toUpperCase();
      // Map common extensions to display names
      const typeMap = {
        JPG: "JPG",
        JPEG: "JPG",
        PNG: "PNG",
        GIF: "GIF",
        BMP: "BMP",
        WEBP: "WEBP",
        TIFF: "TIFF",
        TIF: "TIFF",
        CR2: "RAW",
        CR3: "RAW",
        NEF: "RAW",
        ARW: "RAW",
        DNG: "RAW",
        RAF: "RAW",
        ORF: "RAW",
        RW2: "RAW",
        PEF: "RAW",
      };
      return typeMap[ext] || ext;
    };

    const getLightboxPhotoUrl = (photo) => {
      // Use optimized endpoint with 1280px for high quality lightbox viewing
      return `/api/photos/${photo.id}/optimized?maxSize=1280`;
    };

    const togglePhotoSelection = (photoId, event) => {
      event.stopPropagation();
      if (selectedPhotos.value.has(photoId)) {
        selectedPhotos.value.delete(photoId);
      } else {
        selectedPhotos.value.add(photoId);
      }
      // Force reactivity update
      selectedPhotos.value = new Set(selectedPhotos.value);

      // Enter selection mode if any photo is selected
      selectionMode.value = selectedPhotos.value.size > 0;
    };

    const isPhotoSelected = (photoId) => {
      return selectedPhotos.value.has(photoId);
    };

    const clearSelection = () => {
      selectedPhotos.value.clear();
      selectedPhotos.value = new Set();
      selectionMode.value = false;
    };

    const selectAll = () => {
      photos.value.forEach((photo) => selectedPhotos.value.add(photo.id));
      selectedPhotos.value = new Set(selectedPhotos.value);
      selectionMode.value = true;
    };

    const selectAllInDate = (datePhotos) => {
      // Check if all photos in this date are already selected
      const allSelected = datePhotos.every((photo) =>
        selectedPhotos.value.has(photo.id)
      );

      if (allSelected) {
        // Deselect all photos in this date
        datePhotos.forEach((photo) => selectedPhotos.value.delete(photo.id));
      } else {
        // Select all photos in this date
        datePhotos.forEach((photo) => selectedPhotos.value.add(photo.id));
      }

      selectedPhotos.value = new Set(selectedPhotos.value);
      selectionMode.value = selectedPhotos.value.size > 0;
    };

    const areAllSelectedInDate = (datePhotos) => {
      return datePhotos.every((photo) => selectedPhotos.value.has(photo.id));
    };

    const closeSettings = () => {
      showSettings.value = false;
    };

    const saveSettings = async () => {
      try {
        // Update library path if changed
        if (
          storagePath.value &&
          storagePath.value !== config.value.photoLibraryPath
        ) {
          const response = await axios.post("/api/config/library-path", {
            path: storagePath.value,
          });

          if (response.data.success) {
            config.value.photoLibraryPath = response.data.photoLibraryPath;
            scanStatus.value = {
              type: "success",
              message: response.data.message,
            };

            setTimeout(() => {
              scanStatus.value = null;
            }, 5000);
          }
        }

        showSettings.value = false;
      } catch (error) {
        console.error("Error saving settings:", error);
        scanStatus.value = {
          type: "error",
          message: error.response?.data?.error || "Failed to save settings",
        };
      }
    };

    const browseFolder = () => {
      // Note: Browser file picker doesn't support folder selection in all browsers
      // User can manually enter the path, then it will be saved to .env file
      alert(
        'Please enter the full path to your photo library folder in the text field above and click "Save Changes" to update.'
      );
    };

    const moveToTrash = async () => {
      if (selectedPhotos.value.size === 0) return;

      const confirmDelete = confirm(
        `Are you sure you want to move ${selectedPhotos.value.size} photo(s) to trash?`
      );
      if (!confirmDelete) return;

      try {
        const photoIds = Array.from(selectedPhotos.value);
        const response = await axios.post("/api/photos/trash", { photoIds });

        if (response.data.success) {
          // Remove deleted photos from the list
          photos.value = photos.value.filter(
            (photo) => !selectedPhotos.value.has(photo.id)
          );
          groupedPhotos.value = groupPhotosByDate(photos.value);

          // Update trash count
          await fetchTrashCount();

          // Clear selection
          clearSelection();

          // Show success message
          scanStatus.value = {
            type: "success",
            message: `${response.data.moved} photo(s) moved to trash`,
          };

          setTimeout(() => {
            scanStatus.value = null;
          }, 3000);
        }
      } catch (error) {
        console.error("Error moving photos to trash:", error);
        scanStatus.value = {
          type: "error",
          message:
            "Failed to move photos to trash: " +
            (error.response?.data?.error || error.message),
        };
      }
    };

    const restoreFromTrash = async () => {
      if (selectedPhotos.value.size === 0) return;

      const confirmRestore = confirm(
        `Are you sure you want to restore ${selectedPhotos.value.size} photo(s)?`
      );
      if (!confirmRestore) return;

      try {
        const photoIds = Array.from(selectedPhotos.value);
        const response = await axios.post("/api/photos/trash/restore", {
          photoIds,
        });

        if (response.data.success) {
          // Remove restored photos from trash view
          photos.value = photos.value.filter(
            (photo) => !selectedPhotos.value.has(photo.id)
          );
          groupedPhotos.value = groupPhotosByDate(photos.value);

          // Update trash count
          await fetchTrashCount();

          // Clear selection
          clearSelection();

          // Show success message
          scanStatus.value = {
            type: "success",
            message: `${response.data.restored} photo(s) restored`,
          };

          setTimeout(() => {
            scanStatus.value = null;
          }, 3000);
        }
      } catch (error) {
        console.error("Error restoring photos:", error);
        scanStatus.value = {
          type: "error",
          message:
            "Failed to restore photos: " +
            (error.response?.data?.error || error.message),
        };
      }
    };

    const permanentlyDelete = async () => {
      if (selectedPhotos.value.size === 0) return;

      const confirmDelete = confirm(
        `Are you sure you want to PERMANENTLY delete ${selectedPhotos.value.size} photo(s)?\n\nThis action cannot be undone!`
      );
      if (!confirmDelete) return;

      try {
        const photoIds = Array.from(selectedPhotos.value);
        const response = await axios.delete("/api/photos/trash/permanent", {
          data: { photoIds },
        });

        if (response.data.success) {
          // Remove deleted photos from trash view
          photos.value = photos.value.filter(
            (photo) => !selectedPhotos.value.has(photo.id)
          );
          groupedPhotos.value = groupPhotosByDate(photos.value);

          // Update trash count
          await fetchTrashCount();

          // Clear selection
          clearSelection();

          // Show success message
          scanStatus.value = {
            type: "success",
            message: `${response.data.deleted} photo(s) permanently deleted`,
          };

          setTimeout(() => {
            scanStatus.value = null;
          }, 3000);
        }
      } catch (error) {
        console.error("Error permanently deleting photos:", error);
        scanStatus.value = {
          type: "error",
          message:
            "Failed to delete photos: " +
            (error.response?.data?.error || error.message),
        };
      }
    };

    const emptyTrash = async () => {
      if (trashCount.value === 0) return;

      const confirmEmpty = confirm(
        `Are you sure you want to PERMANENTLY delete all ${trashCount.value} photo(s) in trash?\n\nThis action cannot be undone!`
      );
      if (!confirmEmpty) return;

      try {
        const response = await axios.delete("/api/photos/trash/empty");

        if (response.data.success) {
          // Clear all photos from trash view
          photos.value = [];
          groupedPhotos.value = [];

          // Update trash count
          await fetchTrashCount();

          // Show success message
          scanStatus.value = {
            type: "success",
            message: `${response.data.deleted} photo(s) permanently deleted`,
          };

          setTimeout(() => {
            scanStatus.value = null;
          }, 3000);
        }
      } catch (error) {
        console.error("Error emptying trash:", error);
        scanStatus.value = {
          type: "error",
          message:
            "Failed to empty trash: " +
            (error.response?.data?.error || error.message),
        };
      }
    };

    const expandTimeline = () => {
      timelineExpanded.value = true;
    };

    const collapseTimeline = () => {
      timelineExpanded.value = false;
      hideYearTooltip();
      hideMonthTooltip();
    };

    const showYearTooltip = (year, event) => {
      tooltip.value.visible = true;
      tooltip.value.text = `${year}`;
      tooltip.value.y = event.clientY;
    };

    const hideYearTooltip = () => {
      tooltip.value.visible = false;
    };

    const showMonthTooltip = (density, event) => {
      tooltip.value.visible = true;
      tooltip.value.text = density.label;
      tooltip.value.y = event.clientY;
    };

    const hideMonthTooltip = () => {
      tooltip.value.visible = false;
    };

    // Album functions
    const fetchAlbums = async () => {
      try {
        const response = await axios.get("/api/albums");
        albums.value = response.data.albums || [];
      } catch (err) {
        console.error("Error fetching albums:", err);
      }
    };

    const viewAlbums = () => {
      currentView.value = "albums";
      error.value = null;
      fetchAlbums();
    };

    const viewAlbumDetail = async (albumId) => {
      try {
        loading.value = true;
        error.value = null;
        const response = await axios.get(`/api/albums/${albumId}`);
        currentAlbum.value = response.data.album;
        photos.value = response.data.photos || [];
        groupedPhotos.value = groupPhotosByDate(photos.value);
        currentView.value = "album-detail";
      } catch (err) {
        error.value = "Failed to load album.";
        console.error("Error fetching album:", err);
      } finally {
        loading.value = false;
      }
    };

    const createAlbum = async () => {
      if (!newAlbumName.value.trim()) return;

      try {
        await axios.post("/api/albums", {
          name: newAlbumName.value.trim(),
          description: newAlbumDescription.value.trim(),
        });

        newAlbumName.value = "";
        newAlbumDescription.value = "";
        showAlbumModal.value = false;
        await fetchAlbums();
      } catch (err) {
        console.error("Error creating album:", err);
        alert("Failed to create album");
      }
    };

    const deleteAlbum = async (albumId) => {
      if (
        !confirm(
          "Are you sure you want to delete this album? Photos will not be deleted, only the album."
        )
      ) {
        return;
      }

      try {
        await axios.delete(`/api/albums/${albumId}`);
        await fetchAlbums();

        scanStatus.value = {
          type: "success",
          message: "Album deleted successfully",
        };
        setTimeout(() => {
          scanStatus.value = null;
        }, 3000);
      } catch (err) {
        console.error("Error deleting album:", err);
        scanStatus.value = {
          type: "error",
          message: "Failed to delete album",
        };
        setTimeout(() => {
          scanStatus.value = null;
        }, 3000);
      }
    };

    const addPhotosToAlbum = async (albumId) => {
      if (selectedPhotos.value.size === 0) return;

      try {
        const photoIds = Array.from(selectedPhotos.value);
        const response = await axios.post(`/api/albums/${albumId}/photos`, {
          photoIds,
        });

        if (response.data.success) {
          clearSelection();
          showAddToAlbumModal.value = false;

          scanStatus.value = {
            type: "success",
            message: `${response.data.added} photo(s) added to album`,
          };

          setTimeout(() => {
            scanStatus.value = null;
          }, 3000);
        }
      } catch (err) {
        console.error("Error adding photos to album:", err);
        alert("Failed to add photos to album");
      }
    };

    const openAddToAlbumModal = () => {
      if (selectedPhotos.value.size === 0) return;
      showAddToAlbumModal.value = true;
      fetchAlbums();
    };

    const viewPhotos = () => {
      currentView.value = "photos";
      error.value = null;
      fetchPhotos();
    };

    const viewTrash = async () => {
      currentView.value = "trash";
      loading.value = true;
      error.value = null;

      try {
        const response = await axios.get("/api/photos/trash");
        photos.value = response.data.photos || [];
        groupedPhotos.value = groupPhotosByDate(photos.value);
        trashCount.value = photos.value.length;
      } catch (err) {
        error.value = "Failed to load trash.";
        console.error("Error fetching trash:", err);
      } finally {
        loading.value = false;
      }
    };

    const fetchTrashCount = async () => {
      try {
        const response = await axios.get("/api/photos/trash/count");
        trashCount.value = response.data.count || 0;
      } catch (err) {
        console.error("Error fetching trash count:", err);
      }
    };

    const openLightbox = (photo) => {
      if (selectionMode.value) return; // Don't open lightbox in selection mode

      currentPhotoIndex.value = photos.value.findIndex(
        (p) => p.id === photo.id
      );
      lightboxPhoto.value = photo;
      showInfo.value = false;
      document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
      lightboxPhoto.value = null;
      showInfo.value = false;
      currentPhotoIndex.value = -1;
      document.body.style.overflow = "";
    };

    const toggleInfo = () => {
      showInfo.value = !showInfo.value;
    };

    const canNavigatePrevious = computed(() => {
      return currentPhotoIndex.value > 0;
    });

    const canNavigateNext = computed(() => {
      return currentPhotoIndex.value < photos.value.length - 1;
    });

    const navigatePrevious = () => {
      if (canNavigatePrevious.value) {
        currentPhotoIndex.value--;
        lightboxPhoto.value = photos.value[currentPhotoIndex.value];
        showInfo.value = false;
      }
    };

    const navigateNext = () => {
      if (canNavigateNext.value) {
        currentPhotoIndex.value++;
        lightboxPhoto.value = photos.value[currentPhotoIndex.value];
        showInfo.value = false;
      }
    };

    const formatPhotoDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const getYearFromDate = (dateObj) => {
      return dateObj.getFullYear();
    };

    const uniqueYears = computed(() => {
      const years = new Set();
      groupedPhotos.value.forEach((group) => {
        years.add(group.dateObj.getFullYear());
      });
      return Array.from(years).sort((a, b) => b - a);
    });

    const storagePercentage = computed(() => {
      if (!config.value.diskCapacity || !config.value.diskCapacity.total) {
        return 0;
      }
      return Math.min(
        100,
        (totalStorageSize.value / config.value.diskCapacity.total) * 100
      );
    });

    const formatStorageSize = (bytes) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const scrollToYear = (year) => {
      const yearElement = document.querySelector(`[data-year="${year}"]`);
      if (yearElement) {
        yearElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const scrollToDate = (dateKey) => {
      const dateElement = document.querySelector(`[data-date="${dateKey}"]`);
      if (dateElement) {
        dateElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const getYearDensity = (year) => {
      // Get all photo groups for this year
      const yearGroups = groupedPhotos.value.filter(
        (group) => group.dateObj.getFullYear() === year
      );

      if (yearGroups.length === 0) return [];

      // Group by month
      const monthCounts = new Array(12).fill(0);
      yearGroups.forEach((group) => {
        const month = group.dateObj.getMonth();
        monthCounts[month] += group.photos.length;
      });

      // Find max count for normalization
      const maxCount = Math.max(...monthCounts);

      // Create density array with opacity based on photo count
      return monthCounts
        .map((count, month) => {
          const opacity = count > 0 ? Math.max(0.2, count / maxCount) : 0;
          const monthName = new Date(year, month).toLocaleDateString("en-US", {
            month: "short",
          });

          // Find first date in this month for scrolling
          const monthGroup = yearGroups.find(
            (g) => g.dateObj.getMonth() === month
          );

          return {
            opacity,
            count,
            label: `${monthName} ${year}: ${count} photos`,
            date: monthGroup ? monthGroup.date : null,
          };
        })
        .filter((d) => d.count > 0); // Only show dots for months with photos
    };

    onMounted(() => {
      fetchConfig();
      fetchPhotos();
      fetchTrashCount();
      fetchStatistics();

      // Set up Intersection Observer for infinite scroll
      setTimeout(() => {
        setupIntersectionObserver();
      }, 500);
    });

    onUnmounted(() => {
      // Clean up observer
      if (observer) {
        observer.disconnect();
      }
    });

    const setupIntersectionObserver = () => {
      if (observer) {
        observer.disconnect();
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            console.log("Intersection Observer:", {
              isIntersecting: entry.isIntersecting,
              hasMorePhotos: hasMorePhotos.value,
              loadingMore: loadingMore.value,
              currentView: currentView.value,
            });

            if (
              entry.isIntersecting &&
              hasMorePhotos.value &&
              !loadingMore.value &&
              currentView.value === "photos"
            ) {
              console.log("Loading more photos via Intersection Observer...");
              loadMorePhotos();
            }
          });
        },
        {
          root: null,
          rootMargin: "200px",
          threshold: 0.1,
        }
      );

      if (sentinel.value) {
        observer.observe(sentinel.value);
        console.log("Intersection Observer attached to sentinel");
      }
    };

    return {
      photos,
      groupedPhotos,
      config,
      loading,
      loadingMore,
      hasMorePhotos,
      sentinel,
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
      currentView,
      trashCount,
      consoleOpen,
      consoleLogs,
      statistics,
      albums,
      currentAlbum,
      showAlbumModal,
      showAddToAlbumModal,
      newAlbumName,
      newAlbumDescription,
      timelineContentRef,
      getPhotoUrl,
      getFileType,
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
      selectAllInDate,
      areAllSelectedInDate,
      closeSettings,
      saveSettings,
      browseFolder,
      moveToTrash,
      restoreFromTrash,
      permanentlyDelete,
      emptyTrash,
      expandTimeline,
      collapseTimeline,
      showYearTooltip,
      hideYearTooltip,
      showMonthTooltip,
      hideMonthTooltip,
      viewPhotos,
      viewAlbums,
      viewAlbumDetail,
      viewTrash,
      startScan,
      toggleConsole,
      clearConsoleLogs,
      createAlbum,
      deleteAlbum,
      addPhotosToAlbum,
      openAddToAlbumModal,
    };
  },
};
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
  justify-content: space-between;
  width: 100%;
  gap: 2rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  background-color: #f1f3f4;
  padding: 0.25rem;
  border-radius: 24px;
}

.view-toggle-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  border-radius: 20px;
  color: #5f6368;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.view-toggle-button:hover {
  background-color: #e8eaed;
}

.view-toggle-button.active {
  background-color: #ffffff;
  color: #1a73e8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-toggle-button svg {
  width: 20px;
  height: 20px;
}

.badge {
  background-color: #d93025;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
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

.loading,
.error,
.empty-state {
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
  left: 0;
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

.toolbar-button-danger {
  background-color: #fce8e6;
  border-color: #f28b82;
  color: #d93025;
}

.toolbar-button-danger:hover:not(:disabled) {
  background-color: #fad2cf;
  border-color: #d93025;
}

.toolbar-slide-enter-active,
.toolbar-slide-leave-active {
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

/* Trash Header */
.trash-header {
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  background-color: #ffffff;
  border-bottom: 1px solid #dadce0;
  padding: 1rem 2rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  z-index: 99;
}

.empty-trash-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #fce8e6;
  border: 1px solid #f28b82;
  border-radius: 24px;
  color: #d93025;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.empty-trash-button:hover {
  background-color: #fad2cf;
  border-color: #d93025;
  transform: scale(1.02);
}

.empty-trash-button svg {
  width: 20px;
  height: 20px;
}

.timeline-content {
  flex: 1;
  padding: 2rem 2rem;
  padding-right: 100px;
  overflow-y: auto;
  width: 100%;
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

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.select-date-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background-color: #ffffff;
  border: 1px solid #dadce0;
  border-radius: 8px;
  color: #5f6368;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.select-date-button:hover {
  background-color: #f8f9fa;
  border-color: #1a73e8;
  color: #1a73e8;
}

.select-date-button svg {
  transition: transform 0.2s;
}

.select-date-button:hover svg {
  transform: scale(1.1);
}

.photo-count {
  font-size: 0.9rem;
  font-weight: 400;
  color: #5f6368;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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

.photo-album-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  padding: 4px 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
  transition: all 0.2s;
}

.photo-album-indicator:hover {
  background-color: rgba(0, 0, 0, 0.85);
  transform: scale(1.05);
}

.photo-album-indicator .album-count {
  font-size: 11px;
  font-weight: 600;
  color: white;
  line-height: 1;
}

.photo-file-type {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  z-index: 2;
  transition: all 0.2s;
  text-transform: uppercase;
}

.photo-file-type:hover {
  background-color: rgba(0, 0, 0, 0.9);
  transform: scale(1.05);
}

/* Different colors for different file types */
.file-type-jpg {
  background-color: rgba(33, 150, 243, 0.9);
}

.file-type-png {
  background-color: rgba(76, 175, 80, 0.9);
}

.file-type-gif {
  background-color: rgba(255, 152, 0, 0.9);
}

.file-type-raw {
  background-color: rgba(156, 39, 176, 0.9);
}

.file-type-webp {
  background-color: rgba(0, 188, 212, 0.9);
}

.file-type-tiff {
  background-color: rgba(121, 85, 72, 0.9);
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

.loading-more {
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.loading-skeleton {
  width: 100%;
  padding: 0 2rem;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.skeleton-item {
  aspect-ratio: 1;
  background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 16px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.loading-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-more .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e8eaed;
  border-top-color: #1a73e8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-more p {
  color: #5f6368;
  font-size: 0.95rem;
  margin: 0;
  font-weight: 500;
}

.scroll-sentinel {
  height: 10px;
  width: 100%;
  pointer-events: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.end-message {
  text-align: center;
  padding: 2rem 0 3rem;
  color: #5f6368;
  font-size: 0.95rem;
}

.end-message p {
  margin: 0;
  padding: 1rem;
  background: #f1f3f4;
  border-radius: 8px;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.3s ease;
}

.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
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

.info-slide-enter-active,
.info-slide-leave-active {
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

.btn-cancel,
.btn-save {
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

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
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

  .timeline-navbar {
    display: none;
  }

  .timeline-content {
    padding: 1rem;
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

/* Console Panel */
.console-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #1e1e1e;
  color: #d4d4d4;
  z-index: 999;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  max-height: 50px;
  overflow: hidden;
}

.console-panel.open {
  max-height: 400px;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: #2d2d2d;
  border-bottom: 1px solid #3e3e3e;
  cursor: pointer;
  user-select: none;
}

.console-header:hover {
  background-color: #323232;
}

.console-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  font-size: 0.95rem;
}

.console-title svg {
  color: #4fc3f7;
}

.console-badge {
  background-color: #1a73e8;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
}

.console-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.console-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #3e3e3e;
  border: none;
  border-radius: 4px;
  color: #d4d4d4;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.console-button:hover {
  background-color: #4a4a4a;
}

.console-toggle {
  background: none;
  border: none;
  color: #d4d4d4;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.console-content {
  overflow-y: auto;
  max-height: 350px;
  padding: 1rem 1.5rem;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 0.85rem;
  line-height: 1.6;
}

.console-empty {
  color: #808080;
  text-align: center;
  padding: 2rem;
}

.console-log {
  display: flex;
  gap: 1rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid #2d2d2d;
}

.console-log:last-child {
  border-bottom: none;
}

.log-timestamp {
  color: #808080;
  flex-shrink: 0;
  min-width: 90px;
}

.log-message {
  flex: 1;
}

.log-info .log-message {
  color: #4fc3f7;
}

.log-success .log-message {
  color: #66bb6a;
}

.log-warning .log-message {
  color: #ffa726;
}

.log-error .log-message {
  color: #ef5350;
}

/* Statistics */
.statistics-group {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.statistics-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #202124;
}

.statistics-header svg {
  color: #1a73e8;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.stat-card {
  background-color: #ffffff;
  border: 1px solid #e8eaed;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-label {
  font-size: 0.85rem;
  color: #5f6368;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a73e8;
}

.stat-value.stat-date {
  font-size: 1rem;
  color: #202124;
}

@media (max-width: 768px) {
  .console-panel.open {
    max-height: 300px;
  }

  .console-content {
    max-height: 250px;
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
  }

  .statistics-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .stat-card {
    padding: 0.75rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }
}

/* Albums */
.albums-grid-container {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.albums-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.albums-header h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: #202124;
}

.create-album-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #1a73e8;
  border: none;
  border-radius: 24px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.create-album-button:hover {
  background-color: #1765cc;
  transform: scale(1.02);
}

.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.album-card {
  background-color: #ffffff;
  border: 1px solid #e8eaed;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.album-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}

.album-card:hover .album-delete-button {
  opacity: 1;
}

.album-delete-button {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.95);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.album-delete-button:hover {
  background-color: #fee;
  color: #d93025;
  transform: scale(1.1);
}

.album-delete-button svg {
  color: #5f6368;
  transition: color 0.2s;
}

.album-delete-button:hover svg {
  color: #d93025;
}

.album-cover {
  aspect-ratio: 1;
  background-color: #f1f3f4;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f6368;
}

.album-info {
  padding: 1rem;
  cursor: pointer;
}

.album-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #202124;
}

.album-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #5f6368;
}

/* Album Modals */
.modal-small {
  max-width: 500px;
}

.modal-description {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  color: #5f6368;
}

.album-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e8eaed;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.album-list-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #e8eaed;
}

.album-list-item:last-child {
  border-bottom: none;
}

.album-list-item:hover {
  background-color: #f8f9fa;
}

.album-list-icon {
  color: #1a73e8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.album-list-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #202124;
}

.album-list-info p {
  margin: 0;
  font-size: 0.85rem;
  color: #5f6368;
}

.btn-create-new {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border: 1px dashed #dadce0;
  border-radius: 8px;
  color: #1a73e8;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-new:hover {
  background-color: #e8f0fe;
  border-color: #1a73e8;
}

textarea.setting-input {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}
</style>
