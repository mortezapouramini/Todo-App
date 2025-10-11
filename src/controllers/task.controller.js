const fs = require("fs");
const path = require("path");
const tasksDb = path.join(__dirname, "../../tasks.json");

const addTask = (req, res, session) => {
  const contentType = req.headers["content-type"];
  if (contentType !== "application/json") {
    res.writeHead(400, { "Content-type": "text/plain" });
    res.end("Bad request");
  }
  let body = ""
  try {
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      if (!body) {
        res.writeHead(400, { "Content-type": "application/json" });
        res.end("Bad request");
      }
      const { name, desc, dueDate, priority, category } = JSON.parse(body);
      if ((!name || desc.length > 30 || !dueDate || !priority || !category)) {
        res.writeHead(400, { "Content-type": "text/plain" });
        return res.end("Invalid info");
      }
      const newTaskData = {
        id: Date.now() * 123,
        user: session.user,
        name,
        desc: desc || "",
        dueDate,
        priority,
        category,
        completed: false,
        createdAt: Date.now(),
      };
      const data = await fs.promises.readFile(tasksDb, "utf8");
      let tasks = data ? JSON.parse(data) : [];
      tasks.push(newTaskData);
      await fs.promises.writeFile(tasksDb, JSON.stringify(tasks, null, 2));
      res.writeHead(201, { "Content-type": "application/json" });
      res.end(JSON.stringify(newTaskData));
    });
  } catch (error) {
    res.writeHead(500, { "Content-type": "application/json" });
    res.end(JSON.stringify({error : error.message}))
  }
};

module.exports = {
  addTask,
};
