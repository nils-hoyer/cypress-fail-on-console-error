import * as sinon from 'sinon';
declare const consoleTypes: readonly ['error', 'warn', 'info', 'debug', 'trace', 'table', 'log', 'assert'];
type ConsoleType = (typeof consoleTypes)[number];
interface TypedConsoleMessage {
    type: ConsoleType;
    message: string | RegExp;
}
type ConsoleMessage = string | RegExp | TypedConsoleMessage;
interface Config {
    ignoreConsoleMessages?: ConsoleMessage[];
    /**
     * @deprecated Renamed to `ignoreConsoleMessages`, removed in 6.0. If both are set, `consoleMessages` is used.
     */
    consoleMessages?: ConsoleMessage[];
    consoleTypes?: ConsoleType[];
    debug?: boolean;
}
type ResolvedConfig = Required<Omit<Config, 'consoleMessages'>> & {
    /**
     * @deprecated Use `ignoreConsoleMessages`. The same array, kept for code written before the rename.
     */
    readonly consoleMessages: ConsoleMessage[];
};
interface CompiledConsoleMessage {
    consoleMessage: ConsoleMessage;
    type?: ConsoleType;
    regExp: RegExp;
}
export { Config };
export { ConsoleType };
export { ConsoleMessage };
export { TypedConsoleMessage };
declare global {
    namespace Cypress {
        interface Chainable {
            getIgnoredConsoleMessages(): Chainable<ConsoleMessage[]>;
            setIgnoredConsoleMessages(ignoreConsoleMessages: ConsoleMessage[]): Chainable<void>;
            addIgnoredConsoleMessages(ignoreConsoleMessages: ConsoleMessage[]): Chainable<void>;
            deleteIgnoredConsoleMessages(ignoreConsoleMessages: ConsoleMessage[]): Chainable<void>;
        }
    }
}
export default function failOnConsoleError(_config?: Config): {
    getConfig: () => ResolvedConfig;
    setConfig: (_config: Config) => void;
};
/**
 * Registers the commands getIgnoredConsoleMessages, setIgnoredConsoleMessages, addIgnoredConsoleMessages
 * and deleteIgnoredConsoleMessages, which read and change ignoreConsoleMessages for the current test.
 */
export declare const addIgnoredConsoleMessagesCommands: ({ getConfig, setConfig, }: ReturnType<typeof failOnConsoleError>) => void;
export declare const isSameConsoleMessage: (a: ConsoleMessage, b: ConsoleMessage) => boolean;
export declare const validateConfig: (config: Config) => void;
export declare const createConfig: (config: Config) => ResolvedConfig;
export declare const compileConsoleMessages: (consoleMessages: ConsoleMessage[]) => CompiledConsoleMessage[];
export declare const createSpies: (config: ResolvedConfig, console: Console) => Map<ConsoleType, sinon.SinonSpy>;
export declare const updateSpies: (spies: Map<ConsoleType, sinon.SinonSpy>, config: ResolvedConfig, console: Console) => Map<ConsoleType, sinon.SinonSpy>;
export declare const resetSpies: (spies: Map<ConsoleType, sinon.SinonSpy>) => Map<ConsoleType, sinon.SinonSpy>;
export interface ConsoleCall {
    type: ConsoleType;
    args: any[];
    message: string;
}
export declare const getConsoleCalls: (spies: Map<ConsoleType, sinon.SinonSpy>) => ConsoleCall[];
export declare const findIgnoringConsoleMessage: (consoleCall: ConsoleCall, compiledConsoleMessages: CompiledConsoleMessage[]) => ConsoleMessage | undefined;
export declare const checkConsoleCalls: (consoleCalls: ConsoleCall[], compiledConsoleMessages: CompiledConsoleMessage[], debug: boolean) => ConsoleCall[];
export declare const consoleCallsToString: (consoleCalls: ConsoleCall[]) => string;
export declare const isConsoleMessageExcluded: (consoleMessage: string, configConsoleMessage: string | RegExp) => boolean;
export declare const callToString: (calls: any[]) => string;
export declare const escapeMarkdown: (text: string) => string;
export declare const consoleMessageToString: (consoleMessage: ConsoleMessage) => string;
export declare const logConsoleCall: (consoleCall: ConsoleCall) => void;
export declare const logIgnoredConsoleCall: (consoleCall: ConsoleCall, ignoredBy: ConsoleMessage) => void;
