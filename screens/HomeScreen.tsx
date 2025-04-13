import React, { useState, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { db } from '../firebase/FirebaseConfig';
import { Room, Player } from '../types/Types';
import { RootStackParamList } from '../App'; // Adjust path if needed

type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;

/**
 * Generates a random 4-digit room code.
 */
const generateRoomCode = (): string =>
  Math.floor(1000 + Math.random() * 9000).toString();

/**
 * Home screen for Cosmic Flip, allowing users to create or join a game room.
 */
const HomeScreen = memo(({ navigation }: HomeScreenProps) => {
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [showJoinPopup, setShowJoinPopup] = useState<boolean>(false);

  const createRoom = async () => {
    const roomCode = generateRoomCode();
    const playerId = '1'; // TODO: Consider dynamic IDs for scalability
    const initialRoom: Partial<Room> = {
      roomCode,
      players: [{ id: playerId, cards: [], isHost: true } as Player],
      isFull: false,
      currentCard: null,
      currentPlayer: null,
      countdownStart: null,
      deck: [],
      drawAmount: 0,
      direction: 1,
    };

    try {
      await db.collection('rooms').doc(roomCode).set(initialRoom);
      navigation.navigate('Lobby', { roomCode, isHost: true, playerId });
    } catch (error) {
      console.error('Error creating room:', error.message);
      Alert.alert('Error', 'Failed to create room. Try again.');
    }
  };

  const joinRoom = async () => {
    if (!roomCodeInput) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    const roomRef = db.collection('rooms').doc(roomCodeInput);
    try {
      const roomSnap = await roomRef.get();
      const roomData = roomSnap.data() as Room | undefined;

      if (roomSnap.exists && roomData && !roomData.isFull) {
        const playerId = '2'; // TODO: Consider dynamic IDs
        const newPlayer: Player = { id: playerId, cards: [], isHost: false };
        await roomRef.update({
          players: [...roomData.players, newPlayer],
          isFull: true,
          countdownStart: Date.now() + 1000,
        });
        setShowJoinPopup(false);
        navigation.navigate('Lobby', { roomCode: roomCodeInput, isHost: false, playerId });
      } else {
        Alert.alert('Error', 'Room not found or already full');
      }
    } catch (error) {
      console.error('Error joining room:', error.message);
      Alert.alert('Error', 'Failed to join room. Check the code and try again.');
    }
  };

  const handleJoinRoomClick = () => setShowJoinPopup(true);

  return (
    <View style={styles.container}>
      <View style={[styles.content, { opacity: showJoinPopup ? 0.3 : 1 }]}>
        <Text style={styles.title}>Cosmic Flip</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.createButton} onPress={createRoom}>
            <Text style={styles.createButtonText}>Create Room</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.joinRoomButton} onPress={handleJoinRoomClick}>
            <Text style={styles.joinRoomButtonText}>Join Room</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showJoinPopup && (
        <>
          <View style={styles.blurOverlay} />
          <View style={styles.popup}>
            <TextInput
              style={styles.input}
              value={roomCodeInput}
              onChangeText={setRoomCodeInput}
              placeholder="Enter Room Code"
              placeholderTextColor="#888"
              keyboardType="numeric"
              maxLength={4}
              autoFocus
            />
            <View style={styles.popupButtons}>
              <TouchableOpacity style={styles.popupButtonJoin} onPress={joinRoom}>
                <Text style={styles.popupButtonJoinText}>Join</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.popupButtonCancel}
                onPress={() => setShowJoinPopup(false)}
              >
                <Text style={styles.popupButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
});

// Update navigation options for React Navigation v6+
HomeScreen.options = { headerShown: false };

export default HomeScreen;

// Type-safe styles
interface HomeStyles {
  container: ViewStyle;
  content: ViewStyle;
  title: TextStyle;
  buttonContainer: ViewStyle;
  createButton: ViewStyle;
  createButtonText: TextStyle;
  joinRoomButton: ViewStyle;
  joinRoomButtonText: TextStyle;
  blurOverlay: ViewStyle;
  popup: ViewStyle;
  input: TextStyle & ViewStyle;
  popupButtons: ViewStyle;
  popupButtonJoin: ViewStyle;
  popupButtonJoinText: TextStyle;
  popupButtonCancel: ViewStyle;
  popupButtonCancelText: TextStyle;
}

const styles = StyleSheet.create<HomeStyles>({
  container: {
    flex: 1,
    backgroundColor: '#0A0A23',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    color: '#00FFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '60%',
    marginVertical: 20, // Replace gap with margin
  },
  createButton: {
    backgroundColor: '#00FFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00FFFF',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    marginBottom: 20, // Space between buttons
  },
  createButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  joinRoomButton: {
    backgroundColor: '#FF00FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF00FF',
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  joinRoomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#FF00FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(128, 128, 128, 0.7)',
  },
  popup: {
    position: 'absolute',
    backgroundColor: '#1A1A3D',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00FFFF',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FF00FF',
    padding: 10,
    width: 200,
    color: '#FFFFFF',
    backgroundColor: '#2A2A50',
    borderRadius: 5,
    marginBottom: 15,
  },
  popupButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  popupButtonJoin: {
    backgroundColor: '#00FF00',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00FF00',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  popupButtonJoinText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  popupButtonCancel: {
    backgroundColor: '#FF4444',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4444',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  popupButtonCancelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});