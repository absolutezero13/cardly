export type CardRarity = "common" | "uncommon" | "rare" | "mythic";

export type TradingCard = {
  id: string;
  name: string;
  setName: string;
  rarity: CardRarity;
  price: number;
  trend?: number;
  imageUrl: string;
};