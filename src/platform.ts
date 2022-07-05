import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { Tami4EdgeAccessory as Tami4EdgeAccessory } from './platformAccessory';
import { Commands } from './tami4';
import axios, { AxiosResponse } from 'axios';

export class Tami4 implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  public access_token = '';
  public cookie = '';

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', PLATFORM_NAME);

    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');
      setInterval(() => {
        this.refreshToken();
      }, 300000);
      this.discoverDevices();
    });
  }

  async refreshToken() {
    const instance = axios.create({
      baseURL: 'https://swelcustomers.strauss-water.com/',
      timeout: 10000,
      headers: {
        'User-Agent': 'tami4edge/81 CFNetwork/1325.0.1 Darwin/21.1.0',
      },
      responseType: 'json',
      withCredentials: true,
    });
    let response: AxiosResponse | undefined = undefined;
    try {
      response = await instance.post(Commands.SPLASH_SCREEN);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        response = error.response!;
      }
    }

    this.access_token = response!.data['access_token'];
    this.cookie = response!.headers['set-cookie']!.join('; ');
    instance.defaults.headers.common['Cookie'] = this.cookie;
    try {
      const token_response = await instance.post(Commands.TOKEN_REFRESH, {
        'token': this.config.refresh_token,
      }); this.log.debug('Token refreshed');
      this.access_token = token_response.data['access_token'];
    } catch (error) {
      this.log.debug('Token refresh error');
    }
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    this.refreshToken().then(() => {
      const instance = axios.create({
        baseURL: 'https://swelcustomers.strauss-water.com/',
        timeout: 10000,
        headers: {
          'User-Agent': 'tami4edge/81 CFNetwork/1325.0.1 Darwin/21.1.0',
          'Cookie': this.cookie,
          'Authorization': 'Bearer ' + this.access_token,
        },
        responseType: 'json',
        withCredentials: true,
      });
      instance.get(Commands.DEVICE_DATA)
        .then(response => {
          for (const device of response.data) {
            this.log.debug('Searching for device: ' + device);
            const deviceId = device['id'];
            const uuid = this.api.hap.uuid.generate(deviceId);
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
            if (existingAccessory) {
              this.log.debug('Found: ' + deviceId);
              this.log.debug('Restoring existing accessory from cache:', existingAccessory.displayName);
              new Tami4EdgeAccessory(this, existingAccessory);
            } else {
              this.log.debug('Adding: ' + deviceId);
              const accessory = new this.api.platformAccessory('Tami4', uuid);
              accessory.context.deviceId = deviceId;
              new Tami4EdgeAccessory(this, accessory);
              this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            }
          }
        }).catch(error => {
          this.log.info(error);
        });
    });
  }
}
