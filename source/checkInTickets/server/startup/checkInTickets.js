Meteor.startup(function () {
    Meteor.call('updateCheckInTicketState');
});