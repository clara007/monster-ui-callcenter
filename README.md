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
        'queue_eavesdrop':    { 'verb': 'PUT', 'url': 'accounts/{accountId}/queues/{queueId}/eavesdrop' },
        'call_eavesdrop': { 'verb': 'PUT', 'url': 'accounts/{accountId}/queues/eavesdrop' },
        'queues_livestats': { 'verb': 'GET', 'url': 'accounts/{accountId}/queues/stats' },
        'queues_stats': { 'verb': 'GET', 'url': 'accounts/{accountId}/queues/stats' },
        'queues_list': { 'verb': 'GET', 'url': 'accounts/{accountId}/queues' },
        'queues_get': { 'verb': 'GET', 'url': 'accounts/{accountId}/queues/{queuesId}' },
        'queues_create': { 'verb': 'PUT', 'url': 'accounts/{accountId}/queues' },
        'queues_update': { 'verb': 'POST', 'url': 'accounts/{accountId}/queues/{queuesId}' },
        'queues_delete': { 'verb': 'DELETE', 'url': 'accounts/{accountId}/queues/{queuesId}' },
        'queues_stats_loading': { 'verb': 'GET', 'url': 'accounts/{accountId}/queues/stats' },
        'queues.list_loading': { 'verb': 'GET', 'url': 'accounts/{accountId}/queues' },
        'queues.livestats_loading': { 'verb': 'GET', 'url': 'accounts/{accountId}/queues/stats' }
        },
    agents: {
        'agents_livestats': { 'verb': 'GET', 'url': 'accounts/{accountId}/agents/stats' },
        'agents_status': { 'verb': 'GET', 'url': 'accounts/{accountId}/agents/status' },
        'agents_toggle': { 'verb': 'POST', 'url': 'accounts/{accountId}/agents/{agentId}/status' },
        'agents_stats': { 'verb': 'GET', 'url': 'accounts/{accountId}/agents/stats' },
        'agents_list': { 'verb': 'GET', 'url': 'accounts/{accountId}/agents' },
        'agents_update': { 'verb': 'POST', 'url': 'accounts/{accountId}/queues/{queuesId}/roster' },
        'agents_status_loading': { 'verb': 'GET', 'url': 'accounts/{accountId}/agents/status' },
        'agents_list_loading': { 'verb': 'GET', 'url': 'accounts/{accountId}/agents' },
        'agents_livestats_loading': { 'verb': 'GET', 'url': 'accounts/{accountId}/agents/stats' }
    },
```
