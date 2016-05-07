Meteor.publishComposite("checkInTickets", function (state, date, limit) {
    var self = this, afterADay, dateQuery, normalizedLimit, base = 5, checkInQuery, stateQuery = {};
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
        date.setHours(0, 0, 0, 0);
        afterADay = new Date(date.getTime());
        afterADay.setDate(afterADay.getDate() + 1);
        console.log(normalizedLimit, state, date, afterADay);
        dateQuery = {$and: [{startCheckInAble: {$lt: afterADay, $gte: date}}, {isDeleted: false}]};
        if (state) {
            stateQuery = {
                state: state
            }
        }
        checkInQuery = {
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
                    'checkInTickets',
                    CheckInTickets.find(
                        checkInQuery,
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
                return CheckInTickets.find(
                    checkInQuery,
                    {
                        limit: normalizedLimit,
                        fields: {
                            tripId: 1,
                            userId: 1,
                            state: 1,
                            isDeleted: 1,
                        }
                    }
                );
            },
            children: [
                {
                    find: function (ticket) {
                        return Trips.find({_id: ticket.tripId}, {
                            fields: {
                                origin: 1,
                                destination: 1,
                                startAt: 1
                            }
                        });
                    }
                }
            ]
        }
    } catch (err) {
        console.log("checkInTickets", err);
        self.ready();
        return;
    }
});
Meteor.publishComposite("checkInTicket", function (checkInTicketId) {
    var self = this;
    try {
        if (!self.userId) {
            self.ready();
            return;
        }
        check(checkInTicketId, String);
        return {
            find: function () {
                return CheckInTickets.find(
                    {
                        $and: [
                            {_id: checkInTicketId},
                            {userId: self.userId}
                        ]
                    },
                    {
                        fields: {
                            userId: 1,
                            tripId: 1,
                            state: 1,
                            isDeleted: 1,
                            checkedInAt: 1,
                            checkedOutAt: 1
                        }
                    }
                );
            },
            children: [
                {
                    find: function (ticket) {
                        return Trips.find({_id: ticket.tripId}, {
                            fields: {
                                origin: 1,
                                destination: 1,
                                isDeleted: 1
                            }
                        });
                    }
                }
            ]
        }
    } catch (err) {
        console.log("checkInTicket", err);
        self.ready();
        return;
    }
});