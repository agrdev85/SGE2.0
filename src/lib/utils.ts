import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

export function similarityScore(a: string, b: string): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  
  if (normA === normB) return 1;
  
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(normA, normB);
  return 1 - distance / maxLen;
}

export interface SimilarItem<T> {
  item: T;
  score: number;
}

export function findSimilarItems<T>(
  items: T[],
  searchText: string,
  getName: (item: T) => string,
  threshold: number = 0.6
): SimilarItem<T>[] {
  if (!searchText.trim()) return [];
  
  const normalizedSearch = normalizeText(searchText);
  
  const scored = items.map(item => ({
    item,
    score: similarityScore(getName(item), searchText),
  }));
  
  return scored
    .filter(s => s.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

export function isDuplicate<T>(
  items: T[],
  searchText: string,
  getName: (item: T) => string
): T | undefined {
  return items.find(item => normalizeText(getName(item)) === normalizeText(searchText));
}
