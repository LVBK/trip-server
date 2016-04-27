Reservations = new Meteor.Collection("reservations");
ReservationsSchema = new SimpleSchema({
    roadMapId:
    {
        type:String,
        denyUpdate: true
    },
    userId:
    {
        type:String,
        denyUpdate: true
    },
    totalSeats: {
        type: Number,
        denyUpdate: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        decimal: true,
        denyUpdate: true,
        min: 0
    },
    bookState: {
        type: String,
        allowedValues: ['waiting', 'accepted', 'denied'],
        optional: true,
        autoValue: function () {
            if (this.isInsert) {
                return 'waiting';
            }
        },
    }
});

Reservations.attachSchema(ReservationsSchema);