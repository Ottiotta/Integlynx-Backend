const db = require("./database.js");
const formatting = require("./formatting.js");
const slack = require("./slack.js");
const log = require("./logging.js");
const slackBotId = process.env.SLACK_BOT_ID;
const clickupSlackBotId = process.env.CLICKUP_SLACK_BOT_ID;

//regex is buggy

const linkRegex = /(?:(?:\[(.*?)\]\()(?=\)(?:$)|(?: )?))?(?:(?:(?:https?:\/\/)([\w$\-_.+!*',();:%]+)(?:([\w$\-_.+!*'(),/?#&=;:%][\w$\-_.+!*'(),@/?#&=;:%]*[\w$\-_.+!*'(,@/?#&=;:%])|\@([\w$\-_.+!*'(),@/?#&=;:%]*))?)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}))(?:\))?/mgi
  
async function getMessages() {
  return await db.getDB();
};

async function sendMessage(jsonData) {
  log.info("sendMessage called");
  try {
    slack.postMessage(jsonData.message);

    let raw = jsonData.message;

    log.debug("jsonData:", jsonData.message);

    // remove html tags, add markup, newline
    jsonData.message = formatting.format(jsonData.message);
    // handle links and images
    jsonData.message = await formatting.replaceAsync(
      jsonData.message,
      linkRegex,
      formatting.linkHandle,
    );

    await db.addDB(jsonData.message, raw);
  } catch (error) {
    log.error(error, true);
    throw new Error("Error sending message");
  }
}

async function slackMessage(jsonData) {
  log.info("slackMessage called");
  log.debug("jsonData.event.bot_id: " + jsonData.event.bot_id);
  log.debug("slackBotId: " + slackBotId);

  let msg = jsonData.event.text;
  let raw = jsonData.event.text;

  if (jsonData.event.bot_id != slackBotId) {
    // For preventing message recursion
    msg = formatting.format(msg);
    msg = await slack.linkHandle(msg);
    msg = slack.mailHandle(msg);

    //clickup
    if (jsonData.event.bot_id == clickupSlackBotId) {
      msg += slack.clickupHandle(
        jsonData.event.attachments[0].blocks[0].text.text,
      );
    }

    await db.addDB(msg, raw);
  }
}

async function removeMessage(id = "all") {
  log.info("removeMessage called");
  if (id == "all") await db.setDB([{ message: "Resetted!", id: "0" }]);
  else await db.removeDB(id);
}

async function editMessage(id, raw) {
  log.info("editMessage called");
  // remove html tags, add markup, newline
  let message = formatting.format(raw);
  // handle links and images
  message = await formatting.replaceAsync(
    message,
    linkRegex,
    formatting.linkHandle,
  );
  await db.editDB(id, message, raw);

  return { message: message, id: id, raw: raw };
}

module.exports = {
  getMessages,
  sendMessage,
  removeMessage,
  editMessage,
  slackMessage,
};
