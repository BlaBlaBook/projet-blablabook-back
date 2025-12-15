import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';
import * as adventurer from '@dicebear/adventurer';
import * as bigSmile from '@dicebear/big-smile';
import * as bottts from '@dicebear/bottts';

// Définir un type pour les collections valides
type CollectionName = 'avataaars' | 'adventurer' | 'big-smile' | 'bottts';

// Configuration centrale: tous les utilisateurs utilisent cette collection
const DEFAULT_COLLECTION: CollectionName = 'bottts'; // Changez ici pour modifier le style pour tous

// Fonction générique pour générer un avatar avec une collection spécifique
export function generateDiceBearAvatar(seed: string): string {
  try {
    // Utiliser la collection par défaut
    if (DEFAULT_COLLECTION === 'adventurer') {
      return generateAdventurerAvatar(seed);
    } else if (DEFAULT_COLLECTION === 'big-smile') {
      return generateBigSmileAvatar(seed);
    } else if (DEFAULT_COLLECTION === 'bottts') {
      return generateBotttsAvatar(seed);
    } else {
      return generateAvataaarsAvatar(seed);
    }
  } catch (error) {
    console.error('Error generating DiceBear avatar:', error);
    return getDefaultAvatarSVG();
  }
}

// Fonctions spécifiques pour chaque collection
function generateAvataaarsAvatar(seed: string): string {
  const avatar = createAvatar(avataaars, {
    seed: seed,
    size: 128,
    backgroundColor: ['b6e3f4'],
    radius: 50,
  });
  return avatar.toString();
}

function generateAdventurerAvatar(seed: string): string {
  const avatar = createAvatar(adventurer, {
    seed: seed,
    size: 128,
  });
  return avatar.toString();
}

function generateBigSmileAvatar(seed: string): string {
  const avatar = createAvatar(bigSmile, {
    seed: seed,
    size: 128,
  });
  return avatar.toString();
}

function generateBotttsAvatar(seed: string): string {
  const avatar = createAvatar(bottts, {
    seed: seed,
    size: 128,
  });
  return avatar.toString();
}

/**
 * Generate a new random seed for avatar regeneration
 * @returns Random string to use as avatar seed
 */
export function generateRandomAvatarSeed(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a DiceBear avatar SVG string with custom options
 * @param seed - A unique string to generate consistent avatars (e.g., user ID)
 * @param options - Additional options for the avatar
 * @returns SVG string for the DiceBear avatar
 */
export function generateDiceBearAvatarWithOptions(seed: string, options: {
  size?: number;
  backgroundColor?: string;
  radius?: number;
} = {}): string {
  try {
    const avatar = createAvatar(avataaars, {
      seed: seed,
      size: options.size || 128,
      backgroundColor: [options.backgroundColor || 'b6e3f4'],
      radius: options.radius || 50,
    });
    
    return avatar.toString();
  } catch (error) {
    console.error('Error generating DiceBear avatar with options:', error);
    // Fallback to a default avatar SVG
    return getDefaultAvatarSVG();
  }
}

/**
 * Fallback default avatar SVG
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