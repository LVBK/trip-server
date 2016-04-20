insertRoadMapAsync = function (tripId, origin, destination, date, time, callback) {
    try {
        date.setHours(time.getHours());
        date.setMinutes(time.getMinutes());
        date.setMilliseconds(0);
        date.setSeconds(0);
        var roadMap = {
            tripId: tripId,
            origin: origin,
            destination: destination,
            startAt: date,
        };
        console.log("Road map", roadMap);
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
}