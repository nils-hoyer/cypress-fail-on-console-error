import { ConsoleType } from "./ConsoleType";
export interface Config {
    consoleMessages?: (string | RegExp)[];
    consoleTypes?: (ConsoleType)[];
    debug?: boolean;
}
