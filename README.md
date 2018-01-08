# Monster UI Call Center (Cloudbased Callcenter GUI)

#### Manual installation (to source files):
1. Upload files from directory `src` to directory with source files of your Monster UI (*near the folders "apps", "css" and "js"*)
2. Add next strings to `/src/js/main.js` after `paths: {`:
```javascript
    'datatables.net': 'js/vendor/datatables/jquery.dataTables.min',
    'datatables.net-bs': 'js/vendor/datatables/dataTables.bootstrap.min',
    'datatables.net-buttons': 'js/vendor/datatables/dataTables.buttons.min',
    'datatables.net-buttons-html5': 'js/vendor/datatables/buttons.html5.min',
    'datatables.net-buttons-bootstrap': 'js/vendor/datatables/buttons.bootstrap.min',
```
3. Register `recordings` app
4. Build your Monster UI with original builder (command `gulp`)
5. Activate the Callcenter app in Monster UI App Store ( `/#/apps/appstore` )

#### Manual installation (to compiled files):
1. Install dependencies
`npm install gulp && npm install gulp-sass && npm install gulp-clean`
2. Run builder
`gulp --gulpfile gulpfile-build-app.js`
3. Upload all folders and files from directory `dist` to root directory of your Monster UI (*near the folders "apps", "css" and "js"*)
4. Create next symbol links in root directory of Monster UI
```bash
# ln [options] <target file> [link name]
ln -s js/vendor/datatables/jquery.dataTables.min.js datatables.net.js
ln -s js/vendor/datatables/dataTables.bootstrap.min.js datatables.net-bs.js
ln -s js/vendor/datatables/dataTables.buttons.min.js datatables.net-buttons.js
ln -s js/vendor/datatables/buttons.html5.min.js datatables.net-buttons-html5.js
ln -s js/vendor/datatables/buttons.bootstrap.min.js datatables.net-buttons-bootstrap.js
```
4. Register `callcenter` app
5. Activate Callcenter app in the Monster UI App Store ( `/#/apps/appstore` )