
const fs = require("node:fs");
const config = JSON.parse(fs.readFileSync("logging.json"));

function getCallerInfo() {
  const err = new Error();
  const stack = err.stack.split('\n')[3]; // Get caller of logging function
  const caller = stack.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) || 
                 stack.match(/at\s+()(.*):(\d+):(\d+)/);
  if (caller) {
    return `${caller[2]}:${caller[3]}`;
  }
  return 'unknown';
}

function debug(text) {
  log("DEBUG", getCallerInfo(), text);
}

function info(text) {
  log("INFO", getCallerInfo(), text);
}

function warning(text) {
  log("WARNING", getCallerInfo(), text);
}

function error(text) {
  log("ERROR", getCallerInfo(), text);
}

function log(level, source, text) {
  const template = config.templates[level] || config.templates.default;
  const output = template.replace('${level}', level)
                        .replace('${source}', source)
                        .replace('${text}', text);
  console.log(output);
}

module.exports = { debug, info, warning, error };
