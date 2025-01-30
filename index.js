const http = require("http");
const slack = require("./slack.js");
const requesthandle = require("./requesthandle.js");

const slackBotId = process.env["SLACK_BOT_ID"];
const clickupSlackBotId = process.env["CLICKUP_SLACK_BOT_ID"];

const server = http.createServer(function (req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    // Preflight request handling
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.statusCode = 204; // No Content
    res.end();
    return;
  }

  let data = "";
  req.on("data", (chunk) => {
    data += chunk;
  });

  req.on("end", async function () {
    // Store posted message in database
    if (req.method === "POST" && req.url === "/api/messages/send") {
      try {
        const jsonData = JSON.parse(data);
        await requesthandle.sendMessage(jsonData);

        res.setHeader("Content-Type", "application/json");
        res.statusCode = 201; // Created
        res.end(
          JSON.stringify({
            message: "Message sent successfully",
            content: jsonData.message,
          }),
        );
      } catch (error) {
        res.statusCode = 400; // Bad request
        res.end("Error: Invalid JSON data");
        console.log("Error:" + JSON.stringify(error));
      }

      // Send all messages to front-end
    } else if (req.method === "GET" && req.url === "/api/messages") {
      const messages = await requesthandle.getMessages();

      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(messages));

      // Remove message from database
    } else if (req.method === "POST" && req.url === "/api/messages/delete") {
      let jsonData = {};
      console.log(data);
      try {
        jsonData = JSON.parse(data);
      } catch {}

      await requesthandle.removeMessage(jsonData.id);
      console.log("jsonData.id: " + jsonData.id);
      console.log("jsonData: " + JSON.stringify(jsonData));

      res.statusCode = 200;
      res.end("Deleted every message");

      // Edit message using its id
    } else if (req.method === "POST" && req.url === "/api/messages/edit") {
      let jsonData = {};
      console.log(data);
      try {
        jsonData = JSON.parse(data);
      } catch {}

      const message = await requesthandle.editMessage(
        jsonData.id,
        jsonData.message,
      );
      console.log("jsonData.id: " + jsonData.id);
      console.log("jsonData: " + JSON.stringify(jsonData));

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(message));

      // Send message to Slack
    } else if (
      req.method === "POST" && req.url.includes("/event/message/slack")) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      const jsonData = JSON.parse(data);
      if (jsonData.event.text === undefined) {
        return;
      }
      await requesthandle.slackMessage(jsonData);

      res.end("Message received");

      // Route not found
    } else {
      res.statusCode = 400;
      res.end("Not Found");
    }
  });
});

server.listen(80, "0.0.0.0", () => {
  console.log("Server running at localhost");
});


/* JSON data retrieved from slack:
{
  "token": "bogNVHxc9h3GNHToYjjElUpB",
  "team_id": "T05QZRA9P3R",
  "context_team_id": "T05QZRA9P3R",
  "context_enterprise_id": null,
  "api_app_id": "A06QK370Y3E",
  "event": {
    "user": "U05RGR7UFT6",
    "type": "message",
    "ts": "1727795493.267129",
    "client_msg_id": "326ed927-e38a-4e24-8dd5-c501dd1a196d",
    "text": "det var ju skumt",
    "team": "T05QZRA9P3R",
    "blocks": [
      {
        "type": "rich_text",
        "block_id": "qembx",
        "elements": [
          {
            "type": "rich_text_section",
            "elements": [
              {
                "type": "text",
                "text": "det var ju skumt"
              }
            ]
          }
        ]
      }
    ],
    "channel": "C05UUA7F61J",
    "event_ts": "1727795493.267129",
    "channel_type": "channel"
  },
  "type": "event_callback",
  "event_id": "Ev07PT7N7S7P",
  "event_time": 1727795493,
  "authorizations": [
    {
      "enterprise_id": null,
      "team_id": "T05QZRA9P3R",
      "user_id": "U06QW3K37LZ",
      "is_bot": true,
      "is_enterprise_install": false
    }
  ],
  "is_ext_shared_channel": false,
  "event_context": "4-eyJldCI6Im1lc3NhZ2UiLCJ0aWQiOiJUMDVRWlJBOVAzUiIsImFpZCI6IkEwNlFLMzcwWTNFIiwiY2lkIjoiQzA1VVVBN0Y2MUoifQ"
}
*/