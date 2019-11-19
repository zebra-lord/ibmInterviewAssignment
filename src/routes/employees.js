'use strict';

const express = require('express');
const axios = require('axios');
const uuid = require('uuid/v4');
const router = express.Router();

//TODO: Move database management to separate module
/**
 * Variable to keep track of the CEO's employee id.
 * Useful in ensuring there's only one CEO
 */
let CEO_ID = null;
const DATABASE = {};

const HIRE_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const JOB_ROLES = ['CEO', 'VP', 'MANAGER', 'LACKEY'];
/* Helper function to validate hireDate input */
var validateHireDate = function(hireDate) {
  if (typeof hireDate !== 'string') return false;

  const matchResult = hireDate.match(HIRE_DATE_REGEX);
  if (!matchResult || // check date provided in correct format
      (new Date()) < (new Date(hireDate))) { // check that date is in the past
    console.log("here in false " + hireDate);
    return false;
  }

  return true;
}
/**
 * Middleware to validate provided data for employee data to add
 * or update to the DATABASE.
 */
var validateEmployeeData = function(req, res, next) {
  const body = req.body;
  let employee = {};
  // validate firstName field
  if (body.firstName && typeof body.firstName === 'string') {
    employee.firstName = body.firstName;
  } else {
    return res.status(400).send("Missing employee's firstName in request.");
  }

  // validate lastName field
  if (body.lastName && typeof body.lastName === 'string') {
    employee.lastName = body.lastName;
  } else {
    return res.status(400).send("Missing employee's lastName in request.");
  }

  // validate hireDate field
  if (body.hireDate && validateHireDate(body.hireDate)) {
    employee.hireDate = body.hireDate;
  } else {
    return res.status(400).send("Employee hireDate must be in the past and in the format of YYYY-MM-DD.");
  }

  // validate jobRole field
  if (body.role &&
      typeof body.role === 'string' &&
      JOB_ROLES.includes(body.role.toUpperCase())) {
    employee.role = body.role.toUpperCase();
  } else {
    return res.status(400).send("Employee role must be one of the following " + JOB_ROLES);
  }

  req.employee = employee;
  next();
};

/* Axios instance to request a Ron Swanson quote */
const ronSwansonQuoteRequester = axios.create({
  baseURL: 'http://ron-swanson-quotes.herokuapp.com/v2/quotes',
  headers: {'Accept': 'application/json'}
});
/* Axion instance to request a joke */
const jokeRequester = axios.create({
  baseURL: 'http://icanhazdadjoke.com',
  headers: {'Accept': 'application/json',
            'User-Agent': 'ma-ibm-test'}
});
/**
 * Middleware to populate employee object with a favorite quote and quote
 * retrieved from external apis
 **/
var populateQuotes = function(req, res, next) {
  axios.all([ronSwansonQuoteRequester.get(), jokeRequester.get()])
    .then(axios.spread(function (rsQuote, joke) {
      req.employee.favoriteQuote = rsQuote.data[0] + " - Ron Swanson";
      req.employee.favoriteJoke = joke.data["joke"];
      next();
    }))
    .catch(function (err) {
      return res.status(500).send("Failed to fetch quotes with error:\n\n" + err)
    })
};

/* GET employees listing. */
router.get('/', (req, res) => {
  return res.send(DATABASE);
});

/**
 * POST an employee to the database.
 * Responds with the employee object along with their id if successful.
 */
router.post('/', [validateEmployeeData, populateQuotes], (req, res) => {
  // TODO: logic in this function should be handled in separate database management module

  const id = uuid();
  if (req.employee.role === 'CEO') {
    if (CEO_ID) { // CEO already exists
      return res.status(400).send(`There's already CEO at the company. Employee ${CEO_ID}`);
    }

    CEO_ID = id;
  }
  DATABASE[id] = req.employee;
  res.send({id: id, employee: req.employee});
});

router.route('/:id')
  /* middleware to validate provided id is present in the DATABASE */
  .all((req, res, next) => {
    var id = req.params['id']
    if (id in DATABASE)
      next();
    else
      return res.status(404).send(`No employee found with id ${id}`);
  })
  /* get employee for given id */
  .get(function(req, res) {
    res.send(DATABASE[req.params['id']])
  })
  /**
   * Delete employee for given id from the database.
   * Responds with the deleted employee if successful.
   */
  .delete(function(req, res) {
    let id = req.params['id']
    let employee = DATABASE[id];
    delete DATABASE[id];
    // if the deleted employee was the CEO, reset the CEO_ID variable
    // TODO: this logic should be in a separate database module
    if (employee.role === 'CEO') {
      CEO_ID = null;
    }
    res.send(employee);
  });

module.exports = router;
