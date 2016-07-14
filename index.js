/**
 * Created by dmytro on 12.07.16.
 */
'use strict';
let cron = require('node-cron');
let config = require('./config');
let MongoClient = require('mongodb').MongoClient;
let assert = require('assert');
let carService = require('./services/car-service');
let  url = config.get('db:url');

//cron.schedule('* * * * *', function () {
    console.log('running a task every minute');
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log("Connected succesfully to DB server");
        carService.handleArrivedCars(db, function () {
            console.log('db closing')
            db.close();
        });
    });
//});
