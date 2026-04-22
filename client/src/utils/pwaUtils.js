// PWA Utility Functions for Horizon Hotels

class PWAUtils {
  static async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('New Service Worker found');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.showUpdateAvailable();
            }
          });
        });
        
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }

  static showUpdateAvailable() {
    // Create a custom notification or use browser notification
    if ('Notification' in navigator && Notification.permission === 'granted') {
      new Notification('App Update Available', {
        body: 'A new version of Horizon Hotels is available. Click to update.',
        icon: '/icons/icon-192x192.png',
        tag: 'app-update'
      }).onclick = () => {
        window.location.reload();
      };
    } else {
      // Fallback to in-app notification
      this.showInAppNotification('update', 'A new version is available. Refresh to update.');
    }
  }

  static async requestNotificationPermission() {
    if ('Notification' in navigator) {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        return permission;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
      }
    }
    return 'unsupported';
  }

  static async subscribeToPushNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY)
        });
        
        // Send subscription to server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(subscription)
        });
        
        console.log('Push notification subscription successful');
        return subscription;
      } catch (error) {
        console.error('Push notification subscription failed:', error);
        return null;
      }
    }
    return null;
  }

  static urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  static showInstallPrompt() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button or banner
      this.showInstallButton();
    });
    
    // Handle install button click
    window.addEventListener('click', async (e) => {
      if (e.target.matches('.install-btn')) {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`Install prompt ${outcome}`);
          deferredPrompt = null;
          
          // Hide install button
          this.hideInstallButton();
        }
      }
    });
  }

  static showInstallButton() {
    const installBtn = document.createElement('button');
    installBtn.className = 'install-btn';
    installBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      Install App
    `;
    installBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 50px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    `;
    
    installBtn.addEventListener('mouseenter', () => {
      installBtn.style.transform = 'translateY(-2px)';
      installBtn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
    });
    
    installBtn.addEventListener('mouseleave', () => {
      installBtn.style.transform = '';
      installBtn.style.boxShadow = '';
    });
    
    document.body.appendChild(installBtn);
  }

  static hideInstallButton() {
    const installBtn = document.querySelector('.install-btn');
    if (installBtn) {
      installBtn.remove();
    }
  }

  static showInAppNotification(type, message, duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `pwa-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'update' ? '#3b82f6' : type === 'error' ? '#ef4444' : '#10b981'};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      
      .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Handle close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto remove
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }

  static async checkConnectivity() {
    const isOnline = navigator.onLine;
    
    if (!isOnline) {
      this.showInAppNotification('error', 'You are offline. Some features may be unavailable.');
    }
    
    // Listen for connectivity changes
    window.addEventListener('online', () => {
      this.showInAppNotification('success', 'Connection restored!');
    });
    
    window.addEventListener('offline', () => {
      this.showInAppNotification('error', 'Connection lost. Working in offline mode.');
    });
    
    return isOnline;
  }

  static async cacheCriticalData(data) {
    if ('caches' in window) {
      try {
        const cache = await caches.open('horizon-dynamic-v1.2.0');
        const response = new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=3600'
          }
        });
        
        await cache.put('/api/critical-data', response);
        console.log('Critical data cached successfully');
      } catch (error) {
        console.error('Failed to cache critical data:', error);
      }
    }
  }

  static async getCachedData(url) {
    if ('caches' in window) {
      try {
        const cache = await caches.open('horizon-dynamic-v1.2.0');
        const response = await cache.match(url);
        
        if (response) {
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to get cached data:', error);
      }
    }
    return null;
  }

  static setupGestureNavigation() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    });
    
    const handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swipe left - navigate forward
          this.navigateForward();
        } else {
          // Swipe right - navigate back
          this.navigateBack();
        }
      }
    };
    
    this.handleSwipe = handleSwipe;
  }

  static navigateForward() {
    // Implement forward navigation logic
    console.log('Swipe forward - navigate to next page');
  }

  static navigateBack() {
    // Implement back navigation logic
    if (window.history.length > 1) {
      window.history.back();
    } else {
      console.log('Swipe back - no previous page');
    }
  }

  static setupBottomSheetUI() {
    // Create bottom sheet container
    const bottomSheet = document.createElement('div');
    bottomSheet.id = 'bottom-sheet';
    bottomSheet.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-radius: 20px 20px 0 0;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
      transform: translateY(100%);
      transition: transform 0.3s ease;
      z-index: 1000;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    document.body.appendChild(bottomSheet);
    
    // Handle drag to close
    let startY = 0;
    let currentY = 0;
    
    bottomSheet.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    });
    
    bottomSheet.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 0) {
        bottomSheet.style.transform = `translateY(${diff}px)`;
      }
    });
    
    bottomSheet.addEventListener('touchend', () => {
      const diff = currentY - startY;
      
      if (diff > 100) {
        this.closeBottomSheet();
      } else {
        bottomSheet.style.transform = '';
      }
    });
  }

  static openBottomSheet(content) {
    const bottomSheet = document.getElementById('bottom-sheet');
    if (bottomSheet) {
      bottomSheet.innerHTML = content;
      bottomSheet.style.transform = 'translateY(0)';
    }
  }

  static closeBottomSheet() {
    const bottomSheet = document.getElementById('bottom-sheet');
    if (bottomSheet) {
      bottomSheet.style.transform = 'translateY(100%)';
    }
  }

  static initializePWAFeatures() {
    // Initialize all PWA features
    this.registerServiceWorker();
    this.requestNotificationPermission();
    this.showInstallPrompt();
    this.checkConnectivity();
    this.setupGestureNavigation();
    this.setupBottomSheetUI();
    
    console.log('PWA features initialized');
  }
}

export default PWAUtils;
