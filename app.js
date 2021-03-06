const express = require("express");
const path = require("path");
const logger = require("morgan");

const db = require("./models/index").sequelize;
const indexRoute = require("./routes/index");
const booksRouter = require("./routes/books");

const app = express();

// view engine setup
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/static", express.static(path.join(__dirname, "public")));

// Routes
app.use(indexRoute);
app.use("/books", booksRouter);

// Not Found Error Handler
app.use((req, res, next) => {
  const err = new Error();
  err.statusCode = 404;
  err.message = `Looks like the page you requested does't exists`;
  console.log(err.message);
  res.status(404).render("page-not-found", { err });
});

// Global error handler
// Used: https://codepen.io/juliepark/pen/erOoeZ
app.use((err, req, res, next) => {
  if (err.status === 404) {
    res.status(404).render("page-not-found", { err });
  } else {
    err.message = err.message || `Oops! Something went wrong. :(`;
    res.status(err.status || 500).render("error", { err });
  }
});

// Check if database connection is successful
db.authenticate()
  .then(() => console.log("Database connection established successfully..."))
  .catch((err) => console.log("Databse connection failed. ", err));

db.sync().then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Listening on port ${port}`));
});
