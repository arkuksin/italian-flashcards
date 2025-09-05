/**
 * Removes accents and diacritics from text for comparison
 */
export const removeAccents = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

/**
 * Compares two strings with optional accent ignoring
 */
export const compareStrings = (str1: string, str2: string, ignoreAccents: boolean): boolean => {
  const normalize = (str: string) => str.toLowerCase().trim();
  
  if (ignoreAccents) {
    return removeAccents(normalize(str1)) === removeAccents(normalize(str2));
  }
  
  return normalize(str1) === normalize(str2);
};