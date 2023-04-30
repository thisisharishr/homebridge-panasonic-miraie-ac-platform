import MirAIePlatformLogger from '../utilities/logger';
import axios, {AxiosError} from 'axios';
import {LOGIN_RETRY_DELAY, LOGIN_TOKEN_REFRESH_INTERVAL,} from '../config/settings';
import {MirAIePlatformAuthResponse, MirAIePlatformHome, PanasonicMirAIePlatformConfig,} from '../model/types';
import {Utils} from "../utilities/utils";

/**
 * This class exposes login, device status fetching, and device status update functions.
 */
export default class MirAIeApi {
    private accessToken: string;
    private _loginRefreshInterval: NodeJS.Timer | undefined;
    private _loginRetryTimeouts: NodeJS.Timer[] = [];
    private static readonly HTTP_CLIENT_ID: string = 'PBcMcfG19njNCL8AOgvRzIC8AjQa';
    private static readonly LOGIN_URL: string = 'https://auth.miraie.in/simplifi/v1/userManagement/login';
    private static readonly HOMES_URL: string = 'https://app.miraie.in/simplifi/v1/homeManagement/homes';

    constructor(
        private readonly config: PanasonicMirAIePlatformConfig,
        private readonly log: MirAIePlatformLogger,
    ) {
        this.accessToken = '';
    }

    /**
     * Getter for {@link this.accessToken}
     */
    public getAccessToken(): string {
        return this.accessToken;
    }

    /**
     * Logs in the user with MirAIe platform and
     * saves the retrieved token on the instance.
     */
    public async login(): Promise<void> {
        this.log.debug('MirAIeApi: Logging into MirAIe platform');

        /**
         * A repeat-login might have been requested by several accessories
         * at a similar time. The first timeout to be executed can clear
         * all remaining ones, since it doesn't make sense to log in multiple
         * times within a short amount of time.
         */
        for (const timeoutId of this._loginRetryTimeouts) {
            clearTimeout(timeoutId);
        }
        clearInterval(<NodeJS.Timer>this._loginRefreshInterval);
        const data = {
            'password': this.config.password,
            'clientId': MirAIeApi.HTTP_CLIENT_ID,
            'scope': this.getScope()
        };
        // Set mobile or email based on the input userId format
        Utils.isNumber(this.config.userId) ? data["mobile"] = this.config.userId : data["email"] = this.config.userId;

        return axios.request<MirAIePlatformAuthResponse>({
            method: 'post',
            url: MirAIeApi.LOGIN_URL,
            data: data,
        })
            .then((response) => {
                this.log.debug('MirAIeApi: MirAIe platform login succeeded');
                this.log.debug(JSON.stringify(response.data));
                this.accessToken = response.data.accessToken;

                // Set an interval to refresh the login token periodically.
                this._loginRefreshInterval = setInterval(this.login.bind(this),
                    LOGIN_TOKEN_REFRESH_INTERVAL);
            })
            .catch((error: AxiosError) => {
                this.log.debug('MirAIeApi: MirAIe platform login failed');
                this.log.debug(JSON.stringify(error, null, 2));
                this.log.error(
                    'Login failed. The MirAIe platform server might be experiencing issues at the moment. ' +
                    `Homebridge will try to log in again in ${LOGIN_RETRY_DELAY / 1000} seconds. ` +
                    'If the issue persists, make sure you configured the correct userId and password ' +
                    'and run the latest version of the plugin. ' +
                    'Restart Homebridge when you change your config, ' +
                    'as it will probably not have an effect on its own. ' +
                    'If the error still persists, please report to ' +
                    'https://github.com/thisisharishr/homebridge-panasonic-miraie-ac-platform/issues.',
                );
                // Try to login again after some time. Might just be a transient server issue.
                this._loginRetryTimeouts.push(setTimeout(this.login.bind(this), LOGIN_RETRY_DELAY));
            });
    }

    /**
     * Fetches the home details registered with the user's MirAIe platform account
     *
     * @returns A promise of all the user's MirAIe platform home details.
     */
    public async getHomeDetails(): Promise<MirAIePlatformHome[]> {
        this.log.debug('MirAIeApi: Fetching Home Details from MirAIeApi platform');

        if (!this.accessToken) {
            return Promise.reject('No auth token available (login probably failed). ' +
                'Check your credentials and restart HomeBridge.');
        }

        return axios.request<MirAIePlatformHome[]>({
            method: 'get',
            url: MirAIeApi.HOMES_URL,
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            },
        })
            .then((response) => {
                this.log.debug(JSON.stringify(response.data, null, 2));
                return response.data
            })
            .catch((error: AxiosError) => {
                this.log.debug('MirAIeApi: MirAIe platform getHomeDetails failed');
                this.handleNetworkRequestError(error);
                return Promise.reject();
            });
    }

    /**
     * Generic Axios error handler that checks which type of
     * error occurred and prints the respective information.
     *
     * @see https://axios-http.com/docs/handling_errors
     * @param error The error that is passes into the Axios error handler
     */
    private handleNetworkRequestError(error: AxiosError) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx.
            this.log.debug(JSON.stringify(error.response));
            if (error.response.status === 401) {
                // Unauthorised, try to log in again
                this._loginRetryTimeouts.push(setTimeout(this.login.bind(this), LOGIN_RETRY_DELAY));
            }
        } else if (error.request) {
            // The request was made but no response was received.
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            this.log.debug(error.request);
        } else {
            // Something happened in setting up the request that triggered an error.
            this.log.debug(error.message);
        }
    }

    private getScope(): string {
        return `an_${Math.floor(Math.random() * 1000000000)}`
    }
}
