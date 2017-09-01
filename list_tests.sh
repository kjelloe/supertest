#!/bin/bash
grep -ri -e "it(\"\(.*\)\"," -e "it('\(.*\)'," testpackages/**/*.js -C0 -o | sed -e "s/(./ /g" | sed -e "s/', *$/ /g" -e "s/\", *$/ /g" 
