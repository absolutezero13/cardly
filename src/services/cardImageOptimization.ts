import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export type CardImageSide = "front" | "back";

export type OptimizedCardImage = {
  file: File;
  uri: string;
};

const MAX_CARD_IMAGE_WIDTH = 1600;
const CARD_IMAGE_COMPRESSION = 0.72;

const bytesToMegabytes = (bytes: number) => bytes / (1024 * 1024);

const optimizeCardImage = async (
  uri: string,
  side: CardImageSide,
): Promise<OptimizedCardImage> => {
  const originalSize = new File(uri).size;
  const context = ImageManipulator.manipulate(uri);

  context.resize({ width: MAX_CARD_IMAGE_WIDTH });

  try {
    const renderedImage = await context.renderAsync();

    try {
      const result = await renderedImage.saveAsync({
        compress: CARD_IMAGE_COMPRESSION,
        format: SaveFormat.JPEG,
      });
      const file = new File(result.uri);
      const reduction = Math.max(0, 1 - file.size / originalSize);

      console.log(
        `[Card image] ${side}: ${bytesToMegabytes(originalSize).toFixed(2)} MB -> ${bytesToMegabytes(file.size).toFixed(2)} MB (${Math.round(reduction * 100)}% smaller)`,
      );

      return { file, uri: result.uri };
    } finally {
      renderedImage.release();
    }
  } finally {
    context.release();
  }
};

export const deleteOptimizedCardImage = (image: OptimizedCardImage) => {
  try {
    image.file.delete();
  } catch (error) {
    console.warn("[Card image] Could not delete temporary image", error);
  }
};

export const optimizeCardImagePair = async (
  frontUri: string,
  backUri: string,
): Promise<[OptimizedCardImage, OptimizedCardImage]> => {
  const [frontResult, backResult] = await Promise.allSettled([
    optimizeCardImage(frontUri, "front"),
    optimizeCardImage(backUri, "back"),
  ]);

  if (frontResult.status === "rejected") {
    if (backResult.status === "fulfilled") {
      deleteOptimizedCardImage(backResult.value);
    }

    throw frontResult.reason;
  }

  if (backResult.status === "rejected") {
    deleteOptimizedCardImage(frontResult.value);
    throw backResult.reason;
  }

  return [frontResult.value, backResult.value];
};
