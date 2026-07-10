import { StyleSheet, Text, View } from 'react-native';

import { Colors, Layout, Typography } from '@/theme/Theme';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>cardly</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.screenHorizontalPadding,
    paddingVertical: Layout.screenVerticalPadding,
    backgroundColor: Colors.background,
  },
  title: {
    ...Typography.title,
    color: Colors.text,
  },
});

export default HomeScreen;
