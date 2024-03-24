const __reset = "\x1b[0m";
const __fgRed = "\x1b[31m";
const __fgYellow = "\x1b[33m";
const ERROR_PREP = __fgRed + "[i18n po->json convert ERROR] " + __reset;
const WARN_PREP = __fgYellow + "[i18n po->json convert WARNING] " + __reset;
const _panicImpl = (message, invalidStrings) => {
    console.error(ERROR_PREP + message);
    console.error('Problematic strings: ', invalidStrings);
};
const _warningImpl = (message, invalidStrings) => {
    console.warn(WARN_PREP + message);
    console.warn('Problematic strings: ', invalidStrings);
};
// Panic & warning overriding for some testing abilities
let panicImpl = _panicImpl;
let warningImpl = _warningImpl;
export const panic = (s, invalidStrings) => panicImpl(s, invalidStrings);
export const warning = (s, invalidStrings) => warningImpl(s, invalidStrings);
export function overridePanic(cb = _panicImpl) {
    panicImpl = cb;
}
export function overrideWarning(cb = _warningImpl) {
    warningImpl = cb;
}
//# sourceMappingURL=panic.js.map