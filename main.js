const utils = require(__dirname + '/lib/utils');
const SerialPort = require('serialport');
const adapter = new utils.Adapter('elero');

let serialPort = null;
const deviceMap = {};

adapter.on('ready', async () => {
  adapter.log.info('Elero adapter starting');
  
  // Get configuration
  const comport = adapter.config.comport || '/dev/cu.usbserial-A101XT0C';
  const baudrate = adapter.config.baudrate || 38400;
  const devices = adapter.config.devices || [];

  adapter.log.info(`Opening serial port: ${comport} @ ${baudrate} baud`);
  
  try {
    // Open serial port
    serialPort = new SerialPort(comport, { baudRate: baudrate });
    
    serialPort.on('open', () => {
      adapter.log.info('Serial port opened successfully');
    });
    
    serialPort.on('error', (err) => {
      adapter.log.error(`Serial port error: ${err.message}`);
    });
    
    serialPort.on('data', (data) => {
      handleSerialData(data);
    });

    // Set up devices
    for (const device of devices) {
      const channel = device.channel;
      const name = device.name || `Device ${channel}`;
      const type = device.type || 'awning';
      
      const stateId = `${adapter.namespace}.${channel}`;
      deviceMap[channel] = { name, type, stateId };
      
      // Create folder
      await adapter.setObjectNotExistsAsync(channel.toString(), {
        type: 'folder',
        common: { name },
        native: {}
      });
      
      // Create state objects
      await adapter.setObjectNotExistsAsync(`${channel}.state`, {
        type: 'state',
        common: {
          name: `${name} state`,
          type: 'number',
          role: 'state',
          read: true,
          write: false,
          min: 0,
          max: 100,
          desc: 'Position: 0=down, 50=moving, 100=up'
        },
        native: {}
      });
      
      await adapter.setObjectNotExistsAsync(`${channel}.up`, {
        type: 'state',
        common: {
          name: `${name} up`,
          type: 'boolean',
          role: 'button',
          read: false,
          write: true,
          desc: 'Move device up'
        },
        native: { cmd: 'up', channel }
      });
      
      await adapter.setObjectNotExistsAsync(`${channel}.down`, {
        type: 'state',
        common: {
          name: `${name} down`,
          type: 'boolean',
          role: 'button',
          read: false,
          write: true,
          desc: 'Move device down'
        },
        native: { cmd: 'down', channel }
      });
      
      await adapter.setObjectNotExistsAsync(`${channel}.stop`, {
        type: 'state',
        common: {
          name: `${name} stop`,
          type: 'boolean',
          role: 'button',
          read: false,
          write: true,
          desc: 'Stop device'
        },
        native: { cmd: 'stop', channel }
      });
    }
    
    // Subscribe to state changes
    adapter.subscribeStates('*');
    
  } catch (err) {
    adapter.log.error(`Failed to open serial port: ${err.message}`);
    adapter.log.error('Available ports: /dev/tty.* or /dev/cu.* on macOS');
  }
});

adapter.on('stateChange', async (id, state) => {
  if (!state || state.ack === true) return; // Ignore acknowledged states
  
  const parts = id.split('.');
  if (parts.length < 3) return;
  
  const channel = parseInt(parts[2]);
  const cmd = parts[3];
  
  if (!deviceMap[channel]) {
    adapter.log.warn(`Unknown device channel: ${channel}`);
    return;
  }
  
  // Send command via serial port
  sendEleroCommand(channel, cmd);
});

function sendEleroCommand(channel, cmd) {
  if (!serialPort || !serialPort.isOpen) {
    adapter.log.error('Serial port not open');
    return;
  }
  
  // Elero protocol: commands are sent as byte sequences
  // Format: [0xAA, 0x55, length, cmd_type, channel, ...]
  // cmd_type: 0x01=up, 0x02=down, 0x04=stop, 0x08=intermediate, 0x10=ventilation
  
  let cmdByte = 0;
  switch (cmd) {
    case 'up':
      cmdByte = 0x01;
      break;
    case 'down':
      cmdByte = 0x02;
      break;
    case 'stop':
      cmdByte = 0x04;
      break;
    case 'intermediate':
      cmdByte = 0x08;
      break;
    case 'ventilation':
      cmdByte = 0x10;
      break;
    default:
      adapter.log.warn(`Unknown command: ${cmd}`);
      return;
  }
  
  // Build frame: [0xAA, 0x55, 0x03, cmdByte, channel-1, checksum]
  const frame = Buffer.from([
    0xAA,
    0x55,
    0x03,
    cmdByte,
    channel - 1, // Elero uses 0-based channels
    0x00  // Placeholder for checksum
  ]);
  
  // Calculate checksum (simple XOR)
  let checksum = 0;
  for (let i = 0; i < frame.length - 1; i++) {
    checksum ^= frame[i];
  }
  frame[5] = checksum;
  
  serialPort.write(frame, (err) => {
    if (err) {
      adapter.log.error(`Serial write error: ${err.message}`);
    } else {
      adapter.log.debug(`Sent command to channel ${channel}: ${cmd}`);
    }
  });
}

function handleSerialData(data) {
  // Parse response data from Elero stick
  // Response format: [0xAA, 0x55, length, response_type, channel, ...]
  
  if (data.length < 5 || data[0] !== 0xAA || data[1] !== 0x55) {
    return;
  }
  
  const len = data[2];
  const respType = data[3];
  const channel = data[4] + 1; // Convert to 1-based
  
  if (!deviceMap[channel]) return;
  
  // Update state based on response
  let state = 50; // moving
  switch (respType) {
    case 0x00: // No response/timeout
      break;
    case 0x01: // Up
      state = 100;
      break;
    case 0x02: // Down
      state = 0;
      break;
    case 0x04: // Stopped
      state = 50;
      break;
  }
  
  adapter.setState(`${channel}.state`, state, true);
  adapter.log.debug(`Updated channel ${channel} state to ${state}`);
}

adapter.on('unload', (callback) => {
  if (serialPort && serialPort.isOpen) {
    serialPort.close(() => {
      adapter.log.info('Serial port closed');
      callback();
    });
  } else {
    callback();
  }
});

process.on('SIGINT', () => {
  if (adapter && adapter.stop) {
    adapter.stop();
  }
});
