import {Logger, LogLevel as HomebridgeLogLevel} from 'homebridge';
import {LogLevel} from "../model/types";

/**
 * Decorates the Homebridge logger to only log debug messages when debug mode is enabled.
 */
export default class MirAIePlatformLogger {

    logLevelAdaptor: { [k in LogLevel]?: HomebridgeLogLevel } = {
        [LogLevel.DEBUG]: HomebridgeLogLevel.DEBUG,
        [LogLevel.INFO]: HomebridgeLogLevel.INFO,
        [LogLevel.WARN]: HomebridgeLogLevel.WARN,
        [LogLevel.ERROR]: HomebridgeLogLevel.ERROR,
    }

    constructor(
        private readonly logger: Logger,
        private readonly logLevel: LogLevel,
    ) {
    }

    public log(logLevel: LogLevel, message: string, parameters?: any[]): void {
        if (!logLevel || logLevel < this.logLevel) {
            return;
        }

        if (parameters) {
            this.logger.info(message, parameters);
        } else {
            this.logger.info(message);
        }
    }

    public debug(message: string, parameters?: any[]): void {
        this.log(LogLevel.DEBUG, message, parameters);
    }

    public info(message: string, parameters?: any[]): void {
        this.log(LogLevel.INFO, message, parameters);
    }

    public warn(message: string, parameters?: any[]): void {
        this.log(LogLevel.WARN, message, parameters);
    }

    public error(message: string, parameters?: any[]): void {
        this.log(LogLevel.ERROR, message, parameters);
    }
}
