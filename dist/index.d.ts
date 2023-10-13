import * as sinon from 'sinon';
type ConsoleType = 'error' | 'warn' | 'info';
type ConsoleMessage = (string | RegExp);
interface Config {
    consoleMessages?: ConsoleMessage[];
    consoleTypes?: ConsoleType[];
    debug?: boolean;
}
export { Config };
export { ConsoleType };
export { ConsoleMessage };
export default function failOnConsoleError(_config?: Config): {
    getConfig: () => Required<Config> | undefined;
    setConfig: (_config: Config) => void;
};
export declare const validateConfig: (config: Config) => void;
export declare const createConfig: (config: Config) => Required<Config>;
export declare const createSpies: (config: Required<Config>, console: Console) => Map<ConsoleType, sinon.SinonSpy>;
export declare const resetSpies: (spies: Map<ConsoleType, sinon.SinonSpy>) => Map<ConsoleType, sinon.SinonSpy>;
export declare const getConsoleMessageIncluded: (spies: Map<ConsoleType, sinon.SinonSpy>, config: Required<Config>) => string | undefined;
export declare const findConsoleMessageIncluded: (spy: sinon.SinonSpy, config: Required<Config>) => string | undefined;
export declare const isConsoleMessageExcluded: (consoleMessage: string, configConsoleMessage: ConsoleMessage, debug: boolean) => boolean;
export declare const callToString: (calls: any[]) => string;
export declare const cypressLogger: (name: string, message: any) => void;
