const EventEmitter = require("events");
const fs = require("fs");
const path = require("path");
const usersLogFile = path.join(__dirname, "../logs/user.logs.log");
const userEmitter = new EventEmitter();

userEmitter.on("userRegistered", (message) => {
  const logData = {
    message: "User registered",
    user: message,
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
        console.log("[LOG] User registered successfully logged.");
      }
    });
  });
});

userEmitter.on("userLoggedIn", (message) => {
  const logData = {
    message: "User logged in",
    user: message,
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
        console.log("[LOG] User logged in successfully logged.");
      }
    });
  });
});

module.exports = userEmitter;
