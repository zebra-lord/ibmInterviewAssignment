'use strict';

const express = require('express');
const employeeRoutes = require('./routes/employees');
const db = require('./database/EmployeeDatabase');
const path = require('path');
const app = express();
const port = parseInt(process.env.PORT || '3000');

// set pug as view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/employees', employeeRoutes);

// front end to view and add employees
app.get('/', (req, res) => {
  db.getAll()
    .then(employees => {
      res.render('index', {employees: employees});
    })
});

// Fail over route
app.use(function(req, res) {
  res.sendStatus(404);
});

// listen for requests
app.listen(port, function() {
  console.log(`Server is listening on port ${port}`);
});

module.exports = app;
