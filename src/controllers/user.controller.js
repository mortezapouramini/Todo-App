const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const userEmitter = require("../events/user.events");
const generateSessionId = require("../utils/session.utils");
const usersDb = path.join(__dirname, "../../users.json");
const sessionsDb = path.join(__dirname, "../../sessions.json");

const register = (req, res) => {
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
    req.on("end", () => {
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

      fs.readFile(usersDb, "utf-8", async (err, data) => {
        if (err) {
          res.writeHead(500, { "Content-type": "text/plain" });
          return res.end("Error connecting to dataBase");
        }
        let users = data ? JSON.parse(data) : [];
        const isExistUser = users.some((u) => u.email === email);
        if (isExistUser) {
          res.writeHead(400, { "Content-type": "text/plain" });
          return res.end("Email is already exist");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        let newUser = { id: Date.now(), email, name, hashedPassword };
        users.push(newUser);
        fs.writeFile(usersDb, JSON.stringify(users, null, 2), (err) => {
          if (err) {
            res.writeHead(500, { "Content-type": "text/plain" });
            return res.end("Error registering");
          }
          delete newUser.hashedPassword;
          userEmitter.emit("userRegistered", newUser);
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "User registered", newUser }));
        });
      });
    });
  } catch (error) {
    res.writeHead(500, { "Content-type": "text/plain" });
    res.end("Internal server error");
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

    req.on("end", () => {
      const { email, password } = JSON.parse(body);
      if (
        !email.endsWith("@gmail.com") ||
        password.length < 8 ||
        password.length > 32
      ) {
        res.writeHead(401, { "Content-type": "text/plain" });
        return res.end("Invalid info");
      }

      fs.readFile(usersDb, "utf8", async (err, data) => {
        if (err) {
          res.writeHead(500, { "Content-type": "text/plain" });
          return res.end("Error connecting to users dataBase");
        }
        let users = data ? JSON.parse(data) : [];
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
        let sessionId;
        try {
          sessionId = await generateSessionId();
        } catch (error) {
          res.writeHead(500, { "Content-type": "text/plain" });
          return res.end("Internal server error");
        }
        const sessionData = {
          sessionId,
          user,
          generatedAt: Date.now(),
          expiresIn: 24 * 60 * 60 * 1000,
        };
        fs.readFile(sessionsDb, "utf8", (err, data) => {
          if (err) {
            res.writeHead(500, { "Content-type": "application/json" });
            return res.end("Error connecting to tokens dataBase");
          }
          let sessions = data ? JSON.parse(data) : [];
          sessions.push(sessionData);
          fs.writeFile(sessionsDb, JSON.stringify(sessions, null, 2), (err) => {
            if (err) {
              res.writeHead(500, { "Content-type": "application/json" });
              return res.end("Error connecting to tokens dataBase");
            }
            userEmitter.emit("userLoggedIn", user);
            res.writeHead(200, {
              "Content-type": "application/json",
              "set-cookie": `sessionId=${sessionId}; Max-Age=${
                sessionData.expiresIn / 1000
              }`,
            });
            res.end(JSON.stringify({ message: "User logged in", user }));
          });
        });
      });
    });
  } catch (error) {
    res.writeHead(500, { "Content-type": "text/plain" });
    res.end("Internal server error");
  }
};

const logOut = (req, res) => {
  const cookies = req.headers?.cookie;
  let parsedCookie = {};
  if (cookies) {
    cookies.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      parsedCookie[key] = value;
    });
  }

  const sessionId = parsedCookie.sessionId;
  if (!sessionId) {
    res.writeHead(401, { "Content-type": "text/plain" });
    return res.end("Please login");
  }
  fs.readFile(sessionsDb, "utf8", (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-type": "text/plain" });
      return res.end("Internal server error");
    }
    let sessions = data ? JSON.parse(data) : [];
    if (sessions.length === 0) {
      res.writeHead(401, { "Content-type": "text/plain" });
      return res.end("Please login");
    }
    const user = sessions.find((s) => s.sessionId === sessionId);
    sessions = sessions.filter((s) => s.sessionId !== sessionId);
    fs.writeFile(sessionsDb, JSON.stringify(sessions, null, 2), (err) => {
      if (err) {
        res.writeHead(500, { "Content-type": "text/plain" });
        return res.end("Internal server error");
      }
      delete user.sessionId;
      delete user.generatedAt;
      delete user.expiresIn;
      userEmitter.emit("userLoggedout", user);
      res.writeHead(200, {
        "Content-type": "text/plain",
        "set-cookie": "sessionId=; Max-Age=0;",
      });
      res.end("log out successful");
    });
  });
};

module.exports = { register, login, logOut };
