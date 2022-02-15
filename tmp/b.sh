#!/bin/bash

curl -X post -d '{"id":"2073959","jsonrpc":"2.0","method":"transfer","params":{"id":"2073959","jsonrpc":"2.0","method":"transfer","params":{"destinations":[{"address":"Ssy2JfkPhZuWDydiLgsizRCMVST8fMv9rEN3j9r55YSebsMZkhwvZMMYyg6K1Aoc6DaVBWRqJcrV332GsPzyU4xh1JhwxPZcHp","amount":1000}],"ring_size":4,"do_not_relay":true}' -H 'content-type: application/json' http://192.168.152:8082/json_rpc
