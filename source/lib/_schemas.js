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