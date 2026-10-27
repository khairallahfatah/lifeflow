/* ============================================================
   LifeFlow — Deep Focus & Pomodoro Module (التركيز الفائق)
   Pomodoro Timer + 100% Offline Web Audio Ambient Sound Generator
   ============================================================ */

import { db } from '../../core/db.js';
import driveSync from '../../core/drive-sync.js';
import reminders from '../../core/reminders.js';
import { playSound } from '../../core/audio.js';
import { toast } from '../../ui/toast.js';

/* ---------- Web Audio Ambient Sound Generator (100% Offline) ---------- */
class AmbientSoundEngine {
  constructor() {
    this.ctx = null;
    this.activeType = null;
    this.gainNode = null;
    this.noiseNode = null;
    this.lfoNode = null;
    this.filterNode = null;
    this.volume = 0.5;
  }

  _initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _createNoiseBuffer(type = 'white') {
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown') {
        // Brown noise: Integrate white noise
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      } else if (type === 'pink') {
        // Pink noise approximation
        data[i] = (lastOut * 0.95) + (white * 0.05);
        lastOut = data[i];
        data[i] *= 3.0;
      } else {
        data[i] = white * 0.5;
      }
    }
    return buffer;
  }

  play(type = 'rain') {
    this._initContext();
    this.stop();

    this.activeType = type;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    if (type === 'rain') {
      // Gentle Rain: Pink noise through bandpass
      const buffer = this._createNoiseBuffer('pink');
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(1000, this.ctx.currentTime);

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.noiseNode.start();
    } else if (type === 'brown') {
      // Brown Noise / Deep Hum
      const buffer = this._createNoiseBuffer('brown');
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(450, this.ctx.currentTime);

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.noiseNode.start();
    } else if (type === 'waves') {
      // Ocean Waves: Modulated pink noise via LFO
      const buffer = this._createNoiseBuffer('pink');
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(600, this.ctx.currentTime);

      // LFO for wave swells (0.15 Hz)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(this.volume * 0.8, this.ctx.currentTime);

      lfo.connect(lfoGain.gain);
      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);

      this.noiseNode.start();
      lfo.start();
      this.lfoNode = lfo;
    }
  }

  stop() {
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch (e) {}
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    if (this.lfoNode) {
      try { this.lfoNode.stop(); } catch (e) {}
      this.lfoNode.disconnect();
      this.lfoNode = null;
    }
    this.activeType = null;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  isPlaying(type) {
    return this.activeType === type;
  }
}

export const ambientEngine = new AmbientSoundEngine();

/* ---------- Focus Sessions & Pomodoro Controller ---------- */

const TIMER_MODES = {
  focus: { name: 'جلسة تركيز', duration: 25 * 60, sound: 'bell' },
  short: { name: 'استراحة قصيرة', duration: 5 * 60, sound: 'chime' },
  long: { name: 'استراحة طويلة', duration: 15 * 60, sound: 'alert' }
};

let currentMode = 'focus';
let timeLeft = TIMER_MODES.focus.duration;
let timerRunning = false;
let timerInterval = null;
let selectedTaskId = null;

export async function getTodayFocusSessions() {
  const today = new Date().toISOString().slice(0, 10);
  return db.list('focus_sessions', {
    all: true,
    predicate: (s) => s.date === today
  });
}

export async function recordFocusSession(minutes, taskId = null) {
  const today = new Date().toISOString().slice(0, 10);
  const session = {
    id: 'foc-' + Date.now().toString(36),
    date: today,
    minutes,
    taskId,
    mode: currentMode,
    completedAt: new Date().toISOString()
  };

  await db.put('focus_sessions', session, { all: true });
  driveSync.notifyDataChanged();
  return session;
}

/**
 * Render Deep Focus View
 */
