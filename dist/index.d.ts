import * as sinon from 'sinon';
type ConsoleType = 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'table';
type ConsoleMessage = string | RegExp;
interface Config {
    consoleMessages?: ConsoleMessage[];
    consoleTypes?: ConsoleType[];
    debug?: boolean;
}
export { Config };
export { ConsoleType };
export { ConsoleMessage };
export default function failOnConsoleError(_config?: Config): {
    getConfig: () => Required<Config>;
    setConfig: (_config: Config) => void;
};
export declare const validateConfig: (config: Config) => void;
export declare const createConfig: (config: Config) => Required<Config>;
export declare const createSpies: (config: Required<Config>, console: Console) => Map<ConsoleType, sinon.SinonSpy>;
export declare const resetSpies: (spies: Map<ConsoleType, sinon.SinonSpy>) => Map<ConsoleType, sinon.SinonSpy>;
export interface ConsoleCall {
    type: ConsoleType;
    args: any[];
    message: string;
}
export declare const getConsoleCalls: (spies: Map<ConsoleType, sinon.SinonSpy>) => ConsoleCall[];
export declare const getConsoleCallsIncluded: (spies: Map<ConsoleType, sinon.SinonSpy>, config: Required<Config>) => ConsoleCall[];
export declare const isConsoleCallIncluded: (consoleCall: ConsoleCall, config: Required<Config>) => boolean;
export declare const consoleCallsToString: (consoleCalls: ConsoleCall[]) => string;
export declare const isConsoleMessageExcluded: (consoleMessage: string, configConsoleMessage: ConsoleMessage, debug: boolean) => boolean;
export declare const callToString: (calls: any[]) => string;
export declare const cypressLogger: (name: string, message: any) => void;
