import {PlatformConfig} from 'homebridge';

export enum LogLevel {
    DISABLED = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
}

export interface PanasonicMirAIePlatformConfig extends PlatformConfig {
    userId: string;
    password: string;
    logLevel: LogLevel;
    suppressOutgoingUpdates?: boolean;
}

export interface PanasonicMirAIeAccessoryContext {
    device: MirAIePlatformDevice;
    deviceDisplayName: string
}

// Login
// POST
export interface MirAIePlatformAuthResponse {
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

// MirAIe Home Detail
export interface MirAIePlatformHome {
    homeId: string;
    homeName: string;
    userId: string;
    primaryUser: string;
    secondaryUsers: string[];
    metaTopic: string;
    spaces: MirAIePlatformSpace[];
}

export interface MirAIePlatformSpace {
    spaceId: string;
    spaceType: string;
    spaceName: string;
    members: string[];
    devices: MirAIePlatformDevice[];
}

export interface MirAIePlatformDevice {
    deviceId: string;
    deviceName: string;
    topic: string[];
}

export interface MirAIePlatformDeviceStatus {
    "achs": number; //0 - AC horizontal swing (0 for enable swing)
    "acfs": string; //"quiet"
    "ps": "on" | "off"; //"off" - AC actively on/off status
    "ty": string; //"AC"
    "rmtmp": string; //"27.5", This is actual room temperature.
    "acdl": number; //0
    "acdc": "on" | "off"; //"on"
    "sid": string; //"rem_5576"
    "acsp": string; //"none",
    "acmd": string; //"cool", - mode
    "V": string; //"1.75",
    "mo": string; //"130101",
    "rssi": number; //-59,
    "acms": "on" | "off"; //"off",
    "acgm": number; //0,
    "acem": "on" | "off"; //"off"
    "cnt": string; //"rem",
    "acec": "on" | "off"; //"off",
    "acmss": number; //0,
    "actmp": string; //"26.0", this is the temperature set in AC via remote or app
    "acpms": number; //0,
    "acpm": "on" | "off"; //"off",
    "acvs": number; //5, AC - vertical swing (0 for enable swing)
    "acfc": "on" | "off"; //"off",
    "actm": number[] //[-1,-1],
    "acng": "on" | "off"; //"off",
    "lcmd": string; //"rmtmp", last AC command
    "acngs": "on" | "off"; //"off",
    "ts": string; //"1665471096",
}

export interface MirAIePlatformDeviceConnectionStatus {
    "deviceId": string;
    "connectedTime": number;
    "updatedTime": number;
    "nextUpdate": number;
    "onlineStatus": string;
}

export enum Mode {
    COOL = "cool",
    DRY = "dry",
    FAN = "fan", //Not supported by homekit
    AUTO = "auto",
}

export enum FanSpeed {
    AUTO = "auto",
    QUIET = "quiet",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}

export enum CommandType {
    MODE,
    TEMPERATURE,
    FAN,
    POWER,
    SWING,
}