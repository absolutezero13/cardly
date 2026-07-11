import { getAuth } from "@react-native-firebase/auth";
import axios from "axios";
import { Platform } from "react-native";

const devApiHost = Platform.OS === "android" ? "10.0.2.2" : "192.168.1.26";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? `http://${devApiHost}:3000`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const user = getAuth().currentUser;

  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
