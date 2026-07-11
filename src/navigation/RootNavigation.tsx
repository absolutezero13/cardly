import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabBarNavigation from "@/navigation/TabBarNavigation";
import ScanCardScreen from "@/screens/ScanCardScreen";
import { Colors } from "@/theme/Theme";

export type RootStackParamList = {
  HomeTabs: undefined;
  ScanCard: undefined;
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
    </Stack.Navigator>
  );
};

export default RootNavigation;
