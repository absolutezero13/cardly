import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabBarNavigation from "@/navigation/TabBarNavigation";
import ScanCardScreen from "@/screens/ScanCardScreen";
import ScanResultScreen from "@/screens/ScanResultScreen";
import WelcomeScreen from "@/screens/WelcomeScreen";
import type { ScanCardResult } from "@/services/scan";
import { Colors } from "@/theme/Theme";

export type RootStackParamList = {
  Welcome: undefined;
  HomeTabs: undefined;
  ScanCard: undefined;
  ScanResult: {
    result: ScanCardResult;
    frontUri: string;
    backUri: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNavigationProps = {
  hasUser: boolean;
};

const RootNavigation = ({ hasUser }: RootNavigationProps) => {
  return (
    <Stack.Navigator
      initialRouteName={hasUser ? "HomeTabs" : "Welcome"}
      screenOptions={{ contentStyle: { backgroundColor: Colors.background } }}
    >
      {hasUser ? (
        <Stack.Group navigationKey="authenticated">
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
        </Stack.Group>
      ) : (
        <Stack.Group navigationKey="guest">
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigation;
