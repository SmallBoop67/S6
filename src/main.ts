import "./style.css";
import {
  EGG_TIERS,
  POKEMON,
  RARITY_COLORS,
  SHINY_CHANCE,
  shinySpriteUrl,
  spriteUrl,
} from "./pokemon.ts";
import type { Pokemon, Rarity } from "./pokemon.ts";

/* ---------- Config ---------- */

const SHINY_AMULET_BONUS = 0.005; // +0.5% shiny chance per level
const SHINY_CHANCE_CAP = 0.15; // 15% max

interface Upgrades {
  bait: number;
  incubator: number;
  amulet: number;
}

interface DexEntry {
  normal: number;
  shiny: number;
}

interface SaveState {
  coins: number;
  totalClicks: number;
  totalHatches: number;
  shinyHatches: number;
  upgrades: Upgrades;
  dex: Record<number, DexEntry>;
}

const SAVE_KEY = "egg-clicker-save-v2";

function freshState(): SaveState {
  return {
    coins: 0,
    totalClicks: 0,
    totalHatches: 0,
    shinyHatches: 0,
    upgrades: { bait: 0, incubator: 0, amulet: 0 },
    dex: {},
  };
}

function loadState(): SaveState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    const fresh = freshState();
    return {
      ...fresh,
      ...parsed,
      upgrades: { ...fresh.upgrades, ...(parsed.upgrades ?? {}) },
      dex: { ...parsed.dex },
    };
  } catch {
    return freshState();
  }
}

let state = loadState();

function saveState(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode etc.) — play without saving
  }
}

/* ---------- Upgrades ---------- */

interface UpgradeDef {
  key: keyof Upgrades;
  name: string;
  emoji: string;
  desc: (level: number) => string;
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
}

const UPGRADES: UpgradeDef[] = [
  {
    key: "bait",
    name: "Better Bait",
    emoji: "🎣",
    desc: (lv) => `+1 coin per tap (now ${1 + lv})`,
    baseCost: 25,
    costGrowth: 1.35,
    maxLevel: 200,
  },
  {
    key: "incubator",
    name: "Incubator",
    emoji: "🔥",
    desc: (lv) => `+1 coin per second (now ${lv})`,
    baseCost: 150,
    costGrowth: 1.5,
    maxLevel: 500,
  },
  {
    key: "amulet",
    name: "Shiny Amulet",
    emoji: "✨",
    desc: (lv) => `+0.5% shiny chance (now ${(1 + lv * 0.5).toFixed(1)}%)`,
    baseCost: 1000,
    costGrowth: 2,
    maxLevel: 28,
  },
];

function upgradeCost(def: UpgradeDef): number {
  return Math.floor(
    def.baseCost * Math.pow(def.costGrowth, state.upgrades[def.key]),
  );
}

function coinsPerTap(): number {
  return 1 + state.upgrades.bait;
}

function shinyChance(): number {
  return Math.min(
    SHINY_CHANCE_CAP,
    SHINY_CHANCE + state.upgrades.amulet * SHINY_AMULET_BONUS,
  );
}

/* ---------- Rolling ---------- */

const byRarity: Record<Rarity, Pokemon[]> = {
  common: [],
  uncommon: [],
  rare: [],
  epic: [],
  legendary: [],
};
for (const p of POKEMON) byRarity[p.rarity].push(p);

function rollRarity(weights: Record<Rarity, number>): Rarity {
  const entries = Object.entries(weights) as [Rarity, number][];
  const positive = entries.filter(([, w]) => w > 0);
  const total = positive.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, w] of positive) {
    roll -= w;
    if (roll < 0) return rarity;
  }
  return positive[positive.length - 1][0];
}

function hatch(tierIdx: number): void {
  const tier = EGG_TIERS[tierIdx];
  const rarity = rollRarity(tier.weights);
  const pool = byRarity[rarity];
  const mon = pool[Math.floor(Math.random() * pool.length)];
  const isShiny = Math.random() < shinyChance();

  state.totalHatches++;
  const entry = (state.dex[mon.id] ??= { normal: 0, shiny: 0 });
  if (isShiny) {
    entry.shiny++;
    state.shinyHatches++;
  } else {
    entry.normal++;
  }

  showResult(mon, isShiny, tier.name);
  render();
  saveState();
}

/* ---------- DOM ---------- */

