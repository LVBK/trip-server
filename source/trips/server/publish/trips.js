Meteor.publishComposite("trip_search", function (origin, destination, distance, date, limit) {
    var self = this, roadMapIds, destinationIdSelector, destinationLocationSelector,
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
        dateQuery = {startAt: {$lt: afterADay, $gte: date}}
        if (origin && origin.length == 2) {
            roadMapIds = RoadMaps.find({
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
            }).map(function (roadMap) {
                var trip = Trips.findOne({$and: [{_id: roadMap.tripId}, {isDeleted: false}, {isFreezing: false}]});
                if (!trip)
                    return;
                if (roadMap.slots && roadMap.slots.length == trip.seats)
                    return;
                return roadMap._id;
            });

        } else {
            roadMapIds = RoadMaps.find(dateQuery).map(function (roadMap) {
                var trip = Trips.findOne({$and: [{_id: roadMap.tripId}, {isDeleted: false}, {isFreezing: false}]});
                if (!trip)
                    return;
                if (roadMap.slots && roadMap.slots.length == trip.seats)
                    return;
                return roadMap._id;
            });
        }
        destinationIdSelector = {_id: {$in: roadMapIds}};
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
                    RoadMaps.find(destinationQuery, {fields: {_id: 1}}), {noReady: true});
                return RoadMaps.find(destinationQuery, {
                    limit: normalizedLimit,
                });
            },
            children: [
                {
                    find: function (roadMap) {
                        return Trips.find({_id: roadMap.tripId}, {
                            fields: {
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
            ]
        }
    } catch (err) {
        console.log("trip_search", err);
        self.ready();
        return;
    }
})
;