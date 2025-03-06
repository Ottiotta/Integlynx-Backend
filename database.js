const Client = require("@replit/database");
const client = new Client();
const log = require("./logging.js");

async function addId(element, raw) {
  log.info("addId called");
  array = await getDB();
  let value = { message: "", id: "", raw: "" };
  value.message = element;
  let id;
  if (array.length == 0 || !isFinite(array[array.length - 1].id)) {
    id = "0";
  } else {
    id = (parseInt(array[array.length - 1].id) + 1).toString();
  }
  value.id = id;
  value.raw = raw;
  return value;
}

async function addDB(data, raw) {
  log.info("addDB called");
  let currentMessages = await getDB();
  currentMessages.push(await addId(data, raw));
  await setDB(currentMessages);
}

async function getDB() {
  log.info("getDB called");
  return JSON.parse(await client.get("messages"));
}

async function setDB(data) {
  log.info("setDB called");
  await client.set("messages", JSON.stringify(data));
}

async function removeDB(id) {
  log.info("removeDB called");
  log.debug("Message id: " + id);
  let currentMessages = await getDB();
  let index = currentMessages.findIndex((element) => element.id == id);
  log.debug(
    "(before delete) currentMessages: " + JSON.stringify(currentMessages),
  );
  log.debug("index of message to be spliced: " + index);
  if (index > -1) {
    currentMessages.splice(index, 1);
  }
  log.log(
    "(after delete) currentMessages: " + JSON.stringify(currentMessages),
  );
  await setDB(currentMessages);
}

async function editDB(id, content, raw) {
  log.info("editDB called");
  log.debug("Message id: " + id);
  let currentMessages = await getDB();
  let index = currentMessages.findIndex((element) => element.id == id);
  log.debug(
    "(before edit) currentMessages: " + JSON.stringify(currentMessages),
  );
  log.debug("index of message to be edited: " + index);
  if (index > -1) {
    currentMessages[index].message = content;
    currentMessages[index].raw = raw;
  }
  log.debug(
    "(after edit) currentMessages: " + JSON.stringify(currentMessages),
  );
  await setDB(currentMessages);
}

module.exports = { addDB, getDB, setDB, removeDB, editDB };
