# ioBroker Elero Adapter

Control Elero Centero devices (blinds, awnings, shutters) via USB Transmitter Stick in ioBroker.

## Installation

1. Copy this adapter folder into `node_modules/iobroker.elero`
2. Install dependencies: `npm install`
3. Restart ioBroker

## Configuration

### Serial Port
- Default: `/dev/cu.usbserial-A101XT0C` (macOS)
- On Linux: typically `/dev/ttyUSB0`
- Baud Rate: 38400 (default)

### Devices
Configure your devices (awnings, blinds, shutters) by specifying:
- **Channel**: The Elero channel (1-15) learned on the transmitter stick
- **Name**: Friendly name for the device (e.g., "Living Room Awning")
- **Type**: Device type (awning, blind, shutter)

## Usage

Each device will have three button controls:
- **up**: Move device to fully open/up position
- **down**: Move device to fully closed/down position
- **stop**: Stop device movement

The **state** object shows the last known position (0=down, 100=up, 50=moving).

## Notes

- Requires the Elero Transmitter Stick to be connected via USB
- Devices must be pre-learned on the transmitter stick (see Elero manual)
- Status updates are based on command echoes; actual position feedback requires bidirectional capable devices
- Supports up to 15 devices per transmitter stick

## Supported Devices

This adapter works with any Elero or compatible device that can be learned on the Centero Transmitter Stick, including:
- Elero blinds, awnings, and shutters
- Weinor awnings and similar compatible products

## Troubleshooting

**Serial port not found:**
- Check that the Elero Transmitter Stick is connected
- Verify the serial port path: `ls /dev/tty.* /dev/cu.*` (macOS) or `ls /dev/ttyUSB*` (Linux)

**Commands not working:**
- Ensure devices are properly learned on the transmitter stick
- Check baud rate setting (should be 38400)
- Review adapter logs for error messages

## License

MIT
