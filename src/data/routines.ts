import type { Dict } from '../i18n/en';

// Built-in routine types (mirrors the Nara routine list). Custom routines are
// stored as plain strings in the entry data.
export const builtinRoutines: { id: string; labelKey: keyof Dict }[] = [
  { id: 'bath', labelKey: 'routine_bath' },
  { id: 'nail', labelKey: 'routine_nail' },
  { id: 'play', labelKey: 'routine_play' },
  { id: 'story', labelKey: 'routine_story' },
  { id: 'tummy', labelKey: 'routine_tummy' },
  { id: 'vitamin', labelKey: 'routine_vitamin' },
  { id: 'walk', labelKey: 'routine_walk' },
];
