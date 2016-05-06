Checkins.after.update(function (userId, doc, fieldNames, modifier, options) {
    try {
        if (modifier.$set && modifier.$set.hasOwnProperty('state')) {
            if (modifier.$set.state == "checkInAble") {
                Notifications.insert({
                    userId: doc.userId,
                    actionType: Meteor.settings.actionTypes[4].type,
                    notificationType: Meteor.settings.notificationTypes[3].type,
                    state: "menu.checkIn",
                    params: {
                        checkInId: doc._id
                    }
                });
            } else if (modifier.$set.state == "expired") {
                Notifications.insert({
                    userId: doc.userId,
                    actionType: Meteor.settings.actionTypes[5].type,
                    notificationType: Meteor.settings.notificationTypes[3].type,
                    state: "menu.checkIn",
                    params: {
                        checkInId: doc._id
                    }
                });
                //TODO: create a report to admin, tell this user late checkin
            }
        }
    } catch (err) {
        console.log("Reservations after update", err);
    }
});