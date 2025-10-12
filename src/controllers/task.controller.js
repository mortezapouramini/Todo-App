const fs = require("fs");
const path = require("path");
const tasksDb = path.join(__dirname, "../../tasks.json");

const addTask = (req, res, session) => {
  const contentType = req.headers["content-type"];
  if (contentType !== "application/json") {
    res.writeHead(400, { "Content-type": "text/plain" });
    res.end("Bad request");
  }
  let body = "";
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
      if (!name || desc.length > 30 || !dueDate || !priority || !category) {
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
    res.end(JSON.stringify({ error: error.message }));
  }
};

const deleteTask = async (req, res, session) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const taskId = parseInt(reqUrl.searchParams.get("taskId"));
  const userId = parseInt(session.user.id);
  try {
    const data = await fs.promises.readFile(tasksDb, "utf8");
    const tasks = data ? JSON.parse(data) : [];
    const task = tasks?.find((t) => t.id === taskId && t.user.id === userId);
    if (!task) {
      res.writeHead(404, { "Content-type": "text/plain" });
      return res.end("Task not found");
    }

    const filteredTasks = tasks.filter((t) => t.id !== task.id);
    await fs.promises.writeFile(
      tasksDb,
      JSON.stringify(filteredTasks, null, 2)
    );

    res.writeHead(200, { "Content-type": "application/json" });
    res.end(`Task ${task.name} deleted`);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
    console.error(error);
  }
};

module.exports = {
  addTask,
  deleteTask,
};
