const slack = require("./slack.js");

function removeHTML(str) {
  str = str.replace("<", "&lt;");
  str = str.replace(">", "&gt;");
  return str;
}

function markup(str) {
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
};

function newLine(str) {
  str = str.split("\n").join("<br/>");
  return str;
};

function format(str) {
  str = removeHTML(str);
  str = markup(str);
  str = newLine(str);
  return str;
};

module.exports = { format, linkHandle, replaceAsync };

async function linkHandle(match, target, path = "", rem, mail) {
  console.log("linkhandle called");
  console.log("match: " + match);
  console.log("target: " + target);
  console.log("path: " + path);
  console.log("rem: " + rem);
  console.log("mail: " + mail);
  if (mail == undefined) {
    try {
      fetchresult = (await fetch("https://" + target + path)).headers
        .get("Content-Type")
        .includes("image");
      console.log("fetch: " + fetchresult);
    } catch (error) {
      console.log("error: " + error);
      fetch = false;
    }
    if (fetchresult) {
      return `<img src="${"https://" + target + path}">`;
    } else {
      if (rem != undefined) {
        return `<a href="${"https://" + rem}" target="_blank">${rem}</a>`;
      } else {
        console.log(
          `OUT LINK: <a href="${"https://" + target + path}" target="_blank">${target + path}</a>`,
        );
        return `<a href="${"https://" + target + path}" target="_blank">${target + path}</a>`;
      };
    };
  } else return `<a href="mailto:${mail}">${mail}</a>`;
};

async function replaceAsync(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (full, ...args) => {
    promises.push(asyncFn(full, ...args));
    return full;
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}
