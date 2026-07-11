import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabBarNavigation from "@/navigation/TabBarNavigation";
import ScanCardScreen from "@/screens/ScanCardScreen";
import ScanResultScreen from "@/screens/ScanResultScreen";
import type { ScanCardResult } from "@/services/scan";
import { Colors } from "@/theme/Theme";

export type RootStackParamList = {
  HomeTabs: undefined;
  ScanCard: undefined;
  ScanResult: {
    result: ScanCardResult;
    frontUri: string;
    backUri: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigation = () => {
  return (
    <Stack.Navigator
      screenOptions={{ contentStyle: { backgroundColor: Colors.background } }}
    >
      <Stack.Screen
        name="HomeTabs"
        component={TabBarNavigation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScanCard"
        component={ScanCardScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          statusBarStyle: "light",
        }}
      />
      <Stack.Screen
        name="ScanResult"
        component={ScanResultScreen}
        options={{
          headerShown: false,
          presentation: "modal",
          statusBarStyle: "light",
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigation;
