// Simple Feed the Cat app
(function () {
  const STORAGE_KEY = "feed-the-cat:v1";
  const THEME_KEY = "feed-the-cat:theme";
  const defaultState = { hunger: 50, food: 0, lastFed: null, happy: 50 };

  let HUNGER_TICK_MS = 60000;
  let HUNGER_PER_TICK = 1;
  let HAPPY_DECAY_PER_TICK = 0.5;
  let FEED_HUNGER_REDUCTION = 12;
  let BUY_AMOUNT = 5;
  let PET_HAPPY_INCREASE = 8;
  let PLAY_HAPPY_INCREASE = 12;
  let PLAY_HUNGER_INCREASE = 5;

  const SETTINGS_KEY = "feed-the-cat:settings";
  const SOUND_KEY = "feed-the-cat:sound";
  let tickIntervalId = null;
  let soundEnabled = false;
  
  // Sound system
  const sounds = {
    feed: new Audio('src/audio/feed.mp3'),
    purr: new Audio('src/audio/purr.mp3'),
    play: new Audio('src/audio/play.mp3'),
    treat: new Audio('src/audio/treat.mp3')
  };

  // Preload sounds
  Object.values(sounds).forEach(sound => {
    sound.load();
    sound.volume = 0.6; // Set volume to 60%
  });

  // Initialize achievement system
  const achievements = new AchievementSystem();
  
  // Initialize stats elements
  const statElements = {
    totalFeeds: document.getElementById('stat-total-feeds'),
    totalTreats: document.getElementById('stat-total-treats'),
    totalPlays: document.getElementById('stat-total-plays'),
    visitStreak: document.getElementById('stat-visit-streak')
  };

  // Initialize achievements grid
  function initializeAchievements() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;

    Object.values(ACHIEVEMENTS).forEach(achievement => {
      const card = document.createElement('div');
      card.className = 'achievement-card';
      card.id = `achievement-${achievement.id}`;
      if (achievements.checkAchievement(achievement.id)) {
        card.classList.add('unlocked');
      }

      card.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-text">
          <div class="achievement-title">${achievement.title}</div>
          <div class="achievement-desc">${achievement.description}</div>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  // Update stats display
  function updateStatsDisplay() {
    if (statElements.totalFeeds) statElements.totalFeeds.textContent = achievements.stats.totalFeeds;
    if (statElements.totalTreats) statElements.totalTreats.textContent = achievements.stats.totalTreats;
    if (statElements.totalPlays) statElements.totalPlays.textContent = achievements.stats.totalPlays;
    if (statElements.visitStreak) statElements.visitStreak.textContent = achievements.stats.visitStreak;
  }

  function playSound(id) {
    if (!soundEnabled || !sounds[id]) return;
    
    try {
      // Create a new Audio instance for each play to allow overlapping
      const sound = new Audio(sounds[id].src);
      sound.volume = 0.6;
      
      // Add slight random pitch variation for more natural sound
      sound.playbackRate = 1 + (Math.random() * 0.2 - 0.1); // ±10% variation
      
      // Play the sound
      sound.play().catch(err => {
        console.log('Audio playback failed:', err);
        // If audio fails, disable sound system
        soundEnabled = false;
        localStorage.setItem(SOUND_KEY, 'false');
        if (soundToggle) {
          soundToggle.setAttribute('aria-pressed', 'false');
          soundToggle.textContent = '🔈';
        }
      });
    } catch (err) {
      console.error('Sound playback error:', err);
    }
  }

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { ...defaultState };
    } catch (e) {
      console.error("readState", e);
      return { ...defaultState };
    }
  }
  function writeState(s) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {
      console.error(e);
    }
  }

  const el = {
    feedBtn: document.getElementById("feed-btn"),
    buyBtn: document.getElementById("buy-btn"),
    treatBtn: document.getElementById("treat-btn"),
    resetBtn: document.getElementById("reset-btn"),
    petBtn: document.getElementById("pet-btn"),
    playBtn: document.getElementById("play-btn"),
    ignoreBtn: document.getElementById("ignore-btn"),
    hungerFill: document.getElementById("hunger-fill"),
    hungerPercent: document.getElementById("hunger-percent"),
    happyPercent: document.getElementById("happy-percent"),
    lastFed: document.getElementById("last-fed"),
    foodCount: document.getElementById("food-count"),
    happyFill: document.getElementById("happy-fill"),
    themeToggle: document.getElementById("theme-toggle"),
    themeIcon: document.getElementById("theme-icon"),
    catGroup: document.getElementById("cat-group"),
    catSvg: document.getElementById("cat-svg"),
  };

  let state = readState();

  function clamp(n) {
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  function render() {
    el.hungerFill.style.width = state.hunger + "%";
    el.hungerFill.setAttribute("aria-valuenow", state.hunger);
    el.hungerPercent.textContent = state.hunger + "%";
    el.foodCount.textContent = state.food;
    el.lastFed.textContent = state.lastFed
      ? new Date(state.lastFed).toLocaleString()
      : "never";

    if (el.happyFill) el.happyFill.style.width = state.happy + "%";
    if (el.happyPercent) el.happyPercent.textContent = state.happy + "%";
    if (state.happy >= 70) el.catGroup.classList.add("playful");
    else el.catGroup.classList.remove("playful");

    if (state.hunger <= 30) {
      el.catGroup.classList.add("playful");
    } else {
      el.catGroup.classList.remove("playful");
    }

    const feedDisabled = state.food <= 0 || state.hunger <= 0;
    el.feedBtn.disabled = feedDisabled;
    if (feedDisabled) {
      el.feedBtn.setAttribute("aria-disabled", "true");
    } else {
      el.feedBtn.removeAttribute("aria-disabled");
    }
    el.buyBtn.disabled = false;

    if (el.happyFill) el.happyFill.setAttribute("aria-valuenow", state.happy);
  }

  function treat() {
    if (state.food <= 0) return flash("No treats left — buy food first.");
    state.food = Math.max(0, state.food - 1);
    state.happy = clamp(state.happy + 18);
    
    // Update achievements
    achievements.stats.totalTreats++;
    if (achievements.stats.totalTreats >= 20) {
      achievements.awardAchievement('TREAT_MASTER');
    }
    
    writeState(state);
    animatePet();
    playSound('treat');
    announce("You gave a treat. Happiness " + state.happy + "%.");
    achievements.updateStats(state);
    updateStatsDisplay();
    render();
  }

  function ignore() {
    state.happy = clamp(state.happy - 12);
    state.hunger = clamp(state.hunger + 2);
    writeState(state);
    announce(
      "You ignored the cat. It seems sad — happiness " + state.happy + "%."
    );
    render();
  }

  function feed() {
    if (state.food <= 0) return flash("No food! Buy some first.");
    state.hunger = clamp(state.hunger - FEED_HUNGER_REDUCTION);
    state.food = Math.max(0, state.food - 1);
    state.lastFed = Date.now();
    
    // Update achievements
    achievements.stats.totalFeeds++;
    if (achievements.stats.totalFeeds === 1) {
      achievements.awardAchievement('FIRST_FEED');
    }
    
    writeState(state);
    animateFeed();
    playSound('feed');
    announce("Fed the cat. Hunger " + state.hunger + "%.");
    achievements.updateStats(state);
    updateStatsDisplay();
    render();
  }

  function buy() {
    state.food = state.food + BUY_AMOUNT;
    writeState(state);
    animateBuy();
    announce("Bought 5 food. Pantry " + state.food + " items.");
    render();
  }

  function pet() {
    state.happy = clamp(state.happy + PET_HAPPY_INCREASE);
    writeState(state);
    animatePet();
    playSound('purr');
    announce("You petted the cat. Happiness " + state.happy + "%.");
    render();
  }

  function play() {
    state.happy = clamp(state.happy + PLAY_HAPPY_INCREASE);
    state.hunger = clamp(state.hunger + PLAY_HUNGER_INCREASE);
    writeState(state);
    animatePlay();
    playSound('play');
    announce("You played with the cat. Happiness " + state.happy + "%.");
    render();
  }

  function animateFeed() {
    const mouth = document.getElementById("mouth");
    const catGroup = document.getElementById("cat-group");
    if (!mouth || !catGroup) return;
    
    mouth.setAttribute("stroke", "#3b6");
    catGroup.classList.add("feeding");
    
    setTimeout(() => {
      mouth.setAttribute("stroke", "#b05");
      catGroup.classList.remove("feeding");
    }, 600);

    const pile = document.querySelector(".food-pile");
    const bubble = document.createElement("span");
    bubble.className = "feed-bubble";
    bubble.textContent = "yum!";
    pile.appendChild(bubble);
    setTimeout(() => bubble.remove(), 900);
    
    playSound('feed');
  }

  function animateBuy() {
    const fc = el.foodCount;
    fc.classList.add("feed-bubble");
    setTimeout(() => fc.classList.remove("feed-bubble"), 700);
  }

  function announce(msg) {
    const a = document.getElementById("announcer");
    if (!a) return;
    a.textContent = msg;
  }

  function animatePet() {
    const pile = document.querySelector(".food-pile");
    const b = document.createElement("span");
    b.className = "feed-bubble";
    b.textContent = "purr";
    pile.appendChild(b);
    setTimeout(() => b.remove(), 800);
  }

  function animatePlay() {
    const svg = el.catSvg;
    svg.style.transform = "translateY(-6px)";
    setTimeout(() => (svg.style.transform = ""), 500);
  }

  function loadTheme() {
    try {
      const t = localStorage.getItem(THEME_KEY) || "light";
      applyTheme(t);
    } catch (e) {}
  }
  function applyTheme(t) {
    if (t === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    if (el.themeToggle)
      el.themeToggle.setAttribute("aria-pressed", t === "dark");
    if (el.themeIcon) el.themeIcon.textContent = t === "dark" ? "☀️" : "🌙";
  }
  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch (e) {}
    if (el.themeToggle) el.themeToggle.setAttribute("aria-pressed", isDark);
    if (el.themeIcon) el.themeIcon.textContent = isDark ? "☀️" : "🌙";
  }

  function flash(msg) {
    const original = document.title;
    document.title = msg;
    setTimeout(() => (document.title = original), 900);
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.hungerTickSeconds) HUNGER_TICK_MS = s.hungerTickSeconds * 1000;
      if (s.feedAmt) FEED_HUNGER_REDUCTION = s.feedAmt;
      if (s.treatPot) {
        state.treatPot = s.treatPot;
      }
    } catch (e) {
      console.error("loadSettings", e);
    }
  }

  function saveSettings(values) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(values));
      loadSettings();
      restartTick();
      flash("Settings saved");
    } catch (e) {
      console.error(e);
    }
  }

  function restartTick() {
    if (tickIntervalId) clearInterval(tickIntervalId);
    
    let perfectCareTimer = 0;
    let happyTimer = 0;
    
    tickIntervalId = setInterval(() => {
      state.hunger = clamp(state.hunger + HUNGER_PER_TICK);
      state.happy = clamp(Math.round(state.happy - HAPPY_DECAY_PER_TICK));
      
      // Check for long-term achievements
      if (state.happy >= 100) {
        happyTimer += HUNGER_TICK_MS;
        if (happyTimer >= 300000) { // 5 minutes
          achievements.awardAchievement('HAPPY_CAT');
        }
      } else {
        happyTimer = 0;
      }
      
      if (state.hunger >= 80 && state.happy >= 80) {
        perfectCareTimer += HUNGER_TICK_MS;
        if (perfectCareTimer >= 600000) { // 10 minutes
          achievements.awardAchievement('PERFECT_CARE');
        }
      } else {
        perfectCareTimer = 0;
      }
      
      writeState(state);
      achievements.updateStats(state);
      updateStatsDisplay();
      render();
    }, HUNGER_TICK_MS);
  }

  loadSettings();
  restartTick();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT') return;
    
    switch(e.key.toLowerCase()) {
      case 'f':
        if (!el.feedBtn.disabled) feed();
        break;
      case 'b':
        buy();
        break;
      case 't':
        if (state.food > 0) treat();
        break;
      case 'p':
        play();
        break;
      case 'h':
        pet();
        break;
      case 'i':
        ignore();
        break;
    }
  });

  el.feedBtn.addEventListener("click", feed);
  el.buyBtn.addEventListener("click", buy);
  const settingsToggle = document.getElementById("settings-toggle");
  const settingsPanel = document.getElementById("settings-panel");
  const settingHungerTick = document.getElementById("setting-hunger-tick");
  const settingFeedAmt = document.getElementById("setting-feed-amt");
  const settingTreatPot = document.getElementById("setting-treat-pot");
  const saveSettingsBtn = document.getElementById("save-settings");
  if (settingsToggle)
    settingsToggle.addEventListener("click", () => {
      const expanded = settingsToggle.getAttribute("aria-expanded") === "true";
      settingsToggle.setAttribute("aria-expanded", !expanded);
      if (settingsPanel) settingsPanel.hidden = expanded;
    });
  if (saveSettingsBtn)
    saveSettingsBtn.addEventListener("click", () => {
      const values = {
        hungerTickSeconds: Number(settingHungerTick.value || 60),
        feedAmt: Number(settingFeedAmt.value || FEED_HUNGER_REDUCTION),
        treatPot: Number(settingTreatPot.value || 18),
      };
      saveSettings(values);
    });
  if (el.resetBtn)
    el.resetBtn.addEventListener("click", () => {
      state = { ...defaultState };
      writeState(state);
      announce("State reset");
      render();
    });
  if (el.petBtn) el.petBtn.addEventListener("click", pet);
  if (el.playBtn) el.playBtn.addEventListener("click", play);
  if (el.treatBtn) el.treatBtn.addEventListener("click", treat);
  if (el.ignoreBtn) el.ignoreBtn.addEventListener("click", ignore);
  // Sound toggle functionality
  const soundToggle = document.getElementById('sound-toggle');
  
  function loadSoundPreference() {
    try {
      // Default to true for better user experience
      soundEnabled = localStorage.getItem(SOUND_KEY) !== 'false';
      if (soundToggle) {
        soundToggle.setAttribute('aria-pressed', soundEnabled);
        soundToggle.textContent = soundEnabled ? '🔊' : '🔈';
      }
      // Test sound system
      if (soundEnabled) {
        const testSound = new Audio();
        testSound.src = sounds.feed.src;
        testSound.volume = 0;
        testSound.play().catch(err => {
          console.log('Sound system test failed:', err);
          // Don't disable sounds on initial test
        });
      }
    } catch (e) {
      console.error('loadSoundPreference', e);
      soundEnabled = false;
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    try {
      localStorage.setItem(SOUND_KEY, soundEnabled);
      if (soundToggle) {
        soundToggle.setAttribute('aria-pressed', soundEnabled);
        soundToggle.textContent = soundEnabled ? '🔊' : '🔈';
      }
    } catch (e) {
      console.error('toggleSound', e);
    }
  }

  if (el.themeToggle) el.themeToggle.addEventListener("click", toggleTheme);
  if (soundToggle) soundToggle.addEventListener("click", toggleSound);

  loadTheme();
  loadSoundPreference();
  initializeAchievements();
  updateStatsDisplay();
  achievements.updateStats(state);
  render();
})();
