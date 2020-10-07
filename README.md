# monster-ui-callcenter
Fixed Callcenter app for ACDC in Monster UI v.4.3 to allow you to customize routing calls.

Requires Monster UI v.4.3

Manual installation (to compiled files):
Upload all folders and files from directory src to root directory of your Monster UI (near the folders "apps", "css" and "js")
Create next symbol links in root directory of Monster UI
# ln [options] <target file> [link name]
ln -s js/vendor/datatables/jquery.dataTables.min.js datatables.net.js
ln -s js/vendor/datatables/dataTables.bootstrap.min.js datatables.net-bs.js
ln -s js/vendor/datatables/dataTables.buttons.min.js datatables.net-buttons.js
ln -s js/vendor/datatables/buttons.html5.min.js datatables.net-buttons-html5.js
ln -s js/vendor/datatables/buttons.bootstrap.min.js datatables.net-buttons-bootstrap.js
Register the callcenter app
# sup crossbar_maintenance init_app PATH_TO_CALLCENTER_DIRECTORY API_ROOT
# Load the callcenter app in the database
sup crossbar_maintenance init_app /var/www/html/monster-ui/dist/apps/callcenter https://site.com:8443/v2/
Activate Callcenter app in the Monster UI App Store ( /#/apps/appstore )
