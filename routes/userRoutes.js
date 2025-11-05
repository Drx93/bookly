const router = require("express").Router();
const ctrl = require("../controllers/userController");
router.get("/", ctrl.listUsers);
router.get("/:id", ctrl.getUser);
router.post("/", ctrl.createUser);
router.put("/:id", ctrl.updateUser);
router.delete("/:id", ctrl.deleteUser);
module.exports = router;