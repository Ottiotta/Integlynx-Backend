const Client = require("@replit/database");
const client = new Client();

async function addId(element, raw) {
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
  let currentMessages = await getDB();
  currentMessages.push(await addId(data, raw));
  await setDB(currentMessages);
}

async function getDB() {
  return JSON.parse(await client.get("messages"));
}

async function setDB(data) {
  await client.set("messages", JSON.stringify(data));
}

async function removeDB(id) {
  console.log("Message id: " + id);
  let currentMessages = await getDB();
  let index = currentMessages.findIndex((element) => element.id == id);
  console.log(
    "(before delete) currentMessages: " + JSON.stringify(currentMessages),
  );
  console.log("index of message to be spliced: " + index);
  if (index > -1) {
    currentMessages.splice(index, 1);
  }
  console.log(
    "(after delete) currentMessages: " + JSON.stringify(currentMessages),
  );
  await setDB(currentMessages);
}

async function editDB(id, content, raw) {
  console.log("Message id: " + id);
  let currentMessages = await getDB();
  let index = currentMessages.findIndex((element) => element.id == id);
  console.log(
    "(before edit) currentMessages: " + JSON.stringify(currentMessages),
  );
  console.log("index of message to be edited: " + index);
  if (index > -1) {
    currentMessages[index].message = content;
    currentMessages[index].raw = raw;
  }
  console.log(
    "(after edit) currentMessages: " + JSON.stringify(currentMessages),
  );
  await setDB(currentMessages);
}

module.exports = { addDB, getDB, setDB, removeDB, editDB };
