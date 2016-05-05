Meteor.methods({
    markAsRead: function (notificationId) {
        try {
            if (!this.userId) {
                return;
            }
            Notifications.update({
                $and: [
                    {
                        _id: notificationId
                    }, {
                        userId: this.userId
                    }
                ]
            }, {
                $set: {
                    read: true
                }
            })
        }
        catch (err) {
            console.log("markAsRead", err);
            return;
        }
    },
    markAllAsRead: function () {
        try {
            if (!this.userId) {
                return;
            }
            Notifications.update({
                userId: this.userId
            }, {
                $set: {
                    read: true
                }
            }, {multi: true})
        }
        catch (err) {
            console.log("markAllAsRead", err);
            return;
        }
    }
});