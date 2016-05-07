Trips = new Meteor.Collection("trips");
TripsSchema = new SimpleSchema({
    owner: {
        type: String
    },
    origin: {
        type: LocationSchema,
        index: '2dsphere'
    },
    destination: {
        type: LocationSchema,
        index: '2dsphere'
    },
    vehicle: {
        type: String,
        allowedValues: ['Motor', 'Car'],
    },
    seats: {
        type: Number,
        min: 2
    },
    startAt: {
        type: Date
    },
    slots: {
        type: Array
    },
    'slots.$': {
        type: String
    },
    pricePerSeat: {
        type: Number,
        decimal: true,
        min: 0
    },
    acceptingReservations: {
        type: Array,
        optional: true
    },
    'acceptingReservations.$': {
        type: String
    },
    baggageSize: {
        type: String,
        allowedValues: ['Small', 'Medium', 'Large'],
    },
    flexibleTime: {
        type: Number,
        allowedValues: [0, 5, 10, 15, 30],
    },
    flexibleDistance: {
        type: String,
        allowedValues: ['Unacceptable', '3 kilometers', '5 kilometers', '10 kilometers', '15 kilometers'],
    },
    note: {
        type: String,
        optional: true
    },
    isExpired: {
        type: Boolean,
        optional: true,
        defaultValue: false
    },
    isDeleted: {
        type: Boolean,
        optional: true,
        defaultValue: false
    },
})
TripsValidationSchema = new SimpleSchema({
    owner: {
        type: String
    },
    origin: {
        type: LocationSchema,
        index: '2dsphere'
    },
    destination: {
        type: LocationSchema,
        index: '2dsphere'
    },
    isRoundTrip: {
        type: Boolean
    },
    tripType: {
        type: String,
        allowedValues: ['one-time', 'often'],
    },
    travelDate: {
        type: Date,
        optional: true,
        custom: function () {
            if (this.field('tripType').value == 'one-time') {
                // inserts
                if (!this.operator) {
                    if (!this.isSet || this.value === null) return "required";
                }
                // updates
                else if (this.isSet) {
                    if (this.operator === "$set" && this.value === null) return "required";
                    if (this.operator === "$unset") return "required";
                    if (this.operator === "$rename") return "required";
                }
            }
        }
    },
    travelTime: {
        type: Date,
    },
    returnDate: {
        type: Date,
        optional: true,
        custom: function () {
            if (this.field('isRoundTrip').value == true && this.field('tripType').value == 'one-time') {
                // inserts
                if (!this.operator) {
                    if (!this.isSet || this.value === null) return "required";
                }
                // updates
                else if (this.isSet) {
                    if (this.operator === "$set" && this.value === null) return "required";
                    if (this.operator === "$unset") return "required";
                    if (this.operator === "$rename") return "required";
                }
            }
        }
    },
    returnTime: {
        type: Date,
        optional: true,
        custom: function () {
            if (this.field('isRoundTrip').value == true) {
                // inserts
                if (!this.operator) {
                    if (!this.isSet || this.value === null) return "required";
                }
                // updates
                else if (this.isSet) {
                    if (this.operator === "$set" && this.value === null) return "required";
                    if (this.operator === "$unset") return "required";
                    if (this.operator === "$rename") return "required";
                }
            }
        }
    },
    startDate: {
        type: Date,
        optional: true,
        custom: function () {
            if (this.field('tripType').value == 'often') {
                // inserts
                if (!this.operator) {
                    if (!this.isSet || this.value === null) return "required";
                }
                // updates
                else if (this.isSet) {
                    if (this.operator === "$set" && this.value === null) return "required";
                    if (this.operator === "$unset") return "required";
                    if (this.operator === "$rename") return "required";
                }
            }
        }
    },
    endDate: {
        type: Date,
        optional: true,
        custom: function () {
            if (this.field('tripType').value == 'often') {
                // inserts
                if (!this.operator) {
                    if (!this.isSet || this.value === null) return "required";
                }
                // updates
                else if (this.isSet) {
                    if (this.operator === "$set" && this.value === null) return "required";
                    if (this.operator === "$unset") return "required";
                    if (this.operator === "$rename") return "required";
                }
            }
        }
    },
    "travelDaysInWeek": {
        type: Array,
        minCount: 7,
        maxCount: 7,
        optional: true,
        custom: function () {
            if (this.field('tripType').value == 'often') {
                // inserts
                if (!this.operator) {
                    if (!this.isSet || this.value === null) return "required";
                }
                // updates
                else if (this.isSet) {
                    if (this.operator === "$set" && this.value === null) return "required";
                    if (this.operator === "$unset") return "required";
                    if (this.operator === "$rename") return "required";
                }
                if (this.value.indexOf(true) == -1) {
                    return 'noTravelDaysInWeek'
                }
            }
        }
    },
    "travelDaysInWeek.$": {
        type: Boolean,
    },
    "returnDaysInWeek": {
        type: Array,
        minCount: 7,
        maxCount: 7,
        optional: true,
        custom: function () {
            if (this.field('isRoundTrip').value == true && this.field('tripType').value == 'often') {
                // inserts
                if (!this.operator) {
                    if (!this.isSet || this.value === null) return "required";
                }
                // updates
                else if (this.isSet) {
                    if (this.operator === "$set" && this.value === null) return "required";
                    if (this.operator === "$unset") return "required";
                    if (this.operator === "$rename") return "required";
                }
                if (this.value.indexOf(true) == -1) {
                    return 'noReturnDaysInWeek'
                }
            }
        }
    },
    "returnDaysInWeek.$": {
        type: Boolean,
    },
    distance: {
        type: Object,
        blackbox: true
    },
    duration: {
        type: Object,
        blackbox: true
    },
    vehicle: {
        type: String,
        allowedValues: ['Motor', 'Car'],
    },
    seats: {
        type: Number,
        min: 2
    },
    emptySeats: {
        type: Number,
        min: 1,
        custom: function () {
            if (this.value >= this.field('seats').value) {
                return 'emptySeaatsOverSeats';
            }
        }
    },
    pricePerSeat: {
        type: Number,
        decimal: true,
        min: 0
    },
    baggageSize: {
        type: String,
        allowedValues: ['Small', 'Medium', 'Large'],
    },
    flexibleTime: {
        type: Number,
        allowedValues: [0, 5, 10, 15, 30],
    },
    flexibleDistance: {
        type: String,
        allowedValues: ['Unacceptable', '3 kilometers', '5 kilometers', '10 kilometers', '15 kilometers'],
    },
    note: {
        type: String,
        optional: true
    },
    isExpired: {
        type: Boolean,
        optional: true,
        defaultValue: false
    },
});
TripsSchema.messages = {
    noTravelDaysInWeek: 'Select at least one day of the week to travel', // Must be between -90 and 90
    noReturnDaysInWeek: 'Select at least one day of the week to return', // Must be between -180 and 180
    emptySeatsOverSeats: '[label] must be less than seats value',
};
Trips.attachSchema(TripsSchema);