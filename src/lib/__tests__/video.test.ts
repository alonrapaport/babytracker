import { describe, expect, it } from 'vitest';
import { youtubeEmbedUrl, youtubeId } from '../video';

describe('youtubeId / youtubeEmbedUrl', () => {
  it('extracts ids from the common URL shapes', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ?si=abc')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://www.youtube.com/watch?list=x&v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('ignores non-YouTube URLs', () => {
    expect(youtubeId('https://www.instagram.com/reel/xyz/')).toBeNull();
    expect(youtubeId('https://example.com/watch?v=abc')).toBeNull();
    expect(youtubeId(null)).toBeNull();
  });

  it('builds privacy-enhanced embed URLs', () => {
    expect(youtubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(youtubeEmbedUrl('https://tiktok.com/@x/video/1')).toBeNull();
  });
});
