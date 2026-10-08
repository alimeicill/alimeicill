import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z, ZodSchema } from 'zod';

export class ZodPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const first = result.error.issues[0];
      const field = first.path.join('.');
      throw new BadRequestException(field ? `${field}: ${first.message}` : first.message);
    }
    return result.data;
  }
}

/** Boş string'i undefined'a çeviren opsiyonel metin alanı. */
export const optStr = () =>
  z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const money = () => z.coerce.number().finite().min(0).max(1e12);
export const posMoney = () => z.coerce.number().finite().positive().max(1e12);
export const dateStr = () => z.coerce.date();
export const period = () => z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'YYYY-AA biçiminde olmalı');
