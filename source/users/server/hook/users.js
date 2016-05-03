Meteor.users.before.update(function (userId, doc, fieldNames, modifier, options) {
    if (doc.emails[0].address == Meteor.settings.private.admin.email) {
        if (modifier.$set && modifier.$set.hasOwnProperty('isDeleted')) {
            if (modifier.$set.isDeleted == true) {
                throw new Meteor.Error(405, "Can not delete this user!");
                return false;
            }
        }
    }
});
Meteor.users.before.update(function (userId, doc, fieldNames, modifier, options) {
    if (modifier.$set && modifier.$set.hasOwnProperty('isDeleted')) {
        if (modifier.$set.isDeleted == true) {
            Trips.update(
                {
                    owner: doc._id
                }, {
                    $set: {
                        'isDeleted': true
                    }
                }, {
                    multi: true
                }
            )
        }
    }
});
Meteor.users.after.remove(function (userId, doc) {
    if (doc.emails[0].address == Meteor.settings.private.admin.email) {
        var adminName = Meteor.settings.private.admin.email;
        var adminPass = Meteor.settings.private.admin.password;
        var adminId = Accounts.createUser({
            email: adminName,
            password: adminPass
        });
        Roles.addUsersToRoles(adminId, Meteor.settings.public.ADMIN_ROLE, Roles.GLOBAL_GROUP);
        Meteor.users.update(
            {_id: adminId},
            {$set: {'isEmployee': true}}
        );
    }
});