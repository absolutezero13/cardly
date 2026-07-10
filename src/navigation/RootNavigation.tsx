import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabBarNavigation from "@/navigation/TabBarNavigation";

type RootStackParamList = {
  HomeTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigation = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeTabs"
        component={TabBarNavigation}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigation;
