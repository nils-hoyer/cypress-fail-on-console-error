import * as sinon from 'sinon';
import { Config } from './types/Config';
import { ConsoleType } from './types/ConsoleType';
export default function failOnConsoleError(config?: Config): void;
export declare const validateConfig: (config: Config) => void;
export declare const createConfig: (config: Config) => Config;
export declare const createSpies: (config: Config, console: Console) => any;
export declare const someSpyCalled: (spies: Map<ConsoleType, sinon.SinonSpy>) => boolean;
export declare const isExludeMessage: (spy: sinon.SinonSpy, config: Config) => boolean;
