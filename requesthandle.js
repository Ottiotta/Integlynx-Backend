const db = require("./database.js");
const formatting = require("./formatting.js");
const slack = require("./slack.js");
const slackBotId = process.env.SLACK_BOT_ID;
const clickupSlackBotId = process.env.CLICKUP_SLACK_BOT_ID;

async function getMessages() {
  return await db.getDB();
}

async function sendMessage(jsonData) {
  slack.postMessage(jsonData.message);

  let raw = jsonData.message;

  console.log(
    "requesthandle.sendMessage -> jsonData.message: " + jsonData.message,
  );

  // remove html tags, add markup, newline
  jsonData.message = formatting.format(jsonData.message);
  //handle links and images
  jsonData.message = await formatting.replaceAsync(
    jsonData.message,
    /(?:https?:\/\/([\w.-]+)(?:(\/[\w./@-]*)|\@?([\w./@-]*))?)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi,
    formatting.linkHandle,
  );

  await db.addDB(jsonData.message, raw);
}

async function slackMessage(jsonData) {
  if (jsonData.event.bot_id != slackBotId) {
    // For preventing message recursion
    jsonData.event.text = formatting.format(jsonData.event.text);
    jsonData.event.text = await slack.linkHandle(jsonData.event.text);
    jsonData.event.text = slack.mailHandle(jsonData.event.text);

    //clickup
    if (jsonData.event.bot_id == clickupSlackBotId) {
      jsonData.event.text += slack.clickupHandle(
        jsonData.event.attachments[0].blocks[0].text.text,
      );
    }

    await db.addDB(jsonData.event.text, jsonData.event.text);
  }
}

async function removeMessage(id = "all") {
  if (id == "all") await db.setDB([{ message: "Resetted!", id: "0" }]);
  else await db.removeDB(id);
}

async function editMessage(id, raw) {
  // remove html tags, add markup, newline
  let message = formatting.format(raw);
  // handle links and images
  message = await formatting.replaceAsync(
    message,
    /(?:https?:\/\/([\w.-]+)(?:(\/[\w./@-]*)|\@?([\w./@-]*))?)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi,
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
