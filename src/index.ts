import { API } from 'homebridge';
import PanasonicMirAIePlatform from './platform/panasonicMiraiePlatform';
import { PLATFORM_NAME } from './config/settings';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, PanasonicMirAIePlatform);
};
