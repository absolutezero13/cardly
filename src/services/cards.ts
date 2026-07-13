import api from "@/api";
import {
  deleteOptimizedCardImage,
  optimizeCardImagePair,
} from "@/services/cardImageOptimization";
import type { ScanCardResult } from "@/services/scan";
import type { CardRarity } from "@/types/card";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  putFile,
  ref,
} from "@react-native-firebase/storage";
import { isAxiosError } from "axios";
import { randomUUID } from "expo-crypto";
import { File, Paths } from "expo-file-system";

export type UserCard = {
  _id: string;
  ownerId: string;
  collectionId: string | null;
  isFavorite: boolean;
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
    | "isFavorite"
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
          : "Could not reach Cardly AI. Check your connection and try again."),
    );
  }

  return error;
};

const CARD_IMAGES_DIRECTORY = "card-images";

type UploadedCardImages = {
  frontImageUrl: string;
  backImageUrl: string;
  storagePaths: [string, string];
};

// Keep resolving relative paths for cards saved locally before Storage uploads
// were introduced. New cards already contain remote download URLs.
export const cardImageUri = (imagePath: string | null): string | null => {
  if (!imagePath) {
    return null;
  }

  if (imagePath.includes("://")) {
    return imagePath;
  }

  return new File(Paths.document, imagePath).uri;
};

const deleteStorageObjects = async (storagePaths: string[]) => {
  const storage = getStorage();
  const results = await Promise.allSettled(
    storagePaths.map((storagePath) =>
      deleteObject(ref(storage, storagePath)),
    ),
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.warn(
        "[Cards] Could not delete a card image from Storage",
        result.reason,
      );
    }
  });
};

const uploadScanImages = async (
  ownerId: string,
  uploadId: string,
  images: CardImages,
): Promise<UploadedCardImages> => {
  const [frontImage, backImage] = await optimizeCardImagePair(
    images.frontUri,
    images.backUri,
  );

  try {
    const storage = getStorage();
    const storagePaths: [string, string] = [
      `${CARD_IMAGES_DIRECTORY}/${ownerId}/${uploadId}/front.jpg`,
      `${CARD_IMAGES_DIRECTORY}/${ownerId}/${uploadId}/back.jpg`,
    ];
    const frontRef = ref(storage, storagePaths[0]);
    const backRef = ref(storage, storagePaths[1]);

    try {
      const uploadResults = await Promise.allSettled([
        putFile(frontRef, frontImage.uri, { contentType: "image/jpeg" }),
        putFile(backRef, backImage.uri, { contentType: "image/jpeg" }),
      ]);

      if (uploadResults.some((result) => result.status === "rejected")) {
        throw new CardServiceError(
          "Could not upload the card images. Check your connection and try again.",
        );
      }

      const [frontImageUrl, backImageUrl] = await Promise.all([
        getDownloadURL(frontRef),
        getDownloadURL(backRef),
      ]);

      return { frontImageUrl, backImageUrl, storagePaths };
    } catch (error) {
      await deleteStorageObjects(storagePaths);

      if (error instanceof CardServiceError) {
        throw error;
      }

      console.warn("[Cards] Could not get card image download URLs", error);
      throw new CardServiceError("Could not prepare the uploaded card images.");
    }
  } finally {
    deleteOptimizedCardImage(frontImage);
    deleteOptimizedCardImage(backImage);
  }
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
    const uploadedImages = await uploadScanImages(
      ownerId,
      randomUUID(),
      images,
    );

    try {
      const response = await api.post<UserCard>("/cards", {
        ownerId,
        name: scan.name,
        setName: scan.setName,
        rarity: scan.rarity,
        price: scan.price,
        confidence: scan.confidence,
        frontImageUrl: uploadedImages.frontImageUrl,
        backImageUrl: uploadedImages.backImageUrl,
      });

      return response.data;
    } catch (error) {
      await deleteStorageObjects(uploadedImages.storagePaths);
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

    const remoteImageUrls = [card.frontImageUrl, card.backImageUrl].filter(
      (imageUrl): imageUrl is string =>
        Boolean(
          imageUrl &&
            (imageUrl.startsWith("gs://") ||
              imageUrl.includes("firebasestorage.googleapis.com") ||
              imageUrl.includes("storage.googleapis.com")),
        ),
    );

    await deleteStorageObjects(remoteImageUrls);
  }
}

const cardService = new CardService();

export default cardService;
