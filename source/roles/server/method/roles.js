checkAndAddRole = function (roleName) {
    let role = Meteor.roles.findOne({name: roleName});
    if (!role) {
        Roles.createRole(roleName);
    }
};
checkRoleInList = function (roleName, callback) {
    try {
        let role = Meteor.roles.findOne({name: roleName});
        if (!role) {
            callback(new Meteor.Error(407, "Invalid Role"));
        }
        else {
            callback(false, "valid role");
        }
    } catch (err) {
        console.log("checkRoleInList", err);
        callback(err);
    }
};
userIsInAdminRole = function (userId) {
    return Roles.userIsInRole(userId,
        [
            Meteor.settings.public.ADMIN_ROLE
        ]
    );
};
userIsInUserManagerRole = function (userId) {
    return Roles.userIsInRole(userId,
        [
            Meteor.settings.public.ADMIN_ROLE,
            Meteor.settings.public.USER_MANAGER_ROLE,
        ]
    );
};
userIsInTripManagerRole = function (userId) {
    return Roles.userIsInRole(userId,
        [
            Meteor.settings.public.ADMIN_ROLE, ,
            Meteor.settings.public.TRIP_MANAGER_ROLE
        ]
    );
};
userIsInNewsManagerRole = function (userId) {
    return Roles.userIsInRole(userId,
        [
            Meteor.settings.public.ADMIN_ROLE,
            Meteor.settings.public.NEWS_MANAGER_ROLE
        ]
    );
};
userIsInCommentManagerRole = function (userId) {
    return Roles.userIsInRole(userId,
        [
            Meteor.settings.public.ADMIN_ROLE,
            Meteor.settings.public.COMMENT_MANAGER_ROLE
        ]
    );
};
userIsInAdminLoginRole = function (userId) {
    return Roles.userIsInRole(userId,
        [
            Meteor.settings.public.ADMIN_ROLE,
            Meteor.settings.public.USER_MANAGER_ROLE,
            Meteor.settings.public.TRIP_MANAGER_ROLE,
            Meteor.settings.public.NEWS_MANAGER_ROLE,
            Meteor.settings.public.COMMENT_MANAGER_ROLE
        ]
    );
};
