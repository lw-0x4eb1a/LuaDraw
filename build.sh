npm run build
mkdir temp
mkdir temp/assets

mv dist/index.html temp
mv dist/assets/index* temp/assets
mv dist/assets/*ttf temp/assets
mv dist/assets/lua* temp/assets

rm -rf dist
mv temp dist
