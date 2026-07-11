import api from "@/api";
import type { ScanCardResult } from "@/services/scan";
import type { CardRarity } from "@/types/card";
import { isAxiosError } from "axios";
import { Directory, File, Paths } from "expo-file-system";

export type UserCard = {
  _id: string;
  ownerId: string;
  collectionId: string | null;
  name: string;
  setName: string;
  rarity: CardRarity;
  price: number;
  confidence: number;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCardInput = Partial<
  Pick<
    UserCard,
    | "collectionId"
    | "name"
    | "setName"
    | "rarity"
    | "price"
    | "confidence"
    | "frontImageUrl"
    | "backImageUrl"
  >
>;

export type CardImages = {
  frontUri: string;
  backUri: string;
};

type ApiErrorBody = {
  error?: string;
};

export class CardServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CardServiceError";
  }
}

const cardError = (error: unknown, fallback: string) => {
  if (isAxiosError<ApiErrorBody>(error)) {
    return new CardServiceError(
      error.response?.data?.error ??
        (error.response
          ? fallback
          : "Could not reach Cardly. Check your connection and try again."),
    );
  }

  return error;
};

const CARD_IMAGES_DIRECTORY = "card-images";

// Card images are stored relative to the document directory because iOS moves
// the app container between updates, which would break absolute file URIs.
export const cardImageUri = (imagePath: string | null): string | null => {
  if (!imagePath) {
    return null;
  }

  if (imagePath.includes("://")) {
    return imagePath;
  }

  return new File(Paths.document, imagePath).uri;
};

const persistScanImage = async (
  sourceUri: string,
  imageId: string,
  side: "front" | "back",
): Promise<string> => {
  const directory = new Directory(Paths.document, CARD_IMAGES_DIRECTORY);

  directory.create({ intermediates: true, idempotent: true });

  const extension = sourceUri.split("?")[0].split(".").pop()?.toLowerCase();
  const safeExtension =
    extension && /^[a-z0-9]{1,5}$/.test(extension) ? extension : "jpg";
  const fileName = `${imageId}-${side}.${safeExtension}`;

  await new File(sourceUri).copy(new File(directory, fileName));

  return `${CARD_IMAGES_DIRECTORY}/${fileName}`;
};

const deleteLocalCardImage = (imagePath: string | null) => {
  if (!imagePath || imagePath.includes("://")) {
    return;
  }

  try {
    const file = new File(Paths.document, imagePath);

    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn("[Cards] Could not delete card image", error);
  }
};

class CardService {
  async listCards(ownerId: string, signal?: AbortSignal): Promise<UserCard[]> {
    try {
      const response = await api.get<UserCard[]>("/cards", {
        params: { ownerId },
        signal,
      });

      return response.data;
    } catch (error) {
      throw cardError(error, "Could not load your cards.");
    }
  }

  async saveScannedCard(
    ownerId: string,
    scan: ScanCardResult,
    images: CardImages,
  ): Promise<UserCard> {
    const imageId = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    let frontImageUrl: string | null = null;
    let backImageUrl: string | null = null;

    try {
      [frontImageUrl, backImageUrl] = await Promise.all([
        persistScanImage(images.frontUri, imageId, "front"),
        persistScanImage(images.backUri, imageId, "back"),
      ]);
    } catch (error) {
      console.warn("[Cards] Could not persist scan images", error);
    }

    try {
      const response = await api.post<UserCard>("/cards", {
        ownerId,
        name: scan.name,
        setName: scan.setName,
        rarity: scan.rarity,
        price: scan.price,
        confidence: scan.confidence,
        frontImageUrl,
        backImageUrl,
      });

      return response.data;
    } catch (error) {
      deleteLocalCardImage(frontImageUrl);
      deleteLocalCardImage(backImageUrl);
      throw cardError(error, "Could not save the card.");
    }
  }

  async updateCard(
    ownerId: string,
    cardId: string,
    updates: UpdateCardInput,
  ): Promise<UserCard> {
    try {
      const response = await api.patch<UserCard>(`/cards/${cardId}`, updates, {
        params: { ownerId },
      });

      return response.data;
    } catch (error) {
      throw cardError(error, "Could not update the card.");
    }
  }

  async deleteCard(ownerId: string, card: UserCard): Promise<void> {
    try {
      await api.delete(`/cards/${card._id}`, {
        params: { ownerId },
      });
    } catch (error) {
      throw cardError(error, "Could not delete the card.");
    }

    deleteLocalCardImage(card.frontImageUrl);
    deleteLocalCardImage(card.backImageUrl);
  }
}

const cardService = new CardService();

export default cardService;
