import { describe, expect, it } from 'vitest';
import { convertQty } from '../convert';

describe('convertQty', () => {
  it('volume to metric', () => {
    expect(convertQty(1, 'cup', 'metric')).toEqual({ qty: 240, unit: 'ml' });
    expect(convertQty(3, 'tsp', 'metric')).toEqual({ qty: 15, unit: 'ml' });
    expect(convertQty(5, 'cup', 'metric')).toEqual({ qty: 1.2, unit: 'l' });
    expect(convertQty(2, 'l', 'metric')).toBeNull(); // already metric
  });

  it('volume to US', () => {
    expect(convertQty(250, 'ml', 'us')).toEqual({ qty: 1, unit: 'cup' });
    expect(convertQty(30, 'ml', 'us')).toEqual({ qty: 2, unit: 'tbsp' });
    expect(convertQty(5, 'ml', 'us')).toEqual({ qty: 1, unit: 'tsp' });
    expect(convertQty(1, 'cup', 'us')).toBeNull(); // already US-style
  });

  it('mass both ways', () => {
    expect(convertQty(500, 'g', 'us')).toEqual({ qty: 1.1, unit: 'lb' });
    expect(convertQty(30, 'g', 'us')).toEqual({ qty: 1.1, unit: 'oz' });
    expect(convertQty(2, 'lb', 'metric')).toEqual({ qty: 907, unit: 'g' });
    expect(convertQty(40, 'oz', 'metric')).toEqual({ qty: 1.1, unit: 'kg' });
    expect(convertQty(100, 'g', 'metric')).toBeNull();
  });

  it('count units pass through', () => {
    expect(convertQty(3, 'clove', 'metric')).toBeNull();
    expect(convertQty(2, 'unit', 'us')).toBeNull();
    expect(convertQty(1, 'nonsense', 'us')).toBeNull();
  });
});
