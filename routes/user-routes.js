const express = require("express");
const { check } = require("express-validator");

const userControllers = require("../controllers/user-controller");
const fileUpload = require("../middleware/file-upload");

const router = express.Router();

// endpoint para obtener un lugar
router.get("/", userControllers.getUsers);

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  userControllers.signUp
);

router.post(
  "/login",
  [
    check("email").optional().normalizeEmail().isEmail(),
    check("password").optional().isLength({ min: 5 }),
  ],
  userControllers.logIn
);

/* router.patch("/:pid", placesControllers.updatePlace);

router.delete("/:pid", placesControllers.deletePlace); */

module.exports = router;
