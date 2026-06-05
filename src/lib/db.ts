import { supabase } from './supabase';
import { isDemo } from './demo';
import { demoApi, demoBabies, demoProfile } from './demoStore';
import type { Baby, Entry, EntryData, EntryType, Profile, Reminder } from './types';

export async function getProfile(userId: string): Promise<Profile | null> {
  if (isDemo) return demoProfile;
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return (data as Profile) ?? null;
}

export async function updateProfile(userId: string, patch: Partial<Profile>) {
  if (isDemo) return;
  await supabase.from('profiles').update(patch).eq('id', userId);
}

export async function listBabies(): Promise<Baby[]> {
  if (isDemo) return demoBabies.slice();
  const { data } = await supabase.from('babies').select('*').order('created_at', { ascending: true });
  return (data as Baby[]) ?? [];
}

export async function createBaby(input: {
  name: string;
  birthdate: string | null;
  sex: string | null;
  photo_path?: string | null;
}): Promise<Baby | null> {
  if (isDemo) return demoApi.createBaby(input);
  const { data: userRes } = await supabase.auth.getUser();
  const owner = userRes.user?.id;
  const { data, error } = await supabase
    .from('babies')
    .insert({ ...input, owner_id: owner })
    .select()
    .single();
  if (error) {
    console.error('createBaby', error);
    return null;
  }
  return data as Baby;
}

export async function updateBaby(id: string, patch: Partial<Baby>) {
  if (isDemo) return;
  await supabase.from('babies').update(patch).eq('id', id);
}

export async function deleteBaby(id: string) {
  if (isDemo) return;
  await supabase.from('babies').delete().eq('id', id);
}

export async function listEntries(babyId: string): Promise<Entry[]> {
  if (isDemo) return demoApi.listEntries();
  const { data } = await supabase
    .from('entries')
    .select('*')
    .eq('baby_id', babyId)
    .order('start_time', { ascending: false });
  return (data as Entry[]) ?? [];
}

export async function createEntry(input: {
  baby_id: string;
  type: EntryType;
  start_time: string;
  end_time?: string | null;
  data?: EntryData;
}): Promise<Entry | null> {
  if (isDemo) return demoApi.createEntry(input);
  const { data, error } = await supabase
    .from('entries')
    .insert({ data: {}, end_time: null, ...input })
    .select()
    .single();
  if (error) {
    console.error('createEntry', error);
    return null;
  }
  return data as Entry;
}

export async function updateEntry(id: string, patch: Partial<Entry>) {
  if (isDemo) return demoApi.updateEntry(id, patch);
  await supabase.from('entries').update(patch).eq('id', id);
}

export async function deleteEntry(id: string) {
  if (isDemo) return demoApi.deleteEntry(id);
  await supabase.from('entries').delete().eq('id', id);
}

export async function listReminders(babyId: string): Promise<Reminder[]> {
  if (isDemo) return [];
  const { data } = await supabase.from('reminders').select('*').eq('baby_id', babyId);
  return (data as Reminder[]) ?? [];
}

export async function upsertReminder(r: Partial<Reminder> & { baby_id: string }) {
  if (isDemo) return;
  if (r.id) {
    await supabase.from('reminders').update(r).eq('id', r.id);
  } else {
    await supabase.from('reminders').insert(r);
  }
}

// Subscribe to live entry changes for one baby. Returns an unsubscribe fn.
export function subscribeEntries(babyId: string, onChange: () => void): () => void {
  if (isDemo) return demoApi.subscribe(onChange);
  const channel = supabase
    .channel(`entries:${babyId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'entries', filter: `baby_id=eq.${babyId}` },
      () => onChange()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// --- Photos -----------------------------------------------------------------

export async function uploadPhoto(babyId: string, dataUrl: string): Promise<string | null> {
  if (isDemo) return null;
  try {
    const [meta, b64] = dataUrl.split(',');
    const contentType = /data:(.*?);/.exec(meta)?.[1] || 'image/jpeg';
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const ext = contentType.split('/')[1] || 'jpg';
    const path = `${babyId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('baby-photos').upload(path, bytes, { contentType });
    if (error) {
      console.error('uploadPhoto', error);
      return null;
    }
    return path;
  } catch (e) {
    console.error('uploadPhoto', e);
    return null;
  }
}

export async function signedPhotoUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('baby-photos').createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
