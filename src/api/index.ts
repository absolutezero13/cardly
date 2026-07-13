import { getAuth } from "@react-native-firebase/auth";
import axios from "axios";
import { Platform } from "react-native";

const devApiHost =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://192.168.1.28:3000";
const remoteApiHost = "https://cardly-be.vercel.app";

const api = axios.create({
  baseURL: remoteApiHost,
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
