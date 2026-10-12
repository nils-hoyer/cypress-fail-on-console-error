import { type Config, type ConsoleMessage } from './internal.js';
export type { Config, ConsoleMessage, ConsoleType, TypedConsoleMessage, } from './internal.js';
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
    getConfig: () => Required<Config>;
    setConfig: (_config: Config) => void;
};
/**
 * Registers the commands getIgnoredConsoleMessages, setIgnoredConsoleMessages, addIgnoredConsoleMessages
 * and deleteIgnoredConsoleMessages, which read and change ignoreConsoleMessages for the current test.
 */
export declare const addIgnoredConsoleMessagesCommands: ({ getConfig, setConfig, }: ReturnType<typeof failOnConsoleError>) => void;
