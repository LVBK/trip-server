changeReservationStateAsync = function (reservationId, oldState, newState, callback) {
    try {
        Reservations.update(
            {
                _id: reservationId,
                bookState: oldState
            }
            , {
                $set: {
                    bookState: newState
                }
            }, function (err, result) {
                if (err) {
                    callback(err)
                } else {
                    callback(false, result);
                }
            })
    } catch (err) {
        console.log("changeReservationStateAsync", err);
        callback(err);
    }
};
acceptReservationAsync = function (roadMap, reservation, newSlots, callback) {
    try {
        RoadMaps.update(
            {
                _id: roadMap._id,
                slots: roadMap.slots,
                acceptingReservations: {$ne: reservation._id}
            }, {
                $set: {
                    slots: newSlots
                },
                $push: {
                    acceptingReservations: reservation._id
                }
            }, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(false, result)
                }
            }
        );
    } catch (err) {
        console.log("acceptReservationAsync", err);
        callback(err);
        callback(err);
    }
}
Meteor.methods({
    bookSeats: function (roadMapId, totalSeat) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            checkLogin(this.userId);
            check(roadMapId, String);
            check(totalSeat, Match.Where(function (totalSeat) {
                check(totalSeat, Number);
                if (totalSeat <= 0) {
                    throw new Meteor.Error(405, "Number of seat for must be larger than 0");
                }
                return totalSeat > 0;
            }));

            var roadMap = RoadMaps.findOne({_id: roadMapId});
            if (!roadMap) {
                throw new Meteor.Error(406, "Not found roadmap for booking");
            }
            var trip = Trips.findOne({_id: roadMap.tripId});
            if (!trip) {
                throw new Meteor.Error(407, "Not found trip for booking");
            }
            if (trip.hasOwnProperty('isFreezing') && trip.isFreezing == true) {
                throw new Meteor.Error(409, "This trip do not accept for booking now");
            }
            var user = Meteor.users.findOne({_id: roadMap.owner});
            if (!user) {
                throw new Meteor.Error(410, "Not found driver, can't book this trip");
            }
            if (totalSeat > (trip.seats - roadMap.slots.length)) {
                throw new Meteor.Error(411, "Not enough empty seat for book");
            }
            //Create order
            Reservations.insert({
                roadMapId: roadMap._id,
                userId: this.userId,
                totalSeats: totalSeat,
                totalPrice: totalSeat * trip.pricePerSeat,
                startAt: roadMap.startAt,
                to: roadMap.owner
            }, function (err, result) {
                if (err) {
                    myFuture.throw(err);
                    return myFuture.wait();
                } else {
                    myFuture.return(result);
                    return myFuture.wait();
                }
            })
        } catch (err) {
            console.log("bookSeats: ", err.reason);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
    bookCancel: function (reservationId) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            checkLogin(this.userId);
            check(reservationId, String);
            var reservation = Reservations.findOne({$and: [{_id: reservationId}]});
            if (!reservation) {
                throw new Meteor.Error(406, 'Not found reservation');
            }
            if (reservation.userId != this.userId) {
                throw new Meteor.Error(407, 'You have no permission with this reservation');
            }
            if (reservation.bookState !== 'waiting') {
                throw new Meteor.Error(408, 'This reservation is in ' + reservation.bookState + ' state! Can not canceled now!');
            }
            //Update if is concurrent
            var changeReservationStateSync = Meteor.wrapAsync(changeReservationStateAsync);
            var result = changeReservationStateSync(reservation._id, reservation.bookState, 'canceled');
            if (result == 0) {
                throw new Meteor.Error(409, 'Can not canceled!');
            } else {
                myFuture.return("This reservation was canceled!")
            }
        } catch (err) {
            console.log("bookCancel: ", err.reason);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
    bookDeny: function (reservationId) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            var self = this;
            checkLogin(self.userId);
            check(reservationId, String);
            var reservation = Reservations.findOne({$and: [{_id: reservationId}]});
            if (!reservation) {
                throw new Meteor.Error(406, 'Not found reservation');
            }
            if (reservation.bookState !== 'waiting') {
                throw new Meteor.Error(406, 'This reservation is in ' + reservation.bookState + ' state! Can not deny now!');
            }
            var roadMap = RoadMaps.findOne({$and: [{_id: reservation.roadMapId}, {owner: self.userId}]});
            if (!roadMap) {
                throw new Meteor.Error(407, 'You have no permission to deny this reservation');
            }
            //Update if is concurrent
            var changeReservationStateSync = Meteor.wrapAsync(changeReservationStateAsync);
            var result = changeReservationStateSync(reservation._id, reservation.bookState, 'denied');
            if (result == 0) {
                throw new Meteor.Error(409, 'Can not denied!');
            } else {
                myFuture.return("This reservation was denied!")
            }
        } catch (err) {
            console.log("bookDeny: ", err.reason);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
    bookAccept: function (reservationId) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            var self = this;
            checkLogin(self.userId);
            check(reservationId, String);

            var reservation = Reservations.findOne({$and: [{_id: reservationId}]});
            if (!reservation) {
                throw new Meteor.Error(405, 'Not found reservation');
            }
            if (reservation.bookState !== 'waiting') {
                throw new Meteor.Error(406, 'This reservation is in ' + reservation.bookState + ' state! Can not accept now!');
            }
            var roadMap = RoadMaps.findOne({$and: [{_id: reservation.roadMapId}, {owner: self.userId}]});
            if (!roadMap) {
                throw new Meteor.Error(407, 'You have no permission to accept this reservation');
            }
            if (reservation.totalSeats > (roadMap.seats - roadMap.slots.length)) {
                throw new Meteor.Error(408, 'Not enough empty seats for this reservation');
            }
            if (roadMap.startAt < new Date()) {
                throw new Meteor.Error(409, 'This trip was departed! No longer acceptable');
            }
            //Update if is concurrent
            var changeReservationStateSync = Meteor.wrapAsync(changeReservationStateAsync);
            var changeReservationResult = changeReservationStateSync(reservation._id, reservation.bookState, 'accepting');
            if (changeReservationResult == 0) {
                throw new Meteor.Error(409, 'Can not accepted!');
            }
            //Now reservation in state 'accepting'
            //TODO: server down here: reservation must rollback to waiting
            var oldSlots = roadMap.slots;
            var newSlots = roadMap.slots;
            for (i = 0; i < reservation.totalSeats; i++) {
                newSlots.push(reservation.userId);
            }
            var acceptReservationSync = Meteor.wrapAsync(acceptReservationAsync);
            var acceptReservationResult = acceptReservationSync(roadMap, reservation, newSlots);
            if (acceptReservationResult == 0) {
                throw new Meteor.Error(409, 'Can not accepted!');
            }
            //TODO: server down here: reservation must be accepted
            //Success accept, now need change reservation state to accepted
            var changeReservationStateToAcceptedResult = changeReservationStateSync(reservation._id, 'accepting', 'accepted');
            if (changeReservationStateToAcceptedResult) {
                throw new Meteor.Error(409, 'Can not accepted!');
            } else {
                myFuture.return("This reservation was accepted!")
            }

        } catch (err) {
            try {
                //Rollback
                if (changeReservationResult) {
                    Reservations.update(
                        {
                            _id: reservation._id,
                            bookState: 'accepting'
                        }
                        , {
                            $set: {
                                bookState: 'waiting'
                            }
                        }
                    )
                }
                if (acceptReservationResult) {
                    RoadMaps.update(
                        {
                            _id: roadMap._id,
                            slots: newSlots,
                            acceptingReservations: reservation._id
                        },
                        {
                            $set: {
                                slots: oldSlots
                            },
                            $pull: {acceptingReservations: reservation._id}
                        }
                    )
                }
            } catch (err2) {

            }
            console.log("bookDeny: ", err.reason);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },

    //ensure correctness and consistent of Reservation state with Roadmaps per 30 minutes
    checkReservation: function () {
        try {
            var dateThreshold = new Date();
            dateThreshold.setMinutes(dateThreshold.getMinutes() - 30);
            var interval = new Meteor.setInterval(function () {
                var reservations = Reservations.find({$and:[{bookState: 'accepting'}, {updatedAt: {$lt: dateThreshold}}]})
                reservations.forEach(function (reservation) {
                    var roadMap = RoadMaps.findOne({acceptingReservations: reservation._id});
                    if(!roadMap){
                        Reservations.update(
                            {
                                _id: reservation._id,
                                bookState: 'accepting'
                            }
                            , {
                                $set: {
                                    bookState: 'waiting'
                                }
                            }
                        )
                    } else {
                        Reservations.update(
                            {
                                _id: reservation._id,
                                bookState: 'accepting'
                            }
                            , {
                                $set: {
                                    bookState: 'accepted'
                                }
                            }
                        )
                    }
                });
            }, 1000 * 60 * 30);
        } catch (err) {
            console.log("checkReservation", err);
        }
    },
});