const app = document.getElementById("app") as HTMLElement;
app.innerHTML = `
  <header class="topbar">
    <h1>🥚 Egg Clicker</h1>
    <div class="wallet">
      <span id="coins" class="stat-value">0</span>
      <span id="coins-per-sec" class="substat">+0/s</span>
    </div>
  </header>
  <main class="layout">
    <section class="panel egg-panel">
      <h2>Nest</h2>
      <div class="egg-stage">
        <button id="egg" class="egg" aria-label="Tap the egg to earn coins">
          <svg viewBox="0 0 120 150" class="egg-svg" xmlns="http://www.w3.org/2000/svg">
            <ellipse class="shadow" cx="60" cy="140" rx="36" ry="7"/>
            <path class="shell" d="M60 8 C 90 8 102 62 102 92 C 102 122 82 136 60 136 C 38 136 18 122 18 92 C 18 62 30 8 60 8 Z"/>
            <ellipse class="spot s1" cx="44" cy="50" rx="9" ry="13"/>
            <ellipse class="spot s2" cx="76" cy="94" rx="7" ry="10"/>
            <ellipse class="spot s3" cx="62" cy="32" rx="4" ry="6"/>
          </svg>
        </button>
        <div id="float-layer"></div>
      </div>
      <p class="tap-hint">Tap the egg — coins buy eggs, eggs hatch Pokémon!</p>
      <div class="tap-stats">
        <span>+<b id="per-tap">1</b> per tap</span>
        <span>+<b id="per-sec">0</b>/s from incubator</span>
      </div>
    </section>
    <section class="panel shop-panel">
      <h2>Egg Shop</h2>
      <div id="egg-shop" class="shop-grid"></div>
      <h2>Upgrades</h2>
      <div id="upgrade-shop" class="upgrade-list"></div>
    </section>
  </main>
  <section class="panel collection-panel">
    <h2>Collection <span id="dex-count" class="muted"></span></h2>
    <div id="collection" class="collection-grid"></div>
  </section>
  <footer class="footer">
    <span>Sprites from PokeAPI · progress saves automatically</span>
    <button id="reset" class="danger">Reset save</button>
  </footer>
  <div id="result-popup" class="popup hidden"></div>
`;

const el = {
  coins: document.getElementById("coins") as HTMLElement,
  coinsPerSec: document.getElementById("coins-per-sec") as HTMLElement,
  egg: document.getElementById("egg") as HTMLElement,
  floatLayer: document.getElementById("float-layer") as HTMLElement,
  perTap: document.getElementById("per-tap") as HTMLElement,
  perSec: document.getElementById("per-sec") as HTMLElement,
  eggShop: document.getElementById("egg-shop") as HTMLElement,
  upgradeShop: document.getElementById("upgrade-shop") as HTMLElement,
  collection: document.getElementById("collection") as HTMLElement,
  dexCount: document.getElementById("dex-count") as HTMLElement,
  popup: document.getElementById("result-popup") as HTMLElement,
};

/* ---------- Rendering ---------- */

function fmt(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e4) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toLocaleString("en-US");
}

function render(): void {
  el.coins.textContent = fmt(state.coins);
  el.perTap.textContent = String(coinsPerTap());
  el.perSec.textContent = String(state.upgrades.incubator);
  el.coinsPerSec.textContent = `+${state.upgrades.incubator}/s`;
  renderShops();
  renderCollection();
}

function renderShops(): void {
  el.eggShop.replaceChildren(
    ...EGG_TIERS.map((tier, i) => {
      const btn = document.createElement("button");
      btn.className = "shop-item";
      btn.disabled = state.coins < tier.cost;
      const affordable = state.coins >= tier.cost;
      btn.innerHTML = `
        <span class="egg-mini tier-${i}"></span>
        <span class="shop-name">${tier.name}</span>
        <span class="shop-cost ${affordable ? "" : "locked"}">${
        tier.cost === 0 ? "free" : fmt(tier.cost)
      }</span>`;
      btn.title = `Hatch: ${
        (Object.entries(tier.weights) as [Rarity, number][])
          .filter(([, w]) => w > 0)
          .map(([r, w]) => `${w}% ${r}`)
          .join(", ")
      } · shiny ${(shinyChance() * 100).toFixed(1)}%`;
      btn.addEventListener("click", () => {
        if (state.coins < tier.cost) return;
        state.coins -= tier.cost;
        hatch(i);
      });
      return btn;
    }),
  );

  el.upgradeShop.replaceChildren(
    ...UPGRADES.map((def) => {
      const level = state.upgrades[def.key];
      const maxed = level >= def.maxLevel;
      const cost = upgradeCost(def);
      const btn = document.createElement("button");
      btn.className = "upgrade";
      btn.disabled = maxed || state.coins < cost;
      btn.innerHTML = `
        <span class="up-emoji">${def.emoji}</span>
        <span class="up-body">
          <span class="up-name">${def.name} <small>Lv ${level}</small></span>
          <span class="up-desc">${def.desc(level)}</span>
        </span>
        <span class="up-cost ${
        maxed ? "" : state.coins >= cost ? "" : "locked"
      }">${maxed ? "MAX" : fmt(cost)}</span>`;
      btn.addEventListener("click", () => {
        if (maxed || state.coins < cost) return;
        state.coins -= cost;
        state.upgrades[def.key]++;
        render();
        saveState();
      });
      return btn;
    }),
  );
}

