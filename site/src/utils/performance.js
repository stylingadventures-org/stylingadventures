/**
 * Performance Optimization Utilities
 * Phase 9: Performance & Optimization
 */

/**
 * Lazy load pages for route-based code splitting
 */
export const lazyLoadPages = {
  // Public pages
  Home: () => import('./Home'),
  Discover: () => import('./Discover'),
  SignupBestie: () => import('./SignupBestie'),
  SignupCreator: () => import('./SignupCreator'),
  BecomeBestie: () => import('./BecomeBestie'),
  Callback: () => import('./Callback'),
  
  // Protected pages
  Dashboard: () => import('./Dashboard'),
  Admin: () => import('./Admin'),
  CreatorCabinet: () => import('./CreatorCabinet'),
  FashionGame: () => import('./FashionGame'),
  EpisodeTheater: () => import('./EpisodeTheater'),
}

/**
 * Cache API responses in IndexedDB
 */
class APICache {
  constructor(storeName = 'api-cache') {
    this.storeName = storeName
    this.db = null
    this.initDB()
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('stylingadventures', 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' })
        }
      }
    })
  }

  async set(key, value, ttlMinutes = 30) {
    if (!this.db) await this.initDB()

    const expiry = Date.now() + ttlMinutes * 60 * 1000
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put({ key, value, expiry })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async get(key) {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result

        if (!result) {
          resolve(null)
          return
        }

        // Check if expired
        if (result.expiry < Date.now()) {
          // Delete expired entry
          const deleteReq = store.delete(key)
          resolve(null)
        } else {
          resolve(result.value)
        }
      }
    })
  }

  async clear() {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

export const apiCache = new APICache()

/**
 * Image optimization utilities
 */
export const imageOptimization = {
  /**
   * Generate responsive image URLs with cloudinary-like transformations
   */
  generateResponsiveUrl: (url, width, height, quality = 80) => {
    if (!url) return null
    
    // If already using a CDN, add transformation params
    if (url.includes('cloudinary') || url.includes('imgix')) {
      const separator = url.includes('?') ? '&' : '?'
      return `${url}${separator}w=${width}&h=${height}&q=${quality}`
    }
    
    return url
  },

  /**
   * Get srcset for responsive images
   */
  getSrcSet: (url, widths = [320, 640, 960, 1280]) => {
    return widths
      .map(w => `${imageOptimization.generateResponsiveUrl(url, w, null)} ${w}w`)
      .join(', ')
  },

  /**
   * Preload critical images
   */
  preloadImage: (url) => {
    if (typeof document === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  },
}

/**
 * Web Vitals monitoring
 */
export const monitorWebVitals = () => {
  if (typeof window === 'undefined') return

  // Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('LCP:', entry.renderTime || entry.loadTime)
        }
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      console.error('LCP monitoring failed:', e)
    }
  }

  // First Input Delay
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('FID:', entry.processingDuration)
        }
      })
      observer.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      console.error('FID monitoring failed:', e)
    }
  }
}

/**
 * Debounce function for optimization
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for optimization
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Request animation frame helper
 */
export const requestIdleCallback =
  typeof window !== 'undefined' && window.requestIdleCallback
    ? window.requestIdleCallback
    : (cb) => setTimeout(cb, 1)

/**
 * Batch GraphQL requests
 */
export const batchGraphQLRequests = async (queries, endpoint, apiKey) => {
  const batch = queries.map((query) => ({
    query,
  }))

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(batch),
  })

  return response.json()
}

export default {
  lazyLoadPages,
  apiCache,
  imageOptimization,
  monitorWebVitals,
  debounce,
  throttle,
  requestIdleCallback,
  batchGraphQLRequests,
}
