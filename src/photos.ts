import manifest from './photos.json';
import { OBJECT_IDS, type ObjectId } from './objects';
import type { PhotoLibrary } from './game';

export interface PhotoCredit {
  file: string;
  object: ObjectId;
  title: string;
  artist: string;
  license: string;
  source: string;
}

export const PHOTOS: PhotoCredit[] = (manifest.photos as PhotoCredit[]).filter((p) =>
  (OBJECT_IDS as readonly string[]).includes(p.object),
);

export const PHOTO_LIBRARY: PhotoLibrary = {};
for (const p of PHOTOS) (PHOTO_LIBRARY[p.object] ??= []).push(p.file);

export function photoUrl(file: string): string {
  return `${import.meta.env.BASE_URL}photos/${file}`;
}
