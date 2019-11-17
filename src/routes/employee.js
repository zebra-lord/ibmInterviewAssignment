'use strict';

const express = require('express');
const router = express.Router();

const CEO_ID = null;
const DATABASE = {
  '1': {
    'firstName': 'mohsin',
    'lastName': 'ali',
    'hireDate': '2019-11-02',
    'role': 'LACKEY',
    'quote1': '[On bowling] Straight down the middle. No hook, no spin, no fuss. Anything more and this becomes figure skating.',
    'quote2': 'At that point where you have decided to upgrade from aspiration to expectation and have begun to visualize an outcome, something incredibly important has happened, you have committed to the process of change.'
  }
};

/* GET employees listing. */
router.get('/', function(req, res) {
  return res.send(DATABASE);
});

router.route('/:id')
  /* middleware to validate provided id present */
  .all((req, res, next) => {
    var id = req.params['id']
    if (id in DATABASE)
      next();
    else
      return res.status(404).status(`No employee found with id ${id}`);
  })
  .get(function(req, res) {
    res.send(DATABASE[req.params['id']])
  })
  .delete(function(req, res) {
    var id = req.params['id']
    delete DATABASE[id];
    res.send(`Deleted employee with id ${id}`)
  })

module.exports = router;
