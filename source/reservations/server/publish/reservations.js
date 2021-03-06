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
        dateQuery = {$and:[{startAt: {$lt: afterADay, $gte: date}}, {isDeleted: false}]};
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
                return Reservations.find(reservationQuery,
                    {
                        limit: normalizedLimit,
                        fields: {
                            totalSeats: 1,
                            tripId: 1,
                            userId: 1,
                            startAt: 1,
                            to: 1,
                            bookState: 1
                        }
                    }
                );
            },
            children: [
                {
                    find: function (reservation) {
                        return Trips.find({_id: reservation.tripId}, {
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
                        return Meteor.users.find({_id: reservation.userId}, {fields: {name: 1, avatar: 1}});
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
        dateQuery = {$and:[{startAt: {$lt: afterADay, $gte: date}}, {isDeleted: false}]};
        if (state) {
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
                    {
                        limit: normalizedLimit,
                        fields: {
                            totalSeats: 1,
                            bookState: 1,
                            tripId: 1,
                            userId: 1,
                            startAt: 1
                        }
                    }
                );
            },
            children: [
                {
                    find: function (reservation) {
                        return Trips.find({_id: reservation.tripId}, {
                            fields: {
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
Meteor.publishComposite("my_reservation_detail", function (reservationId) {
    var self = this;
    try {
        if (!self.userId) {
            self.ready();
            return;
        }
        check(reservationId, String);
        return {
            find: function () {
                return Reservations.find(
                    {
                        $and: [
                            {_id: reservationId},
                            {userId: self.userId}
                        ]
                    },
                    {fields: {updatedAt: 0}}
                );
            },
            children: [
                {
                    find: function (reservation) {
                        return Trips.find({_id: reservation.tripId}, {
                            fields: {
                                seats: 1,
                                slots: 1,
                                origin: 1,
                                destination: 1,
                                isDeleted: 1
                            }
                        });
                    }
                },
                {
                    find: function (reservation) {
                        return Meteor.users.find({_id: reservation.to}, {fields: {name: 1, avatar: 1, isDeleted: 1}});
                    }
                }
            ]
        }
    } catch (err) {
        console.log("my_reservation_detail", err);
        self.ready();
        return;
    }
});
Meteor.publishComposite("reservation_detail", function (reservationId) {
    var self = this;
    try {
        if (!self.userId) {
            self.ready();
            return;
        }
        check(reservationId, String);
        return {
            find: function () {
                return Reservations.find(
                    {
                        $and: [
                            {_id: reservationId},
                            {to: self.userId}
                        ]
                    },
                    {fields: {updatedAt: 0}}
                );
            },
            children: [
                {
                    find: function (reservation) {
                        return Trips.find({_id: reservation.tripId}, {
                            fields: {
                                seats: 1,
                                slots: 1,
                                origin: 1,
                                destination: 1,
                                isDeleted: 1
                            }
                        });
                    }
                },
                {
                    find: function (reservation) {
                        return Meteor.users.find({_id: reservation.userId}, {fields: {name: 1, avatar: 1, isDeleted: 1}});
                    }
                }
            ]
        }
    } catch (err) {
        console.log("reservation_detail", err);
        self.ready();
        return;
    }
});