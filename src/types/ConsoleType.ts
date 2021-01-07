export enum ConsoleType {
  INFO,
  WARN,
  ERROR,
}

export const someConsoleType = (consoleType: ConsoleType): boolean => 
  consoleType === ConsoleType.INFO || 
  consoleType === ConsoleType.WARN || 
  consoleType === ConsoleType.ERROR;