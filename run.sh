#!/bin/bash

trap './final' SIGINT

killall pipewire
killall flask
export FLASK_APP=final.py
nohup flask run --port=9003 > /dev/null 2>&1 &
xdg-open "http://127.0.0.1:9003" &
./final 

