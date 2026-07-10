import { Platform } from "react-native";

import { scale } from "@/theme/Theme";

export const TAB_BAR_HEIGHT = scale(Platform.select({ ios: 49, default: 56 }));