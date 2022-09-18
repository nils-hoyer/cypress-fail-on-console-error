import * as sinon from 'sinon';
import { Config } from './types/Config';
import { ConsoleType } from './types/ConsoleType';
export default function failOnConsoleError(_config?: Config): {
    getConfig: () => Required<Config> | undefined;
    setConfig: (_config: Config) => void;
};
export declare const validateConfig: (config: Config) => void;
export declare const createConfig: (config: Config) => Required<Config>;
export declare const createSpies: (config: Required<Config>, console: Console) => Map<ConsoleType, sinon.SinonSpy>;
export declare const resetSpies: (spies: Map<ConsoleType, sinon.SinonSpy>) => Map<ConsoleType, sinon.SinonSpy>;
export declare const getIncludedCall: (spies: Map<ConsoleType, sinon.SinonSpy>, config: Required<Config>) => string | undefined;
export declare const findIncludedCall: (spy: sinon.SinonSpy, config: Required<Config>) => string | undefined;
export declare const isErrorMessageExcluded: (errorMessage: string, excludeMessage: string, cypressLog: boolean) => boolean;
export declare const callToString: (calls: any[]) => string;
export declare const cypressLogger: (name: string, message: any) => void;
export { Config } from './types/Config';
export { ConsoleType as consoleType } from './types/ConsoleType';
