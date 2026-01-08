const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, service: "devsecops-node-demo" });
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/api/hello", (req, res) => {
  const name = (req.query.name || "world").toString();
  res.json({ message: `Hello, ${name}!` });
});

// Example endpoint with basic input handling
app.post("/api/echo", (req, res) => {
  res.json({ echo: req.body ?? null });
});

// Basic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).json({ ok: false, error: "internal_error" });
});

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`Listening on :${port}`));
}

module.exports = app;
