import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabBarNavigation from "@/navigation/TabBarNavigation";
import CardDetailScreen from "@/screens/CardDetailScreen";
import ScanCardScreen from "@/screens/ScanCardScreen";
import WelcomeScreen from "@/screens/WelcomeScreen";
import type { UserCard } from "@/services/cards";
import type { ScanCardResult } from "@/services/scan";
import { Colors } from "@/theme/Theme";

export type CardDetailParams =
  | {
      kind: "scanResult";
      result: ScanCardResult;
      frontUri: string;
      backUri: string;
    }
  | {
      kind: "savedCard";
      card: UserCard;
    };

export type RootStackParamList = {
  Welcome: undefined;
  HomeTabs: undefined;
  ScanCard: undefined;
  CardDetail: CardDetailParams;
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
            name="CardDetail"
            component={CardDetailScreen}
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
