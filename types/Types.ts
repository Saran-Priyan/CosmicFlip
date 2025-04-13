/**
 * Represents a single card in the Cosmic Flip game.
 */
 export interface Card {
  /** Unique identifier for the card */
  id: string;
  /** Elemental type of the card */
  element: 'fire' | 'water' | 'grass' | 'electric' | 'wild';
  /** Value or action of the card */
  value:
    | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' // Number cards
    | 'skip' | 'reverse' | '+2' | '+4' | 'wild'; // Action cards
}

/**
 * Represents a player in the game.
 */
export interface Player {
  /** Unique player ID (e.g., "1" or "2") */
  id: string;
  /** Array of cards in the player's hand */
  cards: Card[];
  /** Whether the player is the room host */
  isHost: boolean;
}

/**
 * Represents a game room stored in Firestore.
 */
export interface Room {
  /** Unique 4-digit code for the room */
  roomCode: string;
  /** List of players in the room (currently max 2) */
  players: Player[];
  /** Whether the room is full (2 players) */
  isFull: boolean;
  /** The current card on the table */
  currentCard: Card | null;
  /** ID of the player whose turn it is */
  currentPlayer: string | null;
  /** Remaining cards in the deck */
  deck: Card[];
  /** Number of cards to draw (e.g., from +2 or +4) */
  drawAmount: number;
  /** Direction of play (1 for forward, -1 for reverse) */
  direction: 1 | -1;
  /** Timestamp (ms) when countdown starts in Lobby, null if not started */
  countdownStart: number | null;
}

/**
 * Possible colors a player can choose for wild cards.
 */
export type WildColorChoice = 'fire' | 'water' | 'grass' | 'electric';

/**
 * Actions a player can take during their turn.
 * Useful for separating game logic into a backend file.
 */
export type GameAction =
  | { type: 'PLAY_CARD'; card: Card }
  | { type: 'DRAW_CARD' }
  | { type: 'ACCEPT_DRAW' }
  | { type: 'SELECT_COLOR'; color: WildColorChoice };