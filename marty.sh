#!/bin/bash

DATE_CMD="date"
TAR_CMD="tar --hard-dereference"

if [[ "$(uname)" == "Darwin" ]]
then
  DATE_CMD="gdate"
  TAR_CMD="tar"
fi

cmd_exists() {
  command -v $1 &> /dev/null
}

ensure_cmd() {
  if ! cmd_exists $1
  then
    echo "Command not found: $1"
    exit 1
  fi
}

ensure_cmd $DATE_CMD
ensure_cmd $TAR_CMD

find_backups_and_archives() {
  find -E $1 -maxdepth 1 -regex ".*[0-9]{14}(\.tar\.gz)?$"
}

find_backups() {
  find -E $1 -maxdepth 1 -type d -regex ".*/[0-9]{14}$"
}

find_latest_backup() {
  find_backups $1 | sort -Vr | head -n 1
}

sync_dirs() {
  rsync -a --delete $3 "$(realpath $1)/" $2
}

ensure_dir() {
  if ! [ -d $1 ]
  then
    echo "Directory not found: $1"
    exit 1
  fi
}

restore_backup() {
  ensure_dir $1
  ensure_dir $2
  sync_dirs "$1" "$2"
}

perform_sync() {
  local backup_dir=$(realpath $2)
  local latest_backup=$(find_latest_backup $backup_dir)
  local this_backup="$backup_dir/$($DATE_CMD +%Y%m%d%H%M%S)"
  local sync_options=""
  if [ -n "$latest_backup" ]
  then
    sync_options="--link-dest $latest_backup"
  fi
  sync_dirs "$1" "$this_backup" "$sync_options"
  echo $this_backup
}

perform_backup() {
  ensure_dir $1
  ensure_dir $2
  perform_sync $1 $2 &> /dev/null
}

remove_path() {
  rm -rf $1 &> /dev/null
}

create_archive() {
  local backup_time=$(basename $1)
  local backup_dir=$(dirname $1)
  local backup_name=$(basename $backup_dir)
  local archive_path="$backup_dir/$backup_name-$backup_time.tar.gz"
  $TAR_CMD -C $1 -czf $archive_path .
}

perform_archive() {
  ensure_dir $1
  ensure_dir $2
  local this_backup=$(perform_sync $1 $2)
  create_archive $this_backup
  remove_path $this_backup
}

remove_old_backups() {
  ensure_dir $1
  local removal_cutoff_time=$($DATE_CMD -d "$2 days ago" +%Y%m%d%H%M%S)
  local paths=$(find_backups_and_archives $1)
  for path in $paths
  do
    if [[ $path =~ ([0-9]{14}) ]]
    then 
      [ $removal_cutoff_time -ge ${BASH_REMATCH[1]} ] && remove_path $path
    fi
  done
}

case "$1" in
  "archive")
    perform_archive $2 $3
    ;;
  "backup")
    perform_backup $2 $3
    ;;
  "clean" | "clean-up" | "prune" | "remove")
    remove_old_backups $2 $3
    ;;
  "restore")
    restore_backup $2 $3
    ;;
  *)
    echo "Unknown command"
    ;;
esac
