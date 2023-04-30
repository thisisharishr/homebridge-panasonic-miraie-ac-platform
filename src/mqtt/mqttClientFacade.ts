import mqtt, {MqttClient, QoS} from 'mqtt';
import MirAIePlatformLogger from "../utilities/logger";

export default class MqttClientFacade {
    private mqttClient: MqttClient | null;

    constructor(private readonly log: MirAIePlatformLogger) {
        this.mqttClient = null;
    }

    public connect(host: string, port: number, clientId: string, useSSL: boolean,
                   username: string, password: string, isClean: boolean,
                   onConnect: Function, onMessage: Function) {
        const protocol = useSSL ? 'mqtts' : 'mqtt';
        const connectUrl = `${protocol}://${host}:${port}`;

        this.mqttClient = mqtt.connect(connectUrl, {
            clientId: clientId,
            username: username,
            password: password,
            clean: isClean,
        });

        if (onConnect) {
            this.mqttClient.on('connect', onConnect);
        }

        if (onMessage) {
            this.mqttClient.on('message', onMessage);
        }
    }

    public disconnect() {
        this.mqttClient?.end()
    }

    public subscribe(topic: string[] | string, options, onSubscribeCompleted) {
        this.mqttClient?.subscribe(topic, options, onSubscribeCompleted)
    }

    public publish(topic: string, payload, qos: QoS = 0, retain: boolean = false, onPublishCompleted) {
        const message = typeof payload === 'object' ? JSON.stringify(payload) : payload;
        this.mqttClient?.publish(topic, message, {qos, retain}, onPublishCompleted);
    }
}
