import {
    API,
    APIEvent,
    Characteristic,
    DynamicPlatformPlugin,
    Logger,
    PlatformAccessory,
    PlatformConfig,
    Service,
} from 'homebridge';
import MirAIeHeaterCoolerAccessory from '../accessories/miraieHeaterCoolerAccessory';
import MirAIePlatformLogger from '../utilities/logger';
import {
    MirAIePlatformDevice,
    MirAIePlatformHome,
    PanasonicMirAIeAccessoryContext,
    PanasonicMirAIePlatformConfig
} from '../model/types';
import {PLATFORM_NAME, PLUGIN_NAME} from '../config/settings';
import MirAIeApi from "../api/miraieApi";
import MirAIeBroker from "../broker/miraieBroker";

/**
 * Panasonic AC Platform Plugin for Homebridge
 * Based on https://github.com/homebridge/homebridge-plugin-template
 */
export default class PanasonicMirAIePlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

    // Used to track restored cached accessories
    private readonly accessories: PlatformAccessory<PanasonicMirAIeAccessoryContext>[] = [];
    public readonly miraieApi: MirAIeApi;
    public readonly log: MirAIePlatformLogger;
    public readonly platformConfig: PanasonicMirAIePlatformConfig;

    /**
     * This constructor is where you should parse the user config
     * and discover/register accessories with Homebridge.
     *
     * @param homebridgeLogger Homebridge logger
     * @param config Homebridge platform config
     * @param api Homebridge API
     */
    constructor(
        homebridgeLogger: Logger,
        config: PlatformConfig,
        public readonly api: API,
    ) {
        this.platformConfig = config as PanasonicMirAIePlatformConfig;

        // Initialise logging utility
        this.log = new MirAIePlatformLogger(homebridgeLogger, this.platformConfig.logLevel);

        // Create MirAIe platform communication module
        this.miraieApi = new MirAIeApi(
            this.platformConfig,
            this.log,
        );

        /**
         * When this event is fired it means Homebridge has restored all cached accessories from disk.
         * Dynamic Platform plugins should only register new accessories after this event was fired,
         * in order to ensure they weren't added to homebridge already. This event can also be used
         * to start discovery of new accessories.
         */
        this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
            this.log.debug('Finished launching and restored cached accessories.');

            if (!this.platformConfig.userId) {
                this.log.error('userId is not configured - aborting plugin start. ' +
                    'Please set the field `User ID` in your config and restart Homebridge.');
                return;
            }

            if (!this.platformConfig.password) {
                this.log.error('Password is not configured - aborting plugin start. ' +
                    'Please set the field `Password` in your config and restart Homebridge.');
                return;
            }

            this.log.info('Attempting to log into MirAIe platform.');
            this.miraieApi.login()
                .then(() => {
                    this.log.info('Successfully logged in.');
                    this.discoverDevices();
                })
                .catch(() => {
                    this.log.error('Login failed. Skipping device discovery.');
                });
        });

        this.log.debug(`Finished initialising platform: ${this.platformConfig.name}`);
    }

    /**
     * This function is invoked when Homebridge restores cached accessories from disk at startup.
     * It should be used to set up event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory<PanasonicMirAIeAccessoryContext>) {
        this.log.info(`Loading accessory '${accessory.displayName}' from cache.`);

        /**
         * We don't have to set up the handlers here,
         * because our device discovery function takes care of that.
         *
         * But we need to add the restored accessory to the
         * accessories cache, so we can access it during that process.
         */
        this.accessories.push(accessory);
    }

    /**
     * Fetches all the user's devices from MirAIe platform and sets up handlers.
     *
     * Accessories must only be registered once. Previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    async discoverDevices() {
        this.log.info('Discovering devices on MirAIe platform.');

        try {
            const homes: MirAIePlatformHome[] = await this.miraieApi.getHomeDetails();
            const discoveredDevices: MirAIePlatformDevice[] = [];

            // Loop over the discovered homes and register the devices
            for (const home of homes) {

                // Setting up one MirAIeBroker per home
                const miraieBroker: MirAIeBroker = new MirAIeBroker(this.platformConfig, this.log)
                miraieBroker.connect(home.homeId, this.miraieApi.getAccessToken());

                for (const space of home.spaces) {

                    // Loop over the discovered devices and register each one
                    // if it has not already been registered
                    for (const device of space.devices) {

                        discoveredDevices.push(device);
                        // Generate a unique id for the accessory.
                        // This should be generated from something globally unique,
                        // but constant, for example, the device serial number or MAC address
                        const uuid = this.api.hap.uuid.generate(device.deviceId);

                        // Check if an accessory with the same uuid has already been registered and restored from
                        // the cached devices we stored in the `configureAccessory` method above.
                        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

                        if (existingAccessory) {
                            // The accessory already exists
                            this.log.info(`Restoring accessory of displayName [${existingAccessory.displayName}] `
                                + ` and deviceId [${device.deviceId}] from cache.`);

                            // If you need to update the accessory.context then you should run
                            // `api.updatePlatformAccessories`. eg.:
                            existingAccessory.context.device = device;
                            existingAccessory.context.deviceDisplayName =
                                `${home.homeName}_${space.spaceName}_${device.deviceName}`
                            this.api.updatePlatformAccessories([existingAccessory]);

                            // Create the accessory handler for the restored accessory
                            new MirAIeHeaterCoolerAccessory(this, existingAccessory, miraieBroker);
                        } else {
                            this.log.info(`Adding accessory '${device.deviceName}' (${device.deviceId}).`);
                            // The accessory does not exist yet, so we need to create it
                            const accessory = new this.api.platformAccessory<PanasonicMirAIeAccessoryContext>(
                                `${home.homeName}_${space.spaceName}_${device.deviceName}`, uuid);

                            // Store a copy of the device object in the `accessory.context` property,
                            // which can be used to store any data about the accessory you may need.
                            accessory.context.device = device;
                            accessory.context.deviceDisplayName =
                                `${home.homeName}_${space.spaceName}_${device.deviceName}`

                            // Create the accessory handler for the newly created accessory
                            new MirAIeHeaterCoolerAccessory(this, accessory, miraieBroker);

                            // Link the accessory to your platform
                            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                        }
                    }
                }
            }

            // At this point, we set up all devices from MirAIe Platform, but we did not unregister
            // cached devices that do not exist on the MirAIe Platform account anymore.
            for (const cachedAccessory of this.accessories) {
                const deviceId = cachedAccessory.context.device.deviceId;
                const miraiePlatformDevice = discoveredDevices.find(device => device.deviceId === deviceId);

                if (!miraiePlatformDevice) {
                    // This cached devices does not exist on the MirAIe platform account (anymore).
                    this.log.info(`Removing accessory '${cachedAccessory.displayName}' (${deviceId}) ` +
                        'because it does not exist on the MirAIe platform account (anymore?).');

                    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [cachedAccessory]);
                }
            }
        } catch (error) {
            this.log.error('An error occurred during device discovery. ' +
                'Turn on debug mode for more information.');
            this.log.debug(JSON.stringify(error));
        }
    }
}
