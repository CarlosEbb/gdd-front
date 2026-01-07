import type { Plugin } from '@pdfme/common';
import { pdfRender } from './pdfRender';
import { uiRender } from './uiRender';
import type { CustomTextSchema } from './types';

export const customText: Plugin<CustomTextSchema> = {
  ui: uiRender,
  pdf: pdfRender,
  propPanel: {
    schema: {},
    defaultSchema: {
      type: 'customText',
      content: '',
      position: { x: 0, y: 0 },
      width: 100,
      height: 30,
      fontSize: 12,
      fontFamily: 'Helvetica', // Fuente predeterminada
    },
  },
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>',
};