const userRoutes = require("./user.routes");
const taskRoutes = require("./task.routes");

const router = (req, res) => {
  if (req.url.startsWith("/auth")) {
    userRoutes(req, res);
  } else if (req.url.startsWith("/tasks")) {
    taskRoutes(req , res)
  } else {
    res.writeHead(404, { "Content-type": "text/plain" });
    return res.end("Not found");
  }
};

module.exports = router;
