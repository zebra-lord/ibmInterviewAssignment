'use strict';

const uuid = require('uuid/v4');

/**
 * Variable to keep track of the CEO's employee id.
 * Useful in ensuring there's only one CEO
 */
let CEO_ID = null;
/* in memory database */
const DATABASE = {};

/**
 * Class which exposes static methods to access the database.
 * All methods return promises.
 */
module.exports = class DatabaseManager {
  /**
   * Takes in a new employee object to add to the database. Returns a promise
   * which resolves with the generatedId and employee object added and
   * rejects with status code and error message. 
   */
  static add(employee) {
    return new Promise((resolve, reject) => {
      const id = uuid();
      if (employee.role === 'CEO') {
        if (CEO_ID) { // CEO already exists
          return reject({
            //TODO: create proper error class
            status: 400,
            message: `Employee ${CEO_ID} is already CEO.`
          });
        }
        // if we got here ceo doesn't exist so save the id
        CEO_ID = id;
      }
      DATABASE[id] = employee;
      resolve(id);
    });
  }

  /**
   * Returns a promise which resolves with the employee data object for given
   * employeeId. 
   */
  static get(employeeId) {
    return new Promise((resolve, reject) => {
      resolve(DATABASE[employeeId]);
    });
  }

  /**
   * Returns a promise which resolves with the employee data for all employees.
   */
  static getAll() {
    return new Promise((resolve, reject) => {
      resolve(DATABASE);
    });
  }

  /**
   * Returns a promise which resolves with the employee data for the deleted
   * employee.
   */
  static delete(employeeId) {
    return new Promise((resolve, reject) => {
      let employee = DATABASE[employeeId];
      delete DATABASE[employeeId];
      // if the deleted employee was the CEO, reset the CEO_ID variable
      // TODO: this logic should be in a separate database module
      if (employee.role === 'CEO') {
        CEO_ID = null;
      }
      resolve(employee);
    });
  }

  /**
   * Returns a promise which resolves with the old employee data.
   * Rejects if this call attempts to upgrade the employee to a CEO while
   * there's already another employee that's CEO for the deleted
   */
  static update(employeeId, newEmployee) {
    return new Promise((resolve, reject) => {
      let oldEmployee = DATABASE[employeeId];

      // special logic if role is being updated to CEO
      if (newEmployee.role === 'CEO') {
        if (!CEO_ID) {
          // if there isn't already a CEO keep track of the id
          CEO_ID = employeeId;
        } else if (CEO_ID !== employeeId) {
          return reject({
            status: 400,
            message: `Employee ${CEO_ID} is already the CEO. Cannot upgrade ` +
                `this employee to CEO.`
          })
        }
      } else if (oldEmployee.role === 'CEO') {
        // if we're downgrading the CEO reset the CEO_ID variable
        CEO_ID = null;
      }

      DATABASE[employeeId] = newEmployee;
      resolve(oldEmployee);
    });
  }

  static contains(employeeId) {
    return employeeId in DATABASE;
  }
}