const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

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
    return next(
      new HttpError("Invalid inputs passed, please check your data,", 422)
    );
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

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (errr) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
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

  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email,
      },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again.", 500);
    return next(error);
  }

  //res.status(201).json({ user: createdUser }); // cuando es exitosa la acción

  //res.status(200).json({ place: place.toObject({ getters: true }) }); // cuando es exitosa la acción

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token }); // cuando es exitosa la acción
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

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in",
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    const err = new HttpError(
      "Could not log you in, please check your credentials and try again",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in",
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
      },
      "supersecret_dont_share",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Loggin in failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  }); // cuando es exitosa la acción
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.logIn = logIn;
