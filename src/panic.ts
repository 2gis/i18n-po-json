const __reset = "\x1b[0m";
const __fgRed = "\x1b[31m";
const __fgYellow = "\x1b[33m";
const ERROR_PREP = __fgRed + "[i18n po->json convert ERROR] " + __reset;
const WARN_PREP = __fgYellow + "[i18n po->json convert WARNING] " + __reset;

export function panic(message: string, invalidStrings: string[]) {
  console.error(ERROR_PREP + message);
  console.error('Problematic strings: ', invalidStrings);
}

export function warning(message: string, invalidStrings: string[]) {
  console.warn(WARN_PREP + message);
  console.warn('Problematic strings: ', invalidStrings);
}
