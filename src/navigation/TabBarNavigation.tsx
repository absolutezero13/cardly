import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import { Platform, StyleSheet, View } from "react-native";

import ScanCardButton from "@/components/ScanCardButton";
import CollectionsScreen from "@/screens/CollectionsScreen";
import HistoryScreen from "@/screens/HistoryScreen";
import HomeScreen from "@/screens/HomeScreen";
import { Colors } from "@/theme/Theme";

type TabParamList = {
  Home: undefined;
  Collections: undefined;
  History: undefined;
};

const Tabs = createNativeBottomTabNavigator<TabParamList>();

const TabBarNavigation = () => {
  return (
    <View style={styles.container}>
      <Tabs.Navigator
        hapticFeedbackEnabled
        initialRouteName="Home"
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          sceneStyle: { backgroundColor: Colors.background },
        }}
      >
        <Tabs.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "Home",
            tabBarIcon: () =>
              Platform.select({
                ios: { sfSymbol: "house.fill" },
                default: require("../../assets/images/CardlyIcon.png"),
              }),
          }}
        />
        <Tabs.Screen
          name="Collections"
          component={CollectionsScreen}
          options={{
            title: "Collections",
            tabBarIcon: () =>
              Platform.select({
                ios: { sfSymbol: "square.stack.3d.up" },
                default: require("../../assets/images/CardlyIcon.png"),
              }),
          }}
        />
        <Tabs.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: "History",
            tabBarIcon: () =>
              Platform.select({
                ios: { sfSymbol: "clock.arrow.circlepath" },
                default: require("../../assets/images/CardlyIcon.png"),
              }),
          }}
        />
      </Tabs.Navigator>
      <ScanCardButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TabBarNavigation;
