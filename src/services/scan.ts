import { CardRarity } from "@/types/card";

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

const MOCK_REQUEST_DURATION_MS = 1800;

const mockResult: ScanCardResult = {
  id: "scan-mock-1",
  name: "Rookie Phenom",
  setName: "2024 Prime Draft",
  rarity: "rare",
  price: 42.5,
  confidence: 0.94,
};

class ScanService {
  // Mock implementation — swap the body for the real upload once the backend
  // endpoint exists:
  //
  //   const formData = new FormData();
  //   formData.append("front", { uri: payload.frontUri, name: "front.jpg", type: "image/jpeg" });
  //   formData.append("back", { uri: payload.backUri, name: "back.jpg", type: "image/jpeg" });
  //   const response = await api.post<ScanCardResult>("/cards/scan", formData, {
  //     headers: { "Content-Type": "multipart/form-data" },
  //   });
  //   return response.data;
  async identifyCard(payload: ScanCardPayload): Promise<ScanCardResult> {
    if (!payload.frontUri || !payload.backUri) {
      throw new Error("Both card sides are required");
    }

    await new Promise((resolve) =>
      setTimeout(resolve, MOCK_REQUEST_DURATION_MS),
    );

    return mockResult;
  }
}

const scanService = new ScanService();

export default scanService;
