const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const userEmitter = require("../events/user.events");
const generateSessionId = require("../utils/session.utils");
const usersDb = path.join(__dirname, "../../users.json");
const sessionsDb = path.join(__dirname, "../../sessions.json");

const register = async (req, res) => {
  let body = "";
  const contentType = req.headers["content-type"];

  if (contentType !== "application/json") {
    res.writeHead(400, { "Content-type": "text/plain" });
    return res.end("Bad request");
  }

  try {
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      if (!body) {
        res.writeHead(401, { "Content-type": "text/plain" });
        return res.end("Please fill out the forms.");
      }
      const { email, name, password } = JSON.parse(body);
      if (
        !email.endsWith("@gmail.com") ||
        name.length < 3 ||
        name.length > 16 ||
        password.length < 8 ||
        password.length > 32
      ) {
        res.writeHead(401, { "Content-type": "text/plain" });
        return res.end("Invalid info");
      }

      const data = await fs.promises.readFile(usersDb, "utf8");
      let users = data ? JSON.parse(data) : [];
      const isExistUser = users.some((u) => u.email === email);
      if (isExistUser) {
        res.writeHead(400, { "Content-type": "text/plain" });
        return res.end("Email is already exist");
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      let newUser = { id: Date.now(), email, name, hashedPassword };
      users.push(newUser);
      await fs.promises.writeFile(usersDb, JSON.stringify(users, null, 2));
      delete newUser.hashedPassword;
      userEmitter.emit("userRegistered", newUser);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "User registered", newUser }));
    });
  } catch (error) {
    res.writeHead(500, { "Content-type": "text/plain" });
    res.end(JSON.stringify({error : error.message}));
  }
};

const login = (req, res) => {
  const contentType = req.headers["content-type"];
  let body = "";

  if (contentType !== "application/json") {
    res.writeHead(400, { "Content-type": "text/plain" });
    return res.end("Bad request");
  }

  try {
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      if (!body) {
        res.writeHead(401, { "Content-type": "text/plain" });
        return res.end("Please fill out the forms.");
      }
      const { email, password } = JSON.parse(body);
      if (!email || !password) {
        res.writeHead(401, { "Content-type": "text/plain" });
        return res.end("Invalid info");
      }

      const usersData = await fs.promises.readFile(usersDb, "utf8");
      let users = usersData ? JSON.parse(usersData) : [];
      const user = users.find((u) => u.email === email);
      if (!user) {
        res.writeHead(500, { "Content-type": "text/plain" });
        return res.end("User not found");
      }
      const isMatchPassword = await bcrypt.compare(
        password,
        user.hashedPassword
      );
      if (!isMatchPassword) {
        res.writeHead(500, { "Content-type": "text/plain" });
        return res.end("Password does not match");
      }
      delete user.hashedPassword;
      let sessionId = await generateSessionId();
      const sessionData = {
        sessionId,
        user,
        generatedAt: Date.now(),
        expiresIn: 24 * 60 * 60 * 1000,
      };
      const sessionsData = await fs.promises.readFile(sessionsDb, "utf8");
      let sessions = sessionsData ? JSON.parse(sessionsData) : [];
      sessions.push(sessionData);
      await fs.promises.writeFile(
        sessionsDb,
        JSON.stringify(sessions, null, 2)
      );

      userEmitter.emit("userLoggedIn", user);
      res.writeHead(200, {
        "Content-type": "application/json",
        "set-cookie": `sessionId=${sessionId}; Max-Age=${
          sessionData.expiresIn / 1000
        }`,
      });
      res.end(JSON.stringify({ message: "User logged in", user }));
    });
  } catch (error) {
    res.writeHead(500, { "Content-type": "text/plain" });
    res.end(JSON.stringify({error : error.message}));
  }
};

const logOut = async (req, res , sessionId) => {
  try {
    const data = await fs.promises.readFile(sessionsDb, "utf8");
    let sessions = JSON.parse(data);
    const user = sessions.find((s) => s.sessionId === sessionId);
    sessions = sessions.filter((s) => s.sessionId !== sessionId);
    await fs.promises.writeFile(sessionsDb, JSON.stringify(sessions, null, 2));
    delete user.sessionId;
    delete user.generatedAt;
    delete user.expiresIn;
    userEmitter.emit("userLoggedout", user);
    res.writeHead(200, {
      "Content-type": "text/plain",
      "set-cookie": "sessionId=; Max-Age=0;",
    });
    res.end("log out successful");
  } catch (error) {
    res.writeHead(500, { "Content-type": "text/plain" });
    res.end(JSON.stringify({error : error.message}));
  }
};

module.exports = { register, login, logOut };
