import { UIRenderProps } from '@pdfme/common';
import { CustomTextSchema } from './types';

export const uiRender = async (arg: UIRenderProps<CustomTextSchema>) => {
  const { schema, value, onChange, rootElement, mode } = arg;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = value || '';
  input.style.width = '100%';
  input.style.height = '100%';
  input.style.fontSize = `${schema.fontSize}px`;
  input.style.fontFamily = schema.fontFamily;

  if (mode === 'viewer' || (mode === 'form' && schema.readOnly)) {
    input.disabled = true;
  } else {
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      onChange && onChange({ key: 'content', value: target.value });
    });
  }

  // Selector de fuente
  const fontSelector = document.createElement('select');
  fontSelector.style.marginTop = '10px';
  fontSelector.style.width = '100%';
  const fonts = ['Helvetica', 'Times New Roman', 'Courier New', 'Arial', 'Verdana'];
  fonts.forEach((font) => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font;
    if (font === schema.fontFamily) option.selected = true;
    fontSelector.appendChild(option);
  });

  fontSelector.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    onChange && onChange({ key: 'fontFamily', value: target.value });
  });

  rootElement.appendChild(input);
  rootElement.appendChild(fontSelector);
};