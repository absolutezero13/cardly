import type { TradingCard } from "@/types/card";

const unsplash = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=400&h=560&q=80`;

export const trendingCards: TradingCard[] = [
  {
    id: "trending-1",
    name: "Charizard ex",
    setName: "Obsidian Flames",
    rarity: "rare",
    price: 184.5,
    trend: 18.4,
    imageUrl: unsplash("photo-1611532736597-de2d90b29bdd"),
  },
  {
    id: "trending-2",
    name: "Pikachu VMAX",
    setName: "Vivid Voltage",
    rarity: "rare",
    price: 92.0,
    trend: 12.1,
    imageUrl: unsplash("photo-1599658880436-cdc9cc6c8bdc"),
  },
  {
    id: "trending-3",
    name: "Mew ex",
    setName: "151",
    rarity: "mythic",
    price: 64.75,
    trend: 9.8,
    imageUrl: unsplash("photo-1624969862293-86ebbda6b386"),
  },
  {
    id: "trending-4",
    name: "Luffy Leader",
    setName: "Romance Dawn",
    rarity: "uncommon",
    price: 41.2,
    trend: 7.3,
    imageUrl: unsplash("photo-1571407970344-bc81e7e33d48"),
  },
];

export const popularCards: TradingCard[] = [
  {
    id: "popular-1",
    name: "Black Lotus",
    setName: "Alpha",
    rarity: "mythic",
    price: 420000,
    imageUrl: unsplash("photo-1511512578047-dfb367046420"),
  },
  {
    id: "popular-2",
    name: "Blue-Eyes White Dragon",
    setName: "Legend of Blue Eyes",
    rarity: "rare",
    price: 3150,
    imageUrl: unsplash("photo-1551269901-5c5e14c85df6"),
  },
  {
    id: "popular-3",
    name: "Lugia V",
    setName: "Silver Tempest",
    rarity: "rare",
    price: 128.4,
    imageUrl: unsplash("photo-1542751594-5ec346f8a76f"),
  },
  {
    id: "popular-4",
    name: "One Piece",
    setName: "Paramount War",
    rarity: "uncommon",
    price: 88.9,
    imageUrl: unsplash("photo-1633615968363-c61ffeee444d"),
  },
];