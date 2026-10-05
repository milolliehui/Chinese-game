/**
 * Module 2: 合成台練字 (Handwriting & Stroke Order)
 * Pluggable activity module with HanziWriter + Offline Canvas fallback & 2-gem cap.
 * Hardened against zero-stroke gem farming exploits.
 */

(function(window) {
  'use strict';

  class HandwritingModule {
    constructor() {
      this.currentIndex = 0;
      this.characters = [];
      this.currentWriter = null;
      this.offlineDrawingCtx = null;
      this.offlineStrokeCount = 0;
      this.isQuizCompleted = false;
      this.isTransitioning = false;
    }

    render(container, levelData) {
      this.container = container;
      this.characters = levelData?.handwriting || [];
      this.currentIndex = 0;
      this.renderChar();
    }

    cleanup() {
      this.isTransitioning = false;
      if (this.currentWriter) {
        try {
          this.currentWriter = null;
        } catch (e) {}
      }
    }

    renderChar() {
      if (this.currentIndex >= this.characters.length) {
        this.renderCompletion();
        return;
      }

      this.isQuizCompleted = false;
      this.isTransitioning = false;
      this.offlineStrokeCount = 0;
      const cur = this.characters[this.currentIndex];
      const levelId = this.engine.getCurrentLevel()?.levelId || 'lvl';
      const capKey = `${levelId}_${cur.char}`;
      const earnedCount = this.engine.state.hwEarnedCounts[capKey] || 0;
      const isCapped = earnedCount >= 2;

      this.container.innerHTML = `
        <div class="game-module-card">
          <div class="handwriting-meta">
            <span class="hud-badge" style="font-size:0.95rem;">🔨 合成台練字 第 ${this.currentIndex + 1} / ${this.characters.length} 字</span>
            <span style="font-size:0.9rem; font-weight:bold; color:${isCapped ? '#7f8c8d' : '#27ae60'};">
              ${isCapped ? '💎 已獲 2 次獎勵 (自由練習中)' : `💎 本字獎勵: ${earnedCount}/2 次`}
            </span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <div class="char-info-box">
              <h2>${cur.char}</h2>
              <div style="font-size:0.95rem; font-weight:bold; color:#555;">${cur.pinyin || ''} (${cur.strokes || '?'} 畫)</div>
            </div>
            <div style="flex:1; margin-left:14px; font-size:1.05rem; line-height:1.5;">
              <div><strong>部首/結構：</strong>${cur.radical || '漢字'}</div>
              <div><strong>常用組詞：</strong>${cur.words ? cur.words.join('、') : ''}</div>
            </div>
          </div>

          <div class="handwriting-canvas-wrapper" id="hw-canvas-container"></div>

          <div id="hw-feedback-msg" style="text-align:center; min-height:22px; font-size:0.95rem; font-weight:bold; color:#e67e22;"></div>

          <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:4px;">
            <button class="hud-btn" id="btn-animate-hw">🎬 示範筆順</button>
            <button class="hud-btn" id="btn-reset-hw">🔄 重新描紅</button>
            <button class="hud-btn primary" id="btn-complete-hw">
              ${isCapped ? '✨ 下一個字' : '✨ 完成本字 (+1 💎)'}
            </button>
          </div>
        </div>
      `;

      this.initCanvasEngine(cur);

      // Event bindings
      document.getElementById('btn-animate-hw').addEventListener('click', () => {
        if (this.currentWriter) {
          this.currentWriter.animateCharacter();
          this.engine.speakText(cur.char);
        } else {
          this.engine.speakText(cur.char);
        }
      });

      document.getElementById('btn-reset-hw').addEventListener('click', () => {
        this.initCanvasEngine(cur);
      });

      const completeBtn = document.getElementById('btn-complete-hw');
      completeBtn.addEventListener('click', () => {
        this.handleCompleteChar(cur, isCapped, completeBtn);
      });
    }

    initCanvasEngine(cur) {
      const container = document.getElementById('hw-canvas-container');
      if (!container) return;
      container.innerHTML = '';
      const sz = Math.min(340, Math.floor(window.innerWidth * 0.85));

      if (typeof HanziWriter !== 'undefined') {
        try {
          this.currentWriter = HanziWriter.create('hw-canvas-container', cur.char, {
            width: sz,
            height: sz,
            padding: sz * 0.06,
            showOutline: true,
            strokeAnimationSpeed: 1.2,
            delayBetweenStrokes: 200,
            drawingWidth: sz / 18,
            radicalColor: '#16a085',
            leniency: 2.2,
            onCorrectStroke: () => {
              this.engine.playTone(600, 0.05);
            },
            onComplete: () => {
              this.isQuizCompleted = true;
              this.engine.playSuccessSound();
              const feedback = document.getElementById('hw-feedback-msg');
              if (feedback) feedback.textContent = '🌟 太棒了！筆順描寫完成，請點擊下方完成按鈕！';
            }
          });
          this.currentWriter.quiz();
          return;
        } catch (e) {
          console.warn('HanziWriter init failed, falling back to local canvas:', e);
        }
      }

      // Offline HTML5 Canvas Fallback
      this.setupOfflineCanvas(container, cur.char, sz);
    }

    setupOfflineCanvas(container, char, sz) {
      this.currentWriter = null;
      const canvas = document.createElement('canvas');
      canvas.width = sz;
      canvas.height = sz;
      container.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      this.offlineDrawingCtx = ctx;

      // Draw rice-grid (米字格)
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sz / 2, 0); ctx.lineTo(sz / 2, sz);
      ctx.moveTo(0, sz / 2); ctx.lineTo(sz, sz / 2);
      ctx.moveTo(0, 0); ctx.lineTo(sz, sz);
      ctx.moveTo(sz, 0); ctx.lineTo(0, sz);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw watermark character outline
      ctx.font = `${sz * 0.75}px 'Kaiti SC', 'STKaiti', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f0f0f0';
      ctx.fillText(char, sz / 2, sz / 2 + 10);

      // Drawing state
      let isDrawing = false;
      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * (canvas.width / rect.width),
          y: (clientY - rect.top) * (canvas.height / rect.height)
        };
      };

      const start = (e) => {
        e.preventDefault();
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };

      const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.strokeStyle = '#1a5fb4';
        ctx.lineWidth = sz / 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        this.offlineStrokeCount++;
      };

      const stop = () => { isDrawing = false; };

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stop);
      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stop);
    }

    handleCompleteChar(cur, isCapped, btnEl) {
      if (this.isTransitioning) return;

      const feedback = document.getElementById('hw-feedback-msg');

      // Exploitation prevention gate: Must verify valid writing if not capped
      if (!isCapped) {
        if (this.currentWriter !== null && !this.isQuizCompleted) {
          this.engine.playErrorSound();
          if (feedback) feedback.textContent = '⚠️ 請先依照筆順完成描寫，再點擊領取綠寶石喔！';
          return;
        }
        if (this.currentWriter === null && this.offlineStrokeCount < 5) {
          this.engine.playErrorSound();
          if (feedback) feedback.textContent = '⚠️ 請在米字格上認真描寫漢字後再送出喔！';
          return;
        }
      }

      this.isTransitioning = true;
      btnEl.disabled = true;

      const levelId = this.engine.getCurrentLevel()?.levelId || 'lvl';
      const capKey = `${levelId}_${cur.char}`;
      const earnedCount = this.engine.state.hwEarnedCounts[capKey] || 0;

      if (!isCapped) {
        this.engine.state.hwEarnedCounts[capKey] = earnedCount + 1;
        this.engine.saveState();
        this.engine.addEmeralds(1);

        this.engine.recordAnswer({
          module: '合成台練字',
          question: `書寫漢字【${cur.char}】`,
          userAnswer: cur.char,
          correctAnswer: cur.char,
          result: '第一次答對',
          attempts: 1,
          emerald: 1,
          weakTag: '✅ 已掌握'
        });
      } else {
        this.engine.playSuccessSound();
      }

      this.engine.speakText(cur.char, () => {
        setTimeout(() => {
          this.currentIndex++;
          this.renderChar();
        }, 400);
      });
    }

    renderCompletion() {
      this.container.innerHTML = `
        <div class="game-module-card" style="text-align:center; padding: 24px;">
          <h2 style="font-size:2rem; margin-bottom:12px;">🎉 合成台練字完成！</h2>
          <p style="font-size:1.2rem; margin-bottom:16px;">今日的筆順練習已圓滿達成，字體工整又端正！</p>
          <button class="hud-btn primary" id="btn-next-module-reading" style="font-size:1.2rem; padding:10px 24px;">
            前往「村莊冒險日記」📖
          </button>
        </div>
      `;
      document.getElementById('btn-next-module-reading').addEventListener('click', () => {
        this.engine.switchModule('reading');
      });
    }
  }

  window.HandwritingModule = HandwritingModule;
})(window);
