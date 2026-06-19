const path = require('path');
const fs = require('fs');

exports.getAdapterDir = (adapterName) => {
  return path.resolve(__dirname, '../..', 'iobroker.' + adapterName);
};

exports.getControllerDir = () => {
  return path.resolve(__dirname, '../../../..');
};

exports.getLibDir = () => {
  return path.resolve(__dirname, '../');
};

class Adapter {
  constructor(name) {
    this.name = name;
    this.namespace = `${name}.0`;
    this.log = console;
    this.config = {};
    this.objects = {};
    this.states = {};
  }

  setObjectNotExistsAsync(id, obj) {
    return Promise.resolve();
  }

  setState(id, val, ack) {
    this.states[id] = { val, ack, ts: Date.now() };
  }

  subscribeStates(pattern) {
    return this;
  }

  on(event, handler) {
    return this;
  }

  stop() {
    process.exit(0);
  }
}

exports.Adapter = Adapter;
