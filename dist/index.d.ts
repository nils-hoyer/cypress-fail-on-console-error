import * as sinon from 'sinon';
declare const consoleTypes: readonly ['error', 'warn', 'info', 'debug', 'trace', 'table', 'log', 'assert'];
type ConsoleType = (typeof consoleTypes)[number];
interface TypedConsoleMessage {
    type: ConsoleType;
    message: string | RegExp;
}
type ConsoleMessage = string | RegExp | TypedConsoleMessage;
interface Config {
    consoleMessages?: ConsoleMessage[];
    includeConsoleMessages?: ConsoleMessage[];
    consoleTypes?: ConsoleType[];
    debug?: boolean;
}
export { Config };
export { ConsoleType };
export { ConsoleMessage };
export { TypedConsoleMessage };
declare global {
    namespace Cypress {
        interface Chainable {
            getConsoleMessages(): Chainable<ConsoleMessage[]>;
            setConsoleMessages(consoleMessages: ConsoleMessage[]): Chainable<void>;
            addConsoleMessages(consoleMessages: ConsoleMessage[]): Chainable<void>;
            deleteConsoleMessages(consoleMessages: ConsoleMessage[]): Chainable<void>;
        }
    }
}
export default function failOnConsoleError(_config?: Config): {
    getConfig: () => Required<Config>;
    setConfig: (_config: Config) => void;
};
/**
 * Registers the commands getConsoleMessages, setConsoleMessages, addConsoleMessages
 * and deleteConsoleMessages, which read and change consoleMessages for the current test.
 */
export declare const addConsoleMessagesCommands: ({ getConfig, setConfig, }: ReturnType<typeof failOnConsoleError>) => void;
export declare const isSameConsoleMessage: (a: ConsoleMessage, b: ConsoleMessage) => boolean;
export declare const validateConfig: (config: Config) => void;
export declare const createConfig: (config: Config) => Required<Config>;
export declare const compileConfig: (config: Required<Config>) => Required<Config>;
export declare const createSpies: (config: Required<Config>, console: Console) => Map<ConsoleType, sinon.SinonSpy>;
export declare const updateSpies: (spies: Map<ConsoleType, sinon.SinonSpy>, config: Required<Config>, console: Console) => Map<ConsoleType, sinon.SinonSpy>;
export declare const resetSpies: (spies: Map<ConsoleType, sinon.SinonSpy>) => Map<ConsoleType, sinon.SinonSpy>;
export interface ConsoleCall {
    type: ConsoleType;
    args: any[];
    message: string;
}
export declare const getConsoleCalls: (spies: Map<ConsoleType, sinon.SinonSpy>) => ConsoleCall[];
export declare const getConsoleCallsIncluded: (spies: Map<ConsoleType, sinon.SinonSpy>, config: Required<Config>) => ConsoleCall[];
export declare const isConsoleCallIncluded: (consoleCall: ConsoleCall, config: Required<Config>) => boolean;
export declare const isConsoleCallMatched: (consoleCall: ConsoleCall, configConsoleMessage: ConsoleMessage, debug: boolean) => boolean;
export declare const consoleCallsToString: (consoleCalls: ConsoleCall[]) => string;
export declare const isConsoleMessageExcluded: (consoleMessage: string, configConsoleMessage: string | RegExp, debug: boolean) => boolean;
export declare const callToString: (calls: any[]) => string;
export declare const logConsoleCall: (consoleCall: ConsoleCall) => void;
export declare const cypressLogger: (name: string, message: any) => void;
