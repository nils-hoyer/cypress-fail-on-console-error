export enum ConsoleType {
  INFO,
  WARN,
  ERROR,
}

export const containsConsoleType = (consoleType: ConsoleType): boolean => 
  consoleType === ConsoleType.INFO || 
  consoleType === ConsoleType.WARN || 
  consoleType === ConsoleType.ERROR;