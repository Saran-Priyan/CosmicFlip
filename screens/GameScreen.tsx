import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { db } from '../firebase/FirebaseConfig';
import { Card as CardComponent } from '../components/Card';
import { Deck } from '../components/Deck';
import { Card, Room, Player, WildColorChoice } from '../types/Types';
import { RootStackParamList } from '../App';

type GameScreenProps = StackScreenProps<RootStackParamList, 'Game'>;

const GameScreen = memo(({ route, navigation }: GameScreenProps) => {
  const { roomCode, playerId } = route.params;
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = db.collection('rooms').doc(roomCode).onSnapshot(
      (doc) => {
        if (!mounted) return;
        if (doc.exists) {
          const data = doc.data() as Room;
          const updatedRoom = {
            ...data,
            players: data.players.map((p) => ({
              ...p,
              cards: sortCards(p.cards || []),
            })),
          };
          setRoom(updatedRoom);
          if (data.deck.length > 0 && data.players.every((p) => p.cards.length >= 0)) {
            setIsInitialized(true);
          }
          if (isInitialized) {
            const gameWinner = checkForWinner(updatedRoom.players);
            if (gameWinner && !winner) {
              setWinner(gameWinner);
              handleGameEnd(gameWinner);
            }
          }
          setError(null);
        } else {
          setRoom(null);
          setError('Room not found - game likely ended');
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
      },
      (err) => setError(`Snapshot failed: ${err.message}`)
    );

    db.collection('rooms').doc(roomCode).get()
      .then((doc) => {
        if (doc.exists && playerId === '1') {
          const data = doc.data() as Room;
          if (!data.deck.length || !data.players.every((p) => p.cards.length > 0)) {
            initializeGame();
          }
        }
      })
      .catch((err) => setError(`Fetch failed: ${err.message}`));

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [roomCode, playerId, navigation]);

  const sortCards = (cards: Card[]): Card[] => {
    const elementOrder: Record<Card['element'], number> = {
      wild: 0, fire: 1, water: 2, grass: 3, electric: 4,
    };
    const valueOrder: Record<Card['value'], number> = {
      '0': 0, '1': 1, '2': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      skip: 10, reverse: 11, '+2': 12, '+4': 13, wild: 14,
    };
    return [...cards].sort((a, b) => {
      const elementDiff = elementOrder[a.element] - elementOrder[b.element];
      return elementDiff !== 0 ? elementDiff : valueOrder[a.value] - valueOrder[b.value];
    });
  };

  const initializeGame = async () => {
    const fullDeck = generateDeck();
    const shuffled = fullDeck.sort(() => Math.random() - 0.5);
    const playerCards = [shuffled.slice(0, 7), shuffled.slice(7, 14)];
    const remainingDeck = shuffled.slice(14);
    let startingCard = remainingDeck.pop();
    while (
      startingCard &&
      ['+2', '+4', 'skip', 'reverse', 'wild'].includes(startingCard.value)
    ) {
      remainingDeck.unshift(startingCard);
      remainingDeck.sort(() => Math.random() - 0.5);
      startingCard = remainingDeck.pop();
    }
    const gameData: Room = {
      roomCode,
      players: [
        { id: '1', cards: sortCards(playerCards[0]), isHost: true },
        { id: '2', cards: sortCards(playerCards[1]), isHost: false },
      ],
      deck: remainingDeck,
      currentCard: startingCard || shuffled[0],
      currentPlayer: Math.random() < 0.5 ? '1' : '2',
      direction: 1,
      drawAmount: 0,
      isFull: true,
      countdownStart: null,
    };

    try {
      await db.collection('rooms').doc(roomCode).set(gameData, { merge: true });
      setIsInitialized(true);
    } catch (err) {
      setError(`Init failed: ${err.message}`);
    }
  };

  const generateDeck = (): Card[] => {
    const elements: Card['element'][] = ['fire', 'water', 'grass', 'electric'];
    const values: Card['value'][] = [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', 'skip', 'reverse',
    ];
    const deck: Card[] = [];
    elements.forEach((element) =>
      values.forEach((value) =>
        deck.push({ id: `${element}-${value}-${Math.random()}`, element, value })
      )
    );
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `wild-${i}`, element: 'wild', value: 'wild' });
      deck.push({ id: `wild+4-${i}`, element: 'wild', value: '+4' });
    }
    return deck;
  };

  const playCard = async (card: Card) => {
    if (!room || !canPlayCard(card) || room.currentPlayer !== playerId) return;

    let nextPlayer = room.currentPlayer === '1' ? '2' : '1';
    let newDrawAmount = room.drawAmount;
    let skipNext = false;

    if (card.value === '+2') newDrawAmount += 2;
    else if (card.value === '+4') {
      newDrawAmount += 4;
      setShowColorPicker(true);
      return;
    } else if (card.element === 'wild') {
      setShowColorPicker(true);
      return;
    } else if (card.value === 'skip') {
      skipNext = true;
      nextPlayer = nextPlayer === '1' ? '2' : '1';
    } else if (card.value === 'reverse') {
      nextPlayer = room.currentPlayer;
    }

    const updatedPlayers = room.players.map((p) =>
      p.id === playerId ? { ...p, cards: p.cards.filter((c) => c.id !== card.id) } : p
    );

    try {
      await db.collection('rooms').doc(roomCode).update({
        currentCard: card,
        currentPlayer: nextPlayer,
        players: updatedPlayers,
        drawAmount: newDrawAmount,
      });
    } catch (err) {
      setError(`Play failed: ${err.message}`);
    }
  };

  const selectColor = async (color: WildColorChoice) => {
    if (!room || !showColorPicker) return;
    const card = room.players
      .find((p) => p.id === playerId)
      ?.cards.find((c) => c.element === 'wild' || c.value === '+4');
    if (!card) return;

    const updatedPlayers = room.players.map((p) =>
      p.id === playerId ? { ...p, cards: p.cards.filter((c) => c.id !== card.id) } : p
    );
    const nextPlayer = room.currentPlayer === '1' ? '2' : '1';
    const newDrawAmount = card.value === '+4' ? room.drawAmount + 4 : room.drawAmount;

    try {
      await db.collection('rooms').doc(roomCode).update({
        currentCard: { ...card, element: color },
        currentPlayer: nextPlayer,
        players: updatedPlayers,
        drawAmount: newDrawAmount,
      });
      setShowColorPicker(false);
    } catch (err) {
      setError(`Color select failed: ${err.message}`);
    }
  };

  const drawCard = async () => {
    if (!room || room.currentPlayer !== playerId || room.deck.length === 0 || room.drawAmount > 0) return;
    const newCard = room.deck[0];
    const newDeck = room.deck.slice(1);
    const updatedPlayers = room.players.map((p) =>
      p.id === playerId ? { ...p, cards: [...p.cards, newCard] } : p
    );

    try {
      await db.collection('rooms').doc(roomCode).update({
        deck: newDeck,
        players: updatedPlayers,
        currentPlayer: room.currentPlayer === '1' ? '2' : '1',
        drawAmount: 0,
      });
    } catch (err) {
      setError(`Draw failed: ${err.message}`);
    }
  };

  const acceptDraw = async () => {
    if (!room || room.currentPlayer !== playerId || room.drawAmount === 0 || room.deck.length < room.drawAmount) {
      setError('Not enough cards in deck');
      return;
    }

    const cardsToDraw = room.deck.slice(0, room.drawAmount);
    const newDeck = room.deck.slice(room.drawAmount);
    const updatedPlayers = room.players.map((p) =>
      p.id === playerId ? { ...p, cards: [...p.cards, ...cardsToDraw] } : p
    );

    try {
      await db.collection('rooms').doc(roomCode).update({
        deck: newDeck,
        players: updatedPlayers,
        currentPlayer: room.currentPlayer === '1' ? '2' : '1',
        drawAmount: 0,
      });
    } catch (err) {
      setError(`Accept draw failed: ${err.message}`);
    }
  };

  const handleAutoDraw = async () => {
    if (!room || room.currentPlayer !== playerId || room.drawAmount === 0 || room.deck.length < room.drawAmount) {
      setError('Not enough cards in deck');
      return;
    }

    const cardsToDraw = room.deck.slice(0, room.drawAmount);
    const newDeck = room.deck.slice(room.drawAmount);
    const updatedPlayers = room.players.map((p) =>
      p.id === playerId ? { ...p, cards: [...p.cards, ...cardsToDraw] } : p
    );

    try {
      await db.collection('rooms').doc(roomCode).update({
        deck: newDeck,
        players: updatedPlayers,
        currentPlayer: room.currentPlayer === '1' ? '2' : '1', // Fixed ternary operator
        drawAmount: 0,
      });
    } catch (err) {
      setError(`Auto draw failed: ${err.message}`);
    }
  };

  const canPlayCard = (card: Card): boolean => {
    if (!room?.currentCard) return true;
    if (room.drawAmount > 0) {
      if (room.currentCard.value === '+2') return card.value === '+2' || card.value === '+4';
      if (room.currentCard.value === '+4') return card.value === '+4';
    }
    return (
      card.element === 'wild' ||
      card.value === '+4' ||
      card.element === room.currentCard.element ||
      card.value === room.currentCard.value
    );
  };

  const isStackableCard = (card: Card): boolean => {
    if (!room?.currentCard || room.drawAmount === 0) return false;
    if (room.currentCard.value === '+2') return card.value === '+2' || card.value === '+4';
    if (room.currentCard.value === '+4') return card.value === '+4';
    return false;
  };

  const checkForWinner = (players: Player[]): Player | null => {
    const winner = players.find((p) => p.cards.length === 0);
    return winner || null;
  };

  const handleGameEnd = async (winner: Player) => {
    Alert.alert(
      'Game Over',
      `Player ${winner.id} wins!`,
      [
        {
          text: 'OK',
          onPress: async () => {
            try {
              await db.collection('rooms').doc(roomCode).delete();
              setRoom(null);
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            } catch (err) {
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (!room || error) {
    return (
      <View style={styles.container}>
        {error && <Text style={styles.errorText}>Error: {error}</Text>}
      </View>
    );
  }

  const myCards = room.players.find((p) => p.id === playerId)?.cards || [];
  const opponentCards = room.players.find((p) => p.id !== playerId)?.cards.length || 0;

  const gameWinner = checkForWinner(room.players);
  if (gameWinner && !winner) {
    setWinner(gameWinner);
    handleGameEnd(gameWinner);
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>Player ID: {playerId}</Text>
      <Deck currentCard={room.currentCard} deckCount={room.deck.length} />
      <Text style={styles.infoText}>
        Current Player: {room.currentPlayer === playerId ? 'You' : 'Opponent'}
      </Text>
      {room.drawAmount > 0 && room.currentPlayer === playerId && (
        <>
          <Text style={styles.warning}>
            {myCards.some((card) => canPlayCard(card))
              ? `Draw ${room.drawAmount} cards or stack!`
              : `Drawing ${room.drawAmount} cards...`}
          </Text>
          {myCards.some((card) => canPlayCard(card)) ? (
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={acceptDraw}
              disabled={room.deck.length < room.drawAmount}
            >
              <Text style={styles.buttonText}>Accept Draw (+{room.drawAmount})</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAutoDraw}
              disabled={room.deck.length < room.drawAmount}
            >
              <Text style={styles.buttonText}>Confirm Draw (+{room.drawAmount})</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      {room.currentPlayer === playerId && room.drawAmount === 0 && (
        <TouchableOpacity style={styles.drawButton} onPress={drawCard} disabled={room.deck.length === 0}>
          <Text style={styles.buttonText}>Draw Card</Text>
        </TouchableOpacity>
      )}
      {showColorPicker && room.currentPlayer === playerId && (
        <View style={styles.colorPicker}>
          {(['fire', 'grass', 'electric', 'water'] as WildColorChoice[]).map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color === 'fire' ? 'red' : color === 'grass' ? 'green' : color === 'electric' ? 'yellow' : 'blue' },
              ]}
              onPress={() => selectColor(color)}
            >
              <Text style={styles.buttonText}>{color}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <Text style={styles.infoText}>
        Your Cards: {myCards.length} | Opponent's Cards: {opponentCards}
      </Text>
      <ScrollView horizontal contentContainerStyle={styles.cardContainer}>
        {myCards.map((card) => (
          <CardComponent
            key={card.id}
            card={card}
            onPress={() => playCard(card)}
            playable={canPlayCard(card) && room.currentPlayer === playerId}
            highlight={isStackableCard(card)}
          />
        ))}
      </ScrollView>
    </View>
  );
});

export default GameScreen;

interface GameStyles {
  container: ViewStyle;
  infoText: TextStyle;
  errorText: TextStyle;
  warning: TextStyle;
  drawButton: ViewStyle;
  acceptButton: ViewStyle;
  buttonText: TextStyle;
  colorPicker: ViewStyle;
  colorButton: ViewStyle;
  cardContainer: ViewStyle;
}

const styles = StyleSheet.create<GameStyles>({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  infoText: {
    color: '#000000',
    fontSize: 16,
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  warning: {
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  drawButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  acceptButton: {
    backgroundColor: '#FF9500',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  colorPicker: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-around',
    width: '80%',
  },
  colorButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: 70,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
});