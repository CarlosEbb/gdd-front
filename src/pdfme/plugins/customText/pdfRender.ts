import { PDFRenderProps } from '@pdfme/common';
import { CustomTextSchema } from './types';

export const pdfRender = async (arg: PDFRenderProps<CustomTextSchema>) => {
  const { value, schema, pdfDoc, page } = arg;

  const { width, height, position, fontSize, fontFamily } = schema;

  page.drawText(value || '', {
    x: position.x,
    y: page.getHeight() - position.y - height, // Ajustar la posición Y
    size: fontSize,
    font: pdfDoc.embedFont(fontFamily),
    color: 'black',
    width,
    height,
  });
};