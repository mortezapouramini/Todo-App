const fs = require("fs").promises;
const path = require("path");

const sessionsDb = path.join(__dirname, "../../sessions.json");

const authSession = async (req, res) => {
  try {
    const cookies = req.headers?.cookie || "";
    const parsedCookie = {};
    cookies.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) parsedCookie[key] = value;
    });

    const sessionId = parsedCookie.sessionId;
    if (!sessionId) {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Please login");
      return;
    }

    const data = await fs.readFile(sessionsDb, "utf8");
    const sessions = data ? JSON.parse(data) : [];
    const session = sessions.find((s) => s.sessionId === sessionId);

    if (!session) {
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Please login");
      return;
    }

    const { generatedAt, expiresIn } = session;
    const expiration = generatedAt + expiresIn;
    const now = Date.now();

    if (now >= expiration) {
      const filteredSessions = sessions.filter(
        (s) => s.sessionId !== sessionId
      );
      await fs.writeFile(sessionsDb, JSON.stringify(filteredSessions, null, 2));
      res.writeHead(401, { "Content-Type": "text/plain" });
      res.end("Session is expired, please login");
      return;
    }

    req.sessionId = sessionId;
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end("Internal server error");
  }
};

module.exports = authSession;
