import type { Plugin } from '@pdfme/common';
import type { Schema } from '@pdfme/common';
import { ZOOM } from "@pdfme/common"
import SignaturePad from 'signature_pad';
import { image } from "@pdfme/schemas"


interface Signature extends Schema {}

const getEffectiveScale = (element: HTMLElement | null) => {
  let scale = 1;
  while (element && element !== document.body) {
    const style = window.getComputedStyle(element);
    const transform = style.transform;
    if (transform && transform !== 'none') {
      const localScale = parseFloat(transform.match(/matrix\((.+)\)/)?.[1].split(', ')[3] || '1');
      scale *= localScale;
    }
    element = element.parentElement;
  }
  return scale;
};

export const signature: Plugin<Signature> = {
  ui: async (arg) => {
    const { schema, value, onChange, rootElement, mode, i18n } = arg;

    const canvas = document.createElement('canvas');
    canvas.width = schema.width * ZOOM;
    canvas.height = schema.height * ZOOM;
    const resetScale = 1 / getEffectiveScale(rootElement);
    canvas.getContext('2d')!.scale(resetScale, resetScale);

    const signaturePad = new SignaturePad(canvas);
    try {
      value ? signaturePad.fromDataURL(value, { ratio: resetScale }) : signaturePad.clear();
    } catch (e) {
      console.error(e);
    }

    if (mode === 'viewer' || (mode === 'form' && schema.readOnly)) {
      signaturePad.off();
    } else {
      signaturePad.on();
      const clearButton = document.createElement('button');
      clearButton.style.position = 'absolute';
      clearButton.style.zIndex = '1';
      clearButton.textContent = i18n('clear') || 'Borrar';
      clearButton.addEventListener('click', () => {
        onChange && onChange({ key: 'content', value: '' });
      });
      rootElement.appendChild(clearButton);
      signaturePad.addEventListener('endStroke', () => {
        const data = signaturePad.toDataURL('image/png');
        onChange && data && onChange({ key: 'content', value: data });
      });
    }
    rootElement.appendChild(canvas);
  },
  pdf: image.pdf,
  propPanel: {
    schema: {},
    defaultSchema: {
      name: '',
      type: 'signature',
      content:
        '',
      position: { x: 0, y: 0 },
      width: 62.5,
      height: 37.5,
    },
  },
   icon: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-signature"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 17c3.333 -3.333 5 -6 5 -8c0 -3 -1 -3 -2 -3s-2.032 1.085 -2 3c.034 2.048 1.658 4.877 2.5 6c1.5 2 2.5 2.5 3.5 1l2 -3c.333 2.667 1.333 4 3 4c.53 0 2.639 -2 3 -2c.517 0 1.517 .667 3 2" /></svg>',
};
