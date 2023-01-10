#!/bin/bash
rm -rf "screenshots"
mkdir "screenshots"
x=1
for line in $(cat urls.txt)
do
    #echo "$line $x"
    node grab_url.js $x "$line"
    let "x += 1"
done
