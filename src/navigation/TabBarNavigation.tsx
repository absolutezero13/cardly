import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import { Platform } from "react-native";

import HomeScreen from "@/screens/HomeScreen";

type TabParamList = {
  Cardly: undefined;
};

const Tabs = createNativeBottomTabNavigator<TabParamList>();

const TabBarNavigation = () => {
  return (
    <Tabs.Navigator hapticFeedbackEnabled initialRouteName="Cardly">
      <Tabs.Screen
        name="Cardly"
        component={HomeScreen}
        options={{
          title: "Cardly",
          tabBarIcon: () =>
            Platform.select({
              ios: { sfSymbol: "creditcard" },
              default: require("../../assets/images/tabIcons/home.png"),
            }),
        }}
      />
    </Tabs.Navigator>
  );
};

export default TabBarNavigation;
