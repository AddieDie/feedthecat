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
  let tickIntervalId = null;

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
    writeState(state);
    animatePet();
    announce("You gave a treat. Happiness " + state.happy + "%.");
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
    writeState(state);
    animateFeed();
    announce("Fed the cat. Hunger " + state.hunger + "%.");
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
    announce("You petted the cat. Happiness " + state.happy + "%.");
    render();
  }

  function play() {
    state.happy = clamp(state.happy + PLAY_HAPPY_INCREASE);
    state.hunger = clamp(state.hunger + PLAY_HUNGER_INCREASE);
    writeState(state);
    animatePlay();
    announce("You played with the cat. Happiness " + state.happy + "%.");
    render();
  }

  function animateFeed() {
    const mouth = document.getElementById("mouth");
    if (!mouth) return;
    mouth.setAttribute("stroke", "#3b6");
    setTimeout(() => mouth.setAttribute("stroke", "#b05"), 600);

    const pile = document.querySelector(".food-pile");
    const bubble = document.createElement("span");
    bubble.className = "feed-bubble";
    bubble.textContent = "yum!";
    pile.appendChild(bubble);
    setTimeout(() => bubble.remove(), 900);
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
    tickIntervalId = setInterval(() => {
      state.hunger = clamp(state.hunger + HUNGER_PER_TICK);
      state.happy = clamp(Math.round(state.happy - HAPPY_DECAY_PER_TICK));
      writeState(state);
      render();
    }, HUNGER_TICK_MS);
  }

  loadSettings();
  restartTick();

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
  if (el.themeToggle) el.themeToggle.addEventListener("click", toggleTheme);

  loadTheme();
  render();
})();
