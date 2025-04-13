import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { db } from '../firebase/FirebaseConfig';
import { Room } from '../types/Types';
import { RootStackParamList } from '../App'; // Adjust path if needed

type LobbyScreenProps = StackScreenProps<RootStackParamList, 'Lobby'>;

/**
 * Lobby screen where players wait before the game starts.
 */
const LobbyScreen = memo(({ route, navigation }: LobbyScreenProps) => {
  const { isHost, roomCode, playerId } = route.params;
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = db.collection('rooms').doc(roomCode).onSnapshot(
      (doc) => {
        const data = doc.data() as Room | undefined;
        if (data) {
          setPlayerCount(data.players.length);

          if (data.countdownStart) {
            handleCountdown(data.countdownStart);
          }
        } else {
          navigation.navigate('Home');
        }
      },
      (error) => {
        console.error('Snapshot error in Lobby:', error.message);
      }
    );

    return () => unsubscribe();
  }, [roomCode, playerId, navigation]);

  const handleCountdown = (startTime: number) => {
    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = 3 - elapsed;

      if (remaining <= 0) {
        setCountdown(null);
        navigation.navigate('Game', { roomCode, playerId });
      } else if (countdown === null || remaining !== countdown) {
        setCountdown(remaining);
      }
    };

    updateCountdown(); // Initial update
    const interval = setInterval(updateCountdown, 500); // Reduced frequency
    return () => clearInterval(interval);
  };

  const cancelRoom = async () => {
    if (!isHost) return;
    try {
      await db.collection('rooms').doc(roomCode).delete();
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error cancelling room:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>Room Code: {roomCode}</Text>
      <Text style={styles.infoText}>Crew: {playerCount}/2</Text>
      {countdown !== null && (
        <Text style={styles.countdownText}>Launch in {countdown}...</Text>
      )}
      {isHost && playerCount < 2 && (
        <TouchableOpacity style={styles.cancelButton} onPress={cancelRoom}>
          <Text style={styles.cancelButtonText}>Abort Mission</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// Update navigation options for React Navigation v6+
LobbyScreen.options = { headerShown: false };

export default LobbyScreen;

// Type-safe styles
interface LobbyStyles {
  container: ViewStyle;
  infoText: TextStyle;
  countdownText: TextStyle;
  cancelButton: ViewStyle;
  cancelButtonText: TextStyle;
}

const styles = StyleSheet.create<LobbyStyles>({
  container: {
    flex: 1,
    backgroundColor: '#0A0A23',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    marginBottom: 20, // Replace marginVertical
  },
  countdownText: {
    color: '#FF00FF',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4444',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});