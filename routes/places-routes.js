const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");

const placesControllers = require("../controllers/places-controller");

const router = express.Router();

// endpoint para obtener un lugar
router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

// en la ruta para post usamos el método check para validación de inputs
// pasamos check como middleware. Los middlewares se ejecutan de izquierda a derecha
// para que esto funcione debemos incluir la función validateResult() en el controlador
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

router.patch(
  "/:pid",
  [
    check("title").optional().not().isEmpty(),
    check("description").optional().isLength({ min: 5 }),
    check("address").optional().not().isEmpty(),
  ],
  placesControllers.updatePlace
);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
