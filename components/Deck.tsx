import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Card as CardComponent } from './Card'; // Named import from optimized Card.tsx
import { Card } from '../types/Types';

interface DeckProps {
  /** The current card on top of the discard pile */
  currentCard: Card | null;
  /** Number of cards remaining in the deck */
  deckCount: number;
}

/**
 * Renders the game deck and the current card.
 * Optimized with memoization to prevent unnecessary re-renders.
 */
const Deck = memo(({ currentCard, deckCount }: DeckProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.deck}>
        <Text style={styles.deckText}>Deck: {deckCount}</Text>
      </View>
      {currentCard && (
        <CardComponent
          card={currentCard}
          onPress={() => {}}
          playable={false}
        />
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if props change
  return prevProps.deckCount === nextProps.deckCount &&
         prevProps.currentCard?.id === nextProps.currentCard?.id;
});

// Named export for consistency
export { Deck };

// Type-safe styles
interface DeckStyles {
  container: ViewStyle;
  deck: ViewStyle;
  deckText: TextStyle;
}

const styles = StyleSheet.create<DeckStyles>({
  container: {
    flexDirection: 'row',
    marginHorizontal: 20, // Replace gap with margin for compatibility
    marginVertical: 20,
    alignItems: 'center',
  },
  deck: {
    width: 80,
    height: 120,
    backgroundColor: '#666', // Slightly lighter gray for contrast
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000', // Add border for definition
    marginRight: 20, // Space between deck and current card
  },
  deckText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16, // Slightly larger for readability
  },
});