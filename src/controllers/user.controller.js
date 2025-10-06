const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { json } = require("stream/consumers");
const generateToken = require("../utils/token");
const userEmitter = require("../events/user.events");
const usersDb = path.join(__dirname, "../../users.json");
const tokensDb = path.join(__dirname, "../../tokens.json");

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
    req.on("end", () => {
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
            res.end("Error registering");
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

const login = async (req, res) => {
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
          return res.end("Error connecting to dataBase");
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
        const token = generateToken();
        // const tokenData = {
        //   token,
        //   user,
        //   generatedAt : new Date().getTimezoneOffset(),
        // }
        // fs.appendFile(tokensDb , 1)
      });
    });
  } catch (error) {
    res.writeHead(500, { "Content-type": "text/plain" });
    res.end("Internal server error");
  }
};

module.exports = { register, login };
