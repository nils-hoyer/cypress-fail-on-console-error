import { ConsoleType } from "./ConsoleType";
export interface Config {
    excludeMessages: string[];
    includeConsoleTypes: ConsoleType[];
    cypressLog: boolean;
}
