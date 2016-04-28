RoadMaps = new Meteor.Collection("roadMaps");
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
RoadMapsSchema = new SimpleSchema({
    owner: {
      type: String
    },
    tripId: {
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
    startAt: {
        type: Date
    },
    slots: {
        type: Array
    },
    'slots.$': {
        type: String
    },
    seats: {
        type: Number,
        min: 2
    },
    acceptingReservations: {
        type: Array,
        optional: true
    },
    'acceptingReservations.$': {
        type: String
    }
})
RoadMaps.attachSchema(RoadMapsSchema);