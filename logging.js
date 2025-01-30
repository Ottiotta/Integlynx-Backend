const fs = require("node:fs");
const config = JSON.parse(fs.readFileSync("logging.json"));

function debug(text) {
  log("DEBUG", text);
}

function info(text) {
  log("INFO", text);
}

function warning(text) {
  log("WARNING", text);
}

function error(text) {
  log("ERROR", text);
}

function log(level, source, text) {
  templates = config.templates;
  template = (templates[level] !== undefined) ? templates[level] : templates.default;
  template.replacer = {
    level: level,
    source: source,
    text: text,
  }
	console.log(template)
}

module.exports = { debug, info, warning, error };
