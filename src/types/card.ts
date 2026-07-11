export type CardRarity = "common" | "uncommon" | "rare" | "mythic";

export const rarityLabels: Record<CardRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  mythic: "Mythic",
};

export type TradingCard = {
  id: string;
  name: string;
  setName: string;
  rarity: CardRarity;
  price: number;
  trend?: number;
  imageSource: number;
};
