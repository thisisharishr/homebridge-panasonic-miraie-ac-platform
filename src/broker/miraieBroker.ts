import {CommandType, PanasonicMirAIePlatformConfig} from "../model/types";
import MirAIePlatformLogger from "../utilities/logger";
import MqttClientFacade from "../mqtt/mqttClientFacade";
import {Utils} from "../utilities/utils";
import {MIRAIE_BROKER_DETAILS} from "../config/settings";

export default class MirAIeBroker {
    private readonly mqttClientFacade: MqttClientFacade;
    private readonly topicToCallbackMap = new Map<string, Function>();

    constructor(private readonly config: PanasonicMirAIePlatformConfig,
                private readonly log: MirAIePlatformLogger) {
        this.mqttClientFacade = new MqttClientFacade(log);
    }

    onConnected() {
        this.log.info('MirAIeBroker: successfully connected!');
    };

    onMessageReceived(topic, message) {
        const onStateChangedCallback: Function | undefined = this.topicToCallbackMap.get(topic);
        if (onStateChangedCallback) {
            onStateChangedCallback(JSON.parse(message.toString()));
        }
    };

    onPublishCompleted(err) {
        if (err) {
            this.log.error(`MirAIeBroker: Error publishing message to MirAIe MQTT: ${err}`);
        }
    };

    onSubscribeCompleted(err) {
        if (err) {
            this.log.error(`MirAIeBroker: Error subscribing to topic: ${err}`);
        }
    }

    private buildBasePayload() {
        return {ki: 1, cnt: 'ios', sid: '1'};
    }

    private generateMessages(topic: string, command: string, cmdType: CommandType, basePayload) {
        switch (cmdType) {
            case CommandType.POWER:
                return this.generatePowerMessage(basePayload, command.toLowerCase(), topic);
            case CommandType.MODE:
                return this.generateModeMessage(basePayload, command.toLowerCase(), topic);
            case CommandType.TEMPERATURE:
                return this.generateTemperatureMessage(basePayload, command, topic);
            case CommandType.FAN:
                return this.generateFanMessage(basePayload, command.toLowerCase(), topic);
            case CommandType.SWING:
                return this.generateSwingMessage(basePayload, command, topic);
            case CommandType.DISPLAY_MODE:
                return this.generateDisplayModeMessage(basePayload, command, topic);
        }
        return [];
    }

    private generateDisplayModeMessage(basePayload, command, topic) {
        return [
            {
                topic,
                payload: {
                    ...basePayload,
                    acdc: command === 'on' ? 'on' : 'off'
                }
            }
        ];
    }

    private generatePowerMessage(basePayload, command, topic) {
        const powerMode = command == 'off' ? 'off' : 'on';
        return [
            {
                topic,
                payload: {
                    ...basePayload,
                    ps: powerMode
                }
            }
        ];
    }

    private generateModeMessage(basePayload, command, topic) {
        return [
            {
                topic,
                payload: {
                    ...basePayload,
                    acmd: command
                }
            }
        ];
    }

    private generateSwingMessage(basePayload, command, topic) {
        return [
            {
                topic,
                payload: {
                    ...basePayload,
                    acvs: parseInt(command)
                }
            }
        ];
    }

    private generateTemperatureMessage(basePayload, command, topic) {
        return [
            {
                topic,
                payload: {
                    ...basePayload,
                    actmp: command
                }
            }
        ];
    }

    private generateFanMessage(basePayload, command, topic) {
        return [
            {
                topic,
                payload: {
                    ...basePayload,
                    acfs: command
                }
            }
        ];
    }

    public connect(username, password) {
        this.log.debug(`MirAIeBroker: Attempting to connect to MirAIe MQTT with username ['${username}']`
            + `and password ['${password}']`);
        const clientId = 'homebridge-miraie-' + Utils.generateId(5);
        const useSsl = MIRAIE_BROKER_DETAILS.useSsl;
        const host = MIRAIE_BROKER_DETAILS.host;
        const port = MIRAIE_BROKER_DETAILS.port;
        this.mqttClientFacade.connect(host, port, clientId, useSsl, username, password,
            false, this.onConnected.bind(this), this.onMessageReceived.bind(this));
    }

    public subscribe(topics: string[], callback: Function) {
        this.log.debug(`MirAIeBroker: subscribing to topic '[${topics}]'`);
        topics.forEach(topic => this.topicToCallbackMap.set(topic, callback));
        this.mqttClientFacade.subscribe(topics, {qos: 0}, this.onSubscribeCompleted)
    }

    public publish(deviceTopic: string, command: string, cmdType: CommandType) {
        this.log.debug(`MirAIeBroker: publishing command [${command}], commandType [${cmdType}]`
            + ` to topic '[${deviceTopic}]'`);
        const basePayload = this.buildBasePayload();
        const controlTopic = `${deviceTopic}/control`;
        const messages = this.generateMessages(controlTopic, command, cmdType, basePayload);
        messages.map(msg => {
            this.mqttClientFacade.publish(msg.topic, msg.payload, 0, false, this.onPublishCompleted);
        });
    }

    public disconnect() {
        this.mqttClientFacade.disconnect();
    }
}
