const router = require("express").Router();
const ctrl = require("../controllers/bookController");

router.get("/", ctrl.listBooks);
router.get("/:id", ctrl.getBook);
router.post("/", ctrl.createBook);
router.put("/:id", ctrl.updateBook);
router.delete("/:id", ctrl.deleteBook);

module.exports = router;