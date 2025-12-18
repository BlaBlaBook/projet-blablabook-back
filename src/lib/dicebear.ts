import { createAvatar } from "@dicebear/core";
import * as avataaars from "@dicebear/avataaars";
import * as adventurer from "@dicebear/adventurer";
import * as bigSmile from "@dicebear/big-smile";
import * as bottts from "@dicebear/bottts";
import { getPrisma } from "../models/index.ts";

const prisma = getPrisma();

// Types for valid collections
type CollectionName = "avataaars" | "adventurer" | "big-smile" | "bottts";

// Default collection
const DEFAULT_COLLECTION: CollectionName = "bottts";

// Map to simplify selection
const COLLECTIONS: Record<CollectionName, any> = {
	avataaars,
	adventurer,
	"big-smile": bigSmile,
	bottts,
};

// -----------------------------------------------
// Generate an avatar SVG using default collection
// -----------------------------------------------
export function generateDiceBearAvatar(seed: string): string {
	try {
		const collection = COLLECTIONS[DEFAULT_COLLECTION];
		const avatar = createAvatar(collection, { seed, size: 128 });
		return avatar.toString();
	} catch (error) {
		console.error("Error generating DiceBear avatar:", error);
		return getDefaultAvatarSVG();
	}
}

// -------------------------------------------------
// Generate a new random seed to generate avatar SVG
// -------------------------------------------------
export function generateRandomAvatarSeed(): string {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	);
}

// -------------------------------------
// Fallback avatar SVG if DiceBear fails
// -------------------------------------
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

// ------------------------------------
// Verify if user already has an avatar
// ------------------------------------
export async function verifyAvatar(
	userId: string,
	username: string,
	avatarSeed?: string | null,
) {
	const seed = avatarSeed || username;
	const avatar = generateDiceBearAvatar(seed);
	return prisma.users.update({
		where: { id: userId },
		data: { avatar_url: avatar, avatar_seed: avatarSeed ?? seed },
	});
}
