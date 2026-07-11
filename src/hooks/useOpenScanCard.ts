import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert, Linking } from "react-native";
import { useCameraPermission } from "react-native-vision-camera";

import type { RootStackParamList } from "@/navigation/RootNavigation";

const useOpenScanCard = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { hasPermission, requestPermission } = useCameraPermission();

  return async () => {
    if (hasPermission || (await requestPermission())) {
      navigation.navigate("ScanCard");
      return;
    }

    Alert.alert(
      "Camera access needed",
      "Cardly needs the camera to capture your card. You can enable it in Settings.",
      [
        { text: "Not Now", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ],
    );
  };
};

export default useOpenScanCard;
