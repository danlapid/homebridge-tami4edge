import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { Tami4 } from './platform';
import { Commands } from './tami4';
import axios from 'axios';

export class Tami4EdgeAccessory {
  private service: Service;

  constructor(
    private readonly platform: Tami4,
    private readonly accessory: PlatformAccessory,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);

    this.service.setCharacteristic(this.platform.Characteristic.Name, 'Tami4');

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));
  }

  async setOn(value: CharacteristicValue) {
    // this.exampleStates.On = value as boolean;
    this.platform.log.debug('Set Characteristic On ->', value);

    const instance = axios.create({
      baseURL: 'https://swelcustomers.strauss-water.com/',
      timeout: 10000,
      headers: {
        'User-Agent': 'tami4edge/81 CFNetwork/1325.0.1 Darwin/21.1.0',
        'Cookie': this.platform.cookie,
        'Authorization': 'Bearer ' + this.platform.access_token,
      },
      responseType: 'json',
      withCredentials: true,
    });
    try {
      await instance.post(Commands.START_BOILING.replace('{device_id}', this.accessory.context.deviceId));
      this.platform.log.info('Tami4 water boiled successfully');
    } catch (error) {
      this.platform.log.info('Tami4 water boil got error');
    }
  }

  async getOn(): Promise<CharacteristicValue> {
    // const isOn = this.exampleStates.On;
    // this.platform.log.debug('Get Characteristic On ->', isOn);
    return false;
  }
}
