const escReset = '\x1b[0m';
const escFgRed = '\x1b[31m';
const escFgYellow = '\x1b[33m';
const ERROR_PREP = escFgRed + '[i18n po->json convert ERROR] ' + escReset;
const WARN_PREP = escFgYellow + '[i18n po->json convert WARNING] ' + escReset;

const _panicImpl = (message: string, invalidStrings: string[]) => {
  console.error(ERROR_PREP + message);
  console.error('Problematic strings: ', invalidStrings);
};

const _warningImpl = (message: string, invalidStrings: string[]) => {
  console.warn(WARN_PREP + message);
  console.warn('Problematic strings: ', invalidStrings);
};

// Panic & warning overriding for some testing abilities
let panicImpl = _panicImpl;
let warningImpl = _warningImpl;
export const panic: typeof _panicImpl = (s: string, invalidStrings: string[]) =>
  panicImpl(s, invalidStrings);
export const warning: typeof _warningImpl = (s: string, invalidStrings: string[]) =>
  warningImpl(s, invalidStrings);
export function overridePanic(
  cb: (message: string, invalidStrings: string[]) => void = _panicImpl,
) {
  panicImpl = cb;
}
export function overrideWarning(
  cb: (message: string, invalidStrings: string[]) => void = _warningImpl,
) {
  warningImpl = cb;
}
