const EventEmitter = require("events");
const fs = require("fs").promises;
const path = require("path");
const usersLogFile = path.join(__dirname, "../logs/auth.logs.log");
const userEmitter = new EventEmitter();

async function logUserEvent(log, user) {
  const logData = {
    log,
    user,
  };

  try {
    const data = await fs.readFile(usersLogFile, "utf8");
    let logs = data ? JSON.parse(data) : [];
    logs.push(logData);
    await fs.writeFile(usersLogFile, JSON.stringify(logs, null, 2));
    console.log(`[LOG] ${log} successfully logged.`);
  } catch (error) {
    console.error("Failed to update log:", error);
  }
}

userEmitter.on("userRegistered", (user) =>
  logUserEvent("User registered", user)
);
userEmitter.on("userLoggedIn", (user) => logUserEvent("User logged in", user));
userEmitter.on("userLoggedout", (user) => {
  logUserEvent("User logged out", user);
});
module.exports = userEmitter;
