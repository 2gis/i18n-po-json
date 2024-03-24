"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overrideWarning = exports.overridePanic = exports.warning = exports.panic = void 0;
var __reset = "\x1b[0m";
var __fgRed = "\x1b[31m";
var __fgYellow = "\x1b[33m";
var ERROR_PREP = __fgRed + "[i18n po->json convert ERROR] " + __reset;
var WARN_PREP = __fgYellow + "[i18n po->json convert WARNING] " + __reset;
var _panicImpl = function (message, invalidStrings) {
    console.error(ERROR_PREP + message);
    console.error('Problematic strings: ', invalidStrings);
};
var _warningImpl = function (message, invalidStrings) {
    console.warn(WARN_PREP + message);
    console.warn('Problematic strings: ', invalidStrings);
};
// Panic & warning overriding for some testing abilities
var panicImpl = _panicImpl;
var warningImpl = _warningImpl;
var panic = function (s, invalidStrings) { return panicImpl(s, invalidStrings); };
exports.panic = panic;
var warning = function (s, invalidStrings) { return warningImpl(s, invalidStrings); };
exports.warning = warning;
function overridePanic(cb) {
    if (cb === void 0) { cb = _panicImpl; }
    panicImpl = cb;
}
exports.overridePanic = overridePanic;
function overrideWarning(cb) {
    if (cb === void 0) { cb = _warningImpl; }
    warningImpl = cb;
}
exports.overrideWarning = overrideWarning;
//# sourceMappingURL=panic.js.map