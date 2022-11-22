#!/bin/bash

set -e

SOURCE=""
DEST=""

DAYS=30

remove_old_backups() {
  local removal_cutoff_date=$(date -d "$DAYS days ago" +%Y%m%d)
  local backup_dates=$(find -E $DEST -type d -regex ".*/[0-9]{8}" -exec bash -c 'basename "{}"' \;)
  for backup_date in $backup_dates
  do
    if [ $removal_cutoff_date -gt $backup_date ]
    then
      rm -rf $(realpath "$DEST/$backup_date")
    fi
  done
  unset backup_date
}

perform_backup() {
  local yesterday="$DEST/$(date -d yesterday +%Y%m%d)"
  local today="$DEST/$(date +%Y%m%d)"
  local options=""
  if [ -d "$yesterday" ]
  then
    options="--link-dest $yesterday"
  fi
  rsync -a --delete $options "$SOURCE" "$today"
}

remove_old_backups
perform_backup
