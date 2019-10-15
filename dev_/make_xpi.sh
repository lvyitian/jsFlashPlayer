#!/bin/bash

zip="$1"

if [ "$zip" == "" ] ; then
    zip="../storage/shared/web_ext/flash.xpi"
fi

zip -r9 "$zip" . -x .hg/**\* -x .hgignore -x _dev/**\*
