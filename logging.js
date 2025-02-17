const fs = require("node:fs");
const config = JSON.parse(fs.readFileSync("logging.json"));
String.prototype.applyTemplates = applyTemplates;

function getCallerInfo() {
  const err = new Error();
  const stack = err.stack.split("\n")[3]; // Get caller of logging function
  log("INFO", { source: "getCallerInfo" }, stack);
  const caller =
    stack.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) ||
    stack.match(/at\s+()(.*):(\d+):(\d+)/);
  log("INFO", { source: "getCallerInfo" }, caller);
  if (caller) {
    return {
      file: caller[2].split("/")[-1],
      path: caller[2].replace(/.*\//, ""),
      line: caller[3],
      function: "fun" /*add function name*/,
    };
  }
  return "unknown";
}

function applyTemplates(
  templates,
  templateStart = "${",
  templateEnd = "}",
) {
  templates.forEach((template) => {
    text = text.replace(
      templateStart + template.key + templateEnd,
      template.value,
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

function log(level, sourceobj, text) {
  const template = config.templates[level] || config.templates.default;
  let source = config.templates.source.applyTemplates(sourceobj);
  const output = template
    .applyTemplates({
      level: level,
      source: source,
      text: text,
    })
    .applyTemplates(sourceobj);
  console.log(output);
}

module.exports = { debug, info, warning, error };
