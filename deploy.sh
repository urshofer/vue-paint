#!/usr/bin/env sh
# abort on errors
set -e
npm run build
cd dist
git init
git checkout -b master  # create master branch explicitly if not present
git add -A
git commit -m 'deploy'
git push -f git@github.com:urshofer/vue-paint.git master:gh-pages
cd -
