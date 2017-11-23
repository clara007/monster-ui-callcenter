# monster-ui-callcenter (Cloudbased Callcenter GUI)
![callcenter](https://raw.githubusercontent.com/urueedi/monster-ui-callcenter/master/metadata/screenshots/callcenter_1.png)
![callcenter](https://raw.githubusercontent.com/urueedi/monster-ui-callcenter/master/metadata/screenshots/callcenter_2.png)
![callcenter](https://raw.githubusercontent.com/urueedi/monster-ui-callcenter/master/metadata/screenshots/callcenter_3.png)
![callcenter](https://raw.githubusercontent.com/urueedi/monster-ui-callcenter/master/metadata/screenshots/callcenter_4.png)

If you need ACD support for kazoo like additional strategy, monster-ui support and so, please ask for support from below

Additional Support
------------------
Open Phone Net AG infos@openent.ch Switzerland

Manual installation (to source files):
------------------
1. Copy app files and folders to `/src/apps/callcenter` directory of Monster UI
2. Add files to `/src/js/vendor/datatables`
- buttons.bootstrap.min.js
- buttons.html5.min.js
- dataTables.bootstrap.min.js
- dataTables.buttons.min.js
- jquery.dataTables.min.js
3. Add file `jquery.dataTables.css` to `/src/css/vendor/jquery/`
4. Add next strings to `/src/js/main.js` after `paths: {`:
```javascript
    'datatables.net': 'js/vendor/datatables/jquery.dataTables.min',
    'datatables.net-bs': 'js/vendor/datatables/dataTables.bootstrap.min',
    'datatables.net-buttons': 'js/vendor/datatables/dataTables.buttons.min',
    'datatables.net-buttons-html5': 'js/vendor/datatables/buttons.html5.min',
    'datatables.net-buttons-bootstrap': 'js/vendor/datatables/buttons.bootstrap.min',
```

Manual installation (to compiled files):
------------------
1. Upload files from directory `src` to root directory of your Monster UI (*near the folders "apps", "css" and "js"*)
2. Create next symbol links in root directory
```bash
# ln [options] <target file> [link name]
ln -s /var/www/html/monster-ui/js/vendor/datatables/jquery.dataTables.min.js /var/www/html/monster-ui/datatables.net.js
ln -s /var/www/html/monster-ui/js/vendor/datatables/dataTables.bootstrap.min.js /var/www/html/monster-ui/datatables.net-bs.js
ln -s /var/www/html/monster-ui/js/vendor/datatables/dataTables.buttons.min.js /var/www/html/monster-ui/datatables.net-buttons.js
ln -s /var/www/html/monster-ui/js/vendor/datatables/buttons.html5.min.js /var/www/html/monster-ui/datatables.net-buttons-html5.js
ln -s /var/www/html/monster-ui/js/vendor/datatables/buttons.bootstrap.min.js /var/www/html/monster-ui/datatables.net-buttons-bootstrap.js
```
3. Register `callcenter` app
5. Activate the Callcenter app in Monster UI App Store ( `/#/apps/appstore` )