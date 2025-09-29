const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: user })) });
};

const signUp = async (req, res, next) => {
  // capturamos los errores del check() con la función validationResult()
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("erroooooressssss:");
    console.log(errors);
    return new HttpError("Invalid inputs passed, please check your data,", 422);
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image:
      "https://www.dreamstime.com/monaco-principality-cityscape-densely-populated-urban-background-mountain-slope-houses-apartment-buildings-towers-block-stock-images-image-free-125745924",
    password,
    places: [],
  });

  console.log("createdUser: /////////////////////////////");
  console.log(createdUser);

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Signing up, please try again.", 500);
    return next(error);
  }

  //res.status(201).json({ user: createdUser }); // cuando es exitosa la acción

  //res.status(200).json({ place: place.toObject({ getters: true }) }); // cuando es exitosa la acción

  res.status(201).json({ user: createdUser.toObject({ getters: true }) }); // cuando es exitosa la acción
};

const logIn = async (req, res, next) => {
  // capturamos los errores del check() con la función validationResult()
  const errors = validationResult(req);
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later",
      500
    );
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    const error = new HttpError(
      "Invalid credentials, could not log you in",
      500
    );
    return next(error);
  }
  res.status(201).json({ message: "Logged in!" }); // cuando es exitosa la acción
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.logIn = logIn;
