Meteor.startup(function () {
    Meteor.call('checkReservation');
});