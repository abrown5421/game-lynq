import { PlayerSubmission } from './types';

const stripMetadata = (str: string): string => {
  return str
    .replace(/\s*[\(\[].*?(remaster(ed)?|version|edit|mono|stereo).*?[\)\]]/gi, '')
    .replace(/\s*[\(\[]?(feat\.?|featuring|ft\.?|with)\s+.*?[\)\]]?/gi, '')
    .replace(/\s*-\s*(feat\.?|featuring|ft\.?|with).*$/gi, '')
    .trim();
};

const normalizeString = (str: string): string => {
  const stripped = stripMetadata(str);

  return stripped
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
};

const levenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[a.length][b.length];
};

export const checkAnswer = (guess: string, correct: string): boolean => {
  const normalizedGuess = normalizeString(guess);
  const normalizedCorrect = normalizeString(correct);

  if (!normalizedGuess || !normalizedCorrect) return false;

  if (
    normalizedGuess === normalizedCorrect ||
    normalizedGuess.includes(normalizedCorrect) ||
    normalizedCorrect.includes(normalizedGuess)
  ) {
    return true;
  }

  const distance = levenshteinDistance(normalizedGuess, normalizedCorrect);
  const threshold = Math.floor(normalizedCorrect.length / 3);

  return distance <= threshold;
};

export const calculateScore = (
  submission: PlayerSubmission,
  correctTrack: string,
  correctArtist: string,
  allSubmissions: PlayerSubmission[],
  guessArtist: boolean = true
): number => {
  const trackCorrect = checkAnswer(submission.trackGuess, correctTrack);
  const artistCorrect = guessArtist ? checkAnswer(submission.artistGuess, correctArtist) : true;

  // If artist guessing is disabled, only check track
  if (!guessArtist) {
    if (!trackCorrect) return 0;
  } else {
    if (!trackCorrect && !artistCorrect) return 0;
  }

  const basePoints = trackCorrect && artistCorrect ? 800 : 400;

  const correctSubmissions = allSubmissions.filter(s => {
    const t = checkAnswer(s.trackGuess, correctTrack);
    const a = guessArtist ? checkAnswer(s.artistGuess, correctArtist) : true;
    return t || (guessArtist && a);
  });

  const sortedCorrect = [...correctSubmissions].sort(
    (a, b) => a.submittedAt - b.submittedAt
  );

  const position = sortedCorrect.findIndex(
    s => s.playerId === submission.playerId
  );

  const speedBonuses = [200, 150, 100, 50];
  const speedBonus =
    position >= 0 && position < speedBonuses.length
      ? speedBonuses[position]
      : 0;

  return basePoints + speedBonus;
};

export const processSubmissions = (
  submissions: PlayerSubmission[],
  correctTrack: string,
  correctArtist: string,
  guessArtist: boolean = true
): PlayerSubmission[] => {
  return submissions.map(submission => {
    const trackCorrect = checkAnswer(submission.trackGuess, correctTrack);
    const artistCorrect = guessArtist ? checkAnswer(submission.artistGuess, correctArtist) : true;
    const points = calculateScore(
      submission,
      correctTrack,
      correctArtist,
      submissions,
      guessArtist
    );

    return {
      ...submission,
      trackCorrect,
      artistCorrect,
      points,
    };
  });
};

export function getHighResArtwork(url: string, size = 600): string {
  if (!url) return url;
  return url.replace(/\/\d+x\d+bb\.jpg$/, `/${size}x${size}bb.jpg`);
}