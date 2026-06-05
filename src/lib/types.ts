// Shared domain types for the app.

export type Lang = 'he' | 'en';

export type Units = {
  volume: 'ml' | 'oz';
  weight: 'kg' | 'lb';
  length: 'cm' | 'in';
};

export type Profile = {
  id: string;
  display_name: string | null;
  language: Lang;
  units: Units;
  active_baby_id: string | null;
};

export type Sex = 'boy' | 'girl' | 'other';

export type Baby = {
  id: string;
  name: string;
  birthdate: string | null;
  sex: Sex | null;
  photo_path: string | null;
  owner_id: string;
  created_at: string;
};

export type EntryType =
  | 'breastfeed'
  | 'bottle'
  | 'pump'
  | 'solids'
  | 'diaper'
  | 'sleep'
  | 'routine'
  | 'weight'
  | 'height'
  | 'head'
  | 'milestone'
  | 'medical'
  | 'vaccine';

// Free-form per-type payload. Keys used per type:
//  breastfeed: { leftSec, rightSec, lastSide, notes, photo_path }
//  bottle:     { amount, unit, contents, notes }
//  pump:       { leftAmount, rightAmount, unit, leftSec, rightSec, notes }
//  solids:     { foods: string[], notes }
//  diaper:     { kind: 'wet'|'dirty'|'dry', rash: boolean, notes }
//  sleep:      { notes }
//  routine:    { routineType, notes }
//  weight/height/head: { value, unit }
//  milestone:  { title, notes }
//  medical:    { title, notes }
//  vaccine:    { name, notes }
export type EntryData = Record<string, unknown>;

export type Entry = {
  id: string;
  baby_id: string;
  type: EntryType;
  start_time: string;
  end_time: string | null;
  data: EntryData;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ReminderKind = 'wakeWindow' | 'fixed';

export type Reminder = {
  id: string;
  baby_id: string;
  kind: ReminderKind;
  config: { awakeMinutes?: number; times?: string[] };
  enabled: boolean;
};
