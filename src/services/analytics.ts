import type { CardRarity } from "@/types/card";
import * as Amplitude from "@amplitude/analytics-react-native";

export enum AnalyticsEvent {
  FirstLaunch = "first_launch",
  SignIn = "sign_in",
  CardImageAdded = "card_image_added",
  ScanSucceeded = "scan_succeeded",
  ScanFailed = "scan_failed",
  CardSaved = "card_saved",
  ActionError = "action_error",
}

export type CardImageAddedParams = {
  side: "front" | "back";
  source: "camera" | "gallery";
};

export type ScanSucceededParams = {
  rarity: CardRarity;
  price: number;
  confidence: number;
  durationMs: number;
};

export type ScanFailedParams = {
  code?: string;
  message: string;
  durationMs: number;
};

export type CardSavedParams = {
  rarity: CardRarity;
  price: number;
  confidence: number;
};

export type ActionErrorParams = {
  action:
    | "sign_in"
    | "capture"
    | "card_save"
    | "card_delete"
    | "favorite_toggle"
    | "collection_create"
    | "collection_delete"
    | "cards_add_to_collection"
    | "card_remove_from_collection";
  message: string;
};

type EventParams = {
  [AnalyticsEvent.FirstLaunch]: undefined;
  [AnalyticsEvent.SignIn]: undefined;
  [AnalyticsEvent.CardImageAdded]: CardImageAddedParams;
  [AnalyticsEvent.ScanSucceeded]: ScanSucceededParams;
  [AnalyticsEvent.ScanFailed]: ScanFailedParams;
  [AnalyticsEvent.CardSaved]: CardSavedParams;
  [AnalyticsEvent.ActionError]: ActionErrorParams;
};

interface IAnalyticsProvider {
  init(apiKey: string): void;
  logEvent<T extends AnalyticsEvent>(event: T, params?: EventParams[T]): void;
  setUserId(userId: string | null): void;
}

class AmplitudeProvider implements IAnalyticsProvider {
  init(apiKey: string): void {
    Amplitude.init(apiKey, undefined, {
      disableCookies: true,
    });
  }

  logEvent<T extends AnalyticsEvent>(event: T, params?: EventParams[T]): void {
    if (params) {
      Amplitude.track(event, params);
    } else {
      Amplitude.track(event);
    }
  }

  setUserId(userId: string | null): void {
    if (userId) {
      Amplitude.setUserId(userId);
    } else {
      Amplitude.reset();
    }
  }
}

class AnalyticsService {
  private provider: IAnalyticsProvider;
  private initialized = false;

  constructor(provider: IAnalyticsProvider = new AmplitudeProvider()) {
    this.provider = provider;
  }

  init(apiKey: string): void {
    if (this.initialized) {
      return;
    }
    this.provider.init(apiKey);
    this.initialized = true;
  }

  logEvent<T extends AnalyticsEvent>(event: T, params?: EventParams[T]): void {
    if (!this.initialized) {
      console.warn("Analytics not initialized. Call init() first.");
      return;
    }
    this.provider.logEvent(event, params);
  }

  setUserId(userId: string | null): void {
    this.provider.setUserId(userId);
  }

  setProvider(provider: IAnalyticsProvider): void {
    this.provider = provider;
  }
}

export const analyticsService = new AnalyticsService();
