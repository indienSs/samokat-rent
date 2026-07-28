import { ValueTransformer } from 'typeorm';

export class NumericTransformer implements ValueTransformer {
  to(value?: number | string | null): number | string | null {
    return value ?? null;
  }

  from(value?: string | number | null): number | null {
    if (value == null) return null;
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isNaN(num) ? null : num;
  }
}
