declare const _panicImpl: (message: string, invalidStrings: string[]) => void;
declare const _warningImpl: (message: string, invalidStrings: string[]) => void;
export declare const panic: typeof _panicImpl;
export declare const warning: typeof _warningImpl;
export declare function overridePanic(cb?: (message: string, invalidStrings: string[]) => void): void;
export declare function overrideWarning(cb?: (message: string, invalidStrings: string[]) => void): void;
export {};
