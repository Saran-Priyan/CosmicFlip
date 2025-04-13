import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Card } from '../types/Types';

// Map of element to background color for efficient lookup
const ELEMENT_COLORS: Record<Card['element'], string> = {
  fire: 'red',
  water: 'blue',
  grass: 'green',
  electric: 'yellow',
  wild: 'orange',
};

// Determine text color based on background for contrast
const getTextColor = (bgColor: string): string => {
  // Simple heuristic: light backgrounds (yellow, orange) get dark text
  return ['yellow', 'orange'].includes(bgColor) ? 'black' : 'white';
};

interface CardProps {
  /** The card to render */
  card: Card;
  /** Callback when the card is pressed */
  onPress: () => void;
  /** Whether the card can be played */
  playable: boolean;
  /** Whether to highlight the card (e.g., for stacking) */
  highlight?: boolean;
}

/**
 * Renders a single card with its element and value.
 * Optimized with memoization to prevent unnecessary re-renders.
 */
const CardComponent = memo(
  ({ card, onPress, playable, highlight }: CardProps) => {
    const backgroundColor = ELEMENT_COLORS[card.element];
    const textColor = getTextColor(backgroundColor);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor, opacity: playable ? 1 : 0.5 },
          highlight && styles.highlight,
        ]}
        onPress={onPress}
        disabled={!playable}
      >
        <Text style={[styles.text, { color: textColor }]}>
          {`${card.element} ${card.value}`}
        </Text>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if props change
    return (
      prevProps.card.id === nextProps.card.id &&
      prevProps.playable === nextProps.playable &&
      prevProps.highlight === nextProps.highlight &&
      prevProps.onPress === nextProps.onPress
    );
  },
);

// Named export as "Card" for consistency with other components
export { CardComponent as Card };

// Type-safe styles
interface CardStyles {
  card: ViewStyle;
  text: TextStyle;
  highlight: ViewStyle;
}

const styles = StyleSheet.create<CardStyles>({
  card: {
    width: 80,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000', // Default border for visibility
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16, // Slightly larger for readability
  },
  highlight: {
    borderColor: 'gold',
    borderWidth: 3,
  },
});