# monster-ui-callcenter (Cloudbased Callcenter GUI)
![callcenter](https://raw.githubusercontent.com/urueedi/monster-ui-callcenter/master/metadata/screenshots/callcenter_1.png)
![callcenter](https://raw.githubusercontent.com/urueedi/monster-ui-callcenter/master/metadata/screenshots/callcenter_2.png)
![callcenter](https://raw.githubusercontent.com/urueedi/monster-ui-callcenter/master/metadata/screenshots/callcenter_3.png)
![callcenter](https://raw.githubusercontent.com/urueedi/monster-ui-callcenter/master/metadata/screenshots/callcenter_4.png)

If you need ACD support for kazoo like additional strategy, monster-ui support and so, please ask for support from below

Additional Support
------------------
Open Phone Net AG infos@openent.ch Switzerland

Installation
------------------
1. Copy app files and folders to `/src/apps/callcenter` directory of Monster UI
2. Add next strings to `js/lib/jquery.kazoosdk.js` after string `methodsGenerator = {`
```javascript
    queues: {
        'queue_eavesdrop': { 'verb': 'PUT', 'url': 'accounts/{accountId}/queues/{queueId}/eavesdrop' },
        'call_eavesdrop':  { 'verb': 'PUT', 'url': 'accounts/{accountId}/queues/eavesdrop' },
        'queues_list':     { 'verb': 'GET', 'url': 'accounts/{accountId}/queues' },
        'queues_create':   { 'verb': 'PUT', 'url': 'accounts/{accountId}/queues' },
        'queues_get':      { 'verb': 'GET', 'url': 'accounts/{accountId}/queues/{queuesId}' },
        'queues_update':   { 'verb': 'POST', 'url': 'accounts/{accountId}/queues/{queuesId}' },
        'queues_delete':   { 'verb': 'DELETE', 'url': 'accounts/{accountId}/queues/{queuesId}' },
        'queues_stats':    { 'verb': 'GET', 'url': 'accounts/{accountId}/queues/stats' }
        },
    agents: {
        'agents_stats':    { 'verb': 'GET', 'url': 'accounts/{accountId}/agents/stats' },
        'agents_status':   { 'verb': 'GET', 'url': 'accounts/{accountId}/agents/status' },
        'agents_toggle':   { 'verb': 'POST', 'url': 'accounts/{accountId}/agents/{agentId}/status' },
        'agents_list':     { 'verb': 'GET', 'url': 'accounts/{accountId}/agents' },
        'agents_update':   { 'verb': 'POST', 'url': 'accounts/{accountId}/queues/{queuesId}/roster' }
    },
```
3. Add files to `/src/js/vendor/datatables`
- buttons.bootstrap.min.js
- buttons.html5.min.js
- dataTables.bootstrap.min.js
- dataTables.buttons.min.js
- jquery.dataTables.min.js
4. Add file `jquery.dataTables.css` to `/src/css/vendor/jquery/`
5. Add next strings to `/src/js/main.js` after `paths: {`:
```javascript
    'datatables.net': 'js/vendor/datatables/jquery.dataTables.min',
    'datatables.net-bs': 'js/vendor/datatables/dataTables.bootstrap.min',
    'datatables.net-buttons': 'js/vendor/datatables/dataTables.buttons.min',
    'datatables.net-buttons-html5': 'js/vendor/datatables/buttons.html5.min',
    'datatables.net-buttons-bootstrap': 'js/vendor/datatables/buttons.bootstrap.min',
```

