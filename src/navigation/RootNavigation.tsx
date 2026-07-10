import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabBarNavigation from "@/navigation/TabBarNavigation";
import { Colors } from "@/theme/Theme";

type RootStackParamList = {
  HomeTabs: undefined;
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
    </Stack.Navigator>
  );
};

export default RootNavigation;
