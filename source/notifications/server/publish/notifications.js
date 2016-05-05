Meteor.publish(null, function () {
    var self = this;
    try {
        if (!self.userId) {
            self.ready();
            return;
        }
        return ActionTypes.find();
    } catch (err) {
        self.ready();
        return;
    }
});
Meteor.publish(null, function () {
    var self = this;
    try {
        if (!self.userId) {
            self.ready();
            return;
        }
        return NotificationTypes.find();
    } catch (err) {
        self.ready();
        return;
    }

});
Meteor.publish(null, function () {
    var self = this;
    try {
        if (!self.userId) {
            self.ready();
            return;
        }
        Counts.publish(
            self,
            'notifications_unread',
            Notifications.find(
                {
                    $and: [
                        {userId: self.userId},
                        {read: false}
                    ]
                },
                {
                    fields: {
                        _id: 1
                    }
                }
            ),
            {
                noReady: true
            }
        )
    } catch (err) {
        self.ready();
        return;
    }
});
Meteor.publishComposite("notifications", function (limit) {
    var self = this, normalizedLimit, base = 5;
    try {
        if (!self.userId) {
            self.ready();
            return;
        }
        check(limit, Match.Optional(Number));
        limit = limit || base;
        normalizedLimit = limit + (base - (limit % base));
        return {
            find: function () {
                Counts.publish(
                    self,
                    'notifications',
                    Notifications.find(
                        {userId: self.userId},
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
                return Notifications.find(
                    {userId: self.userId},
                    {
                        limit: normalizedLimit,
                        sort: {
                            createdAt: -1
                        }
                    }
                );
            },
            children: [
                {
                    find: function (notification) {
                        return Meteor.users.find({_id: notification.senderId}, {fields: {publicProfile: 1}});
                    }
                }
            ]
        }
    } catch (err) {
        console.log("notifications", err);
        self.ready();
        return;
    }
});