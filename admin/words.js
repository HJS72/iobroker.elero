/*global systemDictionary:false */
'use strict';

// Register all words from here
const words = {
  'en': {
    'comport': 'Serial Port',
    'baudrate': 'Baud Rate',
    'devices': 'Devices',
    'channel': 'Channel',
    'name': 'Name',
    'type': 'Device Type',
    'awning': 'Awning',
    'blind': 'Blind',
    'shutter': 'Shutter'
  },
  'de': {
    'comport': 'Serieller Port',
    'baudrate': 'Baud-Rate',
    'devices': 'Geräte',
    'channel': 'Kanal',
    'name': 'Name',
    'type': 'Gerätetyp',
    'awning': 'Markise',
    'blind': 'Jalousie',
    'shutter': 'Rollo'
  }
};

function applyWord(id, word) {
  const el = document.getElementById(id);
  if (el) {
    el.innerText = word;
  }
}

if (typeof systemDictionary !== 'undefined') {
  Object.assign(systemDictionary, words);
}
