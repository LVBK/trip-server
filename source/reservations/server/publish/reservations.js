//TODO: publish reservation to a roadMap, param: roadMapId, require logged in, is owner of roadMap
Meteor.publishComposite("reservation_to_me", function (date, limit) {
    var self = this, afterADay, dateQuery, reservationQuery, normalizedLimit, base = 5;
    try {
        if (!self.userId) {
            self.ready();
            return;
        }
        check(limit, Match.Optional(Number));
        check(date, Date);
        limit = limit || base;
        normalizedLimit = limit + (base - (limit % base));
        afterADay = new Date(date.getTime());
        afterADay.setDate(afterADay.getDate() + 1);
        dateQuery = {startAt: {$lt: afterADay, $gte: date}};
        reservationQuery = {
            $and: [
                {to: self.userId},
                {bookState: 'waiting'},
                dateQuery
            ]
        }
        return {
            find: function () {
                Counts.publish(self, 'reservation_to_me',
                    Reservations.find(reservationQuery, {fields: {_id: 1}}), {noReady: true});
                return Reservations.find(reservationQuery, {limit: normalizedLimit});
            },
            children: [
                {
                    find: function (reservation) {
                        return RoadMaps.find({_id: reservation._id}, {
                            fields: {
                                seats: 1,
                                slots: 1,
                                origin: 1,
                                destination: 1
                            }
                        });
                    }
                },
                {
                    find: function (reservation) {
                        return Meteor.users.find({_id: reservation.userId}, {fields: {publicProfile: 1}});
                    }
                }
            ]
        }
    } catch (err) {
        console.log("reservation_to_me", err);
        self.ready();
        return;
    }
});
Meteor.publishComposite("reservation_from_me", function (state, date, limit) {
    var self = this, afterADay, dateQuery, normalizedLimit, base = 5, reservationQuery, stateQuery = {};
    try {
        if (!self.userId) {
            self.ready();
            return;
        }
        check(state, Match.Optional(String));
        check(limit, Match.Optional(Number));
        check(date, Date);
        limit = limit || base;
        normalizedLimit = limit + (base - (limit % base));
        afterADay = new Date(date.getTime());
        afterADay.setDate(afterADay.getDate() + 1);
        dateQuery = {startAt: {$lt: afterADay, $gte: date}};
        if(state){
            stateQuery = {
                bookState: state
            }
        }
        reservationQuery = {
            $and: [
                {
                    userId: self.userId,
                },
                dateQuery,
                stateQuery
            ]
        };
        return {
            find: function () {
                Counts.publish(
                    self,
                    'reservation_from_me',
                    Reservations.find(
                        reservationQuery,
                        {
                            fields: {
                                _id: 1
                            }
                        }
                    ),
                    {
                        noReady: true
                    }
                );
                return Reservations.find(
                    reservationQuery,
                    {limit: normalizedLimit}
                );
            },
            children: [
                {
                    find: function (reservation) {
                        return RoadMaps.find({_id: reservation.roadMapId}, {
                            fields: {
                                seats: 1,
                                slots: 1,
                                origin: 1,
                                destination: 1
                            }
                        });
                    }
                }
            ]
        }
    } catch (err) {
        console.log("reservation_from_me", err);
        self.ready();
        return;
    }
});