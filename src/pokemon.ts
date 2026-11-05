// Pokemon data for the egg clicker game.
// Sprites are loaded from PokeAPI (public GitHub CDN), keyed by Pokedex id.

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Pokemon {
  id: number; // Pokedex number, also used for the sprite url
  name: string;
  rarity: Rarity;
}

export interface EggTier {
  name: string;
  cost: number;
  // relative weights per rarity
  weights: Record<Rarity, number>;
}

export const SHINY_CHANCE = 0.01; // 1% base chance per hatch

export const POKEMON: Pokemon[] = [
  // Common
  { id: 10, name: "Caterpie", rarity: "common" },
  { id: 13, name: "Weedle", rarity: "common" },
  { id: 16, name: "Pidgey", rarity: "common" },
  { id: 19, name: "Rattata", rarity: "common" },
  { id: 29, name: "Nidoran F", rarity: "common" },
  { id: 32, name: "Nidoran M", rarity: "common" },
  { id: 41, name: "Zubat", rarity: "common" },
  { id: 43, name: "Oddish", rarity: "common" },
  { id: 52, name: "Meowth", rarity: "common" },
  { id: 63, name: "Abra", rarity: "common" },
  { id: 74, name: "Geodude", rarity: "common" },
  { id: 129, name: "Magikarp", rarity: "common" },

  // Uncommon
  { id: 1, name: "Bulbasaur", rarity: "uncommon" },
  { id: 4, name: "Charmander", rarity: "uncommon" },
  { id: 7, name: "Squirtle", rarity: "uncommon" },
  { id: 25, name: "Pikachu", rarity: "uncommon" },
  { id: 37, name: "Vulpix", rarity: "uncommon" },
  { id: 39, name: "Jigglypuff", rarity: "uncommon" },
  { id: 54, name: "Psyduck", rarity: "uncommon" },
  { id: 60, name: "Poliwag", rarity: "uncommon" },
  { id: 66, name: "Machop", rarity: "uncommon" },
  { id: 77, name: "Ponyta", rarity: "uncommon" },
  { id: 92, name: "Gastly", rarity: "uncommon" },
  { id: 133, name: "Eevee", rarity: "uncommon" },

  // Rare
  { id: 58, name: "Growlithe", rarity: "rare" },
  { id: 79, name: "Slowpoke", rarity: "rare" },
  { id: 95, name: "Onix", rarity: "rare" },
  { id: 104, name: "Cubone", rarity: "rare" },
  { id: 106, name: "Hitmonlee", rarity: "rare" },
  { id: 108, name: "Lickitung", rarity: "rare" },
  { id: 113, name: "Chansey", rarity: "rare" },
  { id: 123, name: "Scyther", rarity: "rare" },
  { id: 127, name: "Pinsir", rarity: "rare" },
  { id: 131, name: "Lapras", rarity: "rare" },

  // Epic
  { id: 130, name: "Gyarados", rarity: "epic" },
  { id: 134, name: "Vaporeon", rarity: "epic" },
  { id: 135, name: "Jolteon", rarity: "epic" },
  { id: 136, name: "Flareon", rarity: "epic" },
  { id: 142, name: "Aerodactyl", rarity: "epic" },
  { id: 143, name: "Snorlax", rarity: "epic" },
  { id: 147, name: "Dratini", rarity: "epic" },
  { id: 148, name: "Dragonair", rarity: "epic" },

  // Legendary
  { id: 144, name: "Articuno", rarity: "legendary" },
  { id: 145, name: "Zapdos", rarity: "legendary" },
  { id: 146, name: "Moltres", rarity: "legendary" },
  { id: 149, name: "Dragonite", rarity: "legendary" },
  { id: 150, name: "Mewtwo", rarity: "legendary" },
  { id: 151, name: "Mew", rarity: "legendary" },
];

export const EGG_TIERS: EggTier[] = [
  {
    name: "Basic Egg",
    cost: 0,
    weights: {
      common: 70,
      uncommon: 25,
      rare: 4.5,
      epic: 0.5,
      legendary: 0.02,
    },
  },
  {
    name: "Good Egg",
    cost: 100,
    weights: { common: 40, uncommon: 40, rare: 15, epic: 4.5, legendary: 0.5 },
  },
  {
    name: "Great Egg",
    cost: 1000,
    weights: { common: 15, uncommon: 40, rare: 30, epic: 13, legendary: 2 },
  },
  {
    name: "Ultra Egg",
    cost: 10000,
    weights: { common: 5, uncommon: 20, rare: 40, epic: 28, legendary: 7 },
  },
  {
    name: "Master Egg",
    cost: 100000,
    weights: { common: 0, uncommon: 10, rare: 35, epic: 40, legendary: 15 },
  },
];

export const RARITY_COLORS: Record<Rarity, string> = {
  common: "#9aa5b1",
  uncommon: "#6dc78b",
  rare: "#5aa9e6",
  epic: "#b17ae8",
  legendary: "#f2b544",
};

export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function shinySpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
}
