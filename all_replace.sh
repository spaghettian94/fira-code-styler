#!/bin/bash

while read -d $'\0' file; do
    if [[ $file =~ ^.*\.ttx$ ]]; then
        rm $file
    fi
done < <(find ./sources -mindepth 1 -maxdepth 1 -print0)

while read -d $'\0' file; do
    if [[ $file =~ ^.*\.otf$ ]]; then :; else
        continue
    fi
    node ./replace_stylistic.js $file
done < <(find ./sources -mindepth 1 -maxdepth 1 -print0)
