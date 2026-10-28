export const OBJECT_IDS = [
  'sun',
  'mercury',
  'venus',
  'earth',
  'moon',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
] as const;

export type ObjectId = (typeof OBJECT_IDS)[number];

export interface SpaceObject {
  id: ObjectId;
  name: string;
  /** Soft background colour for the cartoon card face. */
  colour: string;
}

export const OBJECTS: Record<ObjectId, SpaceObject> = {
  sun: { id: 'sun', name: 'The Sun', colour: '#ffe9a8' },
  mercury: { id: 'mercury', name: 'Mercury', colour: '#e6dcd2' },
  venus: { id: 'venus', name: 'Venus', colour: '#fff1c9' },
  earth: { id: 'earth', name: 'Earth', colour: '#cdeffd' },
  moon: { id: 'moon', name: 'The Moon', colour: '#d9dcef' },
  mars: { id: 'mars', name: 'Mars', colour: '#ffd2c2' },
  jupiter: { id: 'jupiter', name: 'Jupiter', colour: '#f7dfc4' },
  saturn: { id: 'saturn', name: 'Saturn', colour: '#f5ecc2' },
  uranus: { id: 'uranus', name: 'Uranus', colour: '#c9f4ef' },
  neptune: { id: 'neptune', name: 'Neptune', colour: '#cbd8ff' },
};
