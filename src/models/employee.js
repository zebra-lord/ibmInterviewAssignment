'use strict'

const uuid = require('uuid/v4');

module.exports = class Employee {
    constructor(requestBody) {
        this.firstName = requestBody.firstName;
        this.lastName = requestBody.lastName;
        this.hireDate = requestBody.hireDate;
        this.role = requestBody.role;
        this.quote1 = requestBody.quote1;
        this.quote2 = requestBody.quote2;
        this.id = uuid();
    }
}
