'use strict';
let cron = require('node-cron');
let config = require('./config');
let MongoClient = require('mongodb').MongoClient;
let assert = require('assert');
let carService = require('./services/car-service');
let orderService = require('./services/order-service');
let deliveryNotifier = require('./services/delivery-notifier');
let url = config.get('db:url');
let activeCarsAmount = -1;

cron.schedule('* * * * *', function () {
 console.log('running a task every minute');
MongoClient.connect(url, function (err, db) {
        if (!err) {
            assert.equal(null, err);
            console.log("Connected succesfully to DB server");
            carService.handleArrivedCars(db, function (ordersArray) {

                return carService.checkActiveCars(db)
                    .then((amount)=> {
                        console.log("old amount of active: " + activeCarsAmount + " new: " + amount);
                        if (activeCarsAmount < 0) {
                            activeCarsAmount = amount;
                        }
                        if (amount !== activeCarsAmount) {
                            activeCarsAmount = amount;
                            console.log('update order time');
                            orderService.updateOrdersArrivalTime(db).then(()=> {
                                console.log('db closing')
                                db.close();
                            })
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
