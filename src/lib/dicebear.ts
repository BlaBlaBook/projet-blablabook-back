import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';
import * as adventurer from '@dicebear/adventurer';
import * as bigSmile from '@dicebear/big-smile';
import * as bottts from '@dicebear/bottts';

// Définir un type pour les collections valides
type CollectionName = 'avataaars' | 'adventurer' | 'big-smile' | 'bottts';

// Collection par défaut
const DEFAULT_COLLECTION: CollectionName = 'bottts';

// Map pour simplifier la sélection
const COLLECTIONS: Record<CollectionName, any> = {
  avataaars,
  adventurer,
  'big-smile': bigSmile,
  bottts,
};

/**
 * Génère un avatar DiceBear selon la collection par défaut
 * @param seed - Seed unique pour un avatar déterministe
 * @returns SVG string
 */
export function generateDiceBearAvatar(seed: string): string {
  try {
    const collection = COLLECTIONS[DEFAULT_COLLECTION];
    const avatar = createAvatar(collection, { seed, size: 128 });
    return avatar.toString();
  } catch (error) {
    console.error('Error generating DiceBear avatar:', error);
    return getDefaultAvatarSVG();
  }
}

/**
 * Génère un nouveau seed aléatoire pour la regénération d'avatar
 */
export function generateRandomAvatarSeed(): string {
  return Math.random().toString(36).substring(2, 15)
       + Math.random().toString(36).substring(2, 15);
}

/**
 * Fallback avatar SVG si DiceBear échoue
 */
function getDefaultAvatarSVG(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#b6e3f4" rx="64"/>
  <circle cx="64" cy="64" r="40" fill="#ffffff"/>
  <circle cx="52" cy="52" r="8" fill="#333333"/>
  <circle cx="76" cy="52" r="8" fill="#333333"/>
  <path d="M45 80 Q64 95 83 80" stroke="#333333" stroke-width="3" fill="none"/>
</svg>`;
}
