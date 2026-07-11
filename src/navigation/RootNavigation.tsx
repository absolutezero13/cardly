import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabBarNavigation from "@/navigation/TabBarNavigation";
import AddCardsToCollectionScreen from "@/screens/AddCardsToCollectionScreen";
import CardDetailScreen from "@/screens/CardDetailScreen";
import CollectionDetailScreen from "@/screens/CollectionDetailScreen";
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

export type CollectionDetailParams =
  | {
      kind: "favorite";
    }
  | {
      kind: "collection";
      collectionId: string;
      name: string;
    };

export type RootStackParamList = {
  Welcome: undefined;
  HomeTabs: undefined;
  ScanCard: undefined;
  CardDetail: CardDetailParams;
  CollectionDetail: CollectionDetailParams;
  AddCardsToCollection: CollectionDetailParams;
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
            }}
          />
          <Stack.Screen
            name="CollectionDetail"
            component={CollectionDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddCardsToCollection"
            component={AddCardsToCollectionScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="CardDetail"
            component={CardDetailScreen}
            options={{
              headerShown: false,
              presentation: "modal",
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
