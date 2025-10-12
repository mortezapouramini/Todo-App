const taskController = require("../controllers/task.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const taskRoutes = async (req, res) => {
  if (req.method.toLowerCase() === "post") {
    const session = await authMiddleware.authSession(req, res);
    if (!session) return;
    taskController.addTask(req, res, session);
  } else if (req.method.toLowerCase() === "patch") {
    const session = await authMiddleware.authSession(req, res);
    if (!session) return;
    taskController.updateTask(req, res, session);
  } else if (req.method.toLowerCase() === "delete") {
    const session = await authMiddleware.authSession(req, res);
    if (!session) return;
    taskController.deleteTask(req, res, session);
  } else if (req.method.toLowerCase() === "get") {
    const session = await authMiddleware.authSession(req, res);
    if (!session) return;
    taskController.getTasks(req, res, session);
  } else {
    res.writeHead(404, { "Content-type": "text/plain" });
    return res.end("Not found");
  }
};

module.exports = taskRoutes;
