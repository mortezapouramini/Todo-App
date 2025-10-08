const taskRoutes = (req, res) => {
  if (req.method.toLowerCase() === "post") {
    // add task
  } else if (req.method.toLowerCase() === "patch") {
    // update task
  } else if (req.method.toLowerCase() === "delete") {
    // delete task
  } else if (req.method.toLowerCase() === "get") {
    // get tasks
  } else {
    res.writeHead(404, { "Content-type": "text/plain" });
    return res.end("Not found");
  }
};

module.exports = taskRoutes;
