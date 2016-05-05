NotificationTypes = new Meteor.Collection("notificationTypes")
NotificationTypesSchema = new SimpleSchema({
    type: {
        type: String,
        unique: true,
    },
    description: {
        type: String
    }
});
NotificationTypes.attachSchema(NotificationTypesSchema);

ActionTypes = new Meteor.Collection("actionTypes")
ActionTypesSchema = new SimpleSchema({
    type: {
        type: String,
        unique: true,
    },
    description: {
        type: String
    }
});
ActionTypes.attachSchema(ActionTypesSchema);

Notifications = new Meteor.Collection("notifications");
NotificationsSchema = new SimpleSchema({
    userId:
    {
        type:String
    },
    senderId: {
        type: String,
        optional: true
    },
    actionType: {
        type: String,
        optional: true
    },
    notificationType: {
        type: String,
    },
    createdAt: {
        type: Date,
        autoValue: function() {
            if (this.isInsert) {
                return new Date();
            } else if (this.isUpsert) {
                return {$setOnInsert: new Date()};
            }
        }
    },
    read: {
        type: Boolean,
        defaultValue: false
    },
    link: {
        type: String
    }
});

Notifications.attachSchema(NotificationsSchema);