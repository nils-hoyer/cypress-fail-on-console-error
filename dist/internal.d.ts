export declare const consoleTypes: readonly ['error', 'warn', 'info', 'debug', 'trace', 'table', 'log', 'assert'];
export type ConsoleType = (typeof consoleTypes)[number];
export interface TypedConsoleMessage {
    type: ConsoleType;
    message: string | RegExp;
}
export type ConsoleMessage = string | RegExp | TypedConsoleMessage;
export interface Config {
    ignoreConsoleMessages?: ConsoleMessage[];
    consoleTypes?: ConsoleType[];
    debug?: boolean;
}
export type ResolvedConfig = Required<Config>;
export interface CompiledConsoleMessage {
    consoleMessage: ConsoleMessage;
    type?: ConsoleType;
    regExp: RegExp;
}
export declare const isSameConsoleMessage: (a: ConsoleMessage, b: ConsoleMessage) => boolean;
export declare const validateCommandArgument: (command: string, ignoreConsoleMessages: unknown) => void;
export declare const validateConfig: (config: Config) => void;
export declare const createConfig: (config: Config) => ResolvedConfig;
export declare const compileConsoleMessages: (consoleMessages: ConsoleMessage[]) => CompiledConsoleMessage[];
export interface ConsoleSpies {
    watched: Set<ConsoleType>;
    wrapped: Set<ConsoleType>;
    calls: {
        type: ConsoleType;
        args: any[];
    }[];
}
export declare const updateSpies: (spies: ConsoleSpies, config: ResolvedConfig, console: Console) => ConsoleSpies;
export declare const createSpies: (config: ResolvedConfig, console: Console) => ConsoleSpies;
export declare const resetSpies: (spies: ConsoleSpies) => ConsoleSpies;
export interface ConsoleCall {
    type: ConsoleType;
    args: any[];
    message: string;
}
export declare const getConsoleCalls: (spies: ConsoleSpies) => ConsoleCall[];
export declare const findIgnoringConsoleMessage: (consoleCall: ConsoleCall, compiledConsoleMessages: CompiledConsoleMessage[]) => CompiledConsoleMessage | undefined;
export declare const checkConsoleCalls: (consoleCalls: ConsoleCall[], compiledConsoleMessages: CompiledConsoleMessage[], debug: boolean) => ConsoleCall[];
export declare const consoleCallsToString: (consoleCalls: ConsoleCall[]) => string;
export declare const isConsoleMessageExcluded: (consoleMessage: string, configConsoleMessage: string | RegExp) => boolean;
export declare const callToString: (calls: any[]) => string;
export declare const escapeMarkdown: (text: string) => string;
export declare const consoleMessageToString: (consoleMessage: ConsoleMessage) => string;
export declare const logConsoleCall: (consoleCall: ConsoleCall, compiledConsoleMessages: CompiledConsoleMessage[]) => void;
export declare const logIgnoredConsoleCall: (consoleCall: ConsoleCall, ignoredBy: CompiledConsoleMessage) => void;
