class CursorBlinker {
  constructor() {
    this.interval = setInterval(() => this.blink(), 500)
  }

  blink() {
    document.querySelectorAll('[style*="color: #0f0;"]').forEach((cursor) => {
      cursor.style.visibility = cursor.style.visibility === "hidden" ? "visible" : "hidden"
    })
  }

  destroy() {
    clearInterval(this.interval)
  }
}

class GlitchEffect {
  constructor() {
    this.interval = setInterval(() => this.maybeGlitch(), 100)
  }

  maybeGlitch() {
    if (Math.random() >= 0.01) return

    const glitch = document.createElement("div")
    Object.assign(glitch.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "#fff",
      opacity: "0.1",
      pointerEvents: "none",
      zIndex: "1001",
      transform: `translateY(${Math.random() * 10}px)`,
    })

    document.body.appendChild(glitch)
    setTimeout(() => glitch.remove(), 50)
  }

  destroy() {
    clearInterval(this.interval)
  }
}

class Starfield {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId)
    this.ctx = this.canvas.getContext("2d")
    this.stars = []
    this.animationId = null

    this.init()
  }

  init() {
    this.resizeCanvas()
    this.createStars(400)
    window.addEventListener("resize", () => this.resizeCanvas())
    this.animate()
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  createStars(count) {
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * this.canvas.width - this.canvas.width / 2,
      y: Math.random() * this.canvas.height - this.canvas.height / 2,
      z: Math.random() * 1500,
      speed: 1 + Math.random() * 2,
    }))
  }

  updateStar(star) {
    star.z -= star.speed

    if (star.z <= 0) {
      star.z = 1500
      star.x = Math.random() * this.canvas.width - this.canvas.width / 2
      star.y = Math.random() * this.canvas.height - this.canvas.height / 2
    }
  }

  drawStar(star) {
    const scale = 100 / star.z
    const x = star.x * scale + this.canvas.width / 2
    const y = star.y * scale + this.canvas.height / 2
    const size = scale * 2

    if (x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height) {
      this.ctx.beginPath()
      this.ctx.arc(x, y, size, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  animate() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.fillStyle = "white"

    this.stars.forEach((star) => {
      this.updateStar(star)
      this.drawStar(star)
    })

    this.animationId = requestAnimationFrame(() => this.animate())
  }

  setStarCount(count) {
    if (count < this.stars.length) {
      this.stars.length = count
    } else {
      this.createStars(count)
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    window.removeEventListener("resize", this.resizeCanvas)
  }
}

class DiscordStatus {
  constructor() {
    this.userId = "1381763940236792051"
    this.apiUrl = `https://api.lanyard.rest/v1/users/${this.userId}`
    this.intervals = new Map()
    this.statusColors = {
      online: "lime",
      idle: "#ffac00",
      dnd: "red",
      offline: "#747f8d",
    }

    this.init()
  }

  init() {
    this.updateStatus()
    setInterval(() => this.updateStatus(), 30000)
  }

  async updateStatus() {
    try {
      const response = await fetch(this.apiUrl)
      const data = await response.json()

      if (data.success) {
        this.updateUserInfo(data.data)
        this.updateSpotify(data.data)
        this.updateActivities(data.data)
      }
    } catch (error) {
      console.error("Error fetching status:", error)
    }
  }

  updateUserInfo(data) {
    const avatarUrl = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}`
    const avatarElement = document.getElementById("userAvatar")
    const usernameElement = document.getElementById("username")
    const statusElement = document.getElementById("status")

    if (avatarElement) {
      avatarElement.src = avatarUrl
      avatarElement.style.opacity = data.discord_status === "offline" ? "0.5" : "1"
    }

    if (usernameElement) {
      usernameElement.textContent = data.discord_user.display_name || data.discord_user.username
    }

    if (statusElement) {
      statusElement.textContent = data.discord_status.toUpperCase()
    }

    document.documentElement.style.setProperty("--status-color", this.statusColors[data.discord_status])
  }

  updateSpotify(data) {
    const elements = {
      container: document.getElementById("spotifyContainer"),
      cover: document.getElementById("spotifyCover"),
      song: document.getElementById("spotifySong"),
      artist: document.getElementById("spotifyArtist"),
      progress: document.getElementById("spotifyProgress"),
      currentTime: document.getElementById("spotifyCurrentTime"),
      endTime: document.getElementById("spotifyEndTime"),
    }

    this.clearInterval("spotify")

    if (!data.listening_to_spotify || !elements.container) {
      if (elements.container) elements.container.style.display = "none"
      return
    }

    elements.container.style.display = "block"
    elements.song.textContent = data.spotify.song
    elements.artist.textContent = data.spotify.artist
    elements.cover.src = data.spotify.album_art_url
    elements.cover.style.display = "block"

    const { start, end } = data.spotify.timestamps
    const duration = end - start

    const updateProgress = () => {
      const elapsed = Math.max(0, Date.now() - start)
      const percent = Math.min(1, elapsed / duration)

      elements.progress.style.width = `${percent * 100}%`
      elements.currentTime.textContent = this.formatTime(elapsed)
      elements.endTime.textContent = this.formatTime(duration)
    }

    updateProgress()
    this.setInterval("spotify", updateProgress, 1000)
  }

  updateActivities(data) {
    const activities = (data.activities || []).filter(
      (a) => a.name !== "Spotify" && a.name !== "Custom Status" && (a.type === 0 || a.type === 4)
    )

    const elements = {
      container: document.getElementById("activitiesContainer"),
      image: document.getElementById("activityImage"),
      name: document.getElementById("activityName"),
      state: document.getElementById("activityState"),
    }

    let timestampElement = document.getElementById("activityTimestamp")
    if (!timestampElement && elements.container) {
      timestampElement = this.createTimestampElement(elements.state)
    }

    this.clearInterval("activity")

    if (!activities.length || !elements.container) {
      if (elements.container) elements.container.style.display = "none"
      return
    }

    const activity = activities[0]
    elements.container.style.display = "block"
    elements.name.textContent = activity.name || ""
    elements.state.textContent = activity.state || ""

    const { largeImageUrl } = this.getActivityImages(activity)
    if (largeImageUrl) {
      elements.image.src = largeImageUrl
      elements.image.style.display = "block"
    } else {
      elements.image.style.display = "none"
    }

    if (activity.timestamps?.start && timestampElement) {
      const updateElapsed = () => {
        const elapsed = Date.now() - activity.timestamps.start
        timestampElement.textContent = this.formatElapsed(elapsed)
        timestampElement.style.display = "block"
      }

      updateElapsed()
      this.setInterval("activity", updateElapsed, 1000)
    } else if (timestampElement) {
      timestampElement.style.display = "none"
    }
  }

  createTimestampElement(parentElement) {
    const element = document.createElement("div")
    element.id = "activityTimestamp"
    Object.assign(element.style, {
      color: "#888",
      fontSize: "0.9em",
      marginTop: "2px",
    })
    parentElement.parentNode.appendChild(element)
    return element
  }

  getActivityImages(activity) {
    const getImageUrl = (image, applicationId) => {
      if (!image) return `https://dcdn.dstn.to/app-icons/${applicationId}`

      return image.startsWith("mp:external")
        ? `https://media.discordapp.net/${image.replace("mp:", "")}`
        : `https://cdn.discordapp.com/app-assets/${applicationId}/${image}.png`
    }

    return {
      largeImageUrl: getImageUrl(activity.assets?.large_image, activity.application_id),
      smallImageUrl: getImageUrl(activity.assets?.small_image, activity.application_id),
    }
  }

  formatTime(ms) {
    const total = Math.floor(ms / 1000)
    const minutes = Math.floor(total / 60)
    const seconds = total % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  formatElapsed(ms) {
    const total = Math.floor(ms / 1000)
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const seconds = total % 60

    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      : `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  setInterval(key, callback, delay) {
    this.clearInterval(key)
    this.intervals.set(key, setInterval(callback, delay))
  }

  clearInterval(key) {
    const interval = this.intervals.get(key)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(key)
    }
  }

  destroy() {
    this.intervals.forEach((interval) => clearInterval(interval))
    this.intervals.clear()
  }
}

class PerformanceManager {
  constructor() {
    this.storageKey = "performance-mode"
    this.isPerformanceMode = this.getStoredMode()
    this.toggle = null
    this.rateLimitTimer = null

    this.init()
  }

  init() {
    if (this.isPerformanceMode === null) {
      this.showInitialModal()
    } else {
      this.createToggle()
      this.applyMode()
    }
  }

  getStoredMode() {
    const stored = localStorage.getItem(this.storageKey)
    return stored === null ? null : stored === "true"
  }

  showInitialModal() {
    const modal = document.createElement("div")
    modal.className = "performance-modal"
    modal.innerHTML = `
      <div class="performance-modal-content">
        <h2>Performance Settings</h2>
        <p>This site includes visual effects that might affect performance on mobile devices.</p>
        <p>Would you like to enable performance mode?</p>
        <div class="performance-modal-buttons">
          <button data-mode="true">Yes (Recommended for Mobile)</button>
          <button data-mode="false">No (Full Effects)</button>
        </div>
      </div>
    `

    modal.addEventListener("click", (e) => {
      const mode = e.target.dataset.mode
      if (mode !== undefined) {
        this.setMode(mode === "true")
        modal.remove()
        this.showElements()
        this.createToggle()
        this.applyMode()
      }
    })

    document.body.appendChild(modal)
    this.hideElements()
  }

  createToggle() {
    this.toggle = document.createElement("div")
    this.toggle.className = "performance-toggle"
    this.toggle.innerHTML = `
      <label class="switch">
        <input type="checkbox" ${this.isPerformanceMode ? "checked" : ""}>
        <span class="slider"></span>
      </label>
      <span class="toggle-label">Performance Mode</span>
    `

    const checkbox = this.toggle.querySelector("input")
    checkbox.addEventListener("change", (e) => {
      this.setMode(e.target.checked)
      this.applyMode()
    })

    document.body.appendChild(this.toggle)
  }

  setMode(enabled) {
    this.isPerformanceMode = enabled
    localStorage.setItem(this.storageKey, enabled.toString())
  }

  applyMode() {
    const elements = {
      crt: document.querySelector(".crt"),
      scanline: document.querySelector(".retro-scanline"),
      container: document.getElementById("container"),
      bloomContainer: document.querySelector(".bloom-container"),
    }

    const display = this.isPerformanceMode ? "none" : "block"

    if (elements.crt) elements.crt.style.display = display
    if (elements.scanline) elements.scanline.style.display = display
    if (elements.bloomContainer) elements.bloomContainer.style.display = display

    if (elements.container) {
      elements.container.style.filter = this.isPerformanceMode ? "none" : "blur(0.5px) brightness(1.1)"
      elements.container.style.animation = this.isPerformanceMode ? "none" : "chromaticMove 50ms infinite alternate"
    }

    if (window.starfield) {
      window.starfield.setStarCount(this.isPerformanceMode ? 200 : 400)
    }
  }

  hideElements() {
    const elements = ["container", "starfield"]
    elements.forEach((id) => {
      const element = document.getElementById(id)
      if (element) element.style.visibility = "hidden"
    })
  }

  showElements() {
    const elements = ["container", "starfield"]
    elements.forEach((id) => {
      const element = document.getElementById(id)
      if (element) element.style.visibility = "visible"
    })
  }
}

class App {
  constructor() {
    this.components = new Map()
    this.init()
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.initializeComponents())
    } else {
      this.initializeComponents()
    }
  }

  initializeComponents() {
    this.components.set("cursorBlinker", new CursorBlinker())
    this.components.set("glitchEffect", new GlitchEffect())

    if (document.getElementById("starfield")) {
      window.starfield = new Starfield("starfield")
      this.components.set("starfield", window.starfield)
    }

    this.components.set("discordStatus", new DiscordStatus())
    this.components.set("performanceManager", new PerformanceManager())
  }

  destroy() {
    this.components.forEach((component) => {
      if (component.destroy) component.destroy()
    })
    this.components.clear()
  }
}

new App()
