Trips = new Meteor.Collection("trips");
LocationSchema = new SimpleSchema({
    "type": {
        type: String,
        allowedValues: ["Point"]
    },
    "coordinates": {
        type: Array,
        minCount: 2,
        maxCount: 2
    },
    "coordinates.$": {
        type: Number,
        decimal: true,
        custom: function () {
            if (!(-90 <= this.value[0] <= 90))
                return "lonOutOfRange";
            if (!(-180 <= this.value[1] <= 180))
                return "latOutOfRange";
        }

    },
    "name": {
        type: String,
        optional: true
    }
});
LocationSchema.messages = {
    lonOutOfRange: 'Longitude out of range', // Must be between -90 and 90
    latOutOfRange: 'Latitude out of range' // Must be between -180 and 180
};
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
        type: String,
        allowedValues: ['On time', '+/- 5 minutes', '+/- 10 minutes', '+/- 15 minutes', '+/- 30 minutes'],
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
    isFreezing: {
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
        type: String,
        allowedValues: ['On time', '+/- 5 minutes', '+/- 10 minutes', '+/- 15 minutes', '+/- 30 minutes'],
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
    isFreezing: {
        type: Boolean,
        optional: true,
        defaultValue: false
    }
});
TripsSchema.messages = {
    noTravelDaysInWeek: 'Select at least one day of the week to travel', // Must be between -90 and 90
    noReturnDaysInWeek: 'Select at least one day of the week to return', // Must be between -180 and 180
    emptySeatsOverSeats: '[label] must be less than seats value',
};
Trips.attachSchema(TripsSchema);
SimpleSchema.messages({
    required: "[label] is required",
    minString: "[label] must be at least [min] characters",
    maxString: "[label] cannot exceed [max] characters",
    minNumber: "[label] must be at least [min]",
    maxNumber: "[label] cannot exceed [max]",
    minDate: "[label] must be on or after [min]",
    maxDate: "[label] cannot be after [max]",
    badDate: "[label] is not a valid date",
    minCount: "You must specify at least [minCount] values",
    maxCount: "You cannot specify more than [maxCount] values",
    noDecimal: "[label] must be an integer",
    notAllowed: "[value] is not an allowed value",
    expectedString: "[label] must be a string",
    expectedNumber: "[label] must be a number",
    expectedBoolean: "[label] must be a boolean",
    expectedArray: "[label] must be an array",
    expectedObject: "[label] must be an object",
    expectedConstructor: "[label] must be a [type]",
    regEx: [
        {msg: "[label] failed regular expression validation"},
        {exp: SimpleSchema.RegEx.Email, msg: "[label] must be a valid e-mail address"},
        {exp: SimpleSchema.RegEx.WeakEmail, msg: "[label] must be a valid e-mail address"},
        {exp: SimpleSchema.RegEx.Domain, msg: "[label] must be a valid domain"},
        {exp: SimpleSchema.RegEx.WeakDomain, msg: "[label] must be a valid domain"},
        {exp: SimpleSchema.RegEx.IP, msg: "[label] must be a valid IPv4 or IPv6 address"},
        {exp: SimpleSchema.RegEx.IPv4, msg: "[label] must be a valid IPv4 address"},
        {exp: SimpleSchema.RegEx.IPv6, msg: "[label] must be a valid IPv6 address"},
        {exp: SimpleSchema.RegEx.Url, msg: "[label] must be a valid URL"},
        {exp: SimpleSchema.RegEx.Id, msg: "[label] must be a valid alphanumeric ID"}
    ],
    keyNotInSchema: "[key] is not allowed by the schema"
});