const rfxcom = require('rfxcom');

let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory(
    'homebridge-mertik-fireplace',
    'MertikFireplace',
    MertikFireplaceAccessory
  );
};

class MertikFireplaceAccessory {
  constructor(log, config) {
    this.log = log;
    this.name = config.name || 'Mertik Fireplace';
    this.serialPort = config.serialPort || '/dev/ttyUSB0';
    this.codes = config.codes || {}; // { on, off, up, down }

    this.rfx = new rfxcom.RfxCom(this.serialPort);
    this.log(`Using serial port ${this.serialPort}`);

    // Main On/Off service
    this.service = new Service.Switch(this.name);
    this.service
      .getCharacteristic(Characteristic.On)
      .on('set', this.setOn.bind(this));

    // Up service
    this.upService = new Service.Switch(this.name + ' Up', 'Up');
    this.upService
      .getCharacteristic(Characteristic.On)
      .on('set', this.setUp.bind(this));

    // Down service
    this.downService = new Service.Switch(this.name + ' Down', 'Down');
    this.downService
      .getCharacteristic(Characteristic.On)
      .on('set', this.setDown.bind(this));
  }

  sendCommand(commandObj, callback) {
    if (!commandObj) return callback(new Error('Command not configured'));
    this.log(`Sending command: ${JSON.stringify(commandObj)}`);
    try {
      this.rfx.send(commandObj);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  setOn(value, callback) {
    const commandObj = value ? this.codes.on : this.codes.off;
    this.sendCommand(commandObj, callback);
  }

  setUp(value, callback) {
    if (!value) return callback(null);
    this.sendCommand(this.codes.up, (err) => {
      this.upService.getCharacteristic(Characteristic.On).updateValue(false);
      callback(err);
    });
  }

  setDown(value, callback) {
    if (!value) return callback(null);
    this.sendCommand(this.codes.down, (err) => {
      this.downService.getCharacteristic(Characteristic.On).updateValue(false);
      callback(err);
    });
  }

  getServices() {
    return [this.service, this.upService, this.downService];
  }
}
