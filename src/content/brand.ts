// Brand and shared UI text. Rename the app here. (Storage key "p2k:v1" is internal; keep it so saved progress survives renames.)
export const BRAND = {
  name: "Pip's Chess Quest",
  tagline: 'Learn chess from zero. Every mistake explained.',
  coach: 'Pip',
  coachEmoji: '♟️',
  promise: 'Every mistake is explained. Every rule is practiced until remembered.',
};

export const COACH = {
  welcome: "Hi! I'm Pip, a little pawn with a big dream: to become a queen. Let's learn chess together!",
  hintLabels: ['Think about it', 'Look here', 'Show me'],
  cheers: ['Great move!', 'Perfect!', 'You got it!', 'Nice work!', 'Brilliant!', 'Well done!'],
  gentle: ['Not quite. Try again!', 'Good try. Look again.', 'Almost! Have another go.', 'No worries. Mistakes help us learn.'],
  stageClear: 'Stage clear! You are growing strong.',
  breakTime: 'Great session! Your brain remembers more after a rest.',
  graduation: 'You did it! Pip is now a Queen — and you are ready to play real chess.',
};

export const NAV = [
  { to: '/', label: 'Journey', icon: '🗺️' },
  { to: '/review', label: 'Review', icon: '🧩' },
  { to: '/arena', label: 'Arena', icon: '⚔️' },
  { to: '/profile', label: 'Profile', icon: '🏅' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export const END_TEXT: Record<string, string> = {
  checkmate: 'Checkmate!',
  stalemate: 'Stalemate — a draw. The player to move has no legal move but is not in check.',
  insufficient: 'Draw — neither side has enough pieces to checkmate.',
  threefold: 'Draw by threefold repetition.',
  fivefold: 'Draw by fivefold repetition (automatic).',
  fifty: 'Draw by the 50-move rule.',
  seventyfive: 'Draw by the 75-move rule (automatic).',
};
