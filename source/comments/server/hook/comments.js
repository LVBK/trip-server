Comments.after.insert(function (userId, doc) {
    try {
        Notifications.insert({
            userId: doc.to,
            senderId: doc.from,
            actionType: Meteor.settings.actionTypes[7].type,
            notificationType: Meteor.settings.notificationTypes[5].type,
            state: "menu.tripDetail",
            params: {
                tripId: doc.tripId
            }
        });
    } catch (err) {
        console.log("Comments after insert", err);
    }
});