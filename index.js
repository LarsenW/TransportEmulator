/**
 * Created by dmytro on 12.07.16.
 */
var cron = require('node-cron');
var config = require('./config');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var carService = require('./services/car-service');
var url = config.get('db:url');

cron.schedule('* * * * *', function () {
    console.log('running a task every minute');
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log("Connected succesfully to DB server");
        carService.handleArrivedCars(db, function () {
            console.log('db closing')
            db.close();
        });
    });
});
