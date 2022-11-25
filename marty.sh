#!/bin/bash

find_backups_and_archives() {
  find -E $1 -maxdepth 1 -regex ".*[0-9]{14}(\.tar\.gz)?$"
}

find_backups() {
  find -E $1 -maxdepth 1 -type d -regex ".*/[0-9]{14}$"
}

find_latest_backup() {
  echo "$(find_backups $1 | sort -Vr | head -n 1)"
}

perform_sync() {
  local backup_dir=$(realpath $2)
  local latest_backup=$(find_latest_backup $backup_dir)
  local this_backup="$backup_dir/$(date +%Y%m%d%H%M%S)"
  local options=""
  if [ -n "$latest_backup" ]
  then
    options="--link-dest $latest_backup"
  fi
  rsync -a --delete $options "$(realpath $1)/" $this_backup
  echo $this_backup
}

check_input_dirs() {
  if ! [ -d $1 ]
  then
    echo "Source directory not found: $1"
    exit 1
  fi
  if ! [ -d $2 ]
  then
    echo "Destination directory not found: $2"
    exit 1
  fi
}

perform_backup() {
  check_input_dirs $1 $2
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
  tar -C $1 --hard-dereference -czf $archive_path .
}

perform_archive() {
  check_input_dirs $1 $2
  local this_backup=$(perform_sync $1 $2)
  create_archive $this_backup
  remove_path $this_backup
}

remove_old_backups() {
  local removal_cutoff_time=$(date -d "$2 days ago" +%Y%m%d%H%M%S)
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
  *)
    echo "Unknown command"
    ;;
esac
