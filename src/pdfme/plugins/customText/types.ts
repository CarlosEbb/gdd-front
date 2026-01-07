import type { Schema } from '@pdfme/common';

export interface CustomTextSchema extends Schema {
  fontSize: number;
  fontFamily: string;
}