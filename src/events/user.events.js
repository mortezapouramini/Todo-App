const EventEmitter = require("events");
const fs = require("fs");
const path = require("path");
const usersLogFile = path.join(__dirname, "../logs/user.logs.log");
const userEmitter = new EventEmitter();

function logUserEvent(eventName, user) {
  const logData = {
    message: eventName,
    user,
  };

  fs.readFile(usersLogFile, "utf8", (err, data) => {
    if (err) {
      console.error("Corrupted log file, starting fresh.");
    }
    let logs = data ? JSON.parse(data) : [];
    logs.push(logData);

    fs.writeFile(usersLogFile, JSON.stringify(logs, null, 2), (err) => {
      if (err) {
        console.error("Failed to update log:", err);
      } else {
        console.log(`[LOG] ${eventName} successfully logged.`);
      }
    });
  });
}

userEmitter.on("userRegistered", (user) =>
  logUserEvent("User registered", user)
);
userEmitter.on("userLoggedIn", (user) => logUserEvent("User logged in", user));

module.exports = userEmitter;
