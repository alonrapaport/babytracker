import { describe, expect, it } from 'vitest';
import { normalizeOcrText } from '../ocr';

describe('normalizeOcrText', () => {
  it('strips OCR junk prefixes and empty-ish lines', () => {
    const raw = ['© מצרכים:', '| 2 כוסות קמח', '--- ', '', '', '~ 1 כפית מלח', '___'].join('\n');
    expect(normalizeOcrText(raw)).toBe(['מצרכים:', '2 כוסות קמח', '', '1 כפית מלח'].join('\n'));
  });

  it('collapses repeated whitespace within lines', () => {
    expect(normalizeOcrText('2   cups    flour')).toBe('2 cups flour');
  });

  it('keeps real content intact end-to-end for the text parser', () => {
    const raw = 'עוגת שוקולד\n\nמצרכים:\n2 ביצים\n1 כוס סוכר\n\nאופן הכנה:\n1. מערבבים הכל.';
    const cleaned = normalizeOcrText(raw);
    expect(cleaned).toContain('מצרכים:');
    expect(cleaned).toContain('2 ביצים');
    expect(cleaned).toContain('אופן הכנה:');
  });
});
