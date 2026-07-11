import { create } from "zustand";

import cardService, {
  CardServiceError,
  type UserCard,
} from "@/services/cards";

type LoadStatus = "idle" | "loading" | "ready" | "error";

type CardsStore = {
  cards: UserCard[];
  ownerId: string | null;
  status: LoadStatus;
  error: string | null;
  ensureLoaded: (ownerId: string) => Promise<void>;
  refresh: (ownerId: string) => Promise<void>;
  addCard: (card: UserCard) => void;
  upsertCard: (card: UserCard) => void;
  removeCard: (cardId: string) => void;
  reset: () => void;
};

let inFlightLoad: Promise<void> | null = null;
let inFlightOwnerId: string | null = null;

const loadErrorMessage = (error: unknown, fallback: string) =>
  error instanceof CardServiceError ? error.message : fallback;

const useCardsStore = create<CardsStore>((set, get) => ({
  cards: [],
  ownerId: null,
  status: "idle",
  error: null,

  ensureLoaded: async (ownerId) => {
    const { ownerId: loadedOwnerId, status } = get();

    if (loadedOwnerId === ownerId && status === "ready") {
      return;
    }

    if (
      loadedOwnerId === ownerId &&
      status === "loading" &&
      inFlightLoad &&
      inFlightOwnerId === ownerId
    ) {
      return inFlightLoad;
    }

    set({ status: "loading", error: null, ownerId });
    inFlightOwnerId = ownerId;

    inFlightLoad = (async () => {
      try {
        const cards = await cardService.listCards(ownerId);

        if (get().ownerId === ownerId) {
          set({ cards, status: "ready", error: null });
        }
      } catch (error) {
        if (get().ownerId === ownerId) {
          set({
            status: "error",
            error: loadErrorMessage(error, "Could not load your cards."),
          });
        }
      } finally {
        if (inFlightOwnerId === ownerId) {
          inFlightLoad = null;
          inFlightOwnerId = null;
        }
      }
    })();

    return inFlightLoad;
  },

  refresh: async (ownerId) => {
    try {
      const cards = await cardService.listCards(ownerId);

      if (get().ownerId === ownerId || get().ownerId === null) {
        set({ cards, ownerId, status: "ready", error: null });
      }
    } catch (error) {
      const message = loadErrorMessage(error, "Could not load your cards.");

      if (get().cards.length === 0) {
        set({ ownerId, status: "error", error: message });
      }

      throw error instanceof CardServiceError
        ? error
        : new CardServiceError(message);
    }
  },

  addCard: (card) =>
    set((state) => ({
      cards: [card, ...state.cards.filter((item) => item._id !== card._id)],
    })),

  upsertCard: (card) =>
    set((state) => {
      const index = state.cards.findIndex((item) => item._id === card._id);

      if (index === -1) {
        return { cards: [card, ...state.cards] };
      }

      const cards = [...state.cards];
      cards[index] = card;

      return { cards };
    }),

  removeCard: (cardId) =>
    set((state) => ({
      cards: state.cards.filter((card) => card._id !== cardId),
    })),

  reset: () => {
    inFlightLoad = null;
    inFlightOwnerId = null;
    set({
      cards: [],
      ownerId: null,
      status: "idle",
      error: null,
    });
  },
}));

export default useCardsStore;