function renderCollection(): void {
  const owned = POKEMON.filter((p) => state.dex[p.id]);
  const shinyOwned = owned.filter((p) => state.dex[p.id].shiny > 0);
  el.dexCount.textContent =
    `${owned.length}/${POKEMON.length} caught · ${shinyOwned.length} shiny`;

  if (owned.length === 0) {
    el.collection.innerHTML =
      `<p class="empty">Nothing hatched yet. Buy a Basic Egg from the shop!</p>`;
    return;
  }

  el.collection.replaceChildren(
    ...owned.map((p) => {
      const entry = state.dex[p.id];
      const card = document.createElement("div");
      card.className = "dex-card";
      if (entry.shiny > 0) card.classList.add("shiny");
      const hasShiny = entry.shiny > 0;
      const img = document.createElement("img");
      img.src = hasShiny ? shinySpriteUrl(p.id) : spriteUrl(p.id);
      img.alt = p.name;
      img.loading = "lazy";
      img.title = hasShiny
        ? `Shiny ${p.name} ×${entry.shiny}`
        : `${p.name} ×${entry.normal}`;
      const name = document.createElement("span");
      name.textContent = p.name;
      const badge = document.createElement("span");
      badge.className = "rarity";
      badge.style.setProperty("--rarity-color", RARITY_COLORS[p.rarity]);
      badge.textContent = entry.shiny > 0
        ? `✨ ${entry.shiny}`
        : `×${entry.normal}`;
      card.append(img, name, badge);
      return card;
    }),
  );
}

/* ---------- Result popup ---------- */

let popupTimer: ReturnType<typeof setTimeout> | undefined;

function showResult(mon: Pokemon, isShiny: boolean, tierName: string): void {
  const shiny = isShiny;
  el.popup.className = `popup ${shiny ? "shiny" : ""}`;
  el.popup.innerHTML = `
    <div class="popup-card ${shiny ? "shiny-card" : ""}">
      <img src="${
    shiny ? shinySpriteUrl(mon.id) : spriteUrl(mon.id)
  }" alt="${mon.name}">
      <h3>${shiny ? "✨ Shiny " : ""}${mon.name}</h3>
      <span class="rarity-chip" style="background:${
    RARITY_COLORS[mon.rarity]
  }">${mon.rarity}</span>
      <p>${tierName}${shiny ? " · lucky shiny hatch!" : ""}</p>
    </div>`;
  el.popup.classList.remove("hidden");

  if (shiny) spawnSparkles();

  clearTimeout(popupTimer);
  popupTimer = setTimeout(hidePopup, 2400);
}

function hidePopup(): void {
  el.popup.classList.add("hidden");
}

el.popup.addEventListener("click", hidePopup);

function spawnSparkles(): void {
  const stage = document.querySelector(".egg-stage") as HTMLElement;
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    s.className = "sparkle";
    s.textContent = "✨";
    s.style.left = 10 + Math.random() * 80 + "%";
    s.style.top = 10 + Math.random() * 70 + "%";
    s.style.animationDelay = Math.random() * 0.6 + "s";
    stage.appendChild(s);
    setTimeout(() => s.remove(), 1800);
  }
}

/* ---------- Clicking ---------- */

el.egg.addEventListener("pointerdown", (e) => {
  const gain = coinsPerTap();
  state.coins += gain;
  state.totalClicks++;
  spawnFloat(`+${gain}`, e);
  el.egg.classList.remove("tap");
  void el.egg.offsetWidth; // restart CSS animation
  el.egg.classList.add("tap");
  render();
  saveState();
});

function spawnFloat(text: string, e: PointerEvent): void {
  const rect = el.egg.getBoundingClientRect();
  const f = document.createElement("span");
  f.className = "float-text";
  f.textContent = text;
  f.style.left = `${e.clientX - rect.left}px`;
  f.style.top = `${e.clientY - rect.top}px`;
  el.floatLayer.appendChild(f);
  setTimeout(() => f.remove(), 900);
}

/* ---------- Passive income ---------- */

let lastTick = performance.now();
let passiveAcc = 0;

function tick(now: number): void {
  const dt = Math.min((now - lastTick) / 1000, 5);
  lastTick = now;
  const rate = state.upgrades.incubator;
  if (rate > 0) {
    passiveAcc += rate * dt;
    if (passiveAcc >= 1) {
      const whole = Math.floor(passiveAcc);
      passiveAcc -= whole;
      state.coins += whole;
      render();
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

setInterval(saveState, 5000);
addEventListener("beforeunload", saveState);

/* ---------- Reset ---------- */

(document.getElementById("reset") as HTMLElement).addEventListener(
  "click",
  () => {
    if (confirm("Reset all progress? This cannot be undone.")) {
      state = freshState();
      saveState();
      render();
    }
  },
);

render();
