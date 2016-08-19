'use strict';
let cron = require('node-cron');
let config = require('./config');
let MongoClient = require('mongodb').MongoClient;
let carService = require('./services/car-service');
let orderService = require('./services/order-service');
let deliveryNotifier = require('./services/delivery-notifier');
let url = config.get('db:url');
let activeCars = false;
let _ = require("underscore");

cron.schedule('* * * * *', function () {
    console.log('running a task every minute');
    MongoClient.connect(url, function (err, db) {
            if (!err) {
                console.log("Connected succesfully to DB server");
                carService.handleArrivedCars(db, function (ordersArray) {
                    return carService.checkActiveCars(db)
                        .then((cars)=> {
                            if (!activeCars) {
                                activeCars = cars;
                                console.log('first time determining');
                            }
                            if (!_.isEqual(activeCars, cars)) {
                                console.log("old amount of active: " + activeCars.length + " new: " + cars.length);
                                activeCars = cars;
                                console.log('update order time');
                                orderService.updateOrdersArrivalTime(db).then(()=> {
                                    console.log('db closing')
                                    db.close();
                                }).catch(err=> {
                                    console.log(err)
                                })
                            } else {
                                console.log('db closing')
                                db.close();
                            }
                            if (ordersArray) {
                                deliveryNotifier.notify(ordersArray);
                            }
                        })
                });
            }
            else {
                console.log('Incorrect config params or unavailable server')
            }
        }
    );
});
