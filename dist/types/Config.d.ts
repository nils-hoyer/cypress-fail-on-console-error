import { ConsoleType } from "./ConsoleType";
export interface Config {
    excludeMessages?: (string | RegExp)[];
    includeConsoleTypes?: ConsoleType[];
    cypressLog?: boolean;
}
