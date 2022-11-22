#!/bin/bash

set -e

SOURCE=""
DESTINATION=""
SYNC=""

YESTERDAY="$SYNC/$(date -d yesterday +%Y%m%d)"
TODAY="$SYNC/$(date +%Y%m%d)"

if [ -d "$YESTERDAY" ]
then
	OPTS="--link-dest $YESTERDAY"
else
  OPTS=""
fi

rsync -a --delete $OPTS "$SOURCE" "$TODAY"
