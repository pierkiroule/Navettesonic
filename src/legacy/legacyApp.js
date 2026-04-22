let legacyAppBooted = false;

export function initLegacyApp() {
  if (legacyAppBooted) return;
  legacyAppBooted = true;

          const SAMPLE_LIBRARY = [
              { id: 'zen-gong', name: 'Zen Gong', texture: 'Gong profond et respirant', type: 'triangle', freq: 132, lfo: 0.06, lfoDepth: 0.018, gain: 0.28, baseCutoff: 3400, resonanceFreq: 420, resonanceQ: 1.5 },
              { id: 'harp-mist', name: 'Harp Mist', texture: 'Harpes douces dans la brume', type: 'sine', freq: 262, lfo: 0.14, lfoDepth: 0.02, gain: 0.25, baseCutoff: 4200, resonanceFreq: 520, resonanceQ: 1.35 },
              { id: 'tibetan-bowl', name: 'Tibetan Bowl', texture: 'Bol tibétain chaud et stable', type: 'triangle', freq: 196, lfo: 0.08, lfoDepth: 0.016, gain: 0.27, baseCutoff: 3600, resonanceFreq: 480, resonanceQ: 1.8 },
              { id: 'forest-breath', name: 'Forest Breath', texture: 'Souffle de forêt feutré', type: 'noise', freq: 0, lfo: 0.08, gain: 0.17, baseCutoff: 2600, resonanceFreq: 360, resonanceQ: 1.1 },
              { id: 'river-flow', name: 'River Flow', texture: 'Ruissellement lent et soyeux', type: 'noise', freq: 0, lfo: 0.12, gain: 0.15, baseCutoff: 2100, resonanceFreq: 300, resonanceQ: 0.95 },
              { id: 'lotus-drift', name: 'Lotus Drift', texture: 'Nappe méditative veloutée', type: 'sine', freq: 174, lfo: 0.05, lfoDepth: 0.014, gain: 0.24, baseCutoff: 3300, resonanceFreq: 440, resonanceQ: 1.25 },
              { id: 'moon-choir', name: 'Moon Choir', texture: 'Chœur aérien apaisé', type: 'triangle', freq: 220, lfo: 0.09, lfoDepth: 0.017, gain: 0.22, baseCutoff: 3900, resonanceFreq: 540, resonanceQ: 1.4 },
              { id: 'bamboo-wind', name: 'Bamboo Wind', texture: 'Vent léger entre les bambous', type: 'noise', freq: 0, lfo: 0.1, gain: 0.14, baseCutoff: 1900, resonanceFreq: 280, resonanceQ: 0.9 },
              { id: 'temple-halo', name: 'Temple Halo', texture: 'Halo de temple lumineux', type: 'sine', freq: 294, lfo: 0.13, lfoDepth: 0.018, gain: 0.2, baseCutoff: 4400, resonanceFreq: 610, resonanceQ: 1.5 },
              { id: 'dawn-birds', name: 'Dawn Birds', texture: 'Nature matinale très douce', type: 'triangle', freq: 330, lfo: 0.18, lfoDepth: 0.012, gain: 0.18, baseCutoff: 4700, resonanceFreq: 660, resonanceQ: 1.2 },
              { id: 'ocean-deep', name: 'Ocean Deep', texture: 'Grondement sombre des abysses', type: 'noise', freq: 0, lfo: 0.04, gain: 0.21, baseCutoff: 680, resonanceFreq: 120, resonanceQ: 2.2 },
              { id: 'pluie-douce', name: 'Pluie Douce', texture: 'Pluie fine sur les feuilles', type: 'noise', freq: 0, lfo: 0.26, gain: 0.16, baseCutoff: 3500, resonanceFreq: 520, resonanceQ: 0.85 },
              { id: 'baleine-bleue', name: 'Baleine Bleue', texture: 'Chant grave et lointain de baleine', type: 'sine', freq: 82, lfo: 0.022, lfoDepth: 0.030, gain: 0.28, baseCutoff: 1800, resonanceFreq: 160, resonanceQ: 2.4 },
              { id: 'grotte-silence', name: 'Grotte Silence', texture: 'Gouttes d\'eau dans la grotte', type: 'triangle', freq: 148, lfo: 0.03, lfoDepth: 0.011, gain: 0.22, baseCutoff: 2200, resonanceFreq: 260, resonanceQ: 2.8 },
              { id: 'crickets-nuit', name: 'Crickets Nuit', texture: 'Grillons sous les étoiles d\'été', type: 'triangle', freq: 432, lfo: 0.40, lfoDepth: 0.008, gain: 0.14, baseCutoff: 5200, resonanceFreq: 780, resonanceQ: 1.1 },
              { id: 'cascade-lointaine', name: 'Cascade Lointaine', texture: 'Murmure d\'une cascade dans le brouillard', type: 'noise', freq: 0, lfo: 0.19, gain: 0.17, baseCutoff: 5400, resonanceFreq: 680, resonanceQ: 0.78 },
              { id: 'tonnerre-doux', name: 'Tonnerre Doux', texture: 'Tonnerre lointain qui roule et s\'efface', type: 'noise', freq: 0, lfo: 0.03, gain: 0.20, baseCutoff: 560, resonanceFreq: 95, resonanceQ: 1.9 },
              { id: 'vent-desert', name: 'Vent Désert', texture: 'Vent chaud sur les dunes de sable', type: 'noise', freq: 0, lfo: 0.06, gain: 0.16, baseCutoff: 1350, resonanceFreq: 210, resonanceQ: 1.05 },
              { id: 'aurore', name: 'Aurore', texture: 'Drone éthéré de l\'aurore boréale', type: 'sine', freq: 528, lfo: 0.034, lfoDepth: 0.016, gain: 0.18, baseCutoff: 6000, resonanceFreq: 740, resonanceQ: 1.6 },
              { id: 'rosee-foret', name: 'Rosée Forêt', texture: 'Fraîcheur cristalline d\'un matin de forêt', type: 'triangle', freq: 370, lfo: 0.12, lfoDepth: 0.014, gain: 0.19, baseCutoff: 4900, resonanceFreq: 620, resonanceQ: 1.3 }
          ];

          const homeView = document.getElementById('homeView');
          const experienceView = document.getElementById('experienceView');
          const profileView = document.getElementById('profileView');
          const bottomNav = document.getElementById('bottomNav');
          const navHome = document.getElementById('navHome');
          const navSoon = document.getElementById('navSoon');
          const navProfile = document.getElementById('navProfile');
          const enterExperienceBtn = document.getElementById('enterExperienceBtn');
          const echoHypnoseLinkBtn = document.getElementById('echoHypnoseLinkBtn');
          const echoHypnoseModal = document.getElementById('echoHypnoseModal');
          const closeEchoHypnoseModalBtn = document.getElementById('closeEchoHypnoseModalBtn');
          const heroVideo = document.getElementById('heroVideo');
          const heroVideoShell = document.getElementById('heroVideoShell');
          const heroPlayBtn = document.getElementById('heroPlayBtn');

          const canvas = document.getElementById('canvas');
          const ctx = canvas.getContext('2d');
          const ui = document.getElementById('ui');
          const helperTips = document.getElementById('helperTips');
          const echoRecorderPanel = document.getElementById('echoRecorderPanel');
          const echoRecordToggleBtn = document.getElementById('echoRecordToggleBtn');
          const echoRecordTimer = document.getElementById('echoRecordTimer');
          const echoRecordStatus = document.getElementById('echoRecordStatus');
          const echoRecordDownloadLink = document.getElementById('echoRecordDownloadLink');
          const bubblePanel = document.getElementById('bubblePanel');
          const cancelBtn = document.getElementById('cancelBtn');
          const dropBtn = document.getElementById('dropBtn');
          const bubbleLayer = document.getElementById('bubbleLayer');
          const sampleSelect = document.getElementById('sampleSelect');
          const sampleHint = document.getElementById('sampleHint');
          const arenaTrianglePad = document.getElementById('arenaTrianglePad');
          const arenaTriangleStatus = document.getElementById('arenaTriangleStatus');
          const bubblePropsPanel = document.getElementById('bubblePropsPanel');
          const propsBubbleName = document.getElementById('propsBubbleName');
          const propsSampleSelect = document.getElementById('propsSampleSelect');
          const propsSizeRange = document.getElementById('propsSizeRange');
          const propsSizeVal = document.getElementById('propsSizeVal');
          const colorSwatches = document.getElementById('colorSwatches');
          const propsLayerSelect = document.getElementById('propsLayerSelect');
          const propsDeleteBtn = document.getElementById('propsDeleteBtn');
          const propsCloseBtn = document.getElementById('propsCloseBtn');
          const supabaseUrlInput = document.getElementById('supabaseUrlInput');
          const supabaseKeyInput = document.getElementById('supabaseKeyInput');
          const supabaseSaveConfigBtn = document.getElementById('supabaseSaveConfigBtn');
          const supabaseTestBtn = document.getElementById('supabaseTestBtn');
          const supabaseFileInput = document.getElementById('supabaseFileInput');
          const supabaseUploadBtn = document.getElementById('supabaseUploadBtn');
          const supabaseProbeUrlInput = document.getElementById('supabaseProbeUrlInput');
          const supabaseProbeBtn = document.getElementById('supabaseProbeBtn');
          const supabaseStatus = document.getElementById('supabaseStatus');
          const supabaseUploadedLink = document.getElementById('supabaseUploadedLink');
          const supabaseProbeStatus = document.getElementById('supabaseProbeStatus');
          const authEmailInput = document.getElementById('authEmailInput');
          const authPasswordInput = document.getElementById('authPasswordInput');
          const authSignInBtn = document.getElementById('authSignInBtn');
          const authSignUpBtn = document.getElementById('authSignUpBtn');
          const authSignOutBtn = document.getElementById('authSignOutBtn');
          const authStatus = document.getElementById('authStatus');
          const authSessionInfo = document.getElementById('authSessionInfo');
          const dbConnectionStatus = document.getElementById('dbConnectionStatus');
          const storeCatalog = document.getElementById('storeCatalog');
          const sessionHistoryList = document.getElementById('sessionHistoryList');

          let selectedBubble = null;
          let isDraggingBubble = false;
          let lastBubbleTapTime = 0;
          let lastBubbleTapTarget = null;

          const BUBBLE_COLORS = [
              { hue: 195 }, { hue: 230 }, { hue: 265 }, { hue: 315 },
              { hue: 15 },  { hue: 45 },  { hue: 140 }, { hue: 175 },
          ];
          BUBBLE_COLORS.forEach((c, idx) => {
              const sw = document.createElement('button');
              sw.type = 'button';
              sw.className = 'color-swatch';
              sw.style.background = `hsl(${c.hue}, 78%, 60%)`;
              sw.dataset.idx = idx;
              sw.addEventListener('click', () => {
                  if (!selectedBubble) return;
                  selectedBubble.hue = c.hue;
                  refreshSwatchSelection();
              });
              colorSwatches.appendChild(sw);
          });

          SAMPLE_LIBRARY.forEach(s => {
              const opt = document.createElement('option');
              opt.value = s.id; opt.textContent = s.name;
              propsSampleSelect.appendChild(opt);
          });

          function refreshSwatchSelection() {
              colorSwatches.querySelectorAll('.color-swatch').forEach((sw, i) => {
                  sw.classList.toggle('selected', !!selectedBubble && BUBBLE_COLORS[i].hue === selectedBubble.hue);
              });
          }

          function openBubblePropsPanel(bubble) {
              selectedBubble = bubble;
              isTethered = false;
              if (bubble.hue === undefined) bubble.hue = 195;
              propsBubbleName.textContent = bubble.label || 'Bulle sonore';
              propsSampleSelect.value = bubble._sampleId || SAMPLE_LIBRARY[0].id;
              propsSizeRange.value = bubble.r;
              propsSizeVal.textContent = Math.round(bubble.r) + 'px';
              propsLayerSelect.value = bubble.layer;
              refreshSwatchSelection();
              bubblePropsPanel.classList.add('visible');
              ui.textContent = '⟡ Touche l\'océan pour déplacer · Double tap pour fermer';
          }

          function closeBubblePropsPanel() {
              bubblePropsPanel.classList.remove('visible');
              selectedBubble = null;
              isDraggingBubble = false;
              ui.textContent = '';
              rotateHelperTip();
          }

          function rebuildBubbleSound(bubble, sample) {
              if (bubble.sound) {
                  try { bubble.sound.source.stop(); } catch (_) {}
              }
              bubble.sound = createBinauralSound(sample);
              bubble.label = sample.name;
              bubble._sampleId = sample.id;
              bubble.lastImpactAt = 0;
              bubble.fishTouching = false;
              propsBubbleName.textContent = sample.name;
              bubble.currentVolume = 0;
              bubble.zoneMix = 0;
              bubble.resonance = 0;
          }

          propsSampleSelect.addEventListener('change', () => {
              if (!selectedBubble) return;
              const sample = SAMPLE_LIBRARY.find(s => s.id === propsSampleSelect.value);
              if (sample) rebuildBubbleSound(selectedBubble, sample);
          });
          propsSizeRange.addEventListener('input', () => {
              if (!selectedBubble) return;
              selectedBubble.r = parseInt(propsSizeRange.value);
              propsSizeVal.textContent = propsSizeRange.value + 'px';
          });
          propsLayerSelect.addEventListener('change', () => {
              if (!selectedBubble) return;
              const spatial = layerToSpatial(propsLayerSelect.value);
              selectedBubble.layer = propsLayerSelect.value;
              selectedBubble.depthOffset = spatial.depthOffset;
          });
          propsDeleteBtn.addEventListener('click', () => {
              if (!selectedBubble) return;
              try { selectedBubble.sound?.source?.stop(); } catch (_) {}
              ARENA_FIREFLIES.forEach((firefly) => {
                  if (firefly.containedInBubbleId !== selectedBubble.id) return;
                  firefly.containedInBubbleId = null;
                  firefly.triangleVertexIndex = -1;
                  firefly.linkedCooldownUntil = performance.now() + 1200;
                  firefly.nextDestinyAt = performance.now() + 900 + Math.random() * 900;
              });
              const idx = BUBBLES.indexOf(selectedBubble);
              if (idx !== -1) BUBBLES.splice(idx, 1);
              closeBubblePropsPanel();
          });
          propsCloseBtn.addEventListener('click', closeBubblePropsPanel);

          let currentView = 'home';
          let w, h;
          let isTethered = false;
          let mouseWorld = { x: 0, y: 0 };
          let isInteractionPaused = false;
          let lastFishTap = { time: 0, x: 0, y: 0 };
          let selectedSampleId = SAMPLE_LIBRARY[0].id;
          let audioCtx = null;
          let masterGainNode = null;
          let heroVideoAudioCtx = null;
          let heroVideoSourceNode = null;
          let heroVideoAnalyserNode = null;
          let heroHaloData = null;
          let heroHaloRAF = null;
          let heroHaloEnergy = 0;
          let helperTipIndex = 0;
          let sooncutBucketVocals = [];
          let activeArenaAudio = null;
          const RECORDER_MAX_SECONDS = 180;
          const RECORDER_MAX_MILLIS = RECORDER_MAX_SECONDS * 1000;
          const helperTipsPlaylist = [
              'Garde le doigt (ou clic) appuyé dans l’océan : le poisson-plume suit ton mouvement.',
              'Une nouvelle luciole émerge toutes les 15 secondes dans le courant.',
              'Chaque luciole collectée lit son vocal : attends la fin pour en accrocher une autre.',
              'La plume garde 3 lucioles espacées et visibles le long de son axe.',
              'Quand 3 lucioles sont accrochées, touche le halo triangulaire autour du poisson pour les poser.'
          ];

          const ARENA_RADIUS = 2000;
          const SOUND_HEAR_RADIUS = 460;
          const ARENA_TRIANGLE_COUNT = 12;
          const FIREFLY_TAIL_ATTACH_RADIUS = 38;
          const FIREFLY_AUDIO_MIN_MS = 1500;
          const FIREFLY_AUDIO_MAX_MS = 3200;
          const FIREFLY_TAIL_MAX_ATTACHED = 3;
          const FIREFLY_REPULSE_COOLDOWN_MS = 900;
          const FIREFLY_RELEASE_INTERVAL_MS = 15000;
          const FIREFLY_PLUME_LENGTH = 170;
          const DEFAULT_SUPABASE_URL = 'https://qyffktrggapfzlmmlerq.supabase.co';
          const ENV_SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
          const ENV_SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
          const SOONCUT_BUCKET_FOLDER = 'sooncut';
          const SOONCUT_TRIANGLE_SAMPLE_IDS = SAMPLE_LIBRARY.slice(0, ARENA_TRIANGLE_COUNT).map(sample => sample.id);
          const DEPTH_Z = 140;
          const BUBBLES = [];
          const WAKE_PARTICLES = [];
          const MAX_WAKE_PARTICLES = 5;
          const RIPPLE_RINGS = [];
          const MAX_RIPPLES = 18;
          const SURFACE_SPARKLES = [];
          const MAX_SURFACE_SPARKLES = 30;
          const RESONANCE_WAVES = [];
          const MAX_RESONANCE_WAVES = 14;
          const BREATH_WAVES = [];
          const MAX_BREATH_WAVES = 9;
          const DRIFT_MOTES = [];
          const MAX_DRIFT_MOTES = 22;
          const ARENA_FIREFLIES = [];
          const PLACED_FIREFLY_TRIANGLES = [];
          let hasReleasedInitialFireflies = false;
          let fireflyReleaseSequenceActive = false;
          let nextFireflyReleaseAt = 0;
          let fireflyVocalGateUntil = 0;
          let isFireflyVocalPlaying = false;
          const STARTING_BUBBLES = [
              { sampleId: 'forêt-zen', layer: 'front', hue: 188, x: -240, y: -120, r: 72 },
              { sampleId: 'ocean-deep', layer: 'below', hue: 235, x: 220, y: 170, r: 78 },
              { sampleId: 'aurore', layer: 'above', hue: 318, x: 70, y: -255, r: 68 },
          ];
          let shipBreathEmitter = 0;
          let bubbleIdSeed = 1;
          let supabaseClient = null;
          let currentSession = null;
          let isAuthActionPending = false;
          let syncInFlightPromise = null;
          let recordingState = 'idle';
          let recordingTimerInterval = null;
          let recordingAutoStopTimeout = null;
          let recordingStartedAt = 0;
          let recordingMediaDest = null;
          let recordingMediaRecorder = null;
          let recordingChunks = [];
          let recordingMimeType = '';
          let recordingFileExt = 'webm';
          let recordingDownloadUrl = null;
          let recordingFallbackNotice = '';
          const SUPABASE_BUCKET = 'Soonbucket';
          const SUPABASE_LOCAL_KEYS = {
              url: 'soono.supabase.url',
              key: 'soono.supabase.key',
          };
          const ECHO_EXPERIENCES = [
              { id: 'echo-nuit-calmante', title: 'Écho Nuit Calmante', description: 'Session douce pour ralentir le mental.', priceLabel: '12,00 €', durationLabel: '25 min' },
              { id: 'echo-focus-profond', title: 'Écho Focus Profond', description: 'Immersion sonore pour concentration profonde.', priceLabel: '16,00 €', durationLabel: '35 min' },
              { id: 'echo-voyage-ocean', title: 'Écho Voyage Océan', description: 'Parcours méditatif inspiré des abysses.', priceLabel: '19,00 €', durationLabel: '45 min' },
          ];

          const arenaResonance = { level: 0, hue: 198 };

          const ship = {
              x: 0, y: 0, vx: 0, vy: 0, angle: 0, trail: [], maxTrail: 72,
              stiffness: 0.0026, damping: 0.93, turnEase: 0.06, maxSpeed: 3.1,
              wakeEmitter: 0, rippleEmitter: 0
          };
          const camera = { x: 0, y: 0, targetX: 0, targetY: 0, ease: 0.05 };

          function setActiveNav(target) {
              [navHome, navSoon, navProfile].forEach(btn => btn.classList.remove('active'));
              if (target === 'home') navHome.classList.add('active');
              if (target === 'soon') navSoon.classList.add('active');
              if (target === 'profile') navProfile.classList.add('active');
          }

          function showView(target) {
              currentView = target;
              homeView.classList.toggle('hidden-view', target !== 'home');
              experienceView.classList.toggle('hidden-view', target !== 'experience');
              profileView.classList.toggle('hidden-view', target !== 'profile');
              bottomNav.classList.remove('hidden-view');
              setActiveNav(target === 'experience' ? 'soon' : target);
              if (target !== 'experience') {
                  isTethered = false;
                  closeBubblePanel();
              }
              if (heroVideo) {
                  if (target === 'home') {
                      heroVideo.play().catch(() => {});
                  } else {
                      heroVideo.pause();
                      heroVideo.muted = true;
                      syncHeroPlayButton();
                  }
              }
              if (target === 'experience') {
                  rotateHelperTip(true);
                  releaseInitialFirefliesFromBubble(null, performance.now());
              }
              resize();
          }

          function rotateHelperTip(reset = false) {
              if (reset) helperTipIndex = 0;
              if (!helperTips) return;
              helperTips.textContent = helperTipsPlaylist[helperTipIndex];
              helperTipIndex = (helperTipIndex + 1) % helperTipsPlaylist.length;
          }

          function bindTap(button, handler, options = {}) {
              if (!button || typeof handler !== 'function') return;
              const preventTouchDefault = options.preventTouchDefault !== false;
              let lastTouchAt = 0;
              button.addEventListener('touchend', (event) => {
                  if (preventTouchDefault) event.preventDefault();
                  lastTouchAt = Date.now();
                  handler();
              }, { passive: !preventTouchDefault });
              button.addEventListener('click', () => {
                  if (Date.now() - lastTouchAt < 450) return;
                  handler();
              });
          }

          function bindPress(button, handler) {
              if (!button || typeof handler !== 'function') return;
              let lastPressAt = 0;
              const trigger = () => {
                  const now = Date.now();
                  if (now - lastPressAt < 320) return;
                  lastPressAt = now;
                  handler();
              };
              button.addEventListener('click', trigger);
              if ('PointerEvent' in window) {
                  button.addEventListener('pointerup', (event) => {
                      if (event.pointerType === 'touch') trigger();
                  });
              } else {
                  button.addEventListener('touchend', trigger, { passive: true });
              }
          }

          setInterval(() => {
              if (currentView !== 'experience' || isInteractionPaused) return;
              rotateHelperTip();
          }, 5000);

          bindTap(enterExperienceBtn, () => {
              if (!requireRegisteredUserForExperience('Soon experience')) return;
              showView('experience');
              ensureAllAudioRunning();
          });

          bindTap(echoRecordToggleBtn, () => {
              if (recordingState === 'recording') {
                  stopEchoRecording(false);
                  return;
              }
              if (recordingState === 'finalizing') return;
              startEchoRecording();
          });

          function openEchoHypnoseModal() {
              if (!echoHypnoseModal) return;
              echoHypnoseModal.hidden = false;
          }

          function closeEchoHypnoseModal() {
              if (!echoHypnoseModal) return;
              echoHypnoseModal.hidden = true;
          }

          function syncHeroPlayButton() {
              if (!heroVideo || !heroPlayBtn) return;
              const shouldHidePlayButton = !heroVideo.paused && !heroVideo.muted && heroVideo.volume > 0;
              heroPlayBtn.classList.toggle('hidden', shouldHidePlayButton);
          }

          function ensureHeroHaloAudio() {
              if (!heroVideo || !heroVideoShell) return;
              if (!heroVideoAudioCtx) {
                  const HeroAudioContextClass = window.AudioContext || window.webkitAudioContext;
                  if (!HeroAudioContextClass) return;
                  heroVideoAudioCtx = new HeroAudioContextClass();
              }
              if (!heroVideoSourceNode) {
                  heroVideoSourceNode = heroVideoAudioCtx.createMediaElementSource(heroVideo);
                  heroVideoAnalyserNode = heroVideoAudioCtx.createAnalyser();
                  heroVideoAnalyserNode.fftSize = 512;
                  heroVideoAnalyserNode.smoothingTimeConstant = 0.84;
                  heroHaloData = new Uint8Array(heroVideoAnalyserNode.frequencyBinCount);
                  heroVideoSourceNode.connect(heroVideoAnalyserNode);
                  heroVideoSourceNode.connect(heroVideoAudioCtx.destination);
              }
              if (heroVideoAudioCtx.state === 'suspended') {
                  heroVideoAudioCtx.resume().catch(() => {});
              }
              heroVideoShell.classList.add('audio-reactive');
              startHeroHaloLoop();
          }

          function startHeroHaloLoop() {
              if (heroHaloRAF || !heroVideoShell) return;
              const animateHalo = () => {
                  let targetEnergy = 0.12;
                  if (heroVideoAnalyserNode && heroHaloData) {
                      heroVideoAnalyserNode.getByteFrequencyData(heroHaloData);
                      let weighted = 0;
                      let sumWeights = 0;
                      const length = heroHaloData.length;
                      for (let i = 0; i < length; i += 1) {
                          const ratio = i / length;
                          const weight = ratio < 0.07 ? 0.15 : ratio < 0.34 ? 0.75 : 1.25;
                          weighted += (heroHaloData[i] / 255) * weight;
                          sumWeights += weight;
                      }
                      const spectralEnergy = sumWeights ? weighted / sumWeights : 0;
                      targetEnergy = spectralEnergy * 1.12;
                  }
                  if (heroVideo.muted || heroVideo.paused) {
                      targetEnergy *= 0.45;
                  }
                  heroHaloEnergy += (targetEnergy - heroHaloEnergy) * 0.22;
                  const clampedEnergy = Math.max(0.08, Math.min(1, heroHaloEnergy));
                  const haloScale = 1 + clampedEnergy * 0.12;
                  heroVideoShell.style.setProperty('--halo-intensity', clampedEnergy.toFixed(3));
                  heroVideoShell.style.setProperty('--halo-scale', haloScale.toFixed(3));
                  heroHaloRAF = window.requestAnimationFrame(animateHalo);
              };
              heroHaloRAF = window.requestAnimationFrame(animateHalo);
          }

          function playHeroWithSound() {
              if (!heroVideo) return;
              heroVideo.currentTime = 0;
              heroVideo.muted = false;
              if (heroVideo.volume === 0) heroVideo.volume = 1;
              heroVideo.play().catch(() => {});
              ensureHeroHaloAudio();
              syncHeroPlayButton();
          }

          if (echoHypnoseLinkBtn) {
              bindTap(echoHypnoseLinkBtn, openEchoHypnoseModal);
          }
          if (closeEchoHypnoseModalBtn) {
              bindTap(closeEchoHypnoseModalBtn, (event) => {
                  event.stopPropagation();
                  closeEchoHypnoseModal();
              });
          }
          if (echoHypnoseModal) {
              echoHypnoseModal.addEventListener('click', (event) => {
                  if (event.target === echoHypnoseModal) {
                      closeEchoHypnoseModal();
                  }
              });
          }
          window.addEventListener('keydown', (event) => {
              if (event.key === 'Escape' && echoHypnoseModal && !echoHypnoseModal.hidden) {
                  closeEchoHypnoseModal();
              }
          });

          if (heroPlayBtn) {
              heroPlayBtn.addEventListener('click', playHeroWithSound);
          }
          if (heroVideo) {
              heroVideo.addEventListener('volumechange', syncHeroPlayButton);
              heroVideo.addEventListener('pause', syncHeroPlayButton);
              heroVideo.addEventListener('play', ensureHeroHaloAudio);
              heroVideo.addEventListener('loadeddata', startHeroHaloLoop);
              heroVideo.addEventListener('canplay', startHeroHaloLoop);
              syncHeroPlayButton();
          }
          if (heroVideoShell) {
              heroVideoShell.style.setProperty('--halo-intensity', '0.18');
              heroVideoShell.style.setProperty('--halo-scale', '1');
              startHeroHaloLoop();
          }

          bindTap(navHome, () => showView('home'));
          bindTap(navSoon, () => {
              if (!requireRegisteredUserForExperience('navigation')) return;
              showView('experience');
          });
          bindTap(navProfile, () => showView('profile'));

          function maskApiKey(key) {
              if (!key || key.length < 12) return key;
              return `${key.slice(0, 10)}…${key.slice(-4)}`;
          }

          function setSupabaseStatus(message, isError = false) {
              if (!supabaseStatus) return;
              supabaseStatus.textContent = message;
              supabaseStatus.style.color = isError ? 'rgba(255, 148, 148, 0.95)' : 'rgba(146, 247, 210, 0.95)';
          }

          function setSupabaseProbeStatus(message, isError = false) {
              if (!supabaseProbeStatus) return;
              supabaseProbeStatus.textContent = message;
              supabaseProbeStatus.style.color = isError ? 'rgba(255, 172, 172, 0.95)' : 'rgba(197, 223, 255, 0.95)';
          }

          function setAuthStatus(message, isError = false) {
              if (!authStatus) return;
              authStatus.textContent = message;
              authStatus.style.color = isError ? 'rgba(255, 148, 148, 0.95)' : 'rgba(146, 247, 210, 0.95)';
          }

          function setDbConnectionStatus(message, isError = false) {
              if (!dbConnectionStatus) return;
              dbConnectionStatus.textContent = message;
              dbConnectionStatus.style.color = isError ? 'rgba(255, 172, 172, 0.95)' : 'rgba(197, 223, 255, 0.95)';
          }

          function setAuthButtonsPending(isPending) {
              isAuthActionPending = isPending;
              if (authSignInBtn) authSignInBtn.disabled = isPending;
              if (authSignUpBtn) authSignUpBtn.disabled = isPending;
              if (authSignOutBtn) authSignOutBtn.disabled = isPending || !currentSession?.user;
          }

          function updateExperienceAccessUi() {
              const hasAccess = !!currentSession?.user;
              if (enterExperienceBtn) {
                  enterExperienceBtn.textContent = hasAccess ? 'Soon experience' : 'Soon experience 🔒';
              }
              if (navSoon) {
                  navSoon.textContent = hasAccess ? 'Soon•°' : 'Soon•° 🔒';
              }
          }

          function requireRegisteredUserForExperience(triggerLabel = 'Soon experience') {
              if (currentSession?.user) return true;
              setAuthStatus(`Inscris-toi ou connecte-toi pour accéder à l'expérience (${triggerLabel}).`, true);
              showView('profile');
              authEmailInput?.focus();
              return false;
          }

          function getSupabaseConfig() {
              const bootConfig = window.__SOONO_CONFIG__ || {};
              const urlFromStorage = localStorage.getItem(SUPABASE_LOCAL_KEYS.url);
              const keyFromStorage = localStorage.getItem(SUPABASE_LOCAL_KEYS.key);
              return {
                  url: urlFromStorage || bootConfig.supabaseUrl || ENV_SUPABASE_URL || '',
                  key: keyFromStorage || bootConfig.supabasePublishableKey || ENV_SUPABASE_KEY || '',
              };
          }

          function buildSupabaseClient() {
              const cfg = getSupabaseConfig();
              const url = supabaseUrlInput?.value?.trim() || cfg.url || DEFAULT_SUPABASE_URL;
              const key = supabaseKeyInput?.value?.trim() || cfg.key;
              if (!url || !key) {
                  setSupabaseStatus('Ajoute URL + clé publishable Supabase.', true);
                  setDbConnectionStatus('Base Supabase non connectée (variables Vercel manquantes).', true);
                  setAuthStatus('Inscription indisponible: variable VITE_SUPABASE_PUBLISHABLE_KEY manquante.', true);
                  return null;
              }
              if (!window.supabase || typeof window.supabase.createClient !== 'function') {
                  setSupabaseStatus('SDK Supabase introuvable dans la page.', true);
                  setDbConnectionStatus('Base Supabase non connectée (SDK introuvable).', true);
                  return null;
              }
              if (supabaseClient) {
                  setDbConnectionStatus('Base Supabase connectée ✅');
                  return supabaseClient;
              }
              supabaseClient = window.supabase.createClient(url, key);
              setDbConnectionStatus('Base Supabase connectée ✅');
              supabaseClient.auth.onAuthStateChange((event, session) => {
                  currentSession = session;
                  const statusByEvent = {
                      SIGNED_IN: 'Connexion réussie ✅',
                      SIGNED_OUT: 'Session fermée.',
                      TOKEN_REFRESHED: 'Session actualisée.',
                      USER_UPDATED: 'Profil auth mis à jour.',
                      PASSWORD_RECOVERY: 'Récupération mot de passe en cours.',
                  };
                  refreshAuthUi(statusByEvent[event] || 'Session active.');
                  syncSessionAndProfile({ silent: true });
              });
              return supabaseClient;
          }

          async function testSupabaseConnection() {
              const client = buildSupabaseClient();
              if (!client) return;
              setSupabaseStatus('Connexion en cours…');
              const { error } = await client.storage.from(SUPABASE_BUCKET).list('', { limit: 1 });
              if (error) {
                  setSupabaseStatus(`Connexion OK mais accès bucket refusé: ${error.message}`, true);
                  return;
              }
              setSupabaseStatus(`Connecté à ${SUPABASE_BUCKET} avec ${maskApiKey(supabaseKeyInput.value.trim())}.`);
              await fetchSooncutVocalsFromBucket();
          }

          function sanitizeFileName(name) {
              return name.toLowerCase()
                  .replace(/[^a-z0-9._-]/g, '-')
                  .replace(/-+/g, '-')
                  .replace(/^-|-$/g, '');
          }

          async function uploadToSoonbucket() {
              const file = supabaseFileInput.files?.[0];
              if (!file) {
                  setSupabaseStatus('Choisis un fichier avant upload.', true);
                  return;
              }
              const client = buildSupabaseClient();
              if (!client) return;
              setSupabaseStatus('Upload en cours…');

              const objectPath = `uploads/${Date.now()}-${sanitizeFileName(file.name)}`;
              const { error: uploadError } = await client.storage.from(SUPABASE_BUCKET).upload(objectPath, file, {
                  cacheControl: '3600',
                  upsert: false,
              });
              if (uploadError) {
                  setSupabaseStatus(`Échec upload: ${uploadError.message}`, true);
                  return;
              }
              const { data } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(objectPath);
              const url = data?.publicUrl;
              setSupabaseStatus('Upload terminé ✅');
              if (url) {
                  supabaseUploadedLink.innerHTML = `Fichier disponible: <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
              } else {
                  supabaseUploadedLink.textContent = `Uploadé: ${objectPath}`;
              }
          }

          async function probeAudioFile(url) {
              if (!url) return { ok: false, reason: 'URL vide.' };
              try {
                  const response = await fetch(url, {
                      method: 'GET',
                      headers: { Range: 'bytes=0-64' },
                  });
                  if (!response.ok) {
                      return { ok: false, reason: `HTTP ${response.status}` };
                  }
                  const contentType = response.headers.get('content-type') || '';
                  const looksAudio = /^audio\//i.test(contentType) || /\.mp3(\?|$)/i.test(url);
                  if (!looksAudio) {
                      return { ok: false, reason: `Type inattendu: ${contentType || 'inconnu'}` };
                  }
                  return { ok: true, reason: `OK (${response.status}${contentType ? ` · ${contentType}` : ''})` };
              } catch (error) {
                  return { ok: false, reason: error?.message || 'Erreur réseau/CORS' };
              }
          }

          async function testSooncutFilesReadability() {
              const directUrl = supabaseProbeUrlInput?.value?.trim() || '';
              setSupabaseProbeStatus('Test lecture bucket en cours…');

              const directProbe = await probeAudioFile(directUrl);
              const directLine = directProbe.ok
                  ? `URL directe: lisible ✅ (${directProbe.reason})`
                  : `URL directe: échec ❌ (${directProbe.reason})`;

              const url = supabaseUrlInput?.value?.trim() || '';
              const key = supabaseKeyInput?.value?.trim() || '';
              if (!url || !key) {
                  setSupabaseProbeStatus(
                      `${directLine} · Test multi-fichiers ignoré (URL + clé Supabase non renseignées).`,
                      !directProbe.ok
                  );
                  return;
              }
              const client = buildSupabaseClient();
              if (!client) {
                  setSupabaseProbeStatus(`${directLine} · Client Supabase indisponible pour le test multi-fichiers.`, true);
                  return;
              }

              const { data, error } = await client.storage.from(SUPABASE_BUCKET).list(SOONCUT_BUCKET_FOLDER, {
                  limit: 5,
                  offset: 0,
                  sortBy: { column: 'name', order: 'asc' },
              });
              if (error) {
                  setSupabaseProbeStatus(`${directLine} · Listing Sooncut refusé: ${error.message}`, true);
                  return;
              }

              const audioFiles = (data || []).filter((item) => item?.name && isAudioObject(item.name));
              if (!audioFiles.length) {
                  setSupabaseProbeStatus(`${directLine} · Aucun .mp3 trouvé dans ${SUPABASE_BUCKET}/${SOONCUT_BUCKET_FOLDER}.`, true);
                  return;
              }

              let readableCount = 0;
              for (const file of audioFiles) {
                  const objectPath = `${SOONCUT_BUCKET_FOLDER}/${file.name}`;
                  const { data: signedData } = await client.storage.from(SUPABASE_BUCKET).createSignedUrl(objectPath, 60 * 5);
                  const candidateUrl = signedData?.signedUrl || buildPublicSoonbucketUrl(objectPath);
                  const probe = await probeAudioFile(candidateUrl);
                  if (probe.ok) readableCount += 1;
              }

              const allReadable = readableCount === audioFiles.length;
              setSupabaseProbeStatus(`${directLine} · Fichiers testés: ${audioFiles.length}, lisibles: ${readableCount}.`, !allReadable);
          }

          function getCollectionStorageKey() {
              const userId = currentSession?.user?.id || 'guest';
              return `soono.echo.purchases.${userId}`;
          }

          function getSessionHistoryStorageKey() {
              const userId = currentSession?.user?.id || 'guest';
              return `soono.echo.sessions.${userId}`;
          }

          function getOwnedItems() {
              const raw = localStorage.getItem(getCollectionStorageKey());
              if (!raw) return [];
              try {
                  const parsed = JSON.parse(raw);
                  return Array.isArray(parsed) ? parsed : [];
              } catch (_) {
                  return [];
              }
          }

          function setOwnedItems(items) {
              localStorage.setItem(getCollectionStorageKey(), JSON.stringify(items));
          }

          function getSessionHistory() {
              const raw = localStorage.getItem(getSessionHistoryStorageKey());
              if (!raw) return [];
              try {
                  const parsed = JSON.parse(raw);
                  return Array.isArray(parsed) ? parsed : [];
              } catch (_) {
                  return [];
              }
          }

          function setSessionHistory(items) {
              localStorage.setItem(getSessionHistoryStorageKey(), JSON.stringify(items));
          }

          function sanitizeOwnedItems(items) {
              if (!Array.isArray(items)) return [];
              const allowedIds = new Set(ECHO_EXPERIENCES.map((item) => item.id));
              const unique = [];
              const seen = new Set();
              items.forEach((itemId) => {
                  if (!allowedIds.has(itemId) || seen.has(itemId)) return;
                  seen.add(itemId);
                  unique.push(itemId);
              });
              return unique;
          }

          async function fetchUserPurchasesRows(client, userId) {
              const { data, error } = await client
                  .from('user_purchases')
                  .select('pack_id, purchased_at, status, echo_packs(slug, title)')
                  .eq('user_id', userId)
                  .order('purchased_at', { ascending: false })
                  .limit(200);
              if (error) return { rows: [], error };
              return { rows: Array.isArray(data) ? data : [], error: null };
          }

          function toOwnedItemsFromPurchases(rows) {
              const slugs = rows
                  .map((row) => row?.echo_packs?.slug)
                  .filter(Boolean);
              return sanitizeOwnedItems(slugs);
          }

          function toSessionHistoryFromPurchases(rows) {
              return rows
                  .map((row) => {
                      const slug = row?.echo_packs?.slug;
                      const title = row?.echo_packs?.title;
                      const purchasedAt = row?.purchased_at;
                      if (!slug || !purchasedAt) return null;
                      return {
                          experience_id: slug,
                          experience_title: title || 'Expérience Échohypnose',
                          purchased_at: purchasedAt,
                      };
                  })
                  .filter(Boolean);
          }

          async function ensurePurchasesForExperienceIds(client, userId, experienceIds) {
              const safeIds = sanitizeOwnedItems(experienceIds);
              if (!safeIds.length) return { ok: true, inserted: 0 };

              const { data: packs, error: packsError } = await client
                  .from('echo_packs')
                  .select('id, slug')
                  .in('slug', safeIds);
              if (packsError) return { ok: false, error: packsError };

              const packRows = Array.isArray(packs) ? packs : [];
              if (!packRows.length) return { ok: true, inserted: 0 };
              const packIds = packRows.map((row) => row.id).filter(Boolean);

              const { data: existingRows, error: existingError } = await client
                  .from('user_purchases')
                  .select('pack_id')
                  .eq('user_id', userId)
                  .in('pack_id', packIds)
                  .limit(200);
              if (existingError) return { ok: false, error: existingError };

              const existingPackIds = new Set((existingRows || []).map((row) => row.pack_id));
              const missingPurchases = packRows
                  .filter((row) => !existingPackIds.has(row.id))
                  .map((row) => ({
                      user_id: userId,
                      pack_id: row.id,
                      status: 'paid',
                      payment_provider: 'local-sync',
                  }));

              if (!missingPurchases.length) return { ok: true, inserted: 0 };

              const { error: insertError } = await client
                  .from('user_purchases')
                  .insert(missingPurchases);
              if (insertError) return { ok: false, error: insertError };

              return { ok: true, inserted: missingPurchases.length };
          }

          async function syncCollectionFromSupabase() {
              if (!currentSession?.user?.id) return;
              const client = buildSupabaseClient();
              if (!client) return;

              const { data, error } = await client
                  .from('user_profile_collections')
                  .select('owned_item_ids')
                  .eq('user_id', currentSession.user.id)
                  .maybeSingle();

              if (error) {
                  if (!isSupabaseMissingRelationError(error)) {
                      setAuthStatus(`Sync profil échouée (lecture): ${error.message}`, true);
                      return;
                  }
                  const purchasesResult = await fetchUserPurchasesRows(client, currentSession.user.id);
                  if (purchasesResult.error) {
                      setAuthStatus(`Sync profil échouée (fallback user_purchases): ${purchasesResult.error.message}`, true);
                      return;
                  }
                  const remoteOwned = toOwnedItemsFromPurchases(purchasesResult.rows);
                  const localOwned = sanitizeOwnedItems(getOwnedItems());
                  const mergedOwned = sanitizeOwnedItems([...remoteOwned, ...localOwned]);
                  setOwnedItems(mergedOwned);
                  setAuthStatus(`Achats synchronisés via user_purchases (${mergedOwned.length} expérience${mergedOwned.length > 1 ? 's' : ''}).`);
                  return;
              }

              if (!data) {
                  const localOwned = sanitizeOwnedItems(getOwnedItems());
                  await syncCollectionToSupabase(localOwned, { silentSuccess: true });
                  return;
              }

              const remoteOwned = sanitizeOwnedItems(data.owned_item_ids || []);
              const localOwned = sanitizeOwnedItems(getOwnedItems());
              const mergedOwned = sanitizeOwnedItems([...remoteOwned, ...localOwned]);
              const changedFromRemote = mergedOwned.length !== remoteOwned.length;
              setOwnedItems(mergedOwned);
              if (changedFromRemote) {
                  await syncCollectionToSupabase(mergedOwned, { silentSuccess: true });
              }
              setAuthStatus(`Achats synchronisés (${mergedOwned.length} expérience${mergedOwned.length > 1 ? 's' : ''}).`);
          }

          async function syncCollectionToSupabase(items, options = {}) {
              if (!currentSession?.user?.id) return false;
              const client = buildSupabaseClient();
              if (!client) return false;
              const safeItems = sanitizeOwnedItems(items);

              const { error } = await client
                  .from('user_profile_collections')
                  .upsert({
                      user_id: currentSession.user.id,
                      owned_item_ids: safeItems,
                      updated_at: new Date().toISOString(),
                  }, {
                      onConflict: 'user_id',
                  });

              if (error) {
                  if (!isSupabaseMissingRelationError(error)) {
                      setAuthStatus(`Sync profil échouée (écriture): ${error.message}`, true);
                      return false;
                  }
                  const fallback = await ensurePurchasesForExperienceIds(client, currentSession.user.id, safeItems);
                  if (!fallback.ok) {
                      setAuthStatus(`Sync profil échouée (fallback user_purchases): ${fallback.error.message}`, true);
                      return false;
                  }
                  if (!options.silentSuccess) {
                      setAuthStatus(`Achats synchronisés via user_purchases (${safeItems.length} expérience${safeItems.length > 1 ? 's' : ''}).`);
                  }
                  return true;
              }

              if (!options.silentSuccess) {
                  setAuthStatus(`Profil Supabase synchronisé (${safeItems.length} expérience${safeItems.length > 1 ? 's' : ''}).`);
              }
              return true;
          }

          function formatSessionTimestamp(value) {
              const date = new Date(value);
              if (Number.isNaN(date.getTime())) return 'Date inconnue';
              return new Intl.DateTimeFormat('fr-FR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
              }).format(date);
          }

          function isSupabaseMissingRelationError(error) {
              if (!error) return false;
              if (error.code === 'PGRST204' || error.code === '42P01') return true;
              const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
              return message.includes('could not find the table') || message.includes('relation') && message.includes('does not exist');
          }

          async function syncSessionHistoryFromSupabase() {
              if (!currentSession?.user?.id) return;
              const client = buildSupabaseClient();
              if (!client) return;

              const { data, error } = await client
                  .from('echohypnose_session_history')
                  .select('experience_id, experience_title, purchased_at')
                  .eq('user_id', currentSession.user.id)
                  .order('purchased_at', { ascending: false })
                  .limit(100);

              if (error) {
                  if (isSupabaseMissingRelationError(error)) {
                      const purchasesResult = await fetchUserPurchasesRows(client, currentSession.user.id);
                      if (purchasesResult.error) {
                          setAuthStatus(`Historique non synchronisé (fallback user_purchases): ${purchasesResult.error.message}`, true);
                          return;
                      }
                      const purchaseHistory = toSessionHistoryFromPurchases(purchasesResult.rows);
                      const localRows = Array.isArray(getSessionHistory()) ? getSessionHistory() : [];
                      const mergedMap = new Map();
                      [...purchaseHistory, ...localRows].forEach((entry) => {
                          if (!entry?.experience_id || !entry?.purchased_at) return;
                          const key = `${entry.experience_id}::${entry.purchased_at}`;
                          if (!mergedMap.has(key)) {
                              mergedMap.set(key, entry);
                          }
                      });
                      const mergedRows = Array.from(mergedMap.values())
                          .sort((a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime())
                          .slice(0, 100);
                      setSessionHistory(mergedRows);
                      setAuthStatus(`Historique synchronisé via user_purchases (${purchaseHistory.length} entrée${purchaseHistory.length > 1 ? 's' : ''}).`);
                      return;
                  }
                  setAuthStatus(`Historique non synchronisé: ${error.message}`, true);
                  return;
              }
              const remoteRows = Array.isArray(data) ? data : [];
              const localRows = Array.isArray(getSessionHistory()) ? getSessionHistory() : [];
              const mergedMap = new Map();
              [...remoteRows, ...localRows].forEach((entry) => {
                  if (!entry?.experience_id || !entry?.purchased_at) return;
                  const key = `${entry.experience_id}::${entry.purchased_at}`;
                  if (!mergedMap.has(key)) {
                      mergedMap.set(key, {
                          experience_id: entry.experience_id,
                          experience_title: entry.experience_title || 'Expérience Échohypnose',
                          purchased_at: entry.purchased_at,
                      });
                  }
              });
              const mergedRows = Array.from(mergedMap.values())
                  .sort((a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime())
                  .slice(0, 100);
              setSessionHistory(mergedRows);
          }

          async function pushSessionHistoryToSupabase(entry) {
              if (!currentSession?.user?.id) return false;
              const client = buildSupabaseClient();
              if (!client) return false;
              const { error } = await client.from('echohypnose_session_history').insert({
                  user_id: currentSession.user.id,
                  experience_id: entry.experience_id,
                  experience_title: entry.experience_title,
                  purchased_at: entry.purchased_at,
              });
              if (error) {
                  if (isSupabaseMissingRelationError(error)) {
                      const fallback = await ensurePurchasesForExperienceIds(client, currentSession.user.id, [entry.experience_id]);
                      if (fallback.ok) return true;
                      setAuthStatus(`Écriture historique échouée (fallback user_purchases): ${fallback.error.message}`, true);
                      return false;
                  }
                  if (error.code === '23505') return true;
                  setAuthStatus(`Écriture historique échouée: ${error.message}`, true);
                  return false;
              }
              return true;
          }

          async function syncSessionAndProfile(options = {}) {
              if (syncInFlightPromise) return syncInFlightPromise;
              syncInFlightPromise = (async () => {
                  if (!currentSession?.user?.id) {
                      renderStoreCatalog();
                      renderSessionHistory();
                      return;
                  }
                  await syncCollectionFromSupabase();
                  await syncSessionHistoryFromSupabase();
                  renderStoreCatalog();
                  renderSessionHistory();
                  if (!options.silent) {
                      setAuthStatus('Profil + session synchronisés ✅');
                  }
              })();
              try {
                  await syncInFlightPromise;
              } finally {
                  syncInFlightPromise = null;
              }
          }

          async function simulatePaymentAndActivate(item) {
              setAuthStatus(`Achat simulé pour ${item.title}…`);
              await new Promise(resolve => setTimeout(resolve, 650));
              const owned = new Set(getOwnedItems());
              owned.add(item.id);
              const nextOwned = sanitizeOwnedItems([...owned]);
              setOwnedItems(nextOwned);
              const purchasedAt = new Date().toISOString();
              const localHistory = [
                  {
                      experience_id: item.id,
                      experience_title: item.title,
                      purchased_at: purchasedAt,
                  },
                  ...getSessionHistory(),
              ].slice(0, 100);
              setSessionHistory(localHistory);

              if (currentSession?.user?.id) {
                  await syncCollectionToSupabase(nextOwned, { silentSuccess: true });
                  await pushSessionHistoryToSupabase({
                      experience_id: item.id,
                      experience_title: item.title,
                      purchased_at: purchasedAt,
                  });
              }
              setAuthStatus(`${item.title} acheté ✅${currentSession?.user?.id ? ' · historique sync OK' : ''}`);
              renderStoreCatalog();
              renderSessionHistory();
          }

          function refreshAuthUi(message = '') {
              if (message) setAuthStatus(message, false);
              if (currentSession?.user) {
                  authSessionInfo.textContent = `Connecté: ${currentSession.user.email || currentSession.user.id}`;
                  authSignOutBtn.disabled = false;
              } else {
                  authSessionInfo.textContent = 'Aucune session active.';
                  authSignOutBtn.disabled = true;
              }
              updateExperienceAccessUi();
          }

          function renderStoreCatalog() {
              if (!storeCatalog) return;
              const owned = new Set(getOwnedItems());
              storeCatalog.innerHTML = '';
              ECHO_EXPERIENCES.forEach(item => {
                  const card = document.createElement('article');
                  card.className = 'store-item';
                  const isOwned = owned.has(item.id);
                  card.innerHTML = `
                      <h4>${item.title}</h4>
                      <p>${item.description}</p>
                      <span class="pill">${item.durationLabel} · ${isOwned ? 'Acheté' : item.priceLabel}</span>
                  `;
                  const actionBtn = document.createElement('button');
                  actionBtn.type = 'button';
                  actionBtn.textContent = isOwned ? 'Déjà acheté' : 'Acheter (simulé)';
                  actionBtn.disabled = isOwned;
                  bindTap(actionBtn, () => {
                      simulatePaymentAndActivate(item);
                  });
                  card.appendChild(actionBtn);
                  storeCatalog.appendChild(card);
              });
          }

          function renderSessionHistory() {
              if (!sessionHistoryList) return;
              const history = getSessionHistory();
              sessionHistoryList.innerHTML = '';
              if (!history.length) {
                  sessionHistoryList.innerHTML = '<p class="collection-empty">Aucune session enregistrée pour le moment.</p>';
                  return;
              }
              history.forEach((entry, index) => {
                  const row = document.createElement('article');
                  row.className = 'store-item';
                  row.innerHTML = `
                      <h4>${entry.experience_title || 'Expérience Échohypnose'}</h4>
                      <p>Session #${history.length - index} · ${formatSessionTimestamp(entry.purchased_at)}</p>
                  `;
                  sessionHistoryList.appendChild(row);
              });
          }

          async function signInWithEmail() {
              if (isAuthActionPending) return;
              const client = buildSupabaseClient();
              if (!client) return;
              const email = authEmailInput.value.trim();
              const password = authPasswordInput.value.trim();
              if (!email || !password) {
                  setAuthStatus('Email et mot de passe requis.', true);
                  return;
              }
              setAuthButtonsPending(true);
              try {
                  const { data, error } = await client.auth.signInWithPassword({ email, password });
                  if (error) {
                      setAuthStatus(`Connexion refusée: ${error.message}`, true);
                      return;
                  }
                  currentSession = data.session;
                  refreshAuthUi('Connexion réussie ✅');
                  await syncSessionAndProfile({ silent: true });
              } finally {
                  setAuthButtonsPending(false);
              }
          }

          async function signUpWithEmail() {
              if (isAuthActionPending) return;
              const client = buildSupabaseClient();
              if (!client) return;
              const email = authEmailInput.value.trim();
              const password = authPasswordInput.value.trim();
              if (!email || !password) {
                  setAuthStatus('Email et mot de passe requis.', true);
                  return;
              }
              setAuthButtonsPending(true);
              try {
                  const { data, error } = await client.auth.signUp({ email, password });
                  if (error) {
                      setAuthStatus(`Inscription refusée: ${error.message}`, true);
                      return;
                  }
                  if (data?.session) {
                      currentSession = data.session;
                      refreshAuthUi('Compte créé + connecté ✅');
                      await syncSessionAndProfile({ silent: true });
                      return;
                  }
                  setAuthStatus('Compte créé. Vérifie ton email puis connecte-toi.');
              } finally {
                  setAuthButtonsPending(false);
              }
          }

          async function signOutSession() {
              if (isAuthActionPending) return;
              const client = buildSupabaseClient();
              if (!client) return;
              setAuthButtonsPending(true);
              try {
                  const { error } = await client.auth.signOut();
                  if (error) {
                      setAuthStatus(`Déconnexion impossible: ${error.message}`, true);
                      return;
                  }
                  currentSession = null;
                  refreshAuthUi('Déconnecté.');
                  renderStoreCatalog();
                  renderSessionHistory();
              } finally {
                  setAuthButtonsPending(false);
              }
          }

          async function restoreSession() {
              const client = buildSupabaseClient();
              if (!client) return;
              const { data } = await client.auth.getSession();
              currentSession = data?.session || null;
              refreshAuthUi(currentSession ? 'Session restaurée.' : 'Pas de session active.');
              await syncSessionAndProfile({ silent: true });
              await fetchSooncutVocalsFromBucket();
          }

          function initSupabaseProfileCard() {
              const cfg = getSupabaseConfig();
              supabaseUrlInput.value = cfg.url || DEFAULT_SUPABASE_URL;
              supabaseKeyInput.value = cfg.key;
              if (supabaseUrlInput.value && cfg.key) {
                  setSupabaseStatus(`Configuration chargée (${maskApiKey(cfg.key)}).`);
                  setDbConnectionStatus('Base Supabase prête ✅');
              } else {
                  setSupabaseStatus('Renseigne URL + clé publishable pour activer Soonbucket.');
                  setDbConnectionStatus('Base Supabase non connectée (variables Vercel manquantes).', true);
              }

              supabaseSaveConfigBtn.addEventListener('click', () => {
                  const url = supabaseUrlInput.value.trim();
                  const key = supabaseKeyInput.value.trim();
                  localStorage.setItem(SUPABASE_LOCAL_KEYS.url, url);
                  localStorage.setItem(SUPABASE_LOCAL_KEYS.key, key);
                  setSupabaseStatus(`Configuration sauvegardée localement (${maskApiKey(key)}).`);
                  supabaseClient = null;
                  restoreSession();
              });

              supabaseTestBtn.addEventListener('click', () => {
                  testSupabaseConnection();
              });
              supabaseUploadBtn.addEventListener('click', () => {
                  uploadToSoonbucket();
              });
              supabaseProbeBtn.addEventListener('click', () => {
                  testSooncutFilesReadability();
              });
          }
          initSupabaseProfileCard();
          bindPress(authSignInBtn, signInWithEmail);
          bindPress(authSignUpBtn, signUpWithEmail);
          bindPress(authSignOutBtn, signOutSession);
          renderStoreCatalog();
          renderSessionHistory();
          restoreSession();

          SAMPLE_LIBRARY.forEach(sample => {
              const option = document.createElement('option');
              option.value = sample.id;
              option.textContent = sample.name;
              sampleSelect.appendChild(option);
          });
          renderArenaTriangles();

          function updateSampleHint() {
              const sample = SAMPLE_LIBRARY.find(s => s.id === selectedSampleId) || SAMPLE_LIBRARY[0];
              sampleHint.textContent = `${sample.texture} · ${sample.name}`;
          }
          updateSampleHint();

          sampleSelect.addEventListener('change', () => {
              selectedSampleId = sampleSelect.value;
              updateSampleHint();
          });

          function resize() {
              w = window.innerWidth;
              h = window.innerHeight;
              canvas.width = w;
              canvas.height = h;
          }
          window.addEventListener('resize', resize);
          resize();

          function getMousePos(e) {
              const sx = e.clientX ?? (e.touches && e.touches[0]?.clientX);
              const sy = e.clientY ?? (e.touches && e.touches[0]?.clientY);
              return { x: sx - w / 2 + camera.x, y: sy - h / 2 + camera.y };
          }

          function isInteractiveTarget(target) {
              if (!target) return false;
              return bubblePanel.contains(target) || bubblePropsPanel.contains(target) ||
                     arenaTrianglePad.contains(target) || bottomNav.contains(target) ||
                     homeView.contains(target) || profileView.contains(target) ||
                     (echoHypnoseModal && echoHypnoseModal.contains(target));
          }

          function setArenaTriangleStatus(message, isError = false) {
              if (!arenaTriangleStatus) return;
              arenaTriangleStatus.textContent = message;
              arenaTriangleStatus.style.color = isError ? 'rgba(255, 172, 172, 0.95)' : 'rgba(255, 220, 220, 0.88)';
          }

          function isAudioObject(fileName = '') {
              return /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(fileName);
          }

          function buildPublicSoonbucketUrl(objectPath) {
              const projectUrl = supabaseUrlInput.value.trim() || getSupabaseConfig().url || DEFAULT_SUPABASE_URL;
              if (!projectUrl || !objectPath) return null;
              const cleanBase = projectUrl.replace(/\/+$/g, '');
              const cleanPath = objectPath.replace(/^\/+/g, '');
              return `${cleanBase}/storage/v1/object/public/${SUPABASE_BUCKET}/${cleanPath}`;
          }

          function buildFallbackSooncutVocals() {
              const tracks = Array.from({ length: ARENA_TRIANGLE_COUNT }, (_, index) => {
                  const fileNumber = String(index + 1).padStart(3, '0');
                  const name = `extrait_${fileNumber}.mp3`;
                  const objectPath = `${SOONCUT_BUCKET_FOLDER}/${name}`;
                  const url = buildPublicSoonbucketUrl(objectPath);
                  return url ? { name, objectPath, url } : null;
              }).filter(Boolean);
              return tracks;
          }

          async function fetchSooncutVocalsFromBucket() {
              const client = buildSupabaseClient();
              if (!client) {
                  sooncutBucketVocals = buildFallbackSooncutVocals();
                  if (sooncutBucketVocals.length) {
                      setArenaTriangleStatus(`Mode URL publique Soonbucket activé (${sooncutBucketVocals.length} extraits).`);
                      renderArenaTriangles();
                      return sooncutBucketVocals;
                  }
                  setArenaTriangleStatus('Lucioles Sooncut: configure Supabase pour charger les vocaux.', true);
                  return [];
              }

              const { data, error } = await client.storage.from(SUPABASE_BUCKET).list(SOONCUT_BUCKET_FOLDER, {
                  limit: 100,
                  offset: 0,
                  sortBy: { column: 'name', order: 'asc' },
              });

              if (error) {
                  sooncutBucketVocals = buildFallbackSooncutVocals();
                  if (sooncutBucketVocals.length) {
                      setArenaTriangleStatus(`Listing refusé, fallback URL publique activé (${sooncutBucketVocals.length} extraits).`);
                      renderArenaTriangles();
                      return sooncutBucketVocals;
                  }
                  setArenaTriangleStatus(`Sooncut bucket: ${error.message}`, true);
                  return [];
              }

              const audioFiles = (data || []).filter((item) => item?.name && isAudioObject(item.name));
              if (!audioFiles.length) {
                  sooncutBucketVocals = buildFallbackSooncutVocals();
                  if (sooncutBucketVocals.length) {
                      setArenaTriangleStatus(`Aucun fichier listé, fallback URL publique activé (${sooncutBucketVocals.length} extraits).`);
                      renderArenaTriangles();
                      return sooncutBucketVocals;
                  }
                  setArenaTriangleStatus(`Aucun vocal trouvé dans ${SUPABASE_BUCKET}/${SOONCUT_BUCKET_FOLDER}.`, true);
                  return [];
              }

              const resolved = audioFiles.map((item) => {
                  const objectPath = `${SOONCUT_BUCKET_FOLDER}/${item.name}`;
                  const url = buildPublicSoonbucketUrl(objectPath);
                  return url ? { name: item.name, objectPath, url } : null;
              });

              sooncutBucketVocals = resolved.filter(Boolean);
              setArenaTriangleStatus(`Vocaux chargés: ${sooncutBucketVocals.length} depuis ${SUPABASE_BUCKET}/${SOONCUT_BUCKET_FOLDER}.`);
              renderArenaTriangles();
              return sooncutBucketVocals;
          }

          function pickRandomSooncutTrack() {
              if (!sooncutBucketVocals.length) return null;
              const randomIndex = Math.floor(Math.random() * sooncutBucketVocals.length);
              return sooncutBucketVocals[randomIndex] || null;
          }

          async function resolveSooncutTrackUrls(track) {
              if (!track?.objectPath) return [];
              const urls = [];
              const client = buildSupabaseClient();

              if (track.url) urls.push(track.url);

              if (client) {
                  const { data: publicData } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(track.objectPath);
                  if (publicData?.publicUrl) urls.push(publicData.publicUrl);

                  const { data: signedData, error: signedError } = await client
                      .storage
                      .from(SUPABASE_BUCKET)
                      .createSignedUrl(track.objectPath, 60 * 10);
                  if (!signedError && signedData?.signedUrl) urls.push(signedData.signedUrl);
              }

              const fallbackUrl = buildPublicSoonbucketUrl(track.objectPath);
              if (fallbackUrl) urls.push(fallbackUrl);

              return Array.from(new Set(urls.filter(Boolean)));
          }

          function tryPlayArenaUrl(url, trackName) {
              return new Promise((resolve) => {
                  try {
                      const audio = activeArenaAudio || new Audio();
                      if (activeArenaAudio) {
                          activeArenaAudio.pause();
                          activeArenaAudio.currentTime = 0;
                      }
                      audio.preload = 'auto';
                      audio.volume = 0.98;
                      audio.src = url;
                      activeArenaAudio = audio;
                      const startedAt = performance.now();
                      let settled = false;
                      const settle = (durationMs) => {
                          if (settled) return;
                          settled = true;
                          audio.removeEventListener('ended', onEnded);
                          audio.removeEventListener('error', onError);
                          resolve(Math.max(0, durationMs || 0));
                      };
                      const onEnded = () => settle(performance.now() - startedAt);
                      const onError = () => settle(0);
                      audio.addEventListener('ended', onEnded, { once: true });
                      audio.addEventListener('error', onError, { once: true });
                      audio.play().then(() => {
                          setArenaTriangleStatus(`Lecture bucket aléatoire: ${trackName}`);
                          const fallbackDuration = Number.isFinite(audio.duration) && audio.duration > 0
                              ? audio.duration * 1000
                              : FIREFLY_AUDIO_MAX_MS;
                          setTimeout(() => settle(fallbackDuration), Math.max(1200, fallbackDuration + 350));
                      }).catch(() => settle(0));
                  } catch (_) {
                      resolve(0);
                  }
              });
          }

          async function playSooncutBucketTrack(track) {
              if (!track?.name) return 0;
              const candidateUrls = await resolveSooncutTrackUrls(track);
              if (!candidateUrls.length) return 0;

              for (const url of candidateUrls) {
                  const playedDuration = await tryPlayArenaUrl(url, track.name);
                  if (playedDuration > 0) return playedDuration;
              }

              setArenaTriangleStatus(`Lecture impossible pour ${track.name}`, true);
              return 0;
          }

          function triggerArenaSample(sampleId) {
              const sample = SAMPLE_LIBRARY.find(s => s.id === sampleId);
              const context = ensureAudioContext();
              if (!sample || !context || !masterGainNode) return;

              const gain = context.createGain();
              const filter = context.createBiquadFilter();
              const now = context.currentTime;
              const attack = 0.02;
              const hold = 0.32;
              const release = 0.65;
              const peak = Math.max(0.05, Math.min(0.48, (sample.gain ?? 0.2) * 1.4));

              filter.type = 'lowpass';
              filter.frequency.value = sample.baseCutoff ?? 4200;
              filter.Q.value = 0.6;

              gain.gain.setValueAtTime(0.0001, now);
              gain.gain.exponentialRampToValueAtTime(peak, now + attack);
              gain.gain.setValueAtTime(peak, now + attack + hold);
              gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + hold + release);
              gain.connect(filter);
              filter.connect(masterGainNode);

              if (sample.type === 'noise') {
                  const source = context.createBufferSource();
                  source.buffer = buildSyntheticBuffer(context, 1.1);
                  source.connect(gain);
                  source.start(now);
                  source.stop(now + attack + hold + release + 0.08);
                  return;
              }

              const source = context.createOscillator();
              source.type = sample.type || 'sine';
              source.frequency.setValueAtTime(sample.freq || 220, now);
              source.connect(gain);
              source.start(now);
              source.stop(now + attack + hold + release + 0.08);
          }

          function ensureArenaFireflies() {
              if (ARENA_FIREFLIES.length) return;
              const baseDistance = ARENA_RADIUS * 0.52;
              for (let index = 0; index < ARENA_TRIANGLE_COUNT; index++) {
                  const angle = (index / ARENA_TRIANGLE_COUNT) * Math.PI * 2 + Math.random() * 0.55;
                  const radialJitter = (Math.random() - 0.5) * 260;
                  const baseRadius = Math.max(220, baseDistance + radialJitter);
                  ARENA_FIREFLIES.push({
                      id: `firefly-${index + 1}`,
                      index,
                      sampleId: SOONCUT_TRIANGLE_SAMPLE_IDS[index % SOONCUT_TRIANGLE_SAMPLE_IDS.length],
                      bucketTrack: null,
                      x: Math.cos(angle) * baseRadius,
                      y: Math.sin(angle) * baseRadius,
                      baseX: Math.cos(angle) * baseRadius,
                      baseY: Math.sin(angle) * baseRadius,
                      vx: 0,
                      vy: 0,
                      driftPhase: Math.random() * Math.PI * 2,
                      driftSpeed: 0.00016 + Math.random() * 0.00028,
                      driftRadius: 30 + Math.random() * 34,
                      size: 6 + Math.random() * 3,
                      glow: 0.45 + Math.random() * 0.5,
                      pulseFreq: 0.42 + Math.random() * 0.72,
                      pulsePhase: Math.random() * Math.PI * 2,
                      lastTriggerAt: 0,
                      linkedCooldownUntil: 0,
                      attachedToTail: false,
                      attachedOrder: -1,
                      attachedAt: 0,
                      playbackEndsAt: 0,
                      isReleased: false,
                      containedInBubbleId: null,
                      placedTriangleId: null,
                      triangleVertexIndex: -1,
                      bubbleOrbitIndex: index % 3,
                      nextBubbleSwitchAt: performance.now() + 4200 + Math.random() * 3600,
                      destinyX: Math.cos(angle) * baseRadius,
                      destinyY: Math.sin(angle) * baseRadius,
                      nextDestinyAt: performance.now() + 3600 + Math.random() * 4200
                  });
              }
          }

          function renderArenaTriangles() {
              ensureArenaFireflies();
              if (arenaTrianglePad) {
                  arenaTrianglePad.innerHTML = '';
                  arenaTrianglePad.setAttribute('aria-hidden', 'true');
              }

              ARENA_FIREFLIES.forEach((firefly, index) => {
                  firefly.sampleId = SOONCUT_TRIANGLE_SAMPLE_IDS[index % SOONCUT_TRIANGLE_SAMPLE_IDS.length];
                  firefly.bucketTrack = sooncutBucketVocals.length
                      ? sooncutBucketVocals[index % sooncutBucketVocals.length]
                      : null;
              });
          }

          function getShipTailPosition() {
              const speed = Math.hypot(ship.vx, ship.vy);
              let backX = Math.sin(ship.angle);
              let backY = -Math.cos(ship.angle);
              if (speed > 0.04) {
                  const invSpeed = 1 / Math.max(0.0001, speed);
                  backX = -ship.vx * invSpeed;
                  backY = -ship.vy * invSpeed;
              }
              return {
                  x: ship.x + backX * 16,
                  y: ship.y + backY * 16
              };
          }

          async function triggerAttachedFireflyPlayback(firefly, now) {
              if (!firefly) return;
              isFireflyVocalPlaying = true;
              const provisionalDuration = FIREFLY_AUDIO_MIN_MS + Math.random() * (FIREFLY_AUDIO_MAX_MS - FIREFLY_AUDIO_MIN_MS);
              firefly.playbackEndsAt = now + provisionalDuration;
              fireflyVocalGateUntil = firefly.playbackEndsAt;
              const duration = await triggerFireflyVocalPlayback(firefly);
              const effectiveDuration = Math.max(FIREFLY_AUDIO_MIN_MS, duration || provisionalDuration);
              firefly.playbackEndsAt = performance.now();
              fireflyVocalGateUntil = performance.now() + Math.min(220, effectiveDuration * 0.08);
              isFireflyVocalPlaying = false;
          }

          function getBubbleTriangleVertices(bubble) {
              if (!bubble) return [];
              const radius = Math.max(24, (bubble.r || 42) * 0.52);
              const spin = (performance.now() * 0.00022) + (bubble.id ? bubble.id.length * 0.1 : 0);
              return [0, 1, 2].map((idx) => {
                  const angle = spin + (idx / 3) * Math.PI * 2 - Math.PI / 2;
                  return {
                      x: bubble.x + Math.cos(angle) * radius,
                      y: bubble.y + Math.sin(angle) * radius
                  };
              });
          }

          function pointInsideTriangle(point, vertices) {
              if (!point || !vertices || vertices.length < 3) return false;
              const [a, b, c] = vertices;
              const sign = (p1, p2, p3) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
              const d1 = sign(point, a, b);
              const d2 = sign(point, b, c);
              const d3 = sign(point, c, a);
              const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
              const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
              return !(hasNeg && hasPos);
          }

          function distancePointToSegment(point, a, b) {
              const abX = b.x - a.x;
              const abY = b.y - a.y;
              const abLenSq = abX * abX + abY * abY;
              if (abLenSq <= 0.0001) return Math.hypot(point.x - a.x, point.y - a.y);
              const tRaw = ((point.x - a.x) * abX + (point.y - a.y) * abY) / abLenSq;
              const t = Math.max(0, Math.min(1, tRaw));
              const projX = a.x + abX * t;
              const projY = a.y + abY * t;
              return Math.hypot(point.x - projX, point.y - projY);
          }

          function isPointTouchingTriangleElement(point, vertices, threshold = 16) {
              if (!point || !vertices || vertices.length < 3) return false;
              for (const vertex of vertices) {
                  if (Math.hypot(point.x - vertex.x, point.y - vertex.y) <= threshold) return true;
              }
              const edges = [[0, 1], [1, 2], [2, 0]];
              return edges.some(([aIdx, bIdx]) => distancePointToSegment(point, vertices[aIdx], vertices[bIdx]) <= threshold);
          }

          function delay(ms) {
              return new Promise((resolve) => setTimeout(resolve, ms));
          }

          function releaseSingleFireflyFromBubble(sourceBubble, now) {
              const firefly = ARENA_FIREFLIES.find((candidate) => !candidate.isReleased);
              if (!firefly) return false;
              const angle = Math.random() * Math.PI * 2;
              const startRadius = Math.max(30, (sourceBubble?.r || 64) * (0.35 + Math.random() * 0.2));
              const startX = (sourceBubble?.x || 0) + Math.cos(angle) * startRadius;
              const startY = (sourceBubble?.y || 0) + Math.sin(angle) * startRadius;
              firefly.isReleased = true;
              firefly.containedInBubbleId = null;
              firefly.placedTriangleId = null;
              firefly.triangleVertexIndex = -1;
              firefly.attachedToTail = false;
              firefly.attachedOrder = -1;
              firefly.x = startX;
              firefly.y = startY;
              firefly.destinyX = startX + Math.cos(angle) * (160 + Math.random() * 120);
              firefly.destinyY = startY + Math.sin(angle) * (120 + Math.random() * 140);
              firefly.vx = Math.cos(angle) * (0.8 + Math.random() * 0.9);
              firefly.vy = Math.sin(angle) * (0.5 + Math.random() * 0.8);
              firefly.linkedCooldownUntil = now + 1200;
              firefly.nextDestinyAt = now + 1400 + Math.random() * 1200;
              return true;
          }

          function releaseInitialFirefliesFromBubble(sourceBubble, now) {
              if (hasReleasedInitialFireflies) return;
              hasReleasedInitialFireflies = true;
              fireflyReleaseSequenceActive = true;
              nextFireflyReleaseAt = now + FIREFLY_RELEASE_INTERVAL_MS;
              const releasedNow = releaseSingleFireflyFromBubble(sourceBubble, now);
              if (releasedNow) {
                  const remaining = ARENA_FIREFLIES.filter((firefly) => !firefly.isReleased).length;
                  setArenaTriangleStatus(`Une nouvelle luciole émerge. Stock restant : ${remaining}.`);
              }
          }

          async function triggerFireflyVocalPlayback(firefly) {
              if (!firefly) return 0;
              if (!firefly.bucketTrack && !sooncutBucketVocals.length) {
                  await fetchSooncutVocalsFromBucket();
              }
              if (!firefly.bucketTrack && sooncutBucketVocals.length) {
                  firefly.bucketTrack = pickRandomSooncutTrack();
              }
              if (firefly.bucketTrack) {
                  const playedDuration = await playSooncutBucketTrack(firefly.bucketTrack);
                  if (playedDuration > 0) return playedDuration;
              }
              triggerArenaSample(firefly.sampleId);
              return 1200;
          }

          function getAttachedFirefliesSorted() {
              return ARENA_FIREFLIES
                  .filter((firefly) => firefly.attachedToTail)
                  .sort((a, b) => a.attachedOrder - b.attachedOrder);
          }

          function buildTailFilamentPath(attachedCount, tail, backX, backY) {
              const extension = FIREFLY_PLUME_LENGTH;
              const segmentCount = 30;
              const points = [];
              for (let i = 0; i <= segmentCount; i++) {
                  const t = i / segmentCount;
                  const trailIndex = Math.max(0, ship.trail.length - 1 - Math.floor(2 + t * 20));
                  const trailRef = ship.trail[trailIndex] || tail;
                  const straightX = tail.x + backX * extension * t;
                  const straightY = tail.y + backY * extension * t;
                  const followWake = Math.pow(t, 0.68);
                  points.push({
                      x: straightX * (1 - followWake) + trailRef.x * followWake,
                      y: straightY * (1 - followWake) + trailRef.y * followWake
                  });
              }
              return points;
          }

          function getPlumePointAt(path, normalizedT) {
              if (!path?.length) return null;
              const t = Math.max(0, Math.min(1, normalizedT));
              const idx = t * (path.length - 1);
              const low = Math.floor(idx);
              const high = Math.min(path.length - 1, low + 1);
              const ratio = idx - low;
              return {
                  x: path[low].x * (1 - ratio) + path[high].x * ratio,
                  y: path[low].y * (1 - ratio) + path[high].y * ratio
              };
          }

          function getHaloTriangleVertices() {
              const radius = 48;
              const spin = performance.now() * 0.0012;
              return [0, 1, 2].map((idx) => {
                  const angle = ship.angle - Math.PI / 2 + spin + (idx / 3) * Math.PI * 2;
                  return {
                      x: ship.x + Math.cos(angle) * radius,
                      y: ship.y + Math.sin(angle) * radius
                  };
              });
          }

          function placeAttachedFirefliesAsTriangle(now) {
              const attached = getAttachedFirefliesSorted();
              if (attached.length < 3) return false;
              const trio = attached.slice(0, 3);
              const triangleId = `placed-triangle-${Math.round(now)}`;
              const triangle = { id: triangleId, x: ship.x, y: ship.y, radius: 46, fireflyIds: trio.map((f) => f.id) };
              PLACED_FIREFLY_TRIANGLES.push(triangle);
              trio.forEach((firefly, idx) => {
                  firefly.attachedToTail = false;
                  firefly.attachedOrder = -1;
                  firefly.playbackEndsAt = 0;
                  firefly.containedInBubbleId = null;
                  firefly.placedTriangleId = triangleId;
                  firefly.triangleVertexIndex = idx;
                  firefly.linkedCooldownUntil = now + 700;
                  firefly.vx = 0;
                  firefly.vy = 0;
              });
              normalizeAttachedOrders();
              setArenaTriangleStatus('Triangle posé : les 3 lucioles forment un réseau lumineux.');
              return true;
          }

          function getStoredBubbleFireflies(bubble) {
              if (!bubble) return [];
              if (!Array.isArray(bubble.storedFireflyIds)) bubble.storedFireflyIds = [];
              return bubble.storedFireflyIds
                  .map((id) => ARENA_FIREFLIES.find((firefly) => firefly.id === id))
                  .filter(Boolean);
          }

          function normalizeAttachedOrders() {
              getAttachedFirefliesSorted().forEach((firefly, idx) => {
                  firefly.attachedOrder = idx;
              });
          }

          function attachSingleFireflyToTail(firefly, now) {
              if (!firefly || firefly.attachedToTail) return;
              const attached = getAttachedFirefliesSorted();
              if (attached.length >= FIREFLY_TAIL_MAX_ATTACHED) return;
              firefly.attachedToTail = true;
              firefly.attachedOrder = attached.length;
              firefly.attachedAt = now;
              firefly.linkedCooldownUntil = now + 900;
              firefly.vx *= 0.25;
              firefly.vy *= 0.25;
              normalizeAttachedOrders();
              setArenaTriangleStatus(`Luciole accrochée à la queue (${attached.length + 1}/3).`);
              void triggerAttachedFireflyPlayback(firefly, now);
          }

          function depositAttachedFireflyIntoBubble(bubble, now) {
              const attached = getAttachedFirefliesSorted();
              if (attached.length < 3) return false;
              const trio = attached.slice(0, 3);
              if (!Array.isArray(bubble.storedFireflyIds)) bubble.storedFireflyIds = [];
              bubble.storedFireflyIds = [];
              trio.forEach((firefly, idx) => {
                  firefly.attachedToTail = false;
                  firefly.attachedOrder = -1;
                  firefly.playbackEndsAt = 0;
                  firefly.containedInBubbleId = bubble.id;
                  firefly.triangleVertexIndex = idx;
                  firefly.linkedCooldownUntil = now + 600;
                  firefly.vx = 0;
                  firefly.vy = 0;
                  firefly.x = bubble.x;
                  firefly.y = bubble.y;
                  bubble.storedFireflyIds.push(firefly.id);
              });
              bubble.wasShipInsideFireflyTriangle = false;
              bubble.trianglePlaybackLockUntil = 0;
              bubble.isTrianglePlaybackActive = false;
              normalizeAttachedOrders();
              setArenaTriangleStatus(`Triangle de 3 lucioles formé dans ${bubble.label || 'la bulle sonore'}. Traverse le triangle avec le poisson pour lire les audios.`);
              return true;
          }

          function maybePlayBubbleStoredVocal(bubble) {
              const stored = getStoredBubbleFireflies(bubble);
              if (stored.length < 3) return;
              const now = performance.now();
              if (bubble.trianglePlaybackLockUntil && now < bubble.trianglePlaybackLockUntil) return;
              if (bubble.isTrianglePlaybackActive) return;
              bubble.isTrianglePlaybackActive = true;
              bubble.trianglePlaybackLockUntil = now + 60000;
              const trio = stored.slice(0, 3);
              setArenaTriangleStatus(`Triangle touché : lecture séquentielle des 3 vocaux dans ${bubble.label || 'la bulle sonore'}.`);
              (async () => {
                  try {
                      for (let i = 0; i < trio.length; i++) {
                          await triggerFireflyVocalPlayback(trio[i]);
                          if (i < trio.length - 1) await delay(1000);
                      }
                  } finally {
                      bubble.isTrianglePlaybackActive = false;
                  }
              })();
          }

          function updateArenaFireflies() {
              if (!ARENA_FIREFLIES.length) return;
              const now = performance.now();
              const timeSeconds = now * 0.001;
              const tail = getShipTailPosition();
              const shipSpeed = Math.hypot(ship.vx, ship.vy);
              const invShipSpeed = 1 / Math.max(0.0001, shipSpeed);
              const backX = shipSpeed > 0.03 ? -ship.vx * invShipSpeed : Math.sin(ship.angle);
              const backY = shipSpeed > 0.03 ? -ship.vy * invShipSpeed : -Math.cos(ship.angle);

              if (fireflyReleaseSequenceActive && now >= nextFireflyReleaseAt) {
                  const spawnAngle = Math.random() * Math.PI * 2;
                  const spawnRadius = 180 + Math.random() * (ARENA_RADIUS * 0.55);
                  const pseudoBubble = {
                      x: Math.cos(spawnAngle) * spawnRadius,
                      y: Math.sin(spawnAngle) * spawnRadius,
                      r: 64
                  };
                  const released = releaseSingleFireflyFromBubble(pseudoBubble, now);
                  if (released) {
                      const remaining = ARENA_FIREFLIES.filter((firefly) => !firefly.isReleased).length;
                      setArenaTriangleStatus(`Une nouvelle luciole apparaît dans le courant. Stock restant : ${remaining}.`);
                      nextFireflyReleaseAt = now + FIREFLY_RELEASE_INTERVAL_MS;
                  } else {
                      fireflyReleaseSequenceActive = false;
                  }
              }

              ARENA_FIREFLIES.forEach((firefly, idx) => {
                  if (!firefly.isReleased) return;
                  const pulse = (Math.sin(timeSeconds * firefly.pulseFreq * 2 * Math.PI + firefly.pulsePhase) + 1) * 0.5;
                  firefly.glow = firefly.attachedToTail ? (0.48 + pulse * 0.52) : (0.34 + pulse * 0.66);
                  if (firefly.containedInBubbleId) {
                      const hostBubble = BUBBLES.find((bubble) => bubble.id === firefly.containedInBubbleId);
                      if (hostBubble) {
                          const vertices = getBubbleTriangleVertices(hostBubble);
                          const vertex = vertices[firefly.triangleVertexIndex] || { x: hostBubble.x, y: hostBubble.y };
                          firefly.x = vertex.x;
                          firefly.y = vertex.y;
                      }
                      firefly.vx = 0;
                      firefly.vy = 0;
                      return;
                  }
                  if (firefly.placedTriangleId) {
                      const placedTriangle = PLACED_FIREFLY_TRIANGLES.find((triangle) => triangle.id === firefly.placedTriangleId);
                      if (placedTriangle) {
                          const angle = -Math.PI / 2 + (firefly.triangleVertexIndex / 3) * Math.PI * 2;
                          firefly.x = placedTriangle.x + Math.cos(angle) * placedTriangle.radius;
                          firefly.y = placedTriangle.y + Math.sin(angle) * placedTriangle.radius;
                      }
                      firefly.vx = 0;
                      firefly.vy = 0;
                      return;
                  }
                  if (firefly.attachedToTail) {
                      const attached = getAttachedFirefliesSorted();
                      const filament = buildTailFilamentPath(attached.length, tail, backX, backY);
                      const spacingTargets = [0.38, 0.58, 0.78];
                      const targetPos = getPlumePointAt(filament, spacingTargets[Math.max(0, Math.min(2, firefly.attachedOrder))] ?? 0.72) || tail;
                      const targetX = targetPos.x;
                      const targetY = targetPos.y;

                      const spring = 0.052;
                      firefly.vx += (targetX - firefly.x) * spring + ship.vx * 0.005;
                      firefly.vy += (targetY - firefly.y) * spring + ship.vy * 0.005;
                      firefly.vx *= 0.9;
                      firefly.vy *= 0.9;
                      firefly.x += firefly.vx;
                      firefly.y += firefly.vy;
                      return;
                  }
                  firefly.driftPhase += firefly.driftSpeed * 10.2;
                  if (now >= firefly.nextBubbleSwitchAt) {
                      firefly.bubbleOrbitIndex = Math.floor(Math.random() * Math.max(1, BUBBLES.length || 1));
                      firefly.nextBubbleSwitchAt = now + 5400 + Math.random() * 4200;
                  }
                  const anchorBubble = BUBBLES.length ? BUBBLES[firefly.bubbleOrbitIndex % BUBBLES.length] : null;
                  const anchorX = anchorBubble ? anchorBubble.x : firefly.baseX;
                  const anchorY = anchorBubble ? anchorBubble.y : firefly.baseY;
                  if (now >= firefly.nextDestinyAt) {
                      const orbitAngle = firefly.driftPhase + idx * 0.37;
                      const radius = firefly.driftRadius * (0.75 + Math.sin(timeSeconds * 0.22 + idx) * 0.15);
                      firefly.destinyX = anchorX + Math.cos(orbitAngle) * radius;
                      firefly.destinyY = anchorY + Math.sin(orbitAngle * 0.7) * radius;
                      firefly.nextDestinyAt = now + 3200 + Math.random() * 3800;
                  }

                  const microCurrentX = Math.sin(timeSeconds * (0.28 + idx * 0.004) + firefly.pulsePhase) * 0.009;
                  const microCurrentY = Math.cos(timeSeconds * (0.24 + idx * 0.005) + firefly.pulsePhase * 1.3) * 0.009;
                  firefly.vx += (firefly.destinyX - firefly.x) * 0.00036 + microCurrentX;
                  firefly.vy += (firefly.destinyY - firefly.y) * 0.00036 + microCurrentY;
                  firefly.vx *= 0.9935;
                  firefly.vy *= 0.9935;
                  const driftSpeed = Math.hypot(firefly.vx, firefly.vy);
                  if (driftSpeed > 0.22) {
                      const limiter = 0.22 / driftSpeed;
                      firefly.vx *= limiter;
                      firefly.vy *= limiter;
                  }
                  firefly.x += firefly.vx;
                  firefly.y += firefly.vy;
              });

              const attachCandidate = ARENA_FIREFLIES.find((firefly) => {
                  if (!firefly.isReleased) return false;
                  if (firefly.attachedToTail) return false;
                  if (firefly.containedInBubbleId) return false;
                  if (firefly.placedTriangleId) return false;
                  if (now < firefly.linkedCooldownUntil) return false;
                  if (isFireflyVocalPlaying || now < fireflyVocalGateUntil) return false;
                  return Math.hypot(firefly.x - tail.x, firefly.y - tail.y) <= FIREFLY_TAIL_ATTACH_RADIUS;
              });
              if (attachCandidate) {
                  const attachedCount = ARENA_FIREFLIES.filter((firefly) => firefly.attachedToTail).length;
                  if (attachedCount >= FIREFLY_TAIL_MAX_ATTACHED) {
                      attachCandidate.linkedCooldownUntil = now + FIREFLY_REPULSE_COOLDOWN_MS;
                  } else {
                      attachSingleFireflyToTail(attachCandidate, now);
                  }
              }

          }

          function onStart(e) {
              if (currentView !== 'experience') return;
              const pos = getMousePos(e);
              mouseWorld = pos;
              ensureAllAudioRunning();
              const now = performance.now();
              const attachedNow = getAttachedFirefliesSorted();

              if (attachedNow.length >= 3) {
                  const haloVertices = getHaloTriangleVertices();
                  if (pointInsideTriangle(pos, haloVertices) || isPointTouchingTriangleElement(pos, haloVertices, 16)) {
                      placeAttachedFirefliesAsTriangle(now);
                      isTethered = false;
                      return;
                  }
              }

              // Props panel open → canvas touch = drag selected bubble
              if (selectedBubble) {
                  isDraggingBubble = true;
                  isTethered = false;
                  return;
              }

              if (isInteractionPaused) return;

              // Detect double tap on a placed bubble
              for (const b of BUBBLES) {
                  if (Math.hypot(pos.x - b.x, pos.y - b.y) <= b.r + 12) {
                      const isDoubleTap = now - lastBubbleTapTime < 380 && lastBubbleTapTarget === b;
                      lastBubbleTapTime = now;
                      lastBubbleTapTarget = b;
                      if (isDoubleTap) { openBubblePropsPanel(b); return; }
                      return; // single tap on bubble: absorb, no tether
                  }
              }

              // Fish double tap → open creation panel
              const fishTapDistance = Math.hypot(pos.x - ship.x, pos.y - ship.y);
              const now2 = now;
              if (fishTapDistance < 28) {
                  const isDoubleTap = now2 - lastFishTap.time < 330 && Math.hypot(pos.x - lastFishTap.x, pos.y - lastFishTap.y) < 40;
                  lastFishTap = { time: now2, x: pos.x, y: pos.y };
                  if (isDoubleTap) { openBubblePanel(); return; }
              }
              isTethered = true;
          }
          function onMove(e) {
              if (currentView !== 'experience') return;
              const pos = getMousePos(e);
              mouseWorld = pos;
              if (isDraggingBubble && selectedBubble) {
                  selectedBubble.x = pos.x;
                  selectedBubble.y = pos.y;
              }
          }
          function onEnd() { isTethered = false; isDraggingBubble = false; }

          window.addEventListener('mousedown', onStart);
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onEnd);

          window.addEventListener('touchstart', (e) => {
              if (isInteractiveTarget(e.target)) return;
              e.preventDefault();
              onStart(e);
          }, { passive: false });
          window.addEventListener('touchmove', (e) => {
              if (currentView !== 'experience') return;
              if (isInteractiveTarget(e.target)) return;
              e.preventDefault();
              onMove(e);
          }, { passive: false });
          window.addEventListener('touchend', onEnd);

          cancelBtn.addEventListener('click', closeBubblePanel);
          dropBtn.addEventListener('click', () => {
              const sample = SAMPLE_LIBRARY.find(s => s.id === selectedSampleId);
              if (!sample) return;
              const bubble = buildSoundBubble(sample, bubbleLayer.value);
              BUBBLES.push(bubble);
              closeBubblePanel();
          });

          function openBubblePanel() {
              isInteractionPaused = true;
              isTethered = false;
              ship.vx = 0;
              ship.vy = 0;
              bubblePanel.classList.remove('hidden');
              ui.textContent = 'Collection ouverte • Choisissez sample + profondeur';
              helperTips.textContent = 'Astuce : sélectionne un sample + une position, puis clique sur « Ajouter à la collection ».';
          }

          function closeBubblePanel() {
              bubblePanel.classList.add('hidden');
              isInteractionPaused = false;
              ui.textContent = '';
              rotateHelperTip();
          }

          function ensureAudioContext() {
              if (audioCtx) return audioCtx;
              const AudioContextClass = window.AudioContext || window.webkitAudioContext;
              if (!AudioContextClass) return null;
              audioCtx = new AudioContextClass();
              masterGainNode = audioCtx.createGain();
              masterGainNode.gain.value = 1;
              masterGainNode.connect(audioCtx.destination);
              return audioCtx;
          }


          function formatRecordingTime(msElapsed) {
              const clamped = Math.min(RECORDER_MAX_MILLIS, Math.max(0, msElapsed));
              const totalSeconds = Math.floor(clamped / 1000);
              const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
              const seconds = (totalSeconds % 60).toString().padStart(2, '0');
              return `${minutes}:${seconds}`;
          }

          function buildBalladeFilename(ext) {
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              const hours = String(now.getHours()).padStart(2, '0');
              const mins = String(now.getMinutes()).padStart(2, '0');
              const secs = String(now.getSeconds()).padStart(2, '0');
              return `soon-ballade-${year}${month}${day}-${hours}${mins}${secs}.${ext}`;
          }

          function detectRecorderFormat() {
              const defaultFormat = { mimeType: '', ext: 'webm', fallbackNotice: 'Format conteneur par défaut du navigateur.' };
              if (typeof window.MediaRecorder === 'undefined') return null;
              const supportsMime = typeof MediaRecorder.isTypeSupported === 'function'
                  ? (mime) => MediaRecorder.isTypeSupported(mime)
                  : () => true;

              const formats = [
                  { mimeType: 'audio/mpeg', ext: 'mp3', fallbackNotice: '' },
                  { mimeType: 'audio/mp3', ext: 'mp3', fallbackNotice: '' },
                  { mimeType: 'audio/webm;codecs=opus', ext: 'webm', fallbackNotice: 'MP3 indisponible sur ce navigateur : export en WebM/Opus.' },
                  { mimeType: 'audio/ogg;codecs=opus', ext: 'ogg', fallbackNotice: 'MP3 indisponible sur ce navigateur : export en OGG/Opus.' },
                  { mimeType: 'audio/wav', ext: 'wav', fallbackNotice: 'MP3 indisponible sur ce navigateur : export en WAV.' },
              ];

              for (const format of formats) {
                  if (supportsMime(format.mimeType)) return format;
              }
              return defaultFormat;
          }

          function updateEchoRecorderUi() {
              if (!echoRecorderPanel || !echoRecordToggleBtn || !echoRecordStatus || !echoRecordTimer) return;
              echoRecordToggleBtn.classList.toggle('recording', recordingState === 'recording');
              echoRecordToggleBtn.classList.toggle('finalizing', recordingState === 'finalizing');
              echoRecordToggleBtn.disabled = recordingState === 'finalizing' || recordingState === 'unsupported';
              echoRecordToggleBtn.textContent = recordingState === 'recording' ? 'STOP' : 'REC';

              if (recordingState === 'idle') {
                  echoRecordStatus.textContent = 'Prêt';
              } else if (recordingState === 'recording') {
                  const formatLabel = recordingFileExt.toUpperCase();
                  echoRecordStatus.textContent = `Enregistrement… (${formatLabel})`;
              } else if (recordingState === 'finalizing') {
                  echoRecordStatus.textContent = 'Finalisation…';
              } else if (recordingState === 'ready') {
                  const fallbackMsg = recordingFallbackNotice ? ` ${recordingFallbackNotice}` : '';
                  echoRecordStatus.textContent = `Prêt à télécharger (${recordingFileExt.toUpperCase()}).${fallbackMsg}`;
              } else if (recordingState === 'unsupported') {
                  echoRecordStatus.textContent = 'Enregistrement indisponible sur ce navigateur.';
              }
          }

          function clearRecordingTimers() {
              if (recordingTimerInterval) {
                  clearInterval(recordingTimerInterval);
                  recordingTimerInterval = null;
              }
              if (recordingAutoStopTimeout) {
                  clearTimeout(recordingAutoStopTimeout);
                  recordingAutoStopTimeout = null;
              }
          }

          function refreshRecordingTimer() {
              if (!echoRecordTimer) return;
              const elapsed = recordingState === 'recording' ? (Date.now() - recordingStartedAt) : 0;
              echoRecordTimer.textContent = `${formatRecordingTime(elapsed)} / 03:00`;
          }

          function setRecordingDownload(blob) {
              if (!echoRecordDownloadLink) return;
              if (recordingDownloadUrl) {
                  URL.revokeObjectURL(recordingDownloadUrl);
                  recordingDownloadUrl = null;
              }
              if (!blob) {
                  echoRecordDownloadLink.hidden = true;
                  echoRecordDownloadLink.removeAttribute('href');
                  return;
              }
              recordingDownloadUrl = URL.createObjectURL(blob);
              echoRecordDownloadLink.href = recordingDownloadUrl;
              echoRecordDownloadLink.download = buildBalladeFilename(recordingFileExt);
              echoRecordDownloadLink.hidden = false;
          }

          function ensureRecordingDestination(context) {
              if (!context || !masterGainNode) return null;
              if (recordingMediaDest) return recordingMediaDest;
              recordingMediaDest = context.createMediaStreamDestination();
              masterGainNode.connect(recordingMediaDest);
              return recordingMediaDest;
          }

          function stopEchoRecording(triggeredByAutoStop) {
              if (recordingState !== 'recording' || !recordingMediaRecorder) return;
              clearRecordingTimers();
              recordingState = 'finalizing';
              if (echoRecordTimer && triggeredByAutoStop) {
                  echoRecordTimer.textContent = '03:00 / 03:00';
              }
              updateEchoRecorderUi();
              try {
                  recordingMediaRecorder.stop();
              } catch (_) {
                  recordingState = 'idle';
                  updateEchoRecorderUi();
              }
          }

          function startEchoRecording() {
              if (recordingState === 'recording' || recordingState === 'finalizing') return;
              const context = ensureAudioContext();
              ensureAllAudioRunning();
              if (!context || !masterGainNode || typeof window.MediaRecorder === 'undefined') {
                  recordingState = 'unsupported';
                  updateEchoRecorderUi();
                  return;
              }

              const mediaDest = ensureRecordingDestination(context);
              if (!mediaDest || !mediaDest.stream) {
                  recordingState = 'unsupported';
                  updateEchoRecorderUi();
                  return;
              }

              const format = detectRecorderFormat();
              if (!format) {
                  recordingState = 'unsupported';
                  updateEchoRecorderUi();
                  return;
              }

              recordingMimeType = format.mimeType || '';
              recordingFileExt = format.ext;
              recordingFallbackNotice = format.fallbackNotice;
              recordingChunks = [];
              setRecordingDownload(null);

              try {
                  recordingMediaRecorder = recordingMimeType
                      ? new MediaRecorder(mediaDest.stream, { mimeType: recordingMimeType })
                      : new MediaRecorder(mediaDest.stream);
              } catch (_) {
                  recordingState = 'unsupported';
                  updateEchoRecorderUi();
                  return;
              }

              recordingMediaRecorder.ondataavailable = (event) => {
                  if (event.data && event.data.size > 0) {
                      recordingChunks.push(event.data);
                  }
              };

              recordingMediaRecorder.onerror = () => {
                  clearRecordingTimers();
                  recordingState = 'unsupported';
                  updateEchoRecorderUi();
              };

              recordingMediaRecorder.onstop = () => {
                  const finalType = recordingMediaRecorder?.mimeType || recordingMimeType || undefined;
                  const blob = recordingChunks.length ? new Blob(recordingChunks, finalType ? { type: finalType } : undefined) : null;
                  recordingMediaRecorder = null;
                  recordingChunks = [];
                  if (!blob || blob.size === 0) {
                      recordingState = 'idle';
                      updateEchoRecorderUi();
                      return;
                  }
                  setRecordingDownload(blob);
                  recordingState = 'ready';
                  updateEchoRecorderUi();
              };

              recordingStartedAt = Date.now();
              recordingState = 'recording';
              refreshRecordingTimer();
              updateEchoRecorderUi();
              recordingMediaRecorder.start(250);

              recordingTimerInterval = setInterval(() => {
                  const elapsed = Date.now() - recordingStartedAt;
                  if (elapsed >= RECORDER_MAX_MILLIS) {
                      echoRecordTimer.textContent = '03:00 / 03:00';
                      stopEchoRecording(true);
                      return;
                  }
                  refreshRecordingTimer();
              }, 200);

              recordingAutoStopTimeout = setTimeout(() => {
                  stopEchoRecording(true);
              }, RECORDER_MAX_MILLIS);
          }

          updateEchoRecorderUi();
          refreshRecordingTimer();

          window.addEventListener('beforeunload', () => {
              if (recordingDownloadUrl) {
                  URL.revokeObjectURL(recordingDownloadUrl);
              }
          });

          function buildSyntheticBuffer(ctx, seconds = 3.4) {
              const sampleRate = ctx.sampleRate;
              const frameCount = Math.floor(sampleRate * seconds);
              const buffer = ctx.createBuffer(1, frameCount, sampleRate);
              const data = buffer.getChannelData(0);
              let smooth = 0;
              for (let i = 0; i < frameCount; i++) {
                  const t = i / sampleRate;
                  const env = 0.54 + Math.sin(t * Math.PI * 2 * 0.09) * 0.16;
                  smooth = smooth * 0.96 + (Math.random() * 2 - 1) * 0.04;
                  data[i] = smooth * env * 0.38;
              }
              return buffer;
          }

          function layerToSpatial(layer) {
              if (layer === 'above') return { offsetY: -95, depthOffset: DEPTH_Z };
              if (layer === 'below') return { offsetY: 95, depthOffset: -DEPTH_Z };
              return { offsetY: 0, depthOffset: 0 };
          }

          function createResotagList(sample) {
              return [];
          }

          function unlinkResotag(tagId) {
              return;
          }

          function releaseResotagFromBubble(bubble) {
              return;
          }

          function buildSoundBubble(sample, layer = 'front') {
              const mouthDistance = 20;
              const dirX = Math.cos(ship.angle - Math.PI / 2);
              const dirY = Math.sin(ship.angle - Math.PI / 2);
              const spatial = layerToSpatial(layer);

              let x = ship.x + dirX * mouthDistance;
              let y = ship.y + dirY * mouthDistance + spatial.offsetY;

              const maxRadius = ARENA_RADIUS - 80;
              const distance = Math.hypot(x, y);
              if (distance > maxRadius) {
                  x = (x / distance) * maxRadius;
                  y = (y / distance) * maxRadius;
              }

              const sound = createBinauralSound(sample);
              return {
                  id: `bubble-${bubbleIdSeed++}`,
                  x, y, r: 64, layer, depthOffset: spatial.depthOffset, isActive: false,
                  sound, label: sample.name, _sampleId: sample.id,
                  currentVolume: 0, zoneMix: 0, resonance: 0, wasInZone: false, hue: 195,
                  lastImpactAt: 0,
                  fishTouching: false,
                  storedFireflyIds: [],
                  nextStoredFireflyPlaybackIndex: 0,
                  wasShipInsideFireflyTriangle: false,
                  trianglePlaybackLockUntil: 0,
                  isTrianglePlaybackActive: false
              };
          }

          function placeInitialArenaBubbles() {
              if (BUBBLES.length) return;
              STARTING_BUBBLES.forEach((cfg) => {
                  const sample = SAMPLE_LIBRARY.find(s => s.id === cfg.sampleId) || SAMPLE_LIBRARY[0];
                  const bubble = buildSoundBubble(sample, cfg.layer);
                  bubble.x = cfg.x;
                  bubble.y = cfg.y;
                  bubble.r = cfg.r;
                  bubble.hue = cfg.hue;
                  BUBBLES.push(bubble);
              });
          }

          function createBinauralSound(sample) {
              const ctx = ensureAudioContext();
              if (!ctx) return null;

              const distanceGain = ctx.createGain();
              distanceGain.gain.value = 0;

              const toneFilter = ctx.createBiquadFilter();
              toneFilter.type = 'lowpass';
              toneFilter.frequency.value = sample.baseCutoff ?? 4200;
              toneFilter.Q.value = 0.6;

              const analyser = ctx.createAnalyser();
              analyser.fftSize = 256;
              analyser.smoothingTimeConstant = 0.86;
              const analyserData = new Uint8Array(analyser.frequencyBinCount);

              const resonantFilter = ctx.createBiquadFilter();
              resonantFilter.type = 'bandpass';
              resonantFilter.frequency.value = sample.resonanceFreq ?? 520;
              resonantFilter.Q.value = sample.resonanceQ ?? 1.2;

              const resonantGain = ctx.createGain();
              resonantGain.gain.value = 0;

              const panner = new PannerNode(ctx, {
                  panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 90,
                  maxDistance: SOUND_HEAR_RADIUS * 2.2, rolloffFactor: 1.2, coneInnerAngle: 360,
                  coneOuterAngle: 0, coneOuterGain: 1
              });

              const textureGain = ctx.createGain();
              textureGain.gain.value = sample.gain ?? 0.24;

              let source;
              if (sample.type === 'noise') {
                  source = ctx.createBufferSource();
                  source.buffer = buildSyntheticBuffer(ctx);
                  source.loop = true;
              } else {
                  source = ctx.createOscillator();
                  source.type = sample.type;
                  source.frequency.value = sample.freq;
                  const lfo = ctx.createOscillator();
                  const lfoGain = ctx.createGain();
                  lfo.frequency.value = Math.max(0.05, sample.lfo);
                  lfoGain.gain.value = sample.freq * (sample.lfoDepth ?? 0.02);
                  lfo.connect(lfoGain);
                  lfoGain.connect(source.frequency);
                  lfo.start();
              }

              source.connect(textureGain);
              textureGain.connect(distanceGain);
              textureGain.connect(analyser);
              distanceGain.connect(toneFilter);
              toneFilter.connect(panner);
              distanceGain.connect(resonantFilter);
              resonantFilter.connect(resonantGain);
              resonantGain.connect(panner);
              panner.connect(masterGainNode);
              source.start();

              return { source, distanceGain, toneFilter, resonantFilter, resonantGain, panner, analyser, analyserData, isStarted: true };
          }

          function ensureBubbleAudioRunning(bubble) {
              if (!bubble.sound) return;
              if (!bubble.sound.isStarted) return;
          }

          function ensureAllAudioRunning() {
              const ctx = ensureAudioContext();
              if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
              BUBBLES.forEach(ensureBubbleAudioRunning);
          }

          function updateAudioListener() {
              if (!audioCtx) return;
              const listener = audioCtx.listener;
              const forwardX = Math.cos(ship.angle - Math.PI / 2);
              const forwardY = Math.sin(ship.angle - Math.PI / 2);

              if (listener.positionX) {
                  listener.positionX.value = ship.x;
                  listener.positionY.value = ship.y;
                  listener.positionZ.value = 0;
                  listener.forwardX.value = forwardX;
                  listener.forwardY.value = forwardY;
                  listener.forwardZ.value = 0;
                  listener.upX.value = 0;
                  listener.upY.value = 0;
                  listener.upZ.value = 1;
              } else if (listener.setPosition && listener.setOrientation) {
                  listener.setPosition(ship.x, ship.y, 0);
                  listener.setOrientation(forwardX, forwardY, 0, 0, 0, 1);
              }
          }

          function update() {
              if (currentView !== 'experience') return;
              if (isTethered && !isInteractionPaused) {
                  const dx = mouseWorld.x - ship.x;
                  const dy = mouseWorld.y - ship.y;
                  ship.vx += dx * ship.stiffness;
                  ship.vy += dy * ship.stiffness;
              }

              let strongestResonance = 0;
              let resonanceHueMix = 0;
              let resonanceWeight = 0;

              BUBBLES.forEach(b => {
                  const dx = ship.x - b.x;
                  const dy = ship.y - b.y;
                  const dz = (b.depthOffset ?? 0);
                  const dist3d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                  const zoneRadius = SOUND_HEAR_RADIUS * 0.7;
                  const insideZone = dist3d < zoneRadius;

                  if (b.sound) {
                      const normalized = Math.max(0, 1 - (dist3d / SOUND_HEAR_RADIUS));
                      const targetVolume = Math.pow(normalized, 2);
                      b.currentVolume += (targetVolume - b.currentVolume) * 0.1;
                      const clampedVolume = Math.min(1, Math.max(0, b.currentVolume));
                      b.sound.distanceGain.gain.value = clampedVolume;

                      const angleToBubble = Math.atan2(b.y - ship.y, b.x - ship.x);
                      const relativeAngle = angleToBubble - (ship.angle - Math.PI / 2);
                      const front = Math.cos(relativeAngle);
                      const rearFactor = Math.min(1, Math.max(0, (1 - front) * 0.5));
                      const distFactor = Math.min(1, dist3d / SOUND_HEAR_RADIUS);
                      const audioEnergy = sampleBubbleEnergy(b);
                      const cutoff = 12000 - (rearFactor * 7000) - (distFactor * 2600) + audioEnergy * 1100;
                      b.sound.toneFilter.frequency.value = Math.max(1800, cutoff);

                      b.zoneMix += ((insideZone ? 1 : 0) - b.zoneMix) * 0.05;
                      const resonanceTarget = b.zoneMix * (0.45 + audioEnergy * 0.55);
                      b.resonance += (resonanceTarget - b.resonance) * 0.08;

                      if (b.sound.resonantFilter) {
                          b.sound.resonantFilter.frequency.value = 680 + audioEnergy * 650 + b.resonance * 320;
                          b.sound.resonantFilter.Q.value = 1.2 + b.resonance * 2.8;
                      }
                      if (b.sound.resonantGain) {
                          const resonantVolume = b.currentVolume * (0.12 + b.resonance * 0.25);
                          b.sound.resonantGain.gain.value = resonantVolume;
                      }

                      if (b.sound.panner.positionX) {
                          b.sound.panner.positionX.value = b.x;
                          b.sound.panner.positionY.value = b.y;
                          b.sound.panner.positionZ.value = b.depthOffset ?? 0;
                      } else if (b.sound.panner.setPosition) {
                          b.sound.panner.setPosition(b.x, b.y, b.depthOffset ?? 0);
                      }
                      b.isActive = dist3d < SOUND_HEAR_RADIUS;

                      if (insideZone && !b.wasInZone) {
                          spawnResonanceWave(b);
                          releaseInitialFirefliesFromBubble(b, performance.now());
                      }
                      const stored = getStoredBubbleFireflies(b);
                      if (stored.length >= 3) {
                          const triangleVertices = getBubbleTriangleVertices(b);
                          const shipTouchingTriangle = isPointTouchingTriangleElement({ x: ship.x, y: ship.y }, triangleVertices, 18);
                          if (shipTouchingTriangle && !b.wasShipInsideFireflyTriangle) {
                              maybePlayBubbleStoredVocal(b);
                          }
                          b.wasShipInsideFireflyTriangle = shipTouchingTriangle;
                      } else {
                          b.wasShipInsideFireflyTriangle = false;
                      }
                      if (b.resonance > strongestResonance) strongestResonance = b.resonance;
                      resonanceHueMix += b.resonance * (b.layer === 'below' ? 228 : 192);
                      resonanceWeight += b.resonance;
                      b.wasInZone = insideZone;
                  } else {
                      b.isActive = false;
                  }
              });

              arenaResonance.level += (strongestResonance - arenaResonance.level) * 0.04;
              const targetHue = resonanceWeight > 0 ? (resonanceHueMix / resonanceWeight) : 198;
              arenaResonance.hue += (targetHue - arenaResonance.hue) * 0.05;

              ship.vx *= ship.damping;
              ship.vy *= ship.damping;
              const speed = Math.hypot(ship.vx, ship.vy);
              if (speed > ship.maxSpeed) {
                  const ratio = ship.maxSpeed / speed;
                  ship.vx *= ratio;
                  ship.vy *= ratio;
              }
              ship.x += ship.vx;
              ship.y += ship.vy;

              ship.trail.push({ x: ship.x, y: ship.y });
              if (ship.trail.length > ship.maxTrail) ship.trail.shift();

              const dCenter = Math.hypot(ship.x, ship.y);
              if (dCenter > ARENA_RADIUS) {
                  const angle = Math.atan2(ship.y, ship.x);
                  ship.x = Math.cos(angle) * ARENA_RADIUS;
                  ship.y = Math.sin(angle) * ARENA_RADIUS;
                  ship.vx *= -0.5;
                  ship.vy *= -0.5;
              }

              if (speed > 0.08) {
                  const angleVitesse = Math.atan2(ship.vy, ship.vx);
                  let diff = angleVitesse - ship.angle;
                  while (diff < -Math.PI) diff += Math.PI * 2;
                  while (diff > Math.PI) diff -= Math.PI * 2;
                  ship.angle += diff * ship.turnEase;
              }

              camera.targetX = ship.x + ship.vx * 10;
              camera.targetY = ship.y + ship.vy * 10;
              camera.x += (camera.targetX - camera.x) * camera.ease;
              camera.y += (camera.targetY - camera.y) * camera.ease;

              updateAudioListener();
              updateWakeParticles(speed);
              updateSurfaceEffects(speed);
              updateResonanceWaves();
              updatePoetryEffects(speed);
              updateArenaFireflies();
          }

          function updateWakeParticles(speed) {
              const now = performance.now();
              const speedNorm = Math.min(1, speed / ship.maxSpeed);
              ship.wakeEmitter += 0.06 + speedNorm * 0.24;

              if (speed > 0.04) {
                  const invSpeed = 1 / Math.max(0.0001, speed);
                  const backX = -ship.vx * invSpeed;
                  const backY = -ship.vy * invSpeed;
                  const tailX = ship.x + backX * 14;
                  const tailY = ship.y + backY * 14;
                  const targetCount = Math.min(MAX_WAKE_PARTICLES, 3 + Math.round(speedNorm * 2));

                  while (WAKE_PARTICLES.length < targetCount) spawnWakeParticle(tailX, tailY, backX, backY, now);
                  while (ship.wakeEmitter >= 1) {
                      ship.wakeEmitter -= 1;
                      if (WAKE_PARTICLES.length >= MAX_WAKE_PARTICLES) break;
                      spawnWakeParticle(tailX, tailY, backX, backY, now);
                  }
              }

              for (let i = WAKE_PARTICLES.length - 1; i >= 0; i--) {
                  const p = WAKE_PARTICLES[i];
                  p.age = now - p.bornAt;
                  const t = p.age / p.life;
                  if (t >= 1) {
                      WAKE_PARTICLES.splice(i, 1);
                      continue;
                  }
                  p.vx *= 0.993;
                  p.vy = p.vy * 0.992 - 0.01;
                  p.x += p.vx;
                  p.y += p.vy;
              }
              if (WAKE_PARTICLES.length > MAX_WAKE_PARTICLES) WAKE_PARTICLES.splice(0, WAKE_PARTICLES.length - MAX_WAKE_PARTICLES);
          }

          function spawnWakeParticle(tailX, tailY, backX, backY, now) {
              const jitter = 3 + Math.random() * 3;
              const tangentX = -backY;
              const tangentY = backX;
              WAKE_PARTICLES.push({
                  x: tailX + tangentX * (Math.random() - 0.5) * jitter + backX * (Math.random() * 4),
                  y: tailY + tangentY * (Math.random() - 0.5) * jitter + backY * (Math.random() * 4),
                  vx: backX * (0.06 + Math.random() * 0.18) + tangentX * (Math.random() - 0.5) * 0.07,
                  vy: backY * (0.06 + Math.random() * 0.18) + tangentY * (Math.random() - 0.5) * 0.07,
                  age: 0, life: 520 + Math.random() * 260, size: 2 + Math.random() * 1.4,
                  alpha: 0.32 + Math.random() * 0.2, bornAt: now
              });
          }

          function updateSurfaceEffects(speed) {
              const now = performance.now();
              const speedNorm = Math.min(1, speed / ship.maxSpeed);
              ship.rippleEmitter += 0.025 + speedNorm * 0.2;

              while (ship.rippleEmitter >= 1) {
                  ship.rippleEmitter -= 1;
                  spawnRipple(ship.x, ship.y, now, speedNorm);
              }

              for (let i = RIPPLE_RINGS.length - 1; i >= 0; i--) {
                  const ripple = RIPPLE_RINGS[i];
                  ripple.age = now - ripple.bornAt;
                  const t = ripple.age / ripple.life;
                  if (t >= 1) {
                      RIPPLE_RINGS.splice(i, 1);
                      continue;
                  }
                  ripple.radius = ripple.baseRadius + ripple.expand * t;
                  ripple.alpha = ripple.baseAlpha * (1 - t);
              }

              while (SURFACE_SPARKLES.length < MAX_SURFACE_SPARKLES) SURFACE_SPARKLES.push(spawnSparkle(now));
              for (let i = SURFACE_SPARKLES.length - 1; i >= 0; i--) {
                  const sparkle = SURFACE_SPARKLES[i];
                  sparkle.age = now - sparkle.bornAt;
                  if (sparkle.age > sparkle.life) SURFACE_SPARKLES[i] = spawnSparkle(now);
              }
          }

          function spawnRipple(x, y, now, speedNorm) {
              if (RIPPLE_RINGS.length >= MAX_RIPPLES) RIPPLE_RINGS.shift();
              RIPPLE_RINGS.push({
                  x: x + (Math.random() - 0.5) * 8,
                  y: y + (Math.random() - 0.5) * 8,
                  baseRadius: 8 + speedNorm * 4 + Math.random() * 2,
                  expand: 32 + speedNorm * 36 + Math.random() * 18,
                  baseAlpha: 0.22 + speedNorm * 0.2,
                  alpha: 0.2,
                  life: 760 + Math.random() * 360,
                  age: 0,
                  bornAt: now
              });
          }

          function spawnSparkle(now) {
              return {
                  x: (Math.random() - 0.5) * ARENA_RADIUS * 1.8,
                  y: (Math.random() - 0.5) * ARENA_RADIUS * 1.8,
                  size: 0.8 + Math.random() * 1.8,
                  life: 900 + Math.random() * 1400,
                  age: 0,
                  bornAt: now,
                  phase: Math.random() * Math.PI * 2,
                  hueShift: 190 + Math.random() * 40
              };
          }

          function sampleBubbleEnergy(bubble) {
              if (!bubble.sound?.analyser || !bubble.sound?.analyserData) return 0;
              bubble.sound.analyser.getByteFrequencyData(bubble.sound.analyserData);
              let sum = 0;
              const binsToSample = 18;
              for (let i = 0; i < binsToSample; i++) sum += bubble.sound.analyserData[i];
              const avg = sum / (binsToSample * 255);
              return Math.min(1, Math.max(0, avg * 1.9));
          }

          function spawnResonanceWave(bubble) {
              if (RESONANCE_WAVES.length >= MAX_RESONANCE_WAVES) RESONANCE_WAVES.shift();
              RESONANCE_WAVES.push({
                  x: bubble.x,
                  y: bubble.y,
                  bornAt: performance.now(),
                  life: 2800 + Math.random() * 1600,
                  radius: bubble.r * 0.9,
                  maxRadius: 520 + Math.random() * 340,
                  alpha: 0.22,
                  hue: bubble.layer === 'below' ? 230 : 192
              });
          }

          function updateResonanceWaves() {
              const now = performance.now();
              for (let i = RESONANCE_WAVES.length - 1; i >= 0; i--) {
                  const wave = RESONANCE_WAVES[i];
                  const t = (now - wave.bornAt) / wave.life;
                  if (t >= 1) {
                      RESONANCE_WAVES.splice(i, 1);
                      continue;
                  }
                  wave.radius = wave.maxRadius * t;
                  wave.alpha = (1 - t) * 0.22;
              }
          }

          function updatePoetryEffects(speed) {
              const now = performance.now();
              const speedNorm = Math.min(1, speed / ship.maxSpeed);

              // --- BREATH WAVES ---
              const breathInterval = 1.6 + (1 - speedNorm) * 1.2;
              shipBreathEmitter += (0.016 + speedNorm * 0.022);
              if (shipBreathEmitter >= breathInterval) {
                  shipBreathEmitter = 0;
                  if (BREATH_WAVES.length < MAX_BREATH_WAVES) {
                      const elongation = 1 + speedNorm * 1.4;
                      BREATH_WAVES.push({
                          x: ship.x, y: ship.y,
                          angle: ship.angle,
                          bornAt: now,
                          life: 3200 + Math.random() * 1400,
                          maxRx: 180 + Math.random() * 120 + speedNorm * 80,
                          maxRy: (180 + Math.random() * 120 + speedNorm * 80) * elongation,
                          hue: 192 + Math.random() * 18,
                          peakAlpha: 0.055 + speedNorm * 0.035,
                      });
                  }
              }
              for (let i = BREATH_WAVES.length - 1; i >= 0; i--) {
                  const bw = BREATH_WAVES[i];
                  const t = (now - bw.bornAt) / bw.life;
                  if (t >= 1) { BREATH_WAVES.splice(i, 1); continue; }
                  bw.t = t;
                  bw.alpha = bw.peakAlpha * Math.sin(t * Math.PI);
              }

              // --- DRIFT MOTES ---
              while (DRIFT_MOTES.length < MAX_DRIFT_MOTES) {
                  const angle = Math.random() * Math.PI * 2;
                  const dist = 180 + Math.random() * 520;
                  DRIFT_MOTES.push({
                      x: ship.x + Math.cos(angle) * dist,
                      y: ship.y + Math.sin(angle) * dist,
                      baseAlpha: 0.06 + Math.random() * 0.10,
                      size: 1.2 + Math.random() * 2.2,
                      phase: Math.random() * Math.PI * 2,
                      driftAngle: Math.random() * Math.PI * 2,
                      driftSpeed: 0.06 + Math.random() * 0.10,
                      hue: 188 + Math.random() * 30,
                  });
              }
              DRIFT_MOTES.forEach(m => {
                  const dx = ship.x - m.x;
                  const dy = ship.y - m.y;
                  const dist = Math.hypot(dx, dy);
                  const pull = speedNorm < 0.15
                      ? Math.max(0, 1 - dist / 400) * 0.018
                      : -Math.max(0, 1 - dist / 280) * 0.012;
                  if (dist > 1) {
                      m.x += (dx / dist) * pull;
                      m.y += (dy / dist) * pull;
                  }
                  m.x += Math.cos(m.driftAngle) * m.driftSpeed;
                  m.y += Math.sin(m.driftAngle) * m.driftSpeed;
                  m.driftAngle += (Math.random() - 0.5) * 0.04;
                  if (dist > 700) {
                      const a = Math.atan2(ship.y - m.y, ship.x - m.x);
                      m.x = ship.x + Math.cos(a + Math.PI) * 680;
                      m.y = ship.y + Math.sin(a + Math.PI) * 680;
                  }
              });
          }

          function updateResotags(speed) {
              return;
          }

          function updateHaikuAttachment(speed) {
              return;
          }

          function spawnHaikuTriangle(words) {
              return;
          }

          function composeHaiku(words) {
              return [];
          }

          function wordsToNotes(words) {
              return [];
          }

          function playHaikuMelody(notes) {
              return;
          }

          function updateHaikuTriangles() {
              return;
          }

          function drawHaikuTriangles() {
              return;
          }

          function drawBreathWaves() {
              BREATH_WAVES.forEach(bw => {
                  const rx = bw.maxRx * bw.t;
                  const ry = bw.maxRy * bw.t;
                  ctx.save();
                  ctx.translate(bw.x, bw.y);
                  ctx.rotate(bw.angle + Math.PI / 2);
                  ctx.strokeStyle = `hsla(${bw.hue}, 85%, 78%, ${bw.alpha})`;
                  ctx.lineWidth = 0.8 + (1 - bw.t) * 0.7;
                  ctx.beginPath();
                  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
                  ctx.stroke();
                  if (bw.t < 0.6) {
                      const innerAlpha = bw.alpha * 0.4 * (1 - bw.t / 0.6);
                      ctx.strokeStyle = `hsla(${bw.hue + 8}, 90%, 88%, ${innerAlpha})`;
                      ctx.lineWidth = 0.5;
                      ctx.beginPath();
                      ctx.ellipse(0, 0, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2);
                      ctx.stroke();
                  }
                  ctx.restore();
              });
          }

          function drawDriftMotes() {
              const t = performance.now() * 0.0018;
              DRIFT_MOTES.forEach(m => {
                  const twinkle = (Math.sin(t * 2.2 + m.phase) + 1) * 0.5;
                  const alpha = m.baseAlpha * (0.5 + twinkle * 0.5);
                  ctx.fillStyle = `hsla(${m.hue}, 80%, 80%, ${alpha})`;
                  ctx.beginPath();
                  ctx.arc(m.x, m.y, m.size * (0.8 + twinkle * 0.3), 0, Math.PI * 2);
                  ctx.fill();
              });
          }

          function drawArenaFireflies() {
              if (!ARENA_FIREFLIES.length) return;
              const now = performance.now() * 0.001;

              PLACED_FIREFLY_TRIANGLES.forEach((triangle) => {
                  const stored = triangle.fireflyIds
                      .map((id) => ARENA_FIREFLIES.find((firefly) => firefly.id === id))
                      .filter(Boolean);
                  if (stored.length < 3) return;
                  ctx.strokeStyle = 'rgba(255, 214, 120, 0.5)';
                  ctx.lineWidth = 1.2;
                  ctx.beginPath();
                  ctx.moveTo(stored[0].x, stored[0].y);
                  ctx.lineTo(stored[1].x, stored[1].y);
                  ctx.lineTo(stored[2].x, stored[2].y);
                  ctx.closePath();
                  ctx.stroke();
              });

              ARENA_FIREFLIES.forEach((firefly) => {
                  if (!firefly.isReleased) return;
                  const pulse = (Math.sin(now * firefly.pulseFreq * 2 * Math.PI + firefly.pulsePhase) + 1) * 0.5;
                  const coreRadius = firefly.size * (0.72 + pulse * 0.22);
                  const glowRadius = firefly.size * (2.8 + pulse * 1.8);
                  const coreTint = `rgba(245, 62, 48, ${0.82 + firefly.glow * 0.18})`;
                  const haloCenter = `rgba(255, 220, 122, ${0.24 + firefly.glow * 0.34})`;
                  const haloMid = `rgba(255, 160, 64, ${0.14 + firefly.glow * 0.26})`;

                  const halo = ctx.createRadialGradient(firefly.x, firefly.y, 0, firefly.x, firefly.y, glowRadius);
                  halo.addColorStop(0, haloCenter);
                  halo.addColorStop(0.5, haloMid);
                  halo.addColorStop(1, 'rgba(255, 120, 52, 0)');
                  ctx.fillStyle = halo;
                  ctx.beginPath();
                  ctx.arc(firefly.x, firefly.y, glowRadius, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.fillStyle = coreTint;
                  ctx.beginPath();
                  ctx.arc(firefly.x, firefly.y, coreRadius, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.fillStyle = `rgba(255, 248, 248, ${0.5 + pulse * 0.4})`;
                  ctx.beginPath();
                  ctx.arc(firefly.x - firefly.size * 0.22, firefly.y - firefly.size * 0.28, Math.max(0.7, coreRadius * 0.34), 0, Math.PI * 2);
                  ctx.fill();
              });
          }

          function drawTailFilament() {
              const attached = getAttachedFirefliesSorted();
              const tail = getShipTailPosition();
              const speed = Math.hypot(ship.vx, ship.vy);
              let backX = Math.sin(ship.angle);
              let backY = -Math.cos(ship.angle);
              if (speed > 0.04) {
                  const invSpeed = 1 / Math.max(0.0001, speed);
                  backX = -ship.vx * invSpeed;
                  backY = -ship.vy * invSpeed;
              }
              const now = performance.now() * 0.001;
              const filament = buildTailFilamentPath(Math.max(attached.length, 1), tail, backX, backY);
              const tip = filament[filament.length - 1];

              const leftEdge = [];
              const rightEdge = [];
              for (let i = 0; i < filament.length; i++) {
                  const prev = filament[Math.max(0, i - 1)];
                  const next = filament[Math.min(filament.length - 1, i + 1)];
                  const dirX = next.x - prev.x;
                  const dirY = next.y - prev.y;
                  const dirLen = Math.hypot(dirX, dirY) || 1;
                  const normX = -dirY / dirLen;
                  const normY = dirX / dirLen;
                  const t = i / (filament.length - 1);
                  const width = 10 * (1 - t * 0.88) + Math.sin(now * 2.4 + t * 10.6) * 0.9;
                  leftEdge.push({ x: filament[i].x + normX * width, y: filament[i].y + normY * width });
                  rightEdge.push({ x: filament[i].x - normX * width, y: filament[i].y - normY * width });
              }

              ctx.fillStyle = 'rgba(210, 238, 255, 0.4)';
              ctx.beginPath();
              ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
              for (let i = 1; i < leftEdge.length; i++) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
              for (let i = rightEdge.length - 1; i >= 0; i--) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
              ctx.closePath();
              ctx.fill();

              ctx.strokeStyle = 'rgba(236, 247, 255, 0.3)';
              ctx.lineWidth = 1.1;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.beginPath();
              ctx.moveTo(filament[0].x, filament[0].y);
              for (let i = 1; i < filament.length - 1; i++) {
                  const midX = (filament[i].x + filament[i + 1].x) * 0.5;
                  const midY = (filament[i].y + filament[i + 1].y) * 0.5;
                  ctx.quadraticCurveTo(filament[i].x, filament[i].y, midX, midY);
              }
              ctx.stroke();

              for (let i = 2; i < filament.length - 1; i += 2) {
                  const t = i / (filament.length - 1);
                  const flutter = 0.5 + 0.5 * Math.sin(now * 3.8 + t * 12.4);
                  const radius = 0.3 + t * 1.4 + flutter * 0.45;
                  const alpha = (0.02 + t * 0.09) * (0.75 + flutter * 0.45);
                  ctx.fillStyle = `rgba(230, 247, 255, ${alpha})`;
                  ctx.beginPath();
                  ctx.arc(filament[i].x, filament[i].y, radius, 0, Math.PI * 2);
                  ctx.fill();
              }

              ctx.fillStyle = 'rgba(235, 248, 255, 0.28)';
              ctx.beginPath();
              ctx.arc(tip.x, tip.y, 0.9 + attached.length * 0.12, 0, Math.PI * 2);
              ctx.fill();
          }

          function drawLuminousTrail() {
              const trail = ship.trail;
              if (trail.length < 3) return;
              const len = trail.length;
              for (let i = 1; i < len - 1; i++) {
                  const t = i / len;
                  const width = (1 - t) * 4.5 + 0.4;
                  const alpha = t * t * 0.38;
                  const hue = 192 + Math.sin(t * Math.PI * 3) * 10;
                  ctx.strokeStyle = `hsla(${hue}, 85%, 78%, ${alpha})`;
                  ctx.lineWidth = width;
                  ctx.lineCap = 'round';
                  ctx.beginPath();
                  const mx = (trail[i].x + trail[i + 1].x) / 2;
                  const my = (trail[i].y + trail[i + 1].y) / 2;
                  ctx.moveTo((trail[i - 1].x + trail[i].x) / 2, (trail[i - 1].y + trail[i].y) / 2);
                  ctx.quadraticCurveTo(trail[i].x, trail[i].y, mx, my);
                  ctx.stroke();
              }
              // soft glow core
              const last = trail[len - 1];
              const prev = trail[Math.max(0, len - 6)];
              const glowGrad = ctx.createLinearGradient(prev.x, prev.y, last.x, last.y);
              glowGrad.addColorStop(0, 'rgba(140, 210, 255, 0)');
              glowGrad.addColorStop(1, 'rgba(180, 235, 255, 0.18)');
              ctx.strokeStyle = glowGrad;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(prev.x, prev.y);
              ctx.lineTo(last.x, last.y);
              ctx.stroke();
          }

          function drawFishTriangleHaloButton() {
              const attached = getAttachedFirefliesSorted();
              if (attached.length < 3) return;
              const vertices = getHaloTriangleVertices();
              const pulse = (Math.sin(performance.now() * 0.008) + 1) * 0.5;
              ctx.fillStyle = `rgba(255, 228, 140, ${0.18 + pulse * 0.18})`;
              ctx.strokeStyle = `rgba(255, 240, 180, ${0.55 + pulse * 0.35})`;
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.moveTo(vertices[0].x, vertices[0].y);
              ctx.lineTo(vertices[1].x, vertices[1].y);
              ctx.lineTo(vertices[2].x, vertices[2].y);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
          }

          function draw() {
              ctx.fillStyle = '#030308';
              ctx.fillRect(0, 0, w, h);
              if (currentView !== 'experience') return;

              ctx.save();
              ctx.translate(w / 2 - camera.x, h / 2 - camera.y);

              ctx.beginPath();
              ctx.arc(0, 0, ARENA_RADIUS, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
              ctx.lineWidth = 2;
              ctx.stroke();

              const drawBubble = (b) => {
                  const isSurface = b.layer !== 'below';
                  const opacityBoost = b.isActive ? 1.2 : 1;
                  const bHue = b.hue ?? 195;
                  ctx.save();

                  if (!isSurface) {
                      const grad = ctx.createRadialGradient(b.x, b.y, b.r * 0.05, b.x, b.y, b.r);
                      grad.addColorStop(0, `hsla(${bHue}, 70%, 70%, ${0.02 * opacityBoost})`);
                      grad.addColorStop(0.72, `hsla(${bHue}, 72%, 58%, ${0.11 * opacityBoost})`);
                      grad.addColorStop(1, `hsla(${bHue + 15}, 68%, 40%, ${0.22 * opacityBoost})`);
                      ctx.filter = 'blur(7px)';
                      ctx.fillStyle = grad;
                      ctx.beginPath();
                      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                      ctx.fill();
                      ctx.filter = 'none';
                      ctx.strokeStyle = `hsla(${bHue}, 75%, 72%, ${0.20 * opacityBoost})`;
                      ctx.lineWidth = 1.4;
                  } else {
                      const grad = ctx.createRadialGradient(b.x - b.r * 0.25, b.y - b.r * 0.28, b.r * 0.15, b.x, b.y, b.r);
                      grad.addColorStop(0, `hsla(${bHue}, 80%, 90%, ${0.52 * opacityBoost})`);
                      grad.addColorStop(0.65, `hsla(${bHue}, 78%, 68%, ${0.36 * opacityBoost})`);
                      grad.addColorStop(1, `hsla(${bHue + 15}, 72%, 46%, ${0.60 * opacityBoost})`);
                      ctx.fillStyle = grad;
                      ctx.beginPath();
                      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                      ctx.fill();
                      ctx.strokeStyle = `hsla(${bHue}, 88%, 84%, ${0.66 * opacityBoost})`;
                      ctx.lineWidth = b.isActive ? 2.8 : 2.1;
                  }

                  ctx.beginPath();
                  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                  ctx.stroke();

                  // Selection ring
                  if (b === selectedBubble) {
                      const pulse = (Math.sin(performance.now() * 0.004) + 1) * 0.5;
                      ctx.strokeStyle = `hsla(${bHue}, 90%, 88%, ${0.45 + pulse * 0.35})`;
                      ctx.lineWidth = 1.8;
                      ctx.setLineDash([7, 5]);
                      ctx.lineDashOffset = performance.now() * 0.04;
                      ctx.beginPath();
                      ctx.arc(b.x, b.y, b.r + 10 + pulse * 3, 0, Math.PI * 2);
                      ctx.stroke();
                      ctx.setLineDash([]);
                      ctx.lineDashOffset = 0;
                  }

                  if (b.label) {
                      const maxWidth = b.r * 1.42;
                      const fontSize = Math.max(11, Math.min(15, b.r * 0.25));
                      ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillStyle = isSurface ? 'rgba(235, 248, 255, 0.95)' : 'rgba(220, 237, 255, 0.82)';
                      let text = b.label;
                      while (ctx.measureText(text).width > maxWidth && text.length > 6) text = `${text.slice(0, -2)}…`;
                      ctx.fillText(text, b.x, b.y, maxWidth);
                  }

                  ctx.restore();
              };

              BUBBLES.filter((b) => b.layer === 'below').forEach(drawBubble);
              drawBreathWaves();
              drawDriftMotes();
              drawArenaFireflies();
              drawSurfaceSparkles();
              drawResonanceWaves();
              drawWakeParticles();
              drawRipples();
              drawLuminousTrail();
              drawTailFilament();

              ctx.save();
              ctx.translate(ship.x, ship.y);
              ctx.rotate(ship.angle + Math.PI / 2);
              const swimT = performance.now() * 0.001;
              const glide = Math.hypot(ship.vx, ship.vy) / ship.maxSpeed;
              const wag = Math.sin(swimT * 9.5) * (0.16 + glide * 0.22);
              const finFlap = Math.sin(swimT * 7.2 + 0.5) * (0.14 + glide * 0.10);
              const bodyBreath = Math.sin(swimT * 2.5) * 0.65;
              const shimmerPulse = (Math.sin(swimT * 2.2) + 1) * 0.5;
              const bodyUndulate = Math.sin(swimT * 5.8) * (0.03 + glide * 0.055);
              const bodyHueTop = 186 + Math.sin(swimT * 1.7) * 8;
              const bodyHueMid = 198 + Math.sin(swimT * 1.3 + 1.4) * 12;
              const bodyHueLow = 210 + Math.sin(swimT * 1.9 + 2.1) * 10;

              // --- AURA GLOW ---
              const auraR = 34 + shimmerPulse * 9;
              const auraGrad = ctx.createRadialGradient(0, 2, 0, 0, 2, auraR);
              auraGrad.addColorStop(0, `hsla(${bodyHueMid}, 90%, 82%, ${0.22 + shimmerPulse * 0.14})`);
              auraGrad.addColorStop(0.6, `hsla(${bodyHueLow}, 85%, 75%, ${0.08 + shimmerPulse * 0.06})`);
              auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = auraGrad;
              ctx.beginPath();
              ctx.ellipse(0, 2, auraR, auraR * 1.25, 0, 0, Math.PI * 2);
              ctx.fill();

              // --- TRAILING PLUMES (feather wisps behind tail) ---
              const plumeData = [
                  { ox: -3.5, phase: 0.0, spread: -14, len: 34, hueOff: 0 },
                  { ox: -1.5, phase: 0.9, spread: -7, len: 40, hueOff: 8 },
                  { ox: 0,    phase: 1.7, spread: 0,  len: 44, hueOff: 14 },
                  { ox: 1.5,  phase: 2.5, spread: 7,  len: 40, hueOff: 8 },
                  { ox: 3.5,  phase: 3.3, spread: 14, len: 34, hueOff: 0 },
              ];
              plumeData.forEach((p, i) => {
                  const pw = Math.sin(swimT * 7.5 + p.phase) * (0.18 + glide * 0.14);
                  const alpha = (0.28 + shimmerPulse * 0.18) * (1 - Math.abs(i - 2) * 0.12);
                  const hue = bodyHueLow + p.hueOff;
                  ctx.save();
                  ctx.translate(p.ox, 21);
                  const pGrad = ctx.createLinearGradient(0, 0, p.spread * 0.4, p.len);
                  pGrad.addColorStop(0, `hsla(${hue}, 82%, 78%, ${alpha})`);
                  pGrad.addColorStop(0.5, `hsla(${hue + 6}, 85%, 86%, ${alpha * 0.5})`);
                  pGrad.addColorStop(1, `hsla(${hue + 12}, 90%, 90%, 0)`);
                  ctx.fillStyle = pGrad;
                  ctx.beginPath();
                  ctx.moveTo(0, 0);
                  ctx.bezierCurveTo(
                      p.spread * 0.3 + pw * 12, p.len * 0.28,
                      p.spread * 0.6 + pw * 20, p.len * 0.62,
                      p.spread * 0.35 + pw * 8, p.len
                  );
                  ctx.bezierCurveTo(
                      p.spread * 0.1 + pw * 4, p.len * 0.65,
                      -p.spread * 0.1 + pw * 6, p.len * 0.3,
                      0, 0
                  );
                  ctx.fill();
                  ctx.restore();
              });

              // --- BODY ---
              ctx.shadowBlur = 22;
              ctx.shadowColor = `hsla(${bodyHueMid}, 95%, 85%, 0.58)`;
              const bu = bodyUndulate;
              const bodyGrad = ctx.createLinearGradient(-10, -18, 10, 24);
              bodyGrad.addColorStop(0,    `hsla(${bodyHueTop}, 90%, 95%, ${0.88 + shimmerPulse * 0.12})`);
              bodyGrad.addColorStop(0.38, `hsla(${bodyHueMid}, 85%, 80%, ${0.78 + shimmerPulse * 0.12})`);
              bodyGrad.addColorStop(0.72, `hsla(${bodyHueLow}, 80%, 68%, ${0.76 + shimmerPulse * 0.14})`);
              bodyGrad.addColorStop(1,    `hsla(${bodyHueLow + 14}, 75%, 58%, 0.80)`);
              ctx.fillStyle = bodyGrad;
              ctx.beginPath();
              ctx.moveTo(0, -18);
              ctx.bezierCurveTo(-8.5 + bu * 55, -13, -11 + bu * 36, -3 + bodyBreath, -9 + bu * 18, 8);
              ctx.bezierCurveTo(-7, 15, -3, 20 + bodyBreath, 0, 22);
              ctx.bezierCurveTo(3, 20 + bodyBreath, 7, 15, 9 - bu * 18, 8);
              ctx.bezierCurveTo(11 - bu * 36, -3 + bodyBreath, 8.5 - bu * 55, -13, 0, -18);
              ctx.closePath();
              ctx.fill();

              // --- IRIDESCENT SHEEN ---
              const sheenGrad = ctx.createLinearGradient(-10, -18, 8, 4);
              sheenGrad.addColorStop(0, `rgba(255, 255, 255, ${0.26 + shimmerPulse * 0.22})`);
              sheenGrad.addColorStop(0.45, `rgba(200, 245, 255, ${0.10 + shimmerPulse * 0.10})`);
              sheenGrad.addColorStop(1, 'rgba(180, 220, 255, 0)');
              ctx.fillStyle = sheenGrad;
              ctx.beginPath();
              ctx.moveTo(0, -18);
              ctx.bezierCurveTo(-8.5 + bu * 55, -13, -11 + bu * 36, -3 + bodyBreath, -9 + bu * 18, 8);
              ctx.bezierCurveTo(-7, 15, -3, 20 + bodyBreath, 0, 22);
              ctx.bezierCurveTo(3, 20 + bodyBreath, 7, 15, 9 - bu * 18, 8);
              ctx.bezierCurveTo(11 - bu * 36, -3 + bodyBreath, 8.5 - bu * 55, -13, 0, -18);
              ctx.closePath();
              ctx.fill();

              // --- PECTORAL FINS ---
              ctx.shadowBlur = 6;
              ctx.save();
              ctx.translate(-7, 2);
              ctx.rotate(-0.38 + finFlap);
              const finGradL = ctx.createLinearGradient(0, -1, -12, 14);
              finGradL.addColorStop(0, `hsla(${bodyHueMid}, 80%, 82%, 0.70)`);
              finGradL.addColorStop(1, `hsla(${bodyHueMid + 12}, 78%, 88%, 0)`);
              ctx.fillStyle = finGradL;
              ctx.shadowColor = `hsla(${bodyHueMid}, 80%, 80%, 0.3)`;
              ctx.beginPath();
              ctx.moveTo(0, -1);
              ctx.bezierCurveTo(-10, 0, -14, 7, -8, 15);
              ctx.bezierCurveTo(-4, 10, -1, 4, 0, -1);
              ctx.fill();
              ctx.restore();
              ctx.save();
              ctx.translate(7, 2);
              ctx.rotate(0.38 - finFlap);
              const finGradR = ctx.createLinearGradient(0, -1, 12, 14);
              finGradR.addColorStop(0, `hsla(${bodyHueMid}, 80%, 82%, 0.70)`);
              finGradR.addColorStop(1, `hsla(${bodyHueMid + 12}, 78%, 88%, 0)`);
              ctx.fillStyle = finGradR;
              ctx.shadowColor = `hsla(${bodyHueMid}, 80%, 80%, 0.3)`;
              ctx.beginPath();
              ctx.moveTo(0, -1);
              ctx.bezierCurveTo(10, 0, 14, 7, 8, 15);
              ctx.bezierCurveTo(4, 10, 1, 4, 0, -1);
              ctx.fill();
              ctx.restore();

              // --- TAIL with feathered tips ---
              ctx.save();
              ctx.translate(0, 20);
              ctx.rotate(wag);
              ctx.shadowBlur = 10;
              ctx.shadowColor = `hsla(${bodyHueLow}, 85%, 80%, 0.45)`;
              const tailGrad = ctx.createLinearGradient(0, 0, 0, 26);
              tailGrad.addColorStop(0, `hsla(${bodyHueMid}, 84%, 80%, 0.92)`);
              tailGrad.addColorStop(1, `hsla(${bodyHueLow + 10}, 80%, 74%, 0)`);
              ctx.fillStyle = tailGrad;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.bezierCurveTo(-7, 5, -9, 14, -3.5, 22);
              ctx.quadraticCurveTo(0, 18, 3.5, 22);
              ctx.bezierCurveTo(9, 14, 7, 5, 0, 0);
              ctx.fill();
              // Left feather tip
              const tipGrad = ctx.createLinearGradient(0, 18, -6, 36);
              tipGrad.addColorStop(0, `hsla(${bodyHueTop}, 90%, 90%, 0.65)`);
              tipGrad.addColorStop(1, `hsla(${bodyHueTop + 8}, 88%, 94%, 0)`);
              ctx.fillStyle = tipGrad;
              ctx.beginPath();
              ctx.moveTo(-1.5, 18);
              ctx.bezierCurveTo(-5, 23, -8, 31, -4.5, 36);
              ctx.quadraticCurveTo(-2, 30, -1.5, 18);
              ctx.fill();
              // Right feather tip
              const tipGrad2 = ctx.createLinearGradient(0, 18, 6, 36);
              tipGrad2.addColorStop(0, `hsla(${bodyHueTop}, 90%, 90%, 0.65)`);
              tipGrad2.addColorStop(1, `hsla(${bodyHueTop + 8}, 88%, 94%, 0)`);
              ctx.fillStyle = tipGrad2;
              ctx.beginPath();
              ctx.moveTo(1.5, 18);
              ctx.bezierCurveTo(5, 23, 8, 31, 4.5, 36);
              ctx.quadraticCurveTo(2, 30, 1.5, 18);
              ctx.fill();
              ctx.restore();

              ctx.shadowBlur = 0;

              // --- BIOLUMINESCENT SPOTS ---
              const spotT = swimT * 3.2;
              [
                  { x: -4.5, y: -1, r: 1.1, ph: 0.0 },
                  { x:  4.2, y:  1, r: 0.9, ph: 1.4 },
                  { x: -2.0, y:  7, r: 0.85, ph: 2.6 },
                  { x:  3.0, y: -6, r: 0.75, ph: 3.8 },
                  { x:  0.5, y:  3, r: 0.6,  ph: 0.7 },
              ].forEach((s) => {
                  const sp = (Math.sin(spotT + s.ph) + 1) * 0.5;
                  ctx.fillStyle = `rgba(175, 255, 235, ${0.10 + sp * 0.20})`;
                  ctx.shadowBlur = 7;
                  ctx.shadowColor = 'rgba(160, 255, 230, 0.55)';
                  ctx.beginPath();
                  ctx.arc(s.x, s.y, s.r * (1 + sp * 0.35), 0, Math.PI * 2);
                  ctx.fill();
              });

              // --- EYES ---
              // Eye halo
              ctx.fillStyle = `rgba(160, 232, 255, ${0.30 + shimmerPulse * 0.20})`;
              ctx.beginPath();
              ctx.arc(-6.2, -12, 3.0, 0, Math.PI * 2);
              ctx.arc(6.2, -12, 3.0, 0, Math.PI * 2);
              ctx.fill();
              // Iris
              ctx.fillStyle = '#062436';
              ctx.beginPath();
              ctx.arc(-6.2, -12, 1.45, 0, Math.PI * 2);
              ctx.arc(6.2, -12, 1.45, 0, Math.PI * 2);
              ctx.fill();
              // Specular
              ctx.fillStyle = `rgba(255, 255, 255, ${0.75 + shimmerPulse * 0.25})`;
              ctx.beginPath();
              ctx.arc(-5.6, -12.6, 0.52, 0, Math.PI * 2);
              ctx.arc(6.8, -12.6, 0.52, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();

              drawFishTriangleHaloButton();

              BUBBLES.filter((b) => b.layer !== 'below').forEach(drawBubble);
              ctx.restore();
              drawWaterSurface();
              drawArenaResonanceVeil();
          }

          function drawWakeParticles() {
              WAKE_PARTICLES.forEach((p) => {
                  const t = p.age / p.life;
                  const alpha = Math.max(0, 1 - t) * p.alpha;
                  ctx.fillStyle = `rgba(205, 240, 255, ${alpha})`;
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                  ctx.fill();
              });
          }
          function drawRipples() {
              RIPPLE_RINGS.forEach((ripple) => {
                  const thickness = 1 + (1 - ripple.alpha) * 2.6;
                  const hue = 192 + Math.sin((ripple.age / ripple.life) * Math.PI * 2) * 12;
                  ctx.strokeStyle = `hsla(${hue}, 90%, 72%, ${ripple.alpha})`;
                  ctx.lineWidth = thickness;
                  ctx.beginPath();
                  ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                  ctx.stroke();
              });
          }
          function drawSurfaceSparkles() {
              const t = performance.now() * 0.002;
              SURFACE_SPARKLES.forEach((sparkle) => {
                  const lifeT = sparkle.age / sparkle.life;
                  const twinkle = (Math.sin(t * 6 + sparkle.phase) + 1) * 0.5;
                  const alpha = (0.08 + twinkle * 0.42) * (1 - Math.abs(lifeT - 0.5) * 1.5);
                  if (alpha <= 0) return;

                  const offsetX = Math.sin(t + sparkle.phase) * 5;
                  const offsetY = Math.cos(t * 0.6 + sparkle.phase) * 3;
                  const x = sparkle.x + offsetX;
                  const y = sparkle.y + offsetY;

                  ctx.fillStyle = `hsla(${sparkle.hueShift}, 95%, 82%, ${alpha})`;
                  ctx.beginPath();
                  ctx.arc(x, y, sparkle.size, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.strokeStyle = `hsla(${sparkle.hueShift + 8}, 100%, 88%, ${alpha * 0.7})`;
                  ctx.lineWidth = 0.7;
                  ctx.beginPath();
                  ctx.moveTo(x - sparkle.size * 1.8, y);
                  ctx.lineTo(x + sparkle.size * 1.8, y);
                  ctx.moveTo(x, y - sparkle.size * 1.8);
                  ctx.lineTo(x, y + sparkle.size * 1.8);
                  ctx.stroke();
              });
          }

          function drawResonanceWaves() {
              RESONANCE_WAVES.forEach((wave) => {
                  const width = 1.2 + (1 - wave.alpha) * 2.1;
                  const pulse = 0.5 + Math.sin((performance.now() - wave.bornAt) * 0.003) * 0.5;
                  ctx.strokeStyle = `hsla(${wave.hue}, 88%, 76%, ${wave.alpha * (0.7 + pulse * 0.3)})`;
                  ctx.lineWidth = width;
                  ctx.beginPath();
                  ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
                  ctx.stroke();
              });
          }

          function drawResotagLinks() {
              return;
          }

          function drawResotags() {
              return;
          }

          function drawWaterSurface() {
              const horizonY = Math.max(30, h * 0.17);
              const gradient = ctx.createLinearGradient(0, 0, 0, horizonY + 120);
              gradient.addColorStop(0, 'rgba(32, 100, 155, 0.28)');
              gradient.addColorStop(0.7, 'rgba(20, 70, 130, 0.14)');
              gradient.addColorStop(1, 'rgba(6, 22, 40, 0)');
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, w, horizonY + 120);
          }

          function drawArenaResonanceVeil() {
              if (arenaResonance.level <= 0.01) return;
              const intensity = Math.min(0.22, arenaResonance.level * 0.24);
              const g = ctx.createRadialGradient(w * 0.5, h * 0.46, h * 0.14, w * 0.5, h * 0.46, h * 0.74);
              g.addColorStop(0, `hsla(${arenaResonance.hue}, 95%, 74%, ${intensity})`);
              g.addColorStop(1, `hsla(${arenaResonance.hue + 18}, 80%, 30%, 0)`);
              ctx.fillStyle = g;
              ctx.fillRect(0, 0, w, h);
          }

          function loop() {
              update();
              draw();
              requestAnimationFrame(loop);
          }

          placeInitialArenaBubbles();
          showView('home');
          loop();

}
