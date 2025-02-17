function normalizeText(text: string): string {
  let normalizedText = text.toLowerCase();

  // Remove all double spaces
  normalizedText = normalizedText.replace(/\s+/g, " ");
  // Remove all leading and trailing spaces
  normalizedText = normalizedText.trim();
  // Replace ß with ss
  normalizedText = normalizedText.replace(/ß/g, "ss");
  // Remove all punctuation and special characters
  normalizedText = normalizedText.replace(/[.,?!:;]/g, "");
  // Remove all spaces and special characters
  normalizedText = normalizedText.replace(/[^a-z0-9]/g, "");

  return normalizedText;
}

export function checkSolution(guess: string, solution: string): boolean {
  return normalizeText(guess) === normalizeText(solution);
} 