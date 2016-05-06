Meteor.startup(function () {
    Meteor.call('updateCheckinState');
});