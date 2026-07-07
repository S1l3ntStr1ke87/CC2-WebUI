export class Logger {
    constructor(public loggerName: string) { }

    info(...data: any[]) {
        console.log(`[${this.loggerName}] `, ...data);
    }

    warn(...data: any[]) {
        console.warn(`[${this.loggerName}] `, ...data);
    }

    error(...data: any[]) {
        console.error(`[${this.loggerName}] `, ...data);
    }

    debug(...data: any[]) {
        console.debug(`[${this.loggerName}] `, ...data);
    }
}