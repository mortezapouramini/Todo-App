const userRoutes = require("./user.routes");

const router = (req, res) => {
  if (req.url.startsWith("/auth")) {
    userRoutes(req, res);
  } else if (req.url.startsWith("/tasks")) {
    // tasks routes
  } else {
    res.writeHead(404, { "Content-type": "text/plain" });
    return res.end("Not found");
  }
};

module.exports = router;
