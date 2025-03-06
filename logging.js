const fs = require("node:fs");
const config = JSON.parse(fs.readFileSync("logging.json"));
String.prototype.applyTemplates = applyTemplates;

function getCallerInfo() {
  const err = new Error();
  const stack = err.stack.split("\n")[3]; // Get caller of logging function
  const caller =
    stack.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) ||
    stack.match(/at\s+()(.*):(\d+):(\d+)/);
  if (caller) {
    return {
      function: caller[1].split(".")[1],
      name: caller[2].split("/").at(-1),
      path: caller[2].replace(/.*\//, ""),
      line: caller[3],
      column: caller[4],
    };
  }
  return "unknown";
}

function applyTemplates(templates, templateStart = "${", templateEnd = "}") {
  let text = this;
  Object.keys(templates).forEach((template) => {
    text = text.replace(
      templateStart + template + templateEnd,
      templates[template],
    );
  });
  return text;
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

function fatal(error) {
  log("FATAL", { 'name': error.name, 'stack': error.stack });
}

function log(level = "INFO", sourceobj = {}, text = "") {
  const template = config.templates[level] || config.templates.default;
  const display = config.display[level] || config.display.default;
  if (!display) {
    return;
  }
  let source = config.templates.source.applyTemplates(sourceobj);
  const output = template
    .applyTemplates({
      level: level,
      source: source,
      text: text,
    })
    .applyTemplates(sourceobj);

  if (level === "ERROR") {
    console.error(output);
  } else {
    console.log(output);
  }
}

module.exports = { debug, info, warning, error, fatal };
