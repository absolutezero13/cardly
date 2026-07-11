import api from "@/api";
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
const IMAGE_CONTENT_TYPES: Record<string, string> = {
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

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

const imageExtension = (sourceUri: string): string => {
  const extension = sourceUri.split("?")[0].split(".").pop()?.toLowerCase();

  return extension && IMAGE_CONTENT_TYPES[extension] ? extension : "jpg";
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
  const storage = getStorage();
  const frontExtension = imageExtension(images.frontUri);
  const backExtension = imageExtension(images.backUri);
  const storagePaths: [string, string] = [
    `${CARD_IMAGES_DIRECTORY}/${ownerId}/${uploadId}/front.${frontExtension}`,
    `${CARD_IMAGES_DIRECTORY}/${ownerId}/${uploadId}/back.${backExtension}`,
  ];
  const frontRef = ref(storage, storagePaths[0]);
  const backRef = ref(storage, storagePaths[1]);
  const uploadResults = await Promise.allSettled([
    putFile(frontRef, images.frontUri, {
      contentType: IMAGE_CONTENT_TYPES[frontExtension],
    }),
    putFile(backRef, images.backUri, {
      contentType: IMAGE_CONTENT_TYPES[backExtension],
    }),
  ]);

  if (uploadResults.some((result) => result.status === "rejected")) {
    await deleteStorageObjects(storagePaths);
    throw new CardServiceError(
      "Could not upload the card images. Check your connection and try again.",
    );
  }

  try {
    const [frontImageUrl, backImageUrl] = await Promise.all([
      getDownloadURL(frontRef),
      getDownloadURL(backRef),
    ]);

    return { frontImageUrl, backImageUrl, storagePaths };
  } catch (error) {
    await deleteStorageObjects(storagePaths);
    console.warn("[Cards] Could not get card image download URLs", error);
    throw new CardServiceError("Could not prepare the uploaded card images.");
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
