#!/bin/bash
DES='.client-build/meteor-client-all-packages.js'
DES_MIN='.client-build/meteor-client-all-packages.min.js'
mkdir -p '.client-build'

build_dev(){
	FILEPATH='.meteor/local/build/programs/web.browser'
	ALL="$FILEPATH/program.json"
	echo "" > $DES
	while IFS='' read -r line || [[ -n "$line" ]]; do
	    re='"path": "packages/([a-zA-Z0-9\_\-]+).js",'
	    if [[ $line =~ $re ]]; then
	    	PACK="${BASH_REMATCH[1]}"
	    	#if [[ " ${UNIQUE_ALL_PACK[*]} " == *" $PACK "* ]]; then
	    	if [[ "$PACK" != "autoupdate" ]]; then #not include autoupdate package
			    IN_FILE=$PACK.js
	        	echo $FILEPATH/packages/$IN_FILE;
	        	cat $FILEPATH/packages/$IN_FILE >> $DES
			fi
	    fi
	done < "$ALL"
	#remove autoupdate in global
	sed -i '/Autoupdate\ =\ Package\.autoupdate\.Autoupdate\;/d' $DES

	echo "You build file in:"
	echo "   $DES"
}

build(){
	if hash uglifyjs 2>/dev/null; then
	    BUILD_DEV=`build_dev`
	    uglifyjs $DES -o $DES_MIN
        echo "You build file in:"
        echo "   $DES_MIN"
	else
	    echo "You need install uglifyjs by run below command before build"
	    echo "  sudo npm install -g uglify-js  "
	fi
}


ACTION="build"
if [ "$#" -gt 0 ]; then
    ACTION="$1"
fi

$ACTION
