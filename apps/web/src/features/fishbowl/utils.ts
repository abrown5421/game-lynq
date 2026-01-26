import { FishbowlWord, FishbowlTeam } from './types';

export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const assignTeams = (playerIds: string[]): { team1: string[]; team2: string[] } => {
  const shuffled = shuffleArray(playerIds);
  const midpoint = Math.ceil(shuffled.length / 2);
  
  return {
    team1: shuffled.slice(0, midpoint),
    team2: shuffled.slice(midpoint),
  };
};

export const getNextPlayer = (
  currentTeam: 'team1' | 'team2',
  teams: { team1: FishbowlTeam; team2: FishbowlTeam },
  currentPlayer: string | null
): { team: 'team1' | 'team2'; player: string } => {
  const team = teams[currentTeam];
  const currentIndex = currentPlayer ? team.players.indexOf(currentPlayer) : -1;
  const nextIndex = (currentIndex + 1) % team.players.length;
  
  return {
    team: currentTeam,
    player: team.players[nextIndex],
  };
};

export const getNextTeam = (currentTeam: 'team1' | 'team2'): 'team1' | 'team2' => {
  return currentTeam === 'team1' ? 'team2' : 'team1';
};

export const getRoundName = (roundIndex: number): string => {
  const names = ['Describe It', 'Act It Out', 'One Word'];
  return names[roundIndex] || 'Unknown Round';
};

export const getRoundDescription = (roundIndex: number): string => {
  const descriptions = [
    'Use words to describe the term without saying it',
    'Act out the term without speaking or making sounds',
    'Give only ONE word as a clue for the term',
  ];
  return descriptions[roundIndex] || '';
};