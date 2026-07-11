import api from "@/api";
import type { CardRarity } from "@/types/card";
import { isAxiosError } from "axios";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

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

const MAX_SCAN_IMAGE_WIDTH = 1600;
const SCAN_IMAGE_COMPRESSION = 0.72;

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

type OptimizedImage = {
  file: File;
  uri: string;
};

const bytesToMegabytes = (bytes: number) => bytes / (1024 * 1024);

const optimizeImage = async (
  uri: string,
  side: "front" | "back",
): Promise<OptimizedImage> => {
  const originalSize = new File(uri).size;
  const context = ImageManipulator.manipulate(uri);

  context.resize({ width: MAX_SCAN_IMAGE_WIDTH });

  try {
    const renderedImage = await context.renderAsync();

    try {
      const result = await renderedImage.saveAsync({
        compress: SCAN_IMAGE_COMPRESSION,
        format: SaveFormat.JPEG,
      });
      const file = new File(result.uri);
      const reduction = Math.max(0, 1 - file.size / originalSize);

      console.log(
        `[Card scan] ${side} image: ${bytesToMegabytes(originalSize).toFixed(2)} MB -> ${bytesToMegabytes(file.size).toFixed(2)} MB (${Math.round(reduction * 100)}% smaller)`,
      );

      return { file, uri: result.uri };
    } finally {
      renderedImage.release();
    }
  } finally {
    context.release();
  }
};

const deleteTemporaryImage = (image: OptimizedImage) => {
  try {
    image.file.delete();
  } catch (error) {
    console.warn("[Card scan] Could not delete temporary image", error);
  }
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

    const temporaryImages: OptimizedImage[] = [];

    try {
      const [front, back] = await Promise.all(
        [
          { uri: payload.frontUri, side: "front" as const },
          { uri: payload.backUri, side: "back" as const },
        ].map(async ({ uri, side }) => {
          const optimizedImage = await optimizeImage(uri, side);
          temporaryImages.push(optimizedImage);
          return optimizedImage;
        }),
      );
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
      temporaryImages.forEach(deleteTemporaryImage);
    }
  }
}

const scanService = new ScanService();

export default scanService;
