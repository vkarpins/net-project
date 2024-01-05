#!/bin/sh

echo "starting..."

cd /app/backend
./social-network-backend &
backend_pid=$!

cd /app/frontend
npm run dev &
frontend_pid=$!

wait $backend_pid
wait $frontend_pid

echo "done"
