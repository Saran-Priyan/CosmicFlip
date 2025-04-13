import React, { memo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';

export type RootStackParamList = {
  Home: undefined;
  Lobby: {
    roomCode: string;
    playerId: string;
    isHost?: boolean;
  };
  Game: {
    roomCode: string;
    playerId: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const App = memo(() => {
  return (
    <>
      <StatusBar hidden /> {/* Hide status bar app-wide */}
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Lobby" component={LobbyScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
});

export default App;