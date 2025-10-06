const userController = require("../controllers/user.controller");

const userRoutes = (req, res) => {
  if (req.url === "/auth/register" && req.method.toLowerCase() === "post") {
    userController.register(req, res);
  } else if (req.url === "/auth/login" && req.method.toLowerCase() === "post") {
    userController.login(req, res);
  } else if (req.url === "/auth/logout" && req.method.toLowerCase() === "get") {
    // logout controller
  } else {
    res.writeHead(404, { "Content-type": "text/plain" });
    return res.end("Not found");
  }
};

module.exports = userRoutes;
