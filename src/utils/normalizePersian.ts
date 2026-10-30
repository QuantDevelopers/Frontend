/**
 * normalizePersianText - Rule 7.4 of Project Spec
 * Converts Arabic ي (U+064A) and ك (U+0643) to Persian ی (U+06CC) and ک (U+06A9).
 * Also normalizes Arabic-style digits and common Arabic characters.
 */
export function normalizePersianText(text: string): string {
  return text
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/٤/g, '۴')
    .replace(/٥/g, '۵')
    .replace(/٦/g, '۶');
}
