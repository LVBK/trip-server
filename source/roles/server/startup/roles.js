Meteor.startup(function () {
    checkAndAddRole(Meteor.settings.public.ADMIN_ROLE);
    checkAndAddRole(Meteor.settings.public.COMMENT_MANAGER_ROLE);
    checkAndAddRole(Meteor.settings.public.USER_MANAGER_ROLE);
    checkAndAddRole(Meteor.settings.public.TRIP_MANAGER_ROLE);
    checkAndAddRole(Meteor.settings.public.NEWS_MANAGER_ROLE);
});