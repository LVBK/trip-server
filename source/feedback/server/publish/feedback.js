Meteor.publishComposite("feedbacks", function (userId, limit) {
    var self = this, feedbackQuery, normalizedLimit, base = 5;
    try {
        check(userId, String);
        check(limit, Match.Optional(Number));
        limit = limit || base;
        normalizedLimit = limit + (base - (limit % base));
        feedbackQuery = {
            $and: [
                {to: userId},
                {isDeleted: false}
            ]
        }
        return {
            find: function () {
                Counts.publish(self, 'feedbacks',
                    Feedbacks.find(feedbackQuery, {fields: {_id: 1}}), {noReady: true});
                return Feedbacks.find(feedbackQuery,
                    {
                        limit: normalizedLimit,
                        fields: {
                            from: 1,
                            to: 1,
                            rate: 1,
                            content: 1,
                            createdAt: 1,
                        },
                        sort: {
                            createdAt: -1
                        },
                    }
                );
            },
            children: [
                {
                    find: function (feedback) {
                        return Meteor.users.find({_id: feedback.from}, {fields: {publicProfile: 1}});
                    }
                }
            ]
        }
    } catch (err) {
        console.log("feedbacks", err);
        self.ready();
        return;
    }
});
Meteor.publish("feedback_counter", function (tripId) {
    var self = this
    try {
        if (!self.userId) {
            self.ready();
            return;
        }
        check(tripId, String);
        Counts.publish(self, 'feedback_counter',
            Feedbacks.find({
                $and: [
                    {tripId: tripId},
                    {from: self.userId}
                ]
            }, {fields: {_id: 1}}), {noReady: true});
        self.ready();
        return;
    } catch (err) {
        console.log("feedback_counter", err);
        self.ready();
        return;
    }
});