Meteor.publishComposite("trip_search", function (origin, destination, distance, date, limit) {
    var self = this, tripIds, destinationIdSelector, destinationLocationSelector,
        destinationQuery = {$and: []}, afterADay, dateQuery, normalizedLimit, base = 5;
    try {
        check(distance, Match.Where(function (distance) {
            check(distance, Number);
            if (distance < 0) {
                throw new Meteor.Error(505, "distance must be larger or equal than 0");
            }
            return distance >= 0;
        }));
        check(limit, Match.Optional(Number));
        check(date, Date);
        limit = limit || base;
        normalizedLimit = limit + (base - (limit % base));
        afterADay = new Date(date.getTime());
        afterADay.setDate(afterADay.getDate() + 1);
        dateQuery = {startAt: {$lt: afterADay, $gte: date}};
        if (origin && origin.length == 2) {
            tripIds = Trips.find({
                $and: [
                    {
                        origin: {
                            $near: {
                                $geometry: {
                                    type: "Point",
                                    coordinates: [origin[0], origin[1]]
                                },
                                $maxDistance: distance
                            }
                        }
                    },
                    dateQuery
                ]
            }).map(function (trip) {
                if (trip.slots && trip.slots.length == trip.seats)
                    return;
                var user = Meteor.users.findOne({_id: trip.owner});
                if(!user)
                    return;
                return trip._id;
            });

        } else {
            tripIds = Trips.find(dateQuery).map(function (trip) {
                if (trip.slots && trip.slots.length == trip.seats)
                    return;
                var user = Meteor.users.findOne({_id: trip.owner});
                if(!user)
                    return;
                return trip._id;
            });
        }
        destinationIdSelector = {_id: {$in: tripIds}};
        destinationQuery.$and.push(destinationIdSelector);
        if (destination && destination.length == 2) {
            destinationLocationSelector = {
                destination: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [destination[0], destination[1]]
                        },
                        $maxDistance: distance
                    }
                }
            }
        } else {
            destinationLocationSelector = {};
        }
        destinationQuery.$and.push(destinationLocationSelector);
        return {
            find: function () {
                Counts.publish(self, 'trip_search',
                    Trips.find(destinationQuery, {fields: {_id: 1}}), {noReady: true});
                return Trips.find(destinationQuery, {
                    limit: normalizedLimit,
                    fields: {
                        origin: 1,
                        destination: 1,
                        slots: 1,
                        startAt: 1,
                        seats: 1,
                        pricePerSeat: 1,
                        vehicle: 1,
                        owner: 1
                    }
                });
            },
            children: [
                {
                    find: function (trip) {
                        return Meteor.users.find({_id: trip.owner}, {fields: {publicProfile: 1}});
                    }
                }
            ]
        }
    } catch (err) {
        console.log("trip_search", err);
        self.ready();
        return;
    }
});
Meteor.publishComposite("trip_detail", function (tripId, limit) {
    var self = this, normalizedLimit, base = 5;
    try {
        check(tripId, String);
        check(limit, Match.Optional(Number));
        limit = limit || base;
        normalizedLimit = limit + (base - (limit % base));
        return {
            find: function () {
                return Trips.find({_id:tripId}, {
                    fields: {
                        origin: 1,
                        destination: 1,
                        slots: 1,
                        startAt: 1,
                        seats: 1,
                        pricePerSeat: 1,
                        vehicle: 1,
                        owner: 1,
                        baggageSize: 1,
                        flexibleTime: 1,
                        flexibleDistance: 1,
                        isFreezing: 1,
                        note: 1
                    }
                });
            },
            children: [
                {
                    find: function(trip){
                        return Meteor.users.find({_id: {$in: trip.slots}}, {fields: {publicProfile: 1}});
                    }
                }
            ]
        }
    } catch (err) {
        console.log("trip_detail", err);
        self.ready();
        return;
    }
});