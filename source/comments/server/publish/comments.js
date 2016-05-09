Meteor.publishComposite("comments", function (tripId, limit) {
    var self = this, commentQuery, normalizedLimit, base = 5;
    try {
        check(tripId, String);
        check(limit, Match.Optional(Number));
        limit = limit || base;
        normalizedLimit = limit + (base - (limit % base));
        commentQuery = {
            $and: [
                {tripId: tripId},
                {isDeleted: false}
            ]
        }
        return {
            find: function () {
                Counts.publish(self, 'comments',
                    Comments.find(commentQuery, {fields: {_id: 1}}), {noReady: true});
                return Comments.find(commentQuery,
                    {
                        limit: normalizedLimit,
                        fields: {
                            from: 1,
                            tripId: 1,
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
                    find: function (comment) {
                        return Meteor.users.find({_id: comment.from}, {fields: {publicProfile: 1}});
                    }
                }
            ]
        }
    } catch (err) {
        console.log("comments", err);
        self.ready();
        return;
    }
});