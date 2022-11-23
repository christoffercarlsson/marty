#!/bin/bash

if ! [ -d $1 ]
then
  echo "Source directory not found."
  exit 1
fi
if [ -z "$2" ]
then
  echo "No backup directory given."
  exit 1
fi

mkdir -p $2 &> /dev/null

if ! [ -d $2 ]
then
  echo "Failed to create backup directory."
  exit 1
fi

SOURCE=$(realpath $1)
DEST=$(realpath $2)

DAYS=30

BACKUP_PREFIX=$(basename $SOURCE)
BACKUP_PATH="$DEST/$BACKUP_PREFIX"

get_archive_path() {
  echo "$BACKUP_PATH-$1.tar.gz"
}

get_sync_path() {
  echo "$BACKUP_PATH/$1"
}

remove_backup() {
  local archive_path=$(get_archive_path $1)
  local sync_path=$(get_sync_path $1)
  rm -rf $sync_path $archive_path &> /dev/null
}

remove_old_backups() {
  local removal_cutoff_date=$(date -d "$DAYS days ago" +%Y%m%d)
  local backup_dates=$(find -E $BACKUP_PATH -type d -regex ".*/[0-9]{8}" -exec bash -c 'basename "{}"' \;)
  for backup_date in $backup_dates
  do
    if [ $removal_cutoff_date -gt $backup_date ]
    then
      remove_backup $backup_date
    fi
  done
}

create_archive() {
  local archive_path=$(get_archive_path $1)
  local sync_path=$(get_sync_path $1)
  tar -C $sync_path --hard-dereference -czf $archive_path .
}

perform_sync() {
  local yesterday=$(get_sync_path $(date -d yesterday +%Y%m%d))
  local today=$(get_sync_path $1)
  local options=""
  if [ -d $yesterday ]
  then
    options="--link-dest $yesterday"
  fi
  mkdir -p $today
  rsync -a --delete $options "$SOURCE/" $today
}

perform_backup() {
  local today=$(date +%Y%m%d)
  perform_sync $today
  create_archive $today
}

perform_backup
remove_old_backups
