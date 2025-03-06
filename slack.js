const log = require("./logging.js");
const webhook = process.env["slack_webhook_url"];

async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (full, ...args) => {
    promises.push(asyncFn(full, ...args));
    return full;
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

function mailHandle(text) {
  log.debug("mailHandle: " + text);
  const regex =
    /&lt;mailto:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})&gt;/gi;
  let outtext = text.replace(regex, (match, email) => {
    return `<a href="mailto:${email}">${email}</a>`;
  });
  return outtext;
}

async function linkMatchHandle(match, link) {
  log.info("slackLinkHandle called");
  log.debug("match: " + match);
  log.debug("link: " + link);
  try {
    fetchresult = (await fetch(link)).headers
      .get("Content-Type")
      .includes("image");
    log.debug("fetch: " + fetchresult);
  } catch (error) {
    log.warning("error: " + error);
    fetch = false;
  }
  if (fetchresult) {
    return `<img src="${link}" height="200" width="240">`;
  } else {
    return `<a href="${link}" target="_blank">${link}</a>`;
  }
}

async function linkHandle(text) {
  log.debug(text);
  let outtext = await replaceAsync(
    text,
    /&lt;(https?:\/\/[^\s]+\.[^\s]+)&gt;/gi,
    linkMatchHandle,
  );
  return outtext;
}

function clickupHandle(attach) {
  log.debug(attach);
  let outtext =
    "<br/><br/><b>Task:</b> " +
    attach.replace(
      /\*<(https:\/\/[\w./]*)\|([\w \-():]*)>\*/i,
      (match, link, text) => {
        return `<a href="${link}" target="_blank">${text}</a>`;
      },
    );
  return outtext;
}

function postMessage(text) {
  log.info("postMessage called");
  log.debug("text: " + text);
  fetch(webhook, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache",
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer",
    body: JSON.stringify({ text: text, id: 2 }),
  }).then((response) => {
    log.debug("Response from posting in Slack: " + JSON.stringify(response));
  });
}

module.exports = { postMessage, linkHandle, mailHandle, clickupHandle };
