import { MultiVariableTextSchema } from './types';

export const substituteVariables = (text: string, variablesIn: string | Record<string, string>): string => {
  if (!text) {
    return '';
  }

  let substitutedText = text;

  if (variablesIn) {
    const variables: Record<string, string> =
      typeof variablesIn === 'string' ? JSON.parse(variablesIn) || {} : variablesIn;

    Object.keys(variables).forEach((variableName) => {
      // Manejar caracteres especiales en el nombre de la variable
      const variableForRegex = variableName.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp('{' + variableForRegex + '}', 'g');
      substitutedText = substitutedText.replace(regex, variables[variableName]);
    });
  }

  // Eliminar cualquier variable que no se haya sustituido
  substitutedText = substitutedText.replace(/{[^{}]+}/g, '');

  return substitutedText;
};

export const validateVariables = (value: string, schema: MultiVariableTextSchema): boolean => {
  if (schema.variables.length == 0) {
    return true;
  }

  let values;
  try {
    values = value ? JSON.parse(value) : {};
  } catch (e) {
    throw new SyntaxError(
      `[@pdfme/generator] invalid JSON string '${value}' for variables in field ${schema.name}`
    );
  }

  for (const variable of schema.variables) {
    if (!values[variable]) {
      if (schema.required) {
        throw new Error(`[@pdfme/generator] variable ${variable} is missing for field ${schema.name}`);
      }
      // Si no es requerido, simplemente no renderizar este campo si falta una entrada
      return false;
    }
  }

  return true;
};