const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");
const sessionsDb = path.join(__dirname, "../../sessions.json");

const generateSessionId = async () => {
  try {
    let sessions = await fs.readFile(sessionsDb, "utf8");
    sessions = sessions ? JSON.parse(sessions) : []
    let sessionId;
    do {
      sessionId = crypto.randomBytes(32).toString("hex");
    } while (sessions[sessionId]);
    return sessionId;
  } catch (error) {
    throw error;
  }
};

module.exports = generateSessionId;
