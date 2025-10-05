const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId); // findById() no retorna una promesa, pero se puede usar async/await
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(err);
  }
  // si el lugar no existe, envíe un error 404 y lo recibe el middleware de manejo de errores que se encuentra en app.js
  if (!place) {
    // creamos una instancia de HttpError
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    );
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  console.log(userId);
  let places;
  try {
    places = await Place.find({ creator: userId }); // findById() no retorna una promesa, pero se puede usar async/await
    console.log(places);
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again later.",
      500
    );
    return next(err);
  }
  // si el lugar no existe, envíe un error 404 y lo recibe el middleware de manejo de errores que se encuentra en app.js
  if (!places || places.length === 0) {
    // creamos una instancia de HttpError
    const error = new HttpError(
      "Could not find places for the for the provided user id.",
      404
    );
    return next(error);
  }

  // otra opción con populate()

  /* let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places"); // findById() no retorna una promesa, pero se puede usar async/await
    console.log(places);
  } catch (err) {
    const error = HttpError(
      "Fetching places failed, please try again later.",
      500
    );
    return next(err);
  }
  // si el lugar no existe, envíe un error 404 y lo recibe el middleware de manejo de errores que se encuentra en app.js
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    // creamos una instancia de HttpError
    const error = new HttpError(
      "Could not find places for the for the provided user id.",
      404
    );
    return next(error);
  }

  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  }); */

  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  // capturamos los errores del check() con la función validationResult()
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid inputs passed, please check your data,",
      422
    );
    return next(error);
  }
  const { title, description, address, creator } = req.body;

  let coordinates;

  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    location: coordinates,
    address,
    image:
      "https://thumbs.dreamstime.com/z/dead-trees-night-rocky-field-front-huge-moon-spooky-scene-126109347.jpg?ct=jpeg",
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace }); // cuando es exitosa la acción
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data,", 422)
    );
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update.", 500);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not opdate place.",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) }); // cuando es exitosa la acción
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator"); // populate() permite referirnos a un documento guardado en otra colección
    console.log(place);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place 1.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = HttpError("Could not find place for the provided id", 404);
    return next(error);
  }

  let user;
  try {
    user = await User.findById(place.creator);
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({ session: sess });
    place.creator.places.pull(new mongoose.Types.ObjectId(place._id));
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) }); // cuando es exitosa la acción
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
