/**
 * Module 1: 礦洞選字 (Word Recognition & Sentence Fill-in)
 * Pluggable activity module.
 * Enhanced with synchronized real-time karaoke highlighting for prompt & options read-aloud.
 */

(function(window) {
  'use strict';

  class RecognitionModule {
    constructor() {
      this.currentIndex = 0;
      this.questions = [];
      this.attempts = 0;
      this.isProcessing = false;
      this.isReadingPrompt = false;
      this.promptFallbackTimer = null;
      this.confirmFallbackTimer = null;
    }

    render(container, levelData) {
      this.cleanup();
      this.container = container;
      this.questions = levelData?.recognition || [];
      this.currentIndex = 0;
      this.renderQuestion();
    }

    cleanup() {
      this.stopQuestionRead();
      if (this.confirmFallbackTimer) {
        clearInterval(this.confirmFallbackTimer);
        this.confirmFallbackTimer = null;
      }
      this.clearAllHighlights();
      this.isProcessing = false;
    }

    clearAllHighlights() {
      const els = document.querySelectorAll('.story-highlight');
      els.forEach(el => el.classList.remove('story-highlight'));
    }

    renderQuestion() {
      if (this.currentIndex >= this.questions.length) {
        this.renderCompletion();
        return;
      }

      this.cleanup();
      this.attempts = 0;
      this.isProcessing = false;
      this.isReadingPrompt = false;
      const q = this.questions[this.currentIndex];

      // Shuffle options and guarantee answer is randomized across positions
      const options = [...q.options];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      // Sentence with target blank and wrapped character spans
      let sentenceHtml = '';
      let charIdx = 0;
      const blankIndex = q.sentence.indexOf('［  ］');

      if (blankIndex !== -1) {
        const before = q.sentence.slice(0, blankIndex);
        const after = q.sentence.slice(blankIndex + 4);
        for (const ch of before) {
          sentenceHtml += `<span id="rec-char-${charIdx}" class="story-char-span">${ch}</span>`;
          charIdx++;
        }
        sentenceHtml += `<span id="target-blank" class="target-blank">？</span>`;
        for (const ch of after) {
          sentenceHtml += `<span id="rec-char-${charIdx}" class="story-char-span">${ch}</span>`;
          charIdx++;
        }
      } else {
        for (const ch of q.sentence) {
          sentenceHtml += `<span id="rec-char-${charIdx}" class="story-char-span">${ch}</span>`;
          charIdx++;
        }
      }

      this.container.innerHTML = `
        <div class="game-module-card">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
            <span class="hud-badge" style="font-size:0.95rem;">⛏️ 礦洞選字 第 ${this.currentIndex + 1} / ${this.questions.length} 題</span>
            <div style="display:flex; gap:6px; align-items:center;">
              <span style="font-size:0.85rem; color:#555;">提示: ${q.hint || '請選出正確的字'}</span>
              <button class="hud-btn" id="btn-read-rec-q" style="font-size:0.85rem; padding:4px 8px;">🔊 朗讀題目與選項</button>
              <button class="hud-btn" id="btn-stop-rec-q" style="font-size:0.85rem; padding:4px 8px; display:none;">⏹️ 停止</button>
            </div>
          </div>

          <div class="sentence-container" id="sentence-box">
            ${sentenceHtml}
          </div>

          <div class="options-grid" id="options-grid">
            ${options.map((opt, oIdx) => `
              <button class="option-btn" id="rec-opt-${oIdx}" data-val="${opt}">${opt}</button>
            `).join('')}
          </div>

          <div id="ai-companion-drawer" class="ai-companion-drawer" style="display:none;">
            <div class="ai-companion-avatar">🦉</div>
            <div class="ai-companion-body">
              <div class="ai-companion-title">AI 小幫手提點</div>
              <div class="ai-companion-text"></div>
            </div>
          </div>
        </div>
      `;

      // Read question & options audio button
      const readBtn = document.getElementById('btn-read-rec-q');
      const stopBtn = document.getElementById('btn-stop-rec-q');

      readBtn.addEventListener('click', () => {
        this.startQuestionRead(q, options, readBtn, stopBtn);
      });

      stopBtn.addEventListener('click', () => {
        this.stopQuestionRead(readBtn, stopBtn);
      });

      // Bind option button events
      const btns = this.container.querySelectorAll('.option-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.stopQuestionRead(readBtn, stopBtn);
          this.handleAnswer(btn.dataset.val, btn, q);
        });
      });
    }

    startQuestionRead(q, options, readBtn, stopBtn) {
      if (!('speechSynthesis' in window)) return;
      this.engine.cancelSpeech();
      this.clearAllHighlights();

      this.isReadingPrompt = true;
      if (readBtn) readBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'inline-block';

      // Build spoken text and character index map
      let spokenText = '';
      const spanMap = [];
      let cIdx = 0;
      const blankIndex = q.sentence.indexOf('［  ］');

      if (blankIndex !== -1) {
        const before = q.sentence.slice(0, blankIndex);
        const after = q.sentence.slice(blankIndex + 4);
        for (const ch of before) {
          spokenText += ch;
          spanMap.push(`rec-char-${cIdx}`);
          cIdx++;
        }
        // Blank spoken as '什麼'
        spokenText += '什麼';
        spanMap.push('target-blank');
        spanMap.push('target-blank');
        for (const ch of after) {
          spokenText += ch;
          spanMap.push(`rec-char-${cIdx}`);
          cIdx++;
        }
      } else {
        for (const ch of q.sentence) {
          spokenText += ch;
          spanMap.push(`rec-char-${cIdx}`);
          cIdx++;
        }
      }

      spokenText += '。選項有：';
      for (let i = 0; i < 5; i++) spanMap.push(null);

      options.forEach((opt, oIdx) => {
        if (oIdx > 0) {
          spokenText += '、';
          spanMap.push(null);
        }
        for (const ch of opt) {
          spokenText += ch;
          spanMap.push(`rec-opt-${oIdx}`);
        }
      });
      spokenText += '。';
      spanMap.push(null);

      const highlightElement = (targetId) => {
        this.clearAllHighlights();
        if (!targetId) return;
        const el = document.getElementById(targetId);
        if (el) {
          el.classList.add('story-highlight');
          if (el.scrollIntoView) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      };

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = this.engine.speechLang;
      utterance.rate = 0.85;

      let boundaryFired = false;
      let timerIdx = 0;

      utterance.onboundary = (e) => {
        boundaryFired = true;
        if (this.promptFallbackTimer) {
          clearInterval(this.promptFallbackTimer);
          this.promptFallbackTimer = null;
        }
        if (e.charIndex !== undefined && spanMap[e.charIndex] !== undefined) {
          highlightElement(spanMap[e.charIndex]);
        }
      };

      // iOS WebKit Fallback timer
      this.promptFallbackTimer = setInterval(() => {
        if (boundaryFired) {
          clearInterval(this.promptFallbackTimer);
          return;
        }
        if (timerIdx < spanMap.length) {
          highlightElement(spanMap[timerIdx]);
          timerIdx++;
        } else {
          clearInterval(this.promptFallbackTimer);
        }
      }, 310);

      const onFinish = () => {
        this.stopQuestionRead(readBtn, stopBtn);
      };

      utterance.onend = onFinish;
      utterance.onerror = onFinish;

      window.speechSynthesis.speak(utterance);
    }

    stopQuestionRead(readBtn, stopBtn) {
      this.isReadingPrompt = false;
      if (this.promptFallbackTimer) {
        clearInterval(this.promptFallbackTimer);
        this.promptFallbackTimer = null;
      }
      this.engine.cancelSpeech();
      this.clearAllHighlights();

      const rBtn = readBtn || document.getElementById('btn-read-rec-q');
      const sBtn = stopBtn || document.getElementById('btn-stop-rec-q');
      if (rBtn) rBtn.style.display = 'inline-block';
      if (sBtn) sBtn.style.display = 'none';
    }

    handleAnswer(selected, btnEl, q) {
      if (this.isProcessing) return;

      this.attempts++;
      const isCorrect = (selected === q.answer);

      if (isCorrect) {
        this.isProcessing = true;
        this.clearAllHighlights();
        btnEl.classList.add('correct');
        this.engine.playSuccessSound();

        const blank = document.getElementById('target-blank');
        if (blank) {
          blank.textContent = q.answer;
          blank.style.background = '#a5d6a7';
          blank.style.borderColor = '#2e7d32';
        }

        // Award emeralds
        const emeralds = (this.attempts === 1) ? 1 : 0.5;
        this.engine.addEmeralds(emeralds);

        // Record answer
        this.engine.recordAnswer({
          module: '礦洞選字',
          question: q.sentence,
          userAnswer: selected,
          correctAnswer: q.answer,
          result: this.attempts === 1 ? '第一次答對' : '第二次答對',
          attempts: this.attempts,
          emerald: emeralds,
          weakTag: '✅ 已掌握'
        });

        // Speak full completed sentence with karaoke character highlighting
        this.speakConfirmationSentence(q.sentence, q.answer, () => {
          setTimeout(() => {
            this.currentIndex++;
            this.renderQuestion();
          }, 800);
        });

      } else {
        btnEl.classList.add('wrong');
        btnEl.disabled = true;
        this.engine.playErrorSound();

        if (this.attempts >= 2) {
          this.isProcessing = true;
          // Trigger Socratic AI Hint on struggle
          this.engine.triggerSocraticHint({
            char: q.answer,
            hint: q.socraticHint || `正確字是「${q.answer}」。注意它的字形與語境：「${q.hint || ''}」！`
          });

          // Reveal answer after 2 attempts
          const blank = document.getElementById('target-blank');
          if (blank) {
            blank.textContent = q.answer;
            blank.style.background = '#ffcdd2';
            blank.style.borderColor = '#c62828';
          }

          this.engine.recordAnswer({
            module: '礦洞選字',
            question: q.sentence,
            userAnswer: selected,
            correctAnswer: q.answer,
            result: '兩次皆錯',
            attempts: this.attempts,
            emerald: 0,
            weakTag: '⚠️ 需加強'
          });

          setTimeout(() => {
            this.speakConfirmationSentence(q.sentence, q.answer, () => {
              setTimeout(() => {
                this.currentIndex++;
                this.renderQuestion();
              }, 800);
            });
          }, 1500);
        }
      }
    }

    speakConfirmationSentence(sentenceTemplate, answerChar, onEnd) {
      if (!('speechSynthesis' in window)) return onEnd && onEnd();
      this.engine.cancelSpeech();
      this.clearAllHighlights();

      const fullSentence = sentenceTemplate.replace('［  ］', answerChar);
      const spanMap = [];
      let cIdx = 0;
      const blankIndex = sentenceTemplate.indexOf('［  ］');

      if (blankIndex !== -1) {
        const before = sentenceTemplate.slice(0, blankIndex);
        const after = sentenceTemplate.slice(blankIndex + 4);
        for (const ch of before) {
          spanMap.push(`rec-char-${cIdx}`);
          cIdx++;
        }
        spanMap.push('target-blank');
        for (const ch of after) {
          spanMap.push(`rec-char-${cIdx}`);
          cIdx++;
        }
      } else {
        for (let i = 0; i < fullSentence.length; i++) {
          spanMap.push(`rec-char-${i}`);
        }
      }

      const highlightElement = (targetId) => {
        this.clearAllHighlights();
        if (!targetId) return;
        const el = document.getElementById(targetId);
        if (el) el.classList.add('story-highlight');
      };

      const utterance = new SpeechSynthesisUtterance(fullSentence);
      utterance.lang = this.engine.speechLang;
      utterance.rate = 0.85;

      let boundaryFired = false;
      let timerIdx = 0;

      utterance.onboundary = (e) => {
        boundaryFired = true;
        if (this.confirmFallbackTimer) {
          clearInterval(this.confirmFallbackTimer);
          this.confirmFallbackTimer = null;
        }
        if (e.charIndex !== undefined && spanMap[e.charIndex] !== undefined) {
          highlightElement(spanMap[e.charIndex]);
        }
      };

      this.confirmFallbackTimer = setInterval(() => {
        if (boundaryFired) {
          clearInterval(this.confirmFallbackTimer);
          return;
        }
        if (timerIdx < spanMap.length) {
          highlightElement(spanMap[timerIdx]);
          timerIdx++;
        } else {
          clearInterval(this.confirmFallbackTimer);
        }
      }, 310);

      const onFinish = () => {
        if (this.confirmFallbackTimer) {
          clearInterval(this.confirmFallbackTimer);
          this.confirmFallbackTimer = null;
        }
        this.clearAllHighlights();
        if (onEnd) onEnd();
      };

      utterance.onend = onFinish;
      utterance.onerror = onFinish;

      window.speechSynthesis.speak(utterance);
    }

    renderCompletion() {
      this.container.innerHTML = `
        <div class="game-module-card" style="text-align:center; padding: 24px;">
          <h2 style="font-size:2rem; margin-bottom:12px;">🎉 礦洞選字完成！</h2>
          <p style="font-size:1.2rem; margin-bottom:16px;">本關卡的選字練習全部完成，綠寶石已存入背包！</p>
          <button class="hud-btn primary" id="btn-next-module" style="font-size:1.2rem; padding:10px 24px;">
            前往「合成台練字」⛏️
          </button>
        </div>
      `;
      document.getElementById('btn-next-module').addEventListener('click', () => {
        this.engine.switchModule('handwriting');
      });
    }
  }

  window.RecognitionModule = RecognitionModule;
})(window);
