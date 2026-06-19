const path = require("path");
const { tests } = require("@iobroker/testing");

// Run official package file checks used by ioBroker adapters.
tests.packageFiles(path.join(__dirname, "../.."));
