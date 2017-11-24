# Monster UI Call Center (Cloudbased Callcenter GUI)

Manual installation (to source files):
------------------
1. Merge `src` directory of this app with `src` directory of your Monster UI source files
2. Add next strings to `/src/js/main.js` after `paths: {`:
```javascript
    'datatables.net': 'js/vendor/datatables/jquery.dataTables.min',
    'datatables.net-bs': 'js/vendor/datatables/dataTables.bootstrap.min',
    'datatables.net-buttons': 'js/vendor/datatables/dataTables.buttons.min',
    'datatables.net-buttons-html5': 'js/vendor/datatables/buttons.html5.min',
    'datatables.net-buttons-bootstrap': 'js/vendor/datatables/buttons.bootstrap.min',
```
3. Build your Monster UI with original gulp-file, type command `gulp`
4. Register `callcenter` app
5. Activate the Callcenter app in Monster UI App Store ( `/#/apps/appstore` )

Manual installation (to compiled files):
------------------
1. Build app with original gulp-builder of Monster UI (2600hz)
2. Upload files from directory `dist` to root directory of your Monster UI (*near the folders "apps", "css" and "js"*)
3. Create next symbol links in root directory of your site
```bash
# ln [options] <target file> [link name]
ln -s /var/www/html/monster-ui/js/vendor/datatables/jquery.dataTables.min.js /var/www/html/monster-ui/datatables.net.js
ln -s /var/www/html/monster-ui/js/vendor/datatables/dataTables.bootstrap.min.js /var/www/html/monster-ui/datatables.net-bs.js
ln -s /var/www/html/monster-ui/js/vendor/datatables/dataTables.buttons.min.js /var/www/html/monster-ui/datatables.net-buttons.js
ln -s /var/www/html/monster-ui/js/vendor/datatables/buttons.html5.min.js /var/www/html/monster-ui/datatables.net-buttons-html5.js
ln -s /var/www/html/monster-ui/js/vendor/datatables/buttons.bootstrap.min.js /var/www/html/monster-ui/datatables.net-buttons-bootstrap.js
```
4. Register `callcenter` app
5. Activate the Callcenter app in Monster UI App Store ( `/#/apps/appstore` )