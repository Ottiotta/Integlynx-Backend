const slack = require("./slack.js");
const log = require("./logging.js");

function removeHTML(str) {
  str = str.replace("<", "&lt;");
  str = str.replace(">", "&gt;");
  return str;
}

function markup(str) {
  log.debug("markup called");
  // code block
  str = str.replace(
    /^```((?:.|(?:\n))*?)```(?=$)/gm,
    "<code style=' background-color: #e1e1e1; padding: 1; border-style: solid; border-color: #c0c0c0; border-radius: 5px; display: block;'>$1</code>",
  );
  // blockquote
  str = str.replace(/^\&gt; (.*?)(?=$)/gm, "<blockquote>$1</blockquote>");
  // bullet
  str = str.replace(/^\* (.*?)(?=$)/gm, "• $1");
  // italic
  str = str.replace(/\_(.*?)\_/g, "<i>$1</i>");
  // bold
  str = str.replace(/\*(.*?)\*/g, "<b>$1</b>");
  // strikethrough
  str = str.replace(/\~(.*?)\~/g, "<s>$1</s>");
  // code
  str = str.replace(
    /`(.*?)`/g,
    "<code style='color: crimson; background-color: #e1e1e1; padding: 1; border-style: solid; border-color: #c0c0c0; border-radius: 5px;'>$1</code>",
  );
  // heading 1
  str = str.replace(/^\# (.*?)(?=$)/gm, "<h1>$1</h1>");
  // heading 2
  str = str.replace(/^\#\# (.*?)(?=$)/gm, "<h2>$1</h2>");
  // heading 3
  str = str.replace(/^\#\#\# (.*?)(?=$)/gm, "<h3>$1</h3>");
  return str;
}

function newLine(str) {
  str = str.split("\n").join("<br/>");
  return str;
}

function format(str) {
  log.info("format called");
  log.debug("in string: " + str);
  str = removeHTML(str);
  str = markup(str);
  str = newLine(str);
  log.debug("out string: " + str);
  return str;
}

module.exports = { format, linkHandle, replaceAsync };

async function linkHandle(match, name, target, path = "", rem, mail) {
  if (name !== undefined) {return await namedLinkHandle(match, name, target, path, rem, mail);}
  log.info("linkhandle called");
  log.debug("match: " + match);
  log.debug("target: " + target);
  log.debug("path: " + path);
  log.debug("rem: " + rem);
  log.debug("mail: " + mail);
  if (mail == undefined) {
    try {
      fetchresult = (await fetch("https://" + target + path)).headers
        .get("Content-Type")
        .includes("image");
      log.debug("fetch: " + fetchresult);
    } catch (error) {
      log.warning(error);
      fetch = false;
    }
    if (fetchresult) {
      return `<img src="${"https://" + target + path}">`;
    } else {
      if (rem != undefined) {
        return `<a href="${"https://" + rem}" target="_blank">${rem}</a>`;
      } else {
        log.debug(
          `OUT LINK: <a href="${"https://" + target + path}" target="_blank">${target + path}</a>`,
        );
        return `<a href="${"https://" + target + path}" target="_blank">${target + path}</a>`;
      }
    }
  } else return `<a href="mailto:${mail}">${mail}</a>`;
}

async function namedLinkHandle(match, name, target, path = "", rem, mail) {
  log.info("namedlinkhandle called");
  log.debug("match: " + match);
  log.debug("name: " + name);
  log.debug("target: " + target);
  log.debug("path: " + path);
  log.debug("rem: " + rem);
  log.debug("mail: " + mail);
  if (mail == undefined) {
    if (rem != undefined) {
      return `<a href="${"https://" + rem}" target="_blank">${name}</a>`;
    } else {
      log.debug(
        `OUT LINK: <a href="${"https://" + target + path}" target="_blank">${name}</a>`,
      );
      return `<a href="${"https://" + target + path}" target="_blank">${name}</a>`;
    }
  } else return `<a href="mailto:${mail}">${name}</a>`;
}

async function replaceAsync(str, regex, asyncFn) {
  log.info("replaceAsync called");
  const promises = [];
  str.replace(regex, (full, ...args) => {
    promises.push(asyncFn(full, ...args));
    return full;
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}
