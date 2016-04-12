Images = new FS.Collection("images", {
    stores: [
        new FS.Store.FileSystem("original"),
        new FS.Store.FileSystem("thumbnail", {
            transformWrite: function (fileObj, readStream, writeStream) {
                var size = '100';
                gm(readStream).autoOrient().resize(size, size + '^')
                    .gravity('Center').extent(size, size).stream('PNG').pipe(writeStream)
            }
        })
    ],
    filter: {
        allow: {
            contentTypes: ['image/*']
        }
    }
});