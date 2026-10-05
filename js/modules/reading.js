/**
 * Module 3: 村莊冒險日記 (Reading Comprehension & Karaoke Highlighting)
 * Pluggable activity module.
 * Enhanced with question and options read-aloud buttons for comprehension QA.
 */

(function(window) {
  'use strict';

  class ReadingModule {
    constructor() {
      this.storyData = null;
      this.currentQIndex = 0;
      this.isReading = false;
      this.fallbackTimer = null;
      this.attempts = 0;
      this.isProcessing = false;
      this.isReadingQA = false;
    }

    render(container, levelData) {
      this.cleanup();
      this.container = container;
      this.storyData = levelData?.story || null;
      this.currentQIndex = 0;
      this.isReading = false;
      this.isProcessing = false;
      this.isReadingQA = false;
      this.renderView();
    }

    cleanup() {
      if (this.fallbackTimer) {
        clearInterval(this.fallbackTimer);
        this.fallbackTimer = null;
      }
      this.isReading = false;
      this.isProcessing = false;
      this.stopQAQuestionRead();
      this.clearHighlights();
    }

    renderView() {
      if (!this.storyData) {
        this.container.innerHTML = `<div class="game-module-card"><p>本關卡暫無閱讀篇章。</p></div>`;
        return;
      }

      const storyText = this.storyData.content || '';
      const questions = this.storyData.questions || [];
      const hasQA = questions.length > 0;

      // Wrap each character in span for karaoke highlighting
      let charIndex = 0;
      const wrappedStory = storyText.split('').map(ch => {
        const span = `<span id="story-char-${charIndex}" class="story-char-span">${ch}</span>`;
        charIndex++;
        return span;
      }).join('');

      this.container.innerHTML = `
        <div class="game-module-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="hud-badge" style="font-size:0.95rem;">📖 ${this.storyData.title || '冒險日記'}</span>
            <div style="display:flex; gap:6px;">
              <button class="hud-btn primary" id="btn-read-story">🔊 朗讀故事</button>
              <button class="hud-btn" id="btn-stop-story" style="display:none;">⏹️ 停止</button>
            </div>
          </div>

          <div class="story-box" id="story-text-container">
            ${wrappedStory}
          </div>

          <div id="qa-container" style="margin-top:10px;">
            ${hasQA ? `<div id="qa-active-question"></div>` : `<p style="text-align:center;">閱讀完畢！請點擊上方朗讀跟讀練習。</p>`}
          </div>
        </div>
      `;

      // Story audio buttons
      const readBtn = document.getElementById('btn-read-story');
      const stopBtn = document.getElementById('btn-stop-story');

      readBtn.addEventListener('click', () => {
        this.startKaraokeRead(storyText, readBtn, stopBtn);
      });

      stopBtn.addEventListener('click', () => {
        this.stopKaraokeRead(readBtn, stopBtn);
      });

      if (hasQA) {
        this.renderQAQuestion(questions);
      }
    }

    startKaraokeRead(text, readBtn, stopBtn) {
      if (!('speechSynthesis' in window)) return;
      this.engine.cancelSpeech();
      this.clearHighlights();

      this.isReading = true;
      if (readBtn) readBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'inline-block';

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.engine.speechLang;
      utterance.rate = 0.85;

      let boundaryFired = false;
      let timerIdx = 0;

      const highlightChar = (idx) => {
        this.clearHighlights();
        const el = document.getElementById(`story-char-${idx}`);
        if (el) {
          el.classList.add('story-highlight');
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      };

      utterance.onboundary = (e) => {
        boundaryFired = true;
        if (this.fallbackTimer) {
          clearInterval(this.fallbackTimer);
          this.fallbackTimer = null;
        }
        if (e.charIndex !== undefined) {
          highlightChar(e.charIndex);
        }
      };

      // iOS WebKit Fallback timer
      this.fallbackTimer = setInterval(() => {
        if (boundaryFired) {
          clearInterval(this.fallbackTimer);
          return;
        }
        if (timerIdx < text.length) {
          highlightChar(timerIdx);
          timerIdx++;
        } else {
          clearInterval(this.fallbackTimer);
        }
      }, 310);

      const onFinish = () => {
        this.stopKaraokeRead(readBtn, stopBtn);
      };

      utterance.onend = onFinish;
      utterance.onerror = onFinish;

      window.speechSynthesis.speak(utterance);
    }

    stopKaraokeRead(readBtn, stopBtn) {
      this.isReading = false;
      if (this.fallbackTimer) {
        clearInterval(this.fallbackTimer);
        this.fallbackTimer = null;
      }
      this.engine.cancelSpeech();
      this.clearHighlights();

      if (readBtn) readBtn.style.display = 'inline-block';
      if (stopBtn) stopBtn.style.display = 'none';
    }

    clearHighlights() {
      const highlighted = document.querySelectorAll('.story-char-span.story-highlight');
      highlighted.forEach(el => el.classList.remove('story-highlight'));
    }

    renderQAQuestion(questions) {
      const qaContainer = document.getElementById('qa-active-question');
      if (!qaContainer) return;

      if (this.currentQIndex >= questions.length) {
        qaContainer.innerHTML = `
          <div style="text-align:center; padding: 14px; background:#e8f5e9; border:2px solid #4caf50; border-radius:4px;">
            <h3>🌟 閱讀理解測驗全數通過！</h3>
            <p style="margin-top:4px;">已精熟掌握故事重點與文意脈絡！</p>
          </div>
        `;
        return;
      }

      this.attempts = 0;
      this.isProcessing = false;
      this.isReadingQA = false;
      const q = questions[this.currentQIndex];

      // Shuffle options with answer rotation
      const options = [...q.options];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      qaContainer.innerHTML = `
        <div style="background:#f0f0f0; border:2px solid #000; padding:10px; border-radius:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
            <div style="font-weight:bold; font-size:1.15rem;">
              ❓ 問題 ${this.currentQIndex + 1} / ${questions.length}: ${q.question}
            </div>
            <div style="display:flex; gap:6px;">
              <button class="hud-btn" id="btn-read-qa-q" style="font-size:0.85rem; padding:4px 8px;">🔊 朗讀問題與選項</button>
              <button class="hud-btn" id="btn-stop-qa-q" style="font-size:0.85rem; padding:4px 8px; display:none;">⏹️ 停止</button>
            </div>
          </div>
          <div class="options-grid">
            ${options.map(opt => `
              <button class="option-btn qa-opt-btn" data-val="${opt}" style="font-size:1.15rem; min-height:50px;">
                ${opt}
              </button>
            `).join('')}
          </div>
        </div>
      `;

      // Read QA audio buttons
      const readQABtn = document.getElementById('btn-read-qa-q');
      const stopQABtn = document.getElementById('btn-stop-qa-q');

      readQABtn.addEventListener('click', () => {
        this.startQAQuestionRead(q, options, readQABtn, stopQABtn);
      });

      stopQABtn.addEventListener('click', () => {
        this.stopQAQuestionRead(readQABtn, stopQABtn);
      });

      qaContainer.querySelectorAll('.qa-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.stopQAQuestionRead(readQABtn, stopQABtn);
          this.handleQAAnswer(btn.dataset.val, btn, q, questions);
        });
      });
    }

    startQAQuestionRead(q, options, readBtn, stopBtn) {
      this.isReadingQA = true;
      if (readBtn) readBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'inline-block';

      const spokenText = `${q.question}。選項有：${options.join('；')}。`;
      this.engine.speakText(spokenText, () => {
        this.stopQAQuestionRead(readBtn, stopBtn);
      });
    }

    stopQAQuestionRead(readBtn, stopBtn) {
      this.isReadingQA = false;
      this.engine.cancelSpeech();
      const rBtn = readBtn || document.getElementById('btn-read-qa-q');
      const sBtn = stopBtn || document.getElementById('btn-stop-qa-q');
      if (rBtn) rBtn.style.display = 'inline-block';
      if (sBtn) sBtn.style.display = 'none';
    }

    handleQAAnswer(selected, btnEl, q, questions) {
      if (this.isProcessing) return;

      this.attempts++;
      const isCorrect = (selected === q.answer);

      if (isCorrect) {
        this.isProcessing = true;
        // Disable all buttons immediately to prevent duplicate clicks
        const allBtns = this.container.querySelectorAll('.qa-opt-btn');
        allBtns.forEach(b => b.disabled = true);

        btnEl.classList.add('correct');
        this.engine.playSuccessSound();

        const emeralds = (this.attempts === 1) ? 1 : 0.5;
        this.engine.addEmeralds(emeralds);

        this.engine.recordAnswer({
          module: '冒險日記',
          question: q.question,
          userAnswer: selected,
          correctAnswer: q.answer,
          result: this.attempts === 1 ? '第一次答對' : '第二次答對',
          attempts: this.attempts,
          emerald: emeralds,
          weakTag: '✅ 已掌握'
        });

        setTimeout(() => {
          this.currentQIndex++;
          this.renderQAQuestion(questions);
        }, 800);

      } else {
        btnEl.classList.add('wrong');
        btnEl.disabled = true;
        this.engine.playErrorSound();

        if (this.attempts >= 2) {
          this.isProcessing = true;
          const allBtns = this.container.querySelectorAll('.qa-opt-btn');
          allBtns.forEach(b => b.disabled = true);

          this.engine.triggerSocraticHint({
            char: '閱讀理解',
            hint: `答案在故事裡哦！試著重讀故事找出關於「${q.question}」的描寫！`
          });

          this.engine.recordAnswer({
            module: '冒險日記',
            question: q.question,
            userAnswer: selected,
            correctAnswer: q.answer,
            result: '兩次皆錯',
            attempts: this.attempts,
            emerald: 0,
            weakTag: '⚠️ 需加強'
          });

          setTimeout(() => {
            this.currentQIndex++;
            this.renderQAQuestion(questions);
          }, 1600);
        }
      }
    }
  }

  window.ReadingModule = ReadingModule;
})(window);
