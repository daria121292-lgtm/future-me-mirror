#!/bin/bash
cd "$(dirname "$0")"
python3 -m http.server 8765 &
SERVER_PID=$!
sleep 1
open "http://localhost:8765/Mirror%20Scene%20v2.html"
echo ""
echo "✅ Приложение открыто в браузере!"
echo "⚠️  Не закрывай это окно пока работаешь с приложением."
echo "   Когда закончишь — закрой это окно."
echo ""
wait $SERVER_PID
