const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const path = require("path");

console.log("Starting server...");

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(session({
  secret: "pinksparkles",
  resave: false,
  saveUninitialized: false
}));

const db = new sqlite3.Database("db.sqlite");

db.run(`CREATE TABLE IF NOT EXISTS grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judgeName TEXT,
  groupNumber TEXT,
  groupMembers TEXT,
  projectTitle TEXT,
  score1 INTEGER,
  score2 INTEGER,
  score3 INTEGER,
  score4 INTEGER,
  total INTEGER,
  comments TEXT
)`);

const users = {
  judge1: "123",
  judge2: "123",
  judge3: "123",
  judge4: "123",
  admin: "admin"
};

app.get("/", (req, res) => res.redirect("/login"));

app.get("/login", (req, res) => res.render("login"));

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (users[username] === password) {
    req.session.username = username;
    if (username === "admin") return res.redirect("/admin");
    res.redirect("/grading");
  } else {
    res.send("Wrong username or password.");
  }
});

app.get("/grading", (req, res) => {
  if (!req.session.username || req.session.username === "admin") {
    return res.redirect("/login");
  }
  res.render("grading", { judge: req.session.username });
});

app.post("/submit", (req, res) => {
  const data = req.body;
  const total =
    parseInt(data.score1) +
    parseInt(data.score2) +
    parseInt(data.score3) +
    parseInt(data.score4);

  db.run(
    `INSERT INTO grades (
      judgeName, groupNumber, groupMembers, projectTitle,
      score1, score2, score3, score4, total, comments
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.judgeName,
      data.groupNumber,
      data.groupMembers,
      data.projectTitle,
      data.score1,
      data.score2,
      data.score3,
      data.score4,
      total,
      data.comments
    ],
    (err) => {
      if (err) return res.send("Error saving grade.");
      res.send("Grade submitted! ✅");
    }
  );
});

app.get("/admin", (req, res) => {
  if (req.session.username !== "admin") {
    return res.redirect("/login");
  }

  db.all(
    `SELECT groupNumber, AVG(total) as average FROM grades GROUP BY groupNumber`,
    (err, rows) => {
      if (err) return res.send("Error getting data.");
      res.render("admin", { results: rows });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
