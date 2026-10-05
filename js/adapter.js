/**
 * Chinese Game 2.0 - Data Adapter
 * Bridges the frontend engine with Google Sheets / Apps Script Web App and local caching.
 * Hardened with safeStorage to prevent DOMException crashes in restricted storage runtimes.
 */

(function(window) {
  'use strict';

  const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwn7Lf8a2x0U-EHnLb5e5uMtIVtfSRsd_VZla7IbFxLpYFzq8u-A2YUrimdLGtywPOd/exec';

  const memoryStore = {};
  const safeStorage = {
    getItem(key, fallback = null) {
      try {
        const val = localStorage.getItem(key);
        return val !== null ? val : (memoryStore[key] !== undefined ? memoryStore[key] : fallback);
      } catch (e) {
        return memoryStore[key] !== undefined ? memoryStore[key] : fallback;
      }
    },
    setItem(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        memoryStore[key] = String(value);
      }
    }
  };

  class DataAdapter {
    constructor() {
      this.webAppUrl = safeStorage.getItem('cg_webapp_url', DEFAULT_WEB_APP_URL);
    }

    setWebAppUrl(url) {
      if (url) {
        this.webAppUrl = url.trim();
        safeStorage.setItem('cg_webapp_url', this.webAppUrl);
      }
    }

    getLevels(child) {
      const childKey = (child || 'milo').toLowerCase();
      try {
        const cached = safeStorage.getItem(`cg_cloud_bank_${childKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.levels) && parsed.levels.length > 0) {
            return parsed.levels;
          }
        }
      } catch (e) {
        console.warn('Failed reading cloud cache, using default banks:', e);
      }

      // Fallback to default hardcoded bank
      if (window.DEFAULT_BANKS && window.DEFAULT_BANKS[childKey]) {
        return window.DEFAULT_BANKS[childKey].levels || [];
      }
      return [];
    }

    async fetchCloudQuestions(child, onSuccess, onError) {
      const childKey = (child || 'milo').toLowerCase();
      if (!this.webAppUrl) {
        if (onError) onError('No WebApp URL configured');
        return;
      }

      const fetchUrl = `${this.webAppUrl}?action=getQuestions&child=${childKey}&t=${Date.now()}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const resp = await fetch(fetchUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const data = await resp.json();
          if (data && data.levels && data.levels.length > 0) {
            safeStorage.setItem(`cg_cloud_bank_${childKey}`, JSON.stringify(data));
            if (onSuccess) onSuccess(data.levels);
            return;
          }
        }
        throw new Error('Invalid response structure');
      } catch (err) {
        console.warn('Direct fetch failed, falling back to JSONP:', err);
        this.fetchWithJSONP(childKey, onSuccess, onError);
      }
    }

    fetchWithJSONP(childKey, onSuccess, onError) {
      const cbName = `cg_cb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const script = document.createElement('script');

      let timer = setTimeout(() => {
        cleanup();
        if (onError) onError('JSONP Timeout');
      }, 7000);

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      window[cbName] = (data) => {
        cleanup();
        if (data && data.levels && data.levels.length > 0) {
          safeStorage.setItem(`cg_cloud_bank_${childKey}`, JSON.stringify(data));
          if (onSuccess) onSuccess(data.levels);
        } else if (onError) {
          onError('Empty levels from JSONP');
        }
      };

      script.src = `${this.webAppUrl}?action=getQuestions&child=${childKey}&callback=${cbName}&t=${Date.now()}`;
      script.onerror = () => {
        cleanup();
        if (onError) onError('JSONP network error');
      };
      document.head.appendChild(script);
    }

    logRecord(record) {
      const queue = this.getOfflineQueue();
      queue.push(record);
      this.saveOfflineQueue(queue);

      this.flushOfflineQueue();
    }

    getOfflineQueue() {
      try {
        const val = safeStorage.getItem('cg_offline_records');
        return val ? JSON.parse(val) : [];
      } catch (e) {
        return [];
      }
    }

    saveOfflineQueue(queue) {
      try {
        safeStorage.setItem('cg_offline_records', JSON.stringify(queue));
      } catch (e) {}
    }

    async flushOfflineQueue() {
      const queue = this.getOfflineQueue();
      if (!queue.length || !this.webAppUrl) return;

      const recordToSync = queue[0];
      try {
        await fetch(this.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordToSync)
        });

        // Remove sent record
        queue.shift();
        this.saveOfflineQueue(queue);

        // Continue sending if more exist
        if (queue.length > 0) {
          setTimeout(() => this.flushOfflineQueue(), 300);
        }
      } catch (e) {
        console.warn('Offline flush postponed:', e);
      }
    }
  }

  window.DataAdapter = new DataAdapter();
})(window);
