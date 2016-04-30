Reservations = new Meteor.Collection("reservations");
ReservationsSchema = new SimpleSchema({
    tripId:
    {
        type:String,
        denyUpdate: true
    },
    userId:
    {
        type:String,
        denyUpdate: true
    },
    to: {
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
        allowedValues: ['waiting', 'accepting', 'accepted', 'denied', 'canceled'],
        optional: true,
        autoValue: function () {
            if (this.isInsert) {
                return 'waiting';
            }
        },
    },
    updatedAt: {
        type: Date,
        autoValue: function() {
            if (this.isUpdate) {
                return new Date();
            }
        },
        denyInsert: true,
        optional: true
    },
    startAt: {
        type: Date
    }
});

Reservations.attachSchema(ReservationsSchema);