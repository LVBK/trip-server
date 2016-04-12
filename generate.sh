cp -rf generator/component/ $1
mv $1/component $1/$2
mv $1/$2/both/collection/collection-name.js $1/$2/both/collection/$2.js
mv $1/$2/server/hook/hook-name.js $1/$2/server/hook/$2.js
mv $1/$2/server/method/method-name.js $1/$2/server/method/$2.js
mv $1/$2/server/permission/permission-name.js $1/$2/server/permission/$2.js
mv $1/$2/server/publish/publish-name.js $1/$2/server/publish/$2.js
mv $1/$2/server/startup/startup-name.js $1/$2/server/startup/$2.js