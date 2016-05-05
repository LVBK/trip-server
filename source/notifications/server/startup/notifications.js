Meteor.startup(function () {
    var notificationTypes = Meteor.settings.notificationTypes;
    _.each(notificationTypes, function (notificationType) {
        NotificationTypes.upsert(
            {type: notificationType.type},
            {
                $set: {
                    type: notificationType.type,
                    description: notificationType.description
                }
            })
    });
    var actionTypes = Meteor.settings.actionTypes;
    _.each(actionTypes, function (actionType) {
        ActionTypes.upsert(
            {type: actionType.type},
            {
                $set: {
                    type: actionType.type,
                    description: actionType.description
                }
            })
    });
});