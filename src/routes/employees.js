'use strict';

const express = require('express');
const axios = require('axios');
const uuid = require('uuid/v4');
const router = express.Router();
const Employee = require('../models/employee');

let CEO_ID = null;
const sampleEmployee = new Employee({
    'firstName': 'mohsin',
    'lastName': 'ali',
    'hireDate': '2019-11-02',
    'role': 'LACKEY',
    'quote1': '[On bowling] Straight down the middle. No hook, no spin, no fuss. Anything more and this becomes figure skating.',
    'quote2': 'At that point where you have decided to upgrade from aspiration to expectation and have begun to visualize an outcome, something incredibly important has happened, you have committed to the process of change.'
  });

// TODO: move database managment logic to separate module
const DATABASE = {
  1: sampleEmployee
};

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

router.post('/', [validateEmployeeData, populateQuotes], (req, res) => {
  // TODO: logic in this function should be handled in separate database management module

  // if the job role is CEO check there isn't already a CEO
  console.log(`ceo = ${CEO_ID}`);
  if (req.employee.role === 'CEO' && CEO_ID) {
    return res.status(400).send(`There's already CEO at the company. Employee ${CEO_ID}`);
  }
  const id = uuid();
  DATABASE[id] = req.employee;
  res.send({'id': id});
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
  /* delete employee with given id */
  .delete(function(req, res) {
    var id = req.params['id']
    delete DATABASE[id];
    res.send(`Deleted employee with id ${id}`)
  });

module.exports = router;
