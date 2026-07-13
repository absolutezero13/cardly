import api from "@/api";
import { isAxiosError } from "axios";

export type UserCollection = {
  _id: string;
  ownerId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiErrorBody = {
  error?: string;
};

export class CollectionServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CollectionServiceError";
  }
}

const collectionError = (error: unknown, fallback: string) => {
  if (isAxiosError<ApiErrorBody>(error)) {
    return new CollectionServiceError(
      error.response?.data?.error ??
        (error.response
          ? fallback
          : "Could not reach Cardly AI. Check your connection and try again."),
    );
  }

  return error;
};

class CollectionService {
  async listCollections(
    ownerId: string,
    signal?: AbortSignal,
  ): Promise<UserCollection[]> {
    try {
      const response = await api.get<UserCollection[]>("/collections", {
        params: { ownerId },
        signal,
      });

      return response.data;
    } catch (error) {
      throw collectionError(error, "Could not load your collections.");
    }
  }

  async createCollection(ownerId: string, name: string): Promise<UserCollection> {
    try {
      const response = await api.post<UserCollection>("/collections", {
        ownerId,
        name,
      });

      return response.data;
    } catch (error) {
      throw collectionError(error, "Could not create the collection.");
    }
  }

  async deleteCollection(ownerId: string, collectionId: string): Promise<void> {
    try {
      await api.delete(`/collections/${collectionId}`, {
        params: { ownerId },
      });
    } catch (error) {
      throw collectionError(error, "Could not delete the collection.");
    }
  }
}

const collectionService = new CollectionService();

export default collectionService;