export async function renderFocusView(container) {
  const sessions = await getTodayFocusSessions();
  const tasks = await db.list('tasks', {
    all: true,
    predicate: (t) => t.status !== 'done' && t.status !== 'cancelled'
  });

  const totalFocusMinutes = sessions.reduce((acc, s) => acc + (s.minutes || 0), 0);

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function render() {
    const totalSec = TIMER_MODES[currentMode].duration;
    const progressPct = Math.round(((totalSec - timeLeft) / totalSec) * 100);

    container.innerHTML = `
      <div class="col" style="gap:var(--sp-5);">
        <!-- Title & Metrics -->
        <div class="row between wrap" style="gap:12px;">
          <div>
            <h2 style="font-size:var(--fs-xl);font-weight:800;">مؤقت بومودورو وبيئة التركيز الفائق ⏱️</h2>
            <p class="muted small" style="margin-top:2px;">تقنية بومودورو لإنجاز المهام الكبرى بدون تشتت مع أصوات محيطية مريحة</p>
          </div>

          <div class="row" style="gap:8px;">
            <span class="badge ok">🎯 إجمالي اليوم: ${totalFocusMinutes} دقيقة تركيز</span>
            <span class="badge accent">${sessions.length} جلسات مكتملة</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:var(--sp-4);">
          <!-- 1. Pomodoro Dial Card -->
          <div class="card col center" style="gap:var(--sp-4);padding:var(--sp-6) var(--sp-4);">
            <!-- Modes Switcher -->
            <div class="row" style="background:var(--surface-2);padding:4px;border-radius:var(--radius-pill);border:1px solid var(--border);">
              <button class="btn sm ${currentMode === 'focus' ? 'primary' : 'ghost'} mode-btn" data-mode="focus" style="border-radius:var(--radius-pill);font-size:12px;">
                🎯 تركيز (25 د)
              </button>
              <button class="btn sm ${currentMode === 'short' ? 'primary' : 'ghost'} mode-btn" data-mode="short" style="border-radius:var(--radius-pill);font-size:12px;">
                ☕ استراحة (5 د)
              </button>
              <button class="btn sm ${currentMode === 'long' ? 'primary' : 'ghost'} mode-btn" data-mode="long" style="border-radius:var(--radius-pill);font-size:12px;">
                🌴 راحة طويلة (15 د)
              </button>
            </div>

            <!-- Big Timer Counter with Circular Glow -->
            <div style="position:relative;width:210px;height:210px;border-radius:50%;border:8px solid var(--surface-3);border-top-color:var(--accent);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:var(--shadow-md);margin:10px 0;">
              <span id="timer-display" style="font-family:var(--mono);font-size:46px;font-weight:800;letter-spacing:-0.03em;color:var(--text);">
                ${formatTime(timeLeft)}
              </span>
              <span class="muted xs" style="font-weight:600;margin-top:-4px;">${TIMER_MODES[currentMode].name}</span>
            </div>

            <!-- Link Session with a Task -->
            <div class="col" style="width:100%;max-width:320px;gap:6px;">
              <label class="muted xs strong">ربط الجلسة بمهمة:</label>
              <select id="select-focus-task" class="input" style="padding:8px 12px;font-size:var(--fs-s);border-radius:var(--radius-s);border:1px solid var(--border);background:var(--surface);">
                <option value="">-- بدون ربط بمهمة محددة --</option>
                ${tasks.map(t => `
                  <option value="${t.id}" ${t.id === selectedTaskId ? 'selected' : ''}>${t.title}</option>
                `).join('')}
              </select>
            </div>

            <!-- Timer Action Buttons -->
            <div class="row" style="gap:12px;margin-top:6px;">
              <button class="btn primary" id="btn-toggle-timer" style="padding:10px 32px;font-size:var(--fs-l);">
                ${timerRunning ? 'إيقاف مؤقت ⏸️' : 'ابدأ التركيز ▶️'}
              </button>
              <button class="btn ghost" id="btn-reset-timer" title="إعادة ضبط المؤقت">
                إعادة ضبط ↺
              </button>
            </div>
          </div>

          <!-- 2. Ambient Sound Generator Card (Web Audio API) -->
          <div class="card col" style="gap:var(--sp-4);">
            <div class="row between">
              <div class="row" style="gap:10px;">
                <div class="logo-badge" style="width:36px;height:36px;border-radius:10px;background:rgba(13, 148, 136, 0.15);color:var(--accent);">
                  🎧
                </div>
                <div>
                  <h3 style="font-size:var(--fs-m);font-weight:700;">أصوات التركيز المحيطية</h3>
                  <div class="muted xs">توليد نقي بـ Web Audio API (بدون إنترنت وبدون تحميل)</div>
                </div>
              </div>
              <button class="btn ghost sm" id="btn-stop-all-ambient" style="color:var(--danger);" ${ambientEngine.activeType ? '' : 'disabled'}>
                إيقاف الصوت ⏹️
              </button>
            </div>

            <p class="muted xs">
              تشغيل ترددات مهدئة تعزل الضوضاء الخارجية من حولك وتساعد دماغك على الدخول في حالة التدفق الذهني العميق (Flow State).
            </p>

            <!-- Sound Buttons List -->
            <div class="col" style="gap:10px;">
              <!-- Rain -->
              <div class="row between" style="padding:12px 14px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid ${ambientEngine.isPlaying('rain') ? 'var(--accent)' : 'var(--border)'};">
                <div class="row" style="gap:10px;">
                  <span style="font-size:22px;">🌧️</span>
                  <div>
                    <div class="strong small">صوت المطر الهادئ (Rain Noise)</div>
                    <div class="muted xs">تلطيف الذهن وإزالة التوتر</div>
                  </div>
                </div>
                <button class="btn sm ${ambientEngine.isPlaying('rain') ? 'primary' : 'ghost'} btn-toggle-ambient" data-type="rain">
                  ${ambientEngine.isPlaying('rain') ? 'نشط 🔊' : 'تشغيل ▶️'}
                </button>
              </div>

              <!-- Ocean Waves -->
              <div class="row between" style="padding:12px 14px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid ${ambientEngine.isPlaying('waves') ? 'var(--accent)' : 'var(--border)'};">
                <div class="row" style="gap:10px;">
                  <span style="font-size:22px;">🌊</span>
                  <div>
                    <div class="strong small">أمواج البحر الترددية (Ocean Waves)</div>
                    <div class="muted xs">تدرج صوتي انسيابي متناغم</div>
                  </div>
                </div>
                <button class="btn sm ${ambientEngine.isPlaying('waves') ? 'primary' : 'ghost'} btn-toggle-ambient" data-type="waves">
                  ${ambientEngine.isPlaying('waves') ? 'نشط 🔊' : 'تشغيل ▶️'}
                </button>
              </div>

              <!-- Brown Noise -->
              <div class="row between" style="padding:12px 14px;background:var(--surface-2);border-radius:var(--radius-m);border:1px solid ${ambientEngine.isPlaying('brown') ? 'var(--accent)' : 'var(--border)'};">
                <div class="row" style="gap:10px;">
                  <span style="font-size:22px;">☕</span>
                  <div>
                    <div class="strong small">الضوضاء البنية العميقة (Brown Noise)</div>
                    <div class="muted xs">حجب تام لأصوات البيئة المشتتة</div>
                  </div>
                </div>
                <button class="btn sm ${ambientEngine.isPlaying('brown') ? 'primary' : 'ghost'} btn-toggle-ambient" data-type="brown">
                  ${ambientEngine.isPlaying('brown') ? 'نشط 🔊' : 'تشغيل ▶️'}
                </button>
              </div>
            </div>

            <!-- Volume Slider -->
            <div class="row between" style="margin-top:6px;gap:12px;">
              <span class="muted xs strong">درجة الصوت:</span>
              <input type="range" id="ambient-volume" min="0" max="1" step="0.05" value="${ambientEngine.volume}" class="grow" style="accent-color:var(--accent);" />
            </div>
          </div>
        </div>
      </div>
    `;

    attachEvents();
  }

  function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    timerInterval = setInterval(async () => {
      if (timeLeft > 0) {
        timeLeft--;
        const display = container.querySelector('#timer-display');
        if (display) display.textContent = formatTime(timeLeft);
      } else {
        clearInterval(timerInterval);
        timerRunning = false;
        await onTimerFinished();
      }
    }, 1000);
  }

  function pauseTimer() {
    timerRunning = false;
    clearInterval(timerInterval);
  }

  async function onTimerFinished() {
    const modeConfig = TIMER_MODES[currentMode];
    playSound(modeConfig.sound);

    // Record session if focus mode completed
    if (currentMode === 'focus') {
      await recordFocusSession(25, selectedTaskId);
      toast.ok('🎉 أحسنت! أنهيت جلسة تركيز كاملة (25 دقيقة). خذ استراحة الآن!');
    } else {
      toast.info('انتهى وقت الاستراحة! حان وقت التركيز في مهمتك التالية.');
    }

    // Trigger Background Notification
    reminders.fire({
      id: 'pomodoro-finished',
      title: '🎯 انتهت جلسة التركيز في LifeFlow!',
      body: currentMode === 'focus' ? 'أنهيت 25 دقيقة تركيز بنجاح. استمتع باستراحة قصيرة.' : 'انتهت الاستراحة. استعد لمواصلة الإنجاز.',
      sound: modeConfig.sound,
      module: 'focus'
    });

    timeLeft = modeConfig.duration;
    render();
  }

  function attachEvents() {
    // Mode Switchers
    container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        pauseTimer();
        currentMode = btn.getAttribute('data-mode');
        timeLeft = TIMER_MODES[currentMode].duration;
        render();
      });
    });

    // Timer Play/Pause
    container.querySelector('#btn-toggle-timer').addEventListener('click', () => {
      if (timerRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
      render();
    });

    // Reset Timer
    container.querySelector('#btn-reset-timer').addEventListener('click', () => {
      pauseTimer();
      timeLeft = TIMER_MODES[currentMode].duration;
      render();
    });

    // Task select
    const taskSelect = container.querySelector('#select-focus-task');
    if (taskSelect) {
      taskSelect.addEventListener('change', (e) => {
        selectedTaskId = e.target.value || null;
      });
    }

    // Ambient Toggles
    container.querySelectorAll('.btn-toggle-ambient').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        if (ambientEngine.isPlaying(type)) {
          ambientEngine.stop();
        } else {
          ambientEngine.play(type);
        }
        render();
      });
    });

    container.querySelector('#btn-stop-all-ambient').addEventListener('click', () => {
      ambientEngine.stop();
      render();
    });

    const volSlider = container.querySelector('#ambient-volume');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        ambientEngine.setVolume(parseFloat(e.target.value));
      });
    }
  }

  render();
}

export default {
  render: renderFocusView,
  ambient: ambientEngine,
  record: recordFocusSession
};
