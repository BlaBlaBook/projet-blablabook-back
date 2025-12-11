import express from "express";

// --- Typage des query params pour Google Books ---
export interface GoogleBooksQuery {
  q?: string;
  isbn?: string;
}

// --- Typage de la réponse brute de l'API Google Books ---
export interface GoogleBookVolumeInfo {
  title?: string;
  description?: string;
  publishedDate?: string;
  authors?: string[];
  pageCount?: number;
  categories?: string[];
  imageLinks?: { thumbnail?: string };
  industryIdentifiers?: { type: string; identifier: string }[];
  language?: string;
}

export interface GoogleBookItem {
  volumeInfo: GoogleBookVolumeInfo;
}

export interface GoogleBooksAPIResponse {
  items?: GoogleBookItem[];
}

// --- Typage de la réponse renvoyée au front ---
export interface BookDTO {
  title: string;
  summary: string;
  year: string;
  isbn: string | null;
  author: string;
  pages: number;
  image_url: string | null;
  genres: string[];
}