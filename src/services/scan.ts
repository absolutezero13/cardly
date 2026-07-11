import api from "@/api";
import {
  deleteOptimizedCardImage,
  optimizeCardImagePair,
  type OptimizedCardImage,
} from "@/services/cardImageOptimization";
import type { CardRarity } from "@/types/card";
import { isAxiosError } from "axios";

export type ScanCardPayload = {
  frontUri: string;
  backUri: string;
};

export type ScanCardResult = {
  id: string;
  name: string;
  setName: string;
  rarity: CardRarity;
  price: number;
  confidence: number;
};

type ApiErrorBody = {
  error?: string;
  code?: string;
};

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

const IMAGE_TYPES: Record<string, string> = {
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const fileForUri = (uri: string, side: "front" | "back"): ReactNativeFile => {
  const extension = uri
    .split("?")[0]
    .split(".")
    .pop()
    ?.toLowerCase();
  const safeExtension = extension && IMAGE_TYPES[extension] ? extension : "jpg";

  return {
    uri,
    name: `${side}.${safeExtension}`,
    type: IMAGE_TYPES[safeExtension],
  };
};

export class ScanCardError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ScanCardError";
  }
}

class ScanService {
  async identifyCard(payload: ScanCardPayload): Promise<ScanCardResult> {
    if (!payload.frontUri || !payload.backUri) {
      throw new Error("Both card sides are required");
    }

    const temporaryImages: OptimizedCardImage[] = [];

    try {
      const [front, back] = await optimizeCardImagePair(
        payload.frontUri,
        payload.backUri,
      );
      temporaryImages.push(front, back);
      const formData = new FormData();
      formData.append(
        "front",
        fileForUri(front.uri, "front") as unknown as Blob,
      );
      formData.append(
        "back",
        fileForUri(back.uri, "back") as unknown as Blob,
      );

      const response = await api.post<ScanCardResult>("/cards/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data;
    } catch (error) {
      if (isAxiosError<ApiErrorBody>(error)) {
        const message =
          error.response?.data?.error ??
          (error.response
            ? "The card could not be scanned. Please try again."
            : "Could not reach Cardly. Check your connection and try again.");

        throw new ScanCardError(message, error.response?.data?.code);
      }

      throw error;
    } finally {
      temporaryImages.forEach(deleteOptimizedCardImage);
    }
  }
}

const scanService = new ScanService();

export default scanService;
