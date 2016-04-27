insertRoadMapAsync = function (userId, tripId, origin, destination, date, time, slots, callback) {
    try {
        date.setHours(time.getHours());
        date.setMinutes(time.getMinutes());
        date.setMilliseconds(0);
        date.setSeconds(0);
        var roadMap = {
            owner: userId,
            tripId: tripId,
            origin: origin,
            destination: destination,
            startAt: date,
            slots: slots
        };
        RoadMaps.insert(roadMap, function (err, result) {
            if (err) {
                callback(err);
            } else {
                callback(false, result);
            }
        });
    } catch (err) {
        console.log("insertRoadMapAsync", err);
        callback(err);
    }
};