const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");

const placeRoutes = require("./routes/places-routes");
const userRoutes = require("./routes/user-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

/* 
  El siguiente middleware se incluye para corregir el error de CORS.
  El error de CORS sucede cuando se envía una request desde un puerto
  a otro puerto distinto, en este caso desde el :3000 al :5000. 
  Este middleware se incluye antes de los middlewares que hacen el enrutado,
  con el objetivo de agregar los headers antes de realizar las peticiones.
*/
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/places", placeRoutes);
app.use("/api/users", userRoutes);

// este middleware sólo se alcanza si no se obtiene respuesta del middleware anterior asociado a placeRoutes
// manejo de error para rutas que no existen
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

// middleware
// si le pasamos 4 parámetros a un middleware, se tomará automáticamente como un middleware de manejo de errores
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  // ya se envío una respuesta?
  if (res.headerSent) {
    return next(error);
  }
  // si no se envió, enviamos una respuesta tipo error
  res
    .status(error.code || 500)
    .json({ message: error.message || "An unknown error ocurred!" });
});

mongoose
  .connect(
    "mongodb+srv://christricardo92:yY7n04rQ4S2HGS0D@cluster0.uztsdm0.mongodb.net/mern?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
