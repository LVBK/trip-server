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
acceptReservationAsync = function (trip, reservation, newSlots, callback) {
    try {
        Trips.update(
            {
                _id: trip._id,
                slots: trip.slots,
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
    }
}
Meteor.methods({
    bookSeats: function (tripId, totalSeat) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            checkLogin(this.userId);
            check(tripId, String);
            check(totalSeat, Match.Where(function (totalSeat) {
                check(totalSeat, Number);
                if (totalSeat <= 0) {
                    throw new Meteor.Error(405, "Number of seat for must be larger than 0");
                }
                return totalSeat > 0;
            }));

            var trip = Trips.findOne({_id: tripId});
            if (!trip) {
                throw new Meteor.Error(406, "Not found trip for booking");
            }
            if (trip.hasOwnProperty('isDeleted') && trip.isDeleted == true) {
                throw new Meteor.Error(407, "This trip has been removed");
            }
            if(trip.hasOwnProperty('startAt') && trip.startAt < new Date()){
                throw new Meteor.Error(407, "This trip has been departed");
            }
            var user = Meteor.users.findOne({_id: trip.owner});
            if (!user) {
                throw new Meteor.Error(410, "Not found driver, can't book this trip");
            }
            if (user.hasOwnProperty('isDeleted') && user.isDeleted == true) {
                throw new Meteor.Error(407, "Driver of trip has been removed, can't book this trip");
            }
            if (totalSeat > (trip.seats - trip.slots.length)) {
                throw new Meteor.Error(411, "Not enough empty seat for book");
            }
            //Create order
            Reservations.insert({
                tripId: trip._id,
                userId: this.userId,
                totalSeats: totalSeat,
                totalPrice: totalSeat * trip.pricePerSeat,
                startAt: trip.startAt,
                to: trip.owner
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
            var reservation = Reservations.findOne({$and: [{_id: reservationId}, {isDeleted: false}]});
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
            var reservation = Reservations.findOne({$and: [{_id: reservationId}, {isDeleted: false}]});
            if (!reservation) {
                throw new Meteor.Error(406, 'Not found reservation');
            }
            if (reservation.bookState !== 'waiting') {
                throw new Meteor.Error(406, 'This reservation is in ' + reservation.bookState + ' state! Can not deny now!');
            }
            var trip = Trips.findOne({$and: [{_id: reservation.tripId}, {owner: self.userId}]});
            if (!trip) {
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
            var reservation = Reservations.findOne({$and: [{_id: reservationId}, {isDeleted: false}]});
            if (!reservation) {
                throw new Meteor.Error(405, 'Not found reservation');
            }
            if (reservation.bookState !== 'waiting') {
                throw new Meteor.Error(406, 'This reservation is in ' + reservation.bookState + ' state! Can not accept now!');
            }

            var booker = Meteor.users.findOne({_id: reservation.userId});
            if (!booker) {
                throw new Meteor.Error(410, "Not found booker, can't accept this reservation");
            }
            if (booker.hasOwnProperty('isDeleted') && booker.isDeleted == true) {
                throw new Meteor.Error(407, "Owner of reservation has been removed, can't accept");
            }

            var trip = Trips.findOne({$and: [{_id: reservation.tripId}, {owner: self.userId}]});
            if (!trip) {
                throw new Meteor.Error(407, 'You have no permission to accept this reservation');
            }
            if (reservation.totalSeats > (trip.seats - trip.slots.length)) {
                throw new Meteor.Error(408, 'Not enough empty seats for this reservation');
            }
            if (trip.startAt < new Date()) {
                throw new Meteor.Error(409, 'This trip was departed! No longer acceptable');
            }
            //Update if is concurrent
            var changeReservationStateSync = Meteor.wrapAsync(changeReservationStateAsync);
            var changeReservationResult = changeReservationStateSync(reservation._id, reservation.bookState, 'accepting');
            if (changeReservationResult == 0) {
                throw new Meteor.Error(409, 'Can not accepted 1!');
            }
            //Now reservation in state 'accepting'
            //TODO: server down here: reservation must rollback to waiting
            var oldSlots = trip.slots.slice();
            var newSlots = trip.slots.slice();
            for (i = 0; i < reservation.totalSeats; i++) {
                newSlots.push(reservation.userId);
            }
            var acceptReservationSync = Meteor.wrapAsync(acceptReservationAsync);
            var acceptReservationResult = acceptReservationSync(trip, reservation, newSlots);
            if (acceptReservationResult == 0) {
                throw new Meteor.Error(409, 'Can not accepted 2!');
            }
            //TODO: server down here: reservation must be accepted
            //Success accept, now need change reservation state to accepted
            var changeReservationStateToAcceptedResult = changeReservationStateSync(reservation._id, 'accepting', 'accepted');
            if (changeReservationStateToAcceptedResult == 0) {
                throw new Meteor.Error(409, 'Can not accepted 3!');
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
                    Trips.update(
                        {
                            _id: trip._id,
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
                throw new Meteor.Error(407, err2.reason || err2.message);
            }
            console.log("bookAccept: ", err.reason);
            throw new Meteor.Error(408, err.reason || err.message);
        }
        return myFuture.wait();
    },

    //ensure correctness and consistent of Reservation state with Trips per 30 minutes
    checkReservation: function () {
        try {
            var dateThreshold = new Date();
            dateThreshold.setMinutes(dateThreshold.getMinutes() - 30);
            var interval = new Meteor.setInterval(function () {
                var reservations = Reservations.find({$and:[{bookState: 'accepting'}, {updatedAt: {$lt: dateThreshold}}]})
                reservations.forEach(function (reservation) {
                    var trip = Trips.findOne({acceptingReservations: reservation._id});
                    if(!trip){
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