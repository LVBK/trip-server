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
        dateQuery = {$and: [{startAt: {$lt: afterADay, $gte: date}}, {isDeleted: false}]};
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
                var user = Meteor.users.findOne({$and: [{_id: trip.owner}, {isDeleted: false}]});
                if (!user)
                    return;
                return trip._id;
            });

        } else {
            tripIds = Trips.find(dateQuery).map(function (trip) {
                if (trip.slots && trip.slots.length == trip.seats)
                    return;
                var user = Meteor.users.findOne({$and: [{_id: trip.owner}, {isDeleted: false}]});
                if (!user)
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
                        owner: 1,
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
Meteor.publishComposite("trip_detail", function (tripId) {
    var self = this, normalizedLimit, base = 5;
    try {
        check(tripId, String);
        return {
            find: function () {
                return Trips.find({_id: tripId}, {
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
                        note: 1,
                        isDeleted: 1
                    }
                });
            },
            children: [
                {
                    find: function (trip) {
                        return Meteor.users.find({_id: {$in: trip.slots}}, {fields: {publicProfile: 1, isDeleted: 1}});
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
Meteor.publish("my_trips", function (date, limit) {
    var self = this, endOfDay, selector, normalizedLimit, base = 5;
    try {
        if(!self.userId){
            self.ready();
            return;
        }
        check(limit, Match.Optional(Number));
        check(date, Date);
        limit = limit || base;
        normalizedLimit = limit + (base - (limit % base));
        endOfDay = new Date(date.getTime());
        endOfDay.setDate(endOfDay.getDate() + 1);
        endOfDay.setHours(0, 0, 0, 0);
        selector = {
            $and: [
                {owner: self.userId},
                {startAt: {$lt: endOfDay, $gte: date}},
                {isDeleted: false}
            ]
        }
        Counts.publish(self, 'my_trips',
            Trips.find(selector, {fields: {_id: 1}}), {noReady: true});
        return Trips.find(selector, {
            limit: normalizedLimit,
            fields: {
                origin: 1,
                destination: 1,
                slots: 1,
                startAt: 1,
                seats: 1,
                pricePerSeat: 1,
                vehicle: 1,
                owner: 1,
            }
        });
    } catch (err) {
        console.log("my_trips", err);
        self.ready();
        return;
    }
});