#!/bin/bash

set -e

SOURCE=""
SYNC=""
DEST=""

DAYS=30

BACKUP_PREFIX=$(basename $SOURCE)

get_archive_path() {
  echo "$DEST/$BACKUP_PREFIX-$1.tar.gz"
}

get_sync_path() {
  echo "$SYNC/$BACKUP_PREFIX/$1"
}

remove_backup() {
  local archive_path=$(get_archive_path $1)
  local sync_path=$(get_sync_path $1)
  rm -rf $sync_path $archive_path &> /dev/null
}

remove_old_backups() {
  local removal_cutoff_date=$(date -d "$DAYS days ago" +%Y%m%d)
  local backup_dates=$(find -E $SYNC/$BACKUP_PREFIX -type d -regex ".*/[0-9]{8}" -exec bash -c 'basename "{}"' \;)
  for backup_date in $backup_dates
  do
    if [ $removal_cutoff_date -gt $backup_date ]
    then
      remove_backup $backup_date
    fi
  done
  unset backup_date
}

perform_archive() {
  local archive_path=$(get_archive_path $1)
  local sync_path=$(get_sync_path $1)
  mkdir -p $DEST
  tar -C $sync_path -czf $archive_path .
}

perform_sync() {
  local yesterday=$(get_sync_path $(date -d yesterday +%Y%m%d))
  local today=$(get_sync_path $1)
  local options=""
  if [ -d "$yesterday" ]
  then
    options="--link-dest $yesterday"
  fi
  mkdir -p $today
  rsync -a --delete $options "$(realpath $SOURCE)/" $today
}

perform_backup() {
  local today=$(date +%Y%m%d)
  perform_sync $today
  perform_archive $today
}

perform_backup
remove_old_backups
