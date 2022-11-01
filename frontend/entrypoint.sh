#!/bin/bash
echo "window.env = {API_URL: '${API_URL}'};" > build/env.js
exec "$@"