/**
 * Module 1: 礦洞選字 (Word Recognition & Sentence Fill-in)
 * Pluggable activity module.
 */

(function(window) {
  'use strict';

  class RecognitionModule {
    constructor() {
      this.currentIndex = 0;
      this.questions = [];
      this.attempts = 0;
      this.isProcessing = false;
    }

    render(container, levelData) {
      this.container = container;
      this.questions = levelData?.recognition || [];
      this.currentIndex = 0;
      this.renderQuestion();
    }

    renderQuestion() {
      if (this.currentIndex >= this.questions.length) {
        this.renderCompletion();
        return;
      }

      this.attempts = 0;
      this.isProcessing = false;
      const q = this.questions[this.currentIndex];

      // Shuffle options and guarantee answer is randomized across positions
      const options = [...q.options];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      // Sentence with target blank
      const sentenceHtml = q.sentence.replace(
        '［  ］', 
        `<span id="target-blank" class="target-blank">？</span>`
      );

      this.container.innerHTML = `
        <div class="game-module-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="hud-badge" style="font-size:0.95rem;">⛏️ 礦洞選字 第 ${this.currentIndex + 1} / ${this.questions.length} 題</span>
            <span style="font-size:0.9rem; color:#555;">提示: ${q.hint || '請選出正確的字'}</span>
          </div>

          <div class="sentence-container" id="sentence-box">
            ${sentenceHtml}
          </div>

          <div class="options-grid" id="options-grid">
            ${options.map(opt => `
              <button class="option-btn" data-val="${opt}">${opt}</button>
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

      // Bind button events
      const btns = this.container.querySelectorAll('.option-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', (e) => this.handleAnswer(btn.dataset.val, btn, q));
      });
    }

    handleAnswer(selected, btnEl, q) {
      if (this.isProcessing) return;

      this.attempts++;
      const isCorrect = (selected === q.answer);

      if (isCorrect) {
        this.isProcessing = true;
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

        // Speak full completed sentence with natural pause
        const fullSentence = q.sentence.replace('［  ］', q.answer);
        this.engine.speakText(fullSentence, () => {
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
          // Trigger Socratic AI Hint on struggle
          this.engine.triggerSocraticHint({
            char: q.answer,
            hint: q.socraticHint || `正確字是「${q.answer}」。注意它的字形與語境：「${q.hint || ''}」！`
          });

          // Reveal answer after 2 attempts
          const blank = document.getElementById('target-blank');
          if (blank) blank.textContent = q.answer;

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
            const fullSentence = q.sentence.replace('［  ］', q.answer);
            this.engine.speakText(fullSentence, () => {
              setTimeout(() => {
                this.currentIndex++;
                this.renderQuestion();
              }, 800);
            });
          }, 1500);
        }
      }
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
