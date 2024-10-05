#!/bin/bash
set -e

echo "Running migrations..."
npm run migration:run:prod

echo "Starting the application..."
node dist/main.js