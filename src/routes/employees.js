'use strict';

const express = require('express');
const router = express.Router();
const Employee = require('../models/employee');

const CEO_ID = null;
const sampleEmployee = new Employee({
    'firstName': 'mohsin',
    'lastName': 'ali',
    'hireDate': '2019-11-02',
    'role': 'LACKEY',
    'quote1': '[On bowling] Straight down the middle. No hook, no spin, no fuss. Anything more and this becomes figure skating.',
    'quote2': 'At that point where you have decided to upgrade from aspiration to expectation and have begun to visualize an outcome, something incredibly important has happened, you have committed to the process of change.'
  })
const DATABASE = {
  1: sampleEmployee
};

const HIRE_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const JOB_ROLES = ['CEO', 'VP', 'MANAGER', 'LACKEY'];
var validateHireDate = function(hireDate) {
  if (typeof hireDate !== 'string') return false;

  const matchResult = hireDate.match(HIRE_DATE_REGEX);
  if (!matchResult || // check date provided in correct format
      (new Date()) < (new Date(hireDate))) { // check that date is in the past
    console.log("here in false " + hireDate);
    return false;
  }
  console.log("here");

  return true;
}
var validateEmployeeData = function(req, res, next) {
  const body = req.body;
  let employee = {};
  // validate firstName field
  if (body.firstName) {
    employee.firstName = body.firstName;
  } else {
    return res.status(400).send("Missing employee's firstName in request.");
  }

  // validate lastName field
  if (body.lastName) {
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
}

/* GET employees listing. */
router.get('/', (req, res) => {
  return res.send(DATABASE);
});

router.post('/', [validateEmployeeData], (req, res) => {
  res.send(req.employee);
})

router.route('/:id')
  /* middleware to validate provided id is present */
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
  })

module.exports = router;
