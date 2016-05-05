Meteor.publish("null", function () {
    var self = this;
    try {
        self.disableMergebox();
        self.disableAutoRemove();
        self.disableAutoChange();
        if (!self.userId) {
            self.ready();
            return;
        }
        return ActionTypes.find({});
    } catch (err) {
        self.ready();
        return;
    }
});
Meteor.publish("null", function () {
    var self = this;
    try {
        self.disableMergebox();
        self.disableAutoRemove();
        self.disableAutoChange();
        if (!self.userId) {
            self.ready();
            return;
        }
        return NotificationTypes.find({});
    } catch (err) {
        self.ready();
        return;
    }

});