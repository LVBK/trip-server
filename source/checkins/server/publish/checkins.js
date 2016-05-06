Meteor.publishComposite("checkIns", function (state, date, limit) {
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
        date.setHours(0,0,0,0);
        afterADay = new Date(date.getTime());
        afterADay.setDate(afterADay.getDate() + 1);
        dateQuery = {$and:[{startAt: {$lt: afterADay, $gte: date}}, {isDeleted: false}]};
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
                    'checkIns',
                    Checkins.find(
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
                return Checkins.find(
                    checkInQuery,
                    {
                        limit: normalizedLimit,
                        fields: {
                            tripId: 1,
                            userId: 1,
                            state: 1
                        }
                    }
                );
            },
            children: [
                {
                    find: function (checkin) {
                        return Trips.find({_id: checkin.tripId}, {
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
        console.log("checkIns", err);
        self.ready();
        return;
    }
});