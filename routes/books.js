const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");

const Book = require("../models").Book;

const PAGE_SIZE = 5;

/* Handler function to wrap each route. */
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      // Forward error to the global error handler
      next(error);
    }
  };
}

// List all books
router.get(
  "/",
  asyncHandler(async (req, res) => {
    // pagination
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || PAGE_SIZE;
    const offset = (page - 1) * size;
    // search query
    const { searchQuery } = req.query;
    var condition = searchQuery
      ? {
          [Op.or]: [
            {
              title: { [Op.like]: "%" + searchQuery + "%" },
            },
            {
              author: { [Op.like]: "%" + searchQuery + "%" },
            },
            {
              genre: { [Op.like]: "%" + searchQuery + "%" },
            },
            {
              year: { [Op.like]: "%" + searchQuery + "%" },
            },
          ],
        }
      : null;

    const books = await Book.findAll({
      where: condition,
      limit: size,
      offset,
    });
    const numberOfTotalBooks = await Book.count({ where: condition });
    let url;
    if (searchQuery) {
      url = `${req.baseUrl}/?searchQuery=${searchQuery}&`;
    } else {
      url = `${req.baseUrl}/?`;
    }

    const pageCount = Math.ceil(numberOfTotalBooks / size);

    res.render("index", {
      books: books,
      pageCount,
      page,
      size,
      searchQuery,
      url,
      title: "Books",
    });
  })
);

// View new book form
router.get("/new", (req, res) => {
  res.render("books/new-book", { book: {}, title: "New Book" });
});

// handle post event
router.post(
  "/",
  asyncHandler(async (req, res) => {
    let book;
    try {
      book = await Book.create(req.body);
      res.redirect(`/books/${book.id}`);
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        book = await Book.build(req.body);
        res.render("books/new-book", {
          book,
          errors: error.errors,
          title: "New Book",
        });
      } else {
        throw error;
      }
    }
  })
);

// view/update book details
router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const book = await Book.findByPk(req.params.id);
    if (book) {
      res.render("books/update-book", {
        book,
        title: `Edit Book: ${book.title}`,
      });
    } else {
      const err = new Error();
      err.statusCode = 404;
      err.message = `Looks like the book you requested does't exists`;
      console.log(err.message);
      next(err);
    }
  })
);

router.post(
  "/:id",
  asyncHandler(async (req, res) => {
    let book;
    try {
      book = await Book.findByPk(req.params.id);
      if (book) {
        await book.update(req.body);
        res.redirect(`/books/${book.id}`);
      } else {
        const err = new Error();
        err.statusCode = 404;
        err.message = `Looks like the book you requested does't exists`;
        console.log(err.message);
        next(err);
      }
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        book = await Book.build(req.body);
        book.id = req.params.id;
        res.render("books/update-book", {
          book,
          errors: error.errors,
          title: `Edit Book: ${book.title}`,
        });
      } else {
        throw error;
      }
    }
  })
);

router.post(
  "/:id/delete",
  asyncHandler(async (req, res) => {
    const book = await Book.findByPk(req.params.id);
    if (book) {
      await book.destroy();
      res.redirect("/books");
    } else {
      const err = new Error();
      err.statusCode = 404;
      err.message = `Looks like the book you requested does't exists`;
      console.log(err.message);
      next(err);
    }
  })
);

module.exports = router;
