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

const updateTask = (req, res, session) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const taskId = parseInt(reqUrl.searchParams.get("taskId"));
  const userId = parseInt(session.user.id);
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      const data = await fs.promises.readFile(tasksDb, "utf8");
      const tasks = JSON.parse(data);
      const taskIndex = tasks.findIndex(
        (t) => t.id === taskId && t.user.id === userId
      );

      if (taskIndex === -1) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Task not found");
        return;
      }

      const task = tasks[taskIndex];
      const parsedBody = JSON.parse(body);
      const updateFields = {};

      if (parsedBody.name !== undefined) {
        updateFields.name = parsedBody.name;
      }
      if (parsedBody.desc !== undefined && parsedBody.desc.length < 30) {
        updateFields.desc = parsedBody.desc;
      }
      if (parsedBody.dueDate !== undefined) {
        updateFields.dueDate = parsedBody.dueDate;
      }
      if (parsedBody.priority !== undefined) {
        updateFields.priority = parsedBody.priority;
      }
      if (parsedBody.category !== undefined) {
        updateFields.category = parsedBody.category;
      }
      if (typeof parsedBody.completed === "boolean") {
        updateFields.completed = parsedBody.completed;
      }

      const updatedTask = { ...task, ...updateFields };
      tasks[taskIndex] = updatedTask;

      await fs.promises.writeFile(tasksDb, JSON.stringify(tasks, null, 2));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(updatedTask));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
      console.error(error);
    }
  });
};

const getTasks = async (req, res, session) => {
  const userId = parseInt(session.user.id);
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  let page = parseInt(reqUrl.searchParams.get("page")) || 1;
  if (page <= 0) {
    page = 1;
  }
  const limit = 10;
  try {
    const data = await fs.promises.readFile(tasksDb, "utf8");
    const tasks = JSON.parse(data);
    const userTasks = tasks.filter((t) => t.user.id === userId);

    const paginatedTasks = userTasks.slice((page - 1) * limit, page * limit);
    const pagesCount = Math.ceil(userTasks.length / limit);
    const resData = {
      pagesCount,
      currentPage : page,
      limit,
      totalTasks: userTasks.length,
      paginatedTasks,
    };

    res.writeHead(200, { "Content-type": "application/json" });
    res.end(JSON.stringify(resData));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
    console.error(error);
  }
};

module.exports = {
  addTask,
  deleteTask,
  updateTask,
  getTasks
};
