/**
 * Chinese Game 2.0 - Core Engine
 * Manages identity, state, audio synthesis, module orchestration, and AI Socratic tutor hooks.
 * Hardened against memory leaks, cross-tab timer bleeds, and storage restrictions.
 */

(function(window) {
  'use strict';

  // Safe localStorage helper with in-memory fallback to prevent DOMException crashes
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
    },
    getJSON(key, fallback = {}) {
      try {
        const val = this.getItem(key);
        return val ? JSON.parse(val) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    setJSON(key, value) {
      try {
        this.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('Storage setJSON failed:', e);
      }
    }
  };

  class GameEngine {
    constructor() {
      this.modules = {};
      this.activeModuleId = null;
      this.currentLevelIndex = 0;
      this.levels = [];
      this.activeChild = 'milo';
      this.speechLang = 'zh-CN'; // Default: Mandarin (普通話)
      this.audioCtx = null;
      this.storyFallbackTimer = null;

      this.state = {
        emeralds: { milo: 120, ollie: 85 },
        hwEarnedCounts: {}, // Format: levelId_char -> count
        records: []
      };

      this.initIdentity();
      this.loadSavedState();
    }

    initIdentity() {
      const urlParams = new URLSearchParams(window.location.search);
      const childParam = urlParams.get('child');
      if (childParam && (childParam.toLowerCase() === 'milo' || childParam.toLowerCase() === 'ollie')) {
        this.activeChild = childParam.toLowerCase();
      } else {
        this.activeChild = safeStorage.getItem('cg_active_child', 'milo');
      }
      safeStorage.setItem('cg_active_child', this.activeChild);
    }

    setChild(childKey) {
      if (childKey !== 'milo' && childKey !== 'ollie') return;
      if (this.activeModuleId && this.modules[this.activeModuleId]?.cleanup) {
        this.modules[this.activeModuleId].cleanup();
      }
      this.cancelSpeech();
      this.hideSocraticHint();

      this.activeChild = childKey;
      safeStorage.setItem('cg_active_child', childKey);
      this.updateHUD();
      if (window.DataAdapter) {
        this.loadLevels(window.DataAdapter.getLevels(this.activeChild));
      }
    }

    toggleSpeechDialect() {
      if (this.speechLang === 'zh-CN') {
        this.speechLang = 'zh-HK'; // Cantonese
      } else {
        this.speechLang = 'zh-CN'; // Mandarin
      }
      safeStorage.setItem('cg_speech_lang', this.speechLang);
      this.cancelSpeech();
      this.updateHUD();
      this.playTone(523, 0.1);
      return this.speechLang;
    }

    getSpeechDialectLabel() {
      return this.speechLang === 'zh-CN' ? '🗣️ 普通話' : '🗣️ 廣東話';
    }

    loadSavedState() {
      this.state.emeralds = safeStorage.getJSON('cg_emeralds', { milo: 120, ollie: 85 });
      this.state.hwEarnedCounts = safeStorage.getJSON('cg_hw_caps', {});
      this.speechLang = safeStorage.getItem('cg_speech_lang', 'zh-CN');
    }

    saveState() {
      safeStorage.setJSON('cg_emeralds', this.state.emeralds);
      safeStorage.setJSON('cg_hw_caps', this.state.hwEarnedCounts);
    }

    addEmeralds(count) {
      if (!this.state.emeralds[this.activeChild]) {
        this.state.emeralds[this.activeChild] = 0;
      }
      this.state.emeralds[this.activeChild] += count;
      this.saveState();
      this.updateHUD();
      this.playRewardChime();
    }

    // Audio Web Audio API synthesizer for instant zero-dependency sound effects
    initAudio() {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.audioCtx = new AudioContext();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }

    playTone(freq, duration, type = 'sine') {
      try {
        this.initAudio();
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
      } catch (e) {
        // Audio playback error handled silently
      }
    }

    playSuccessSound() {
      this.playTone(523.25, 0.15); // C5
      setTimeout(() => this.playTone(659.25, 0.2), 120); // E5
    }

    playRewardChime() {
      this.playTone(587.33, 0.1); // D5
      setTimeout(() => this.playTone(880.00, 0.25), 100); // A5
    }

    playErrorSound() {
      this.playTone(220, 0.25, 'sawtooth');
    }

    // Speech synthesis wrapper with cancel protection
    cancelSpeech() {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (this.storyFallbackTimer) {
        clearInterval(this.storyFallbackTimer);
        this.storyFallbackTimer = null;
      }
      if (this.activeModuleId && this.modules[this.activeModuleId]?.cleanup) {
        this.modules[this.activeModuleId].cleanup();
      }
    }

    speakText(text, onEnd) {
      if (!('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
      }
      this.cancelSpeech();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.speechLang;
      utterance.rate = 0.85;

      let hasFinished = false;
      const finish = () => {
        if (!hasFinished) {
          hasFinished = true;
          if (onEnd) onEnd();
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      // Fallback safety timeout if mobile browser drops onend
      const estDuration = Math.max(text.length * 360 + 1200, 2500);
      setTimeout(finish, estDuration);

      window.speechSynthesis.speak(utterance);
    }

    // Module Registration & Switching
    registerModule(id, moduleInstance) {
      this.modules[id] = moduleInstance;
      moduleInstance.engine = this;
    }

    switchModule(id) {
      if (!this.modules[id]) return;

      // Clean up previous active module lifecycle
      if (this.activeModuleId && this.modules[this.activeModuleId]?.cleanup) {
        this.modules[this.activeModuleId].cleanup();
      }

      this.cancelSpeech();
      this.hideSocraticHint();

      this.activeModuleId = id;

      // Update Nav UI
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.module === id);
      });

      const stage = document.getElementById('game-stage');
      if (stage) {
        stage.innerHTML = '';
        const currentLevel = this.getCurrentLevel();
        this.modules[id].render(stage, currentLevel);
      }
    }

    loadLevels(levels) {
      this.levels = levels || [];
      this.currentLevelIndex = 0;
      this.renderLevelDropdown();
      if (this.activeModuleId && this.modules[this.activeModuleId]) {
        this.switchModule(this.activeModuleId);
      }
    }

    getCurrentLevel() {
      if (this.levels.length === 0) return null;
      return this.levels[this.currentLevelIndex] || this.levels[0];
    }

    selectLevel(index) {
      if (this.activeModuleId && this.modules[this.activeModuleId]?.cleanup) {
        this.modules[this.activeModuleId].cleanup();
      }
      this.currentLevelIndex = Math.max(0, Math.min(index, this.levels.length - 1));
      this.hideSocraticHint();
      if (this.activeModuleId) {
        this.switchModule(this.activeModuleId);
      }
    }

    renderLevelDropdown() {
      const select = document.getElementById('level-select');
      if (!select) return;
      select.innerHTML = '';
      this.levels.forEach((lvl, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${lvl.date || ''} ${lvl.theme || '關卡' + (idx + 1)}`;
        select.appendChild(opt);
      });
      select.value = this.currentLevelIndex;
    }

    updateHUD() {
      const childBtn = document.getElementById('btn-switch-child');
      if (childBtn) {
        childBtn.textContent = this.activeChild === 'milo' ? '👦 Milo ⇄' : '👦 Ollie ⇄';
      }
      const titleEl = document.getElementById('app-title');
      if (titleEl) {
        titleEl.textContent = this.activeChild === 'milo' ? 'Milo 中文島' : 'Ollie 中文島';
      }
      const emeraldEl = document.getElementById('emerald-count');
      if (emeraldEl) {
        emeraldEl.textContent = `💎 ${this.state.emeralds[this.activeChild] || 0}`;
      }
      const langBtn = document.getElementById('btn-toggle-lang');
      if (langBtn) {
        langBtn.textContent = this.getSpeechDialectLabel();
      }
    }

    // Socratic AI Companion Hook
    triggerSocraticHint(context) {
      const drawer = document.getElementById('ai-companion-drawer');
      if (!drawer) return;
      
      const titleEl = drawer.querySelector('.ai-companion-title');
      const textEl = drawer.querySelector('.ai-companion-text');

      titleEl.textContent = `💡 AI 小幫手的提點 (${context.char || context.target || '字詞啟發'})`;
      textEl.textContent = context.hint || '試著觀察部首的形狀和意思，想一想它和哪個部首有關聯喔！';

      drawer.style.display = 'flex';
      this.playTone(440, 0.15); // Friendly chime
    }

    hideSocraticHint() {
      const drawer = document.getElementById('ai-companion-drawer');
      if (drawer) drawer.style.display = 'none';
    }

    // Answer logging to Google Sheets via DataAdapter
    recordAnswer(record) {
      const fullRecord = {
        timestamp: new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' }),
        child: this.activeChild === 'milo' ? 'Milo' : 'Ollie',
        levelId: this.getCurrentLevel()?.levelId || 'lvl',
        ...record
      };
      if (window.DataAdapter) {
        window.DataAdapter.logRecord(fullRecord);
      }
    }
  }

  window.GameEngine = GameEngine;
})(window);
