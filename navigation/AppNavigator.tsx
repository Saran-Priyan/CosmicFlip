import React, { memo } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import LobbyScreen from '../screens/LobbyScreen';
import GameScreen from '../screens/GameScreen';
import { RootStackParamList } from '../App'; // Adjust path if needed

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Stack navigator for the Cosmic Flip app screens.
 * Memoized to prevent unnecessary re-renders.
 */
const AppNavigator = memo(() => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Lobby" component={LobbyScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
    </Stack.Navigator>
  );
});

export default AppNavigator;