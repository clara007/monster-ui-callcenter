define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	require([
		'datatables.net',
		'datatables.net-bs',
		'datatables.net-buttons',
		'datatables.net-buttons-html5',
		'datatables.net-buttons-bootstrap'
	]);

var app = {
	name: 'callcenter',

	css: [ 'app', 'icons' ],

	i18n: {
		'en-US': { customCss: false },
		'de-DE': { customCss: false },
		'dk-DK': { customCss: false },
		'it-IT': { customCss: false },
		'fr-FR': { customCss: false },
		'nl-NL': { customCss: false },
		'ro-RO': { customCss: false },
		'ru-RU': { customCss: false },
		'pt-PT': { customCss: false },
		'zh-CN': { customCss: false },
		'es-ES': { customCss: false }
	},

	requests: {
		/* move here all unstandart request

		'google.getUser': {
			apiRoot: 'http://api.google.com/',
			url: 'users',
			verb: 'PUT'
		}*/
	},

	load: function(callback){
		var self = this;

		self.initApp(function() {
			callback && callback(self);
		});
	},

	global_timer: false,
	current_queue_id: undefined,
	hide_logout: false,
	map_timers: {
		calls_waiting: {},
		calls_in_progress: {}
	},

	vars: {
		users: []
	},

	initApp: function(callback) {
		var self = this;

		monster.pub('auth.initApp', {
			app: self,
			callback: callback
		});

		self.initHandlebarsHelpers();
	},

	initHandlebarsHelpers: function() {
		Handlebars.registerHelper('inc', function(value, options) {
			return parseInt(value) + 1;
		});

		Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
			var operators, result;

			if (arguments.length < 3) {
				throw new Error('Handlerbars Helper \'compare\' needs 2 parameters');
			}

			if (options === undefined) {
				options = rvalue;
				rvalue = operator;
				operator = '===';
			}

			operators = {
				'==': function (l, r) { return l == r; },
				'===': function (l, r) { return l === r; },
				'!=': function (l, r) { return l != r; },
				'!==': function (l, r) { return l !== r; },
				'<': function (l, r) { return l < r; },
				'>': function (l, r) { return l > r; },
				'<=': function (l, r) { return l <= r; },
				'>=': function (l, r) { return l >= r; },
				'typeof': function (l, r) { return typeof l == r; }
			};

			if (!operators[operator]) {
				throw new Error('Handlerbars Helper \'compare\' doesn\'t know the operator ' + operator);
			}

			result = operators[operator](lvalue, rvalue);

			if (result) {
				return options.fn(this);
			} else {
				return options.inverse(this);
			}

		});
	},

	queue_eavesdrop: function (callback) {
		var self = this;

		self.callApi({
			resource: 'queues.queue_eavesdrop',
			data: {
				accountId: self.accountId
			},
			success: function (queue_eavesdrop) {
				callback(queue_eavesdrop.data);
			}
		});
	},
/*	listDevices: function (callback) {
		var self = this;

		self.callApi({
			resource: 'device.list',
			data: {
				accountId: self.accountId
			},
			success: function (devices) {
				callback(devices.data);
			}
		});
	},*/

	poll_agents: function (global_data, _container) {
		var self = this,
			container = _container,
			polling_interval = 6,
			map_agents = {},
			cpt = 0,
			current_queue,
			current_global_data = global_data,
			stop_light_polling = false,
			poll = function () {
				var data_template = $.extend(true, {}, {
					agents: current_global_data.agents,
					queues: current_global_data.queues
				}); //copy without reference;
				if (stop_light_polling === false) {
					monster.parallel(
						{
							queues_livestats: function (callback) {
								self.get_queues_livestats(function (_data_live_queues) {
									callback(null, _data_live_queues);
								});
							},
							agents_livestats: function (callback) {
								self.get_agents_livestats(function (_data_live_agents) {
									callback(null, _data_live_agents);
								});
							},
							agents_status: function (callback) {
								self.get_agents_status(function (_data_live_status) {
										callback(null, _data_live_status);
									},
									function (_data_live_status) {
										callback(null, {});
									}
								);
							}
						},
						function (err, results) {
							data_template = self.format_live_data(data_template, {
								agents_live_stats: results.agents_livestats,
								queues_live_stats: results.queues_livestats,
								agents_live_status: results.agents_status
							});
						}
					);
				}
			},
			huge_poll = function () {
				if ($('#dashboard-content').size() === 0) {
					self.clean_timers();
				}
				else {
					if (++cpt % 30 === 0) {
						self.fetch_all_data(function (data) {
							current_global_data = data;
						});
					}
					else {
						poll();
					}
				}
			};

		$.each(global_data.agents, function (k, v) {
			map_agents[v.id] = 'logged_out';
		});

		self.global_timer = setInterval(huge_poll, polling_interval * 1000);
	},

	get_queues_livestats: function (callback) {
		var self = this;

		self.callApi({
			resource: 'queues.queues_livestats',
			data: {
				accountId: self.accountId
			},
			success: function (queue_livestats) {
				callback(queue_livestats.data);
			}
		});
	},

	get_agents_status: function (callback) {
		var self = this;

		self.callApi({
			resource: 'agents.agents_status',
			data: {
				accountId: self.accountId
			},
			success: function (agents_status) {
				callback(agents_status.data);
			}
		});
	},

	get_agents_livestats: function (callback) {
		var self = this;

		self.callApi({
			resource: 'agents.agents_livestats',
			data: {
				accountId: self.accountId
			},
			success: function (agents_livestats) {
				callback(agents_livestats.data);
			}
		});
	},

	get_agents_stats: function (callback) {
		var self = this;

		self.callApi({
			resource: 'agents.agents_status',
			data: {
				accountId: self.accountId
			},
			success: function (agents_status) {
				callback(agents_status.data);
			}
		});
	},

	/*get_queues_stats: function (callback) {
		var self = this;

		self.callApi({
			resource: 'queues.queues_stats',
			data: {
				accountId: self.accountId
			},
			success: function (queues_stats) {
				callback(queues_stats.data);
			}
		});
	},*/

	get_queues: function (callback) {
		var self = this;

		self.callApi({
			resource: 'queues.queues_list',
			data: {
				accountId: self.accountId
			},
			success: function (data) {
				callback && callback(data.data);
			}
		});
	},

	get_agents: function (callback) {
		var self = this;

		self.callApi({
			resource: 'agents.agents_list',
			data: {
				accountId: self.accountId
			},
			success: function (agents) {
				callback(agents.data);
			}
		});
	},

	/*render_callwaiting_list: function (_container) {
		var self = this,
			container = _container || $('#dashboard-content');

		$('#callwaiting-list', container).empty().listpanel({
			label: 'Call Waiting',
			identifier: 'callwaiting-listview',
			data: []
		});
		$('.add_flow', container).empty().html('call_waiting_log');
	},*/

	get_time_seconds: function (seconds) {
		var seconds = Math.floor(seconds),
			hours = Math.floor(seconds / 3600),
			minutes = Math.floor(seconds / 60) % 60,
			remaining_seconds = seconds % 60,
			display_time = (hours < 10 ? '0' + hours : '' + hours) + ':' + (minutes < 10 ? '0' + minutes : '' + minutes) + ':' + (remaining_seconds < 10 ? '0' + remaining_seconds : '' + remaining_seconds);

		return seconds >= 0 ? display_time : '00:00:00';
	},


	format_live_data: function (formatted_data, data) {
		var self = this,

			current_agents_by_queue = {};
		formatted_data.current_timestamp = data.queues_live_stats.current_timestamp;
		formatted_data.calls_waiting = {};
		formatted_data.calls_in_progress = {};
		formatted_data.agent_status = {
			busy: {},
			wrapup: {},
			paused: {}
		};

		//Reinitializing previous data;
		$.each(formatted_data.queues, function (k, queue) {
			queue.abandoned_calls = 0;
			queue.average_hold_time = self.get_time_seconds(0);
			queue.current_calls = 0;
			queue.total_calls = 0;
			queue.total_wait_time = 0;
		});

		if(data.agents_live_status) {
			$.each(data.agents_live_status, function(k, agent_status) {
				if(k in formatted_data.agents) {
					if(agent_status.status === 'outbound') {
						agent_status.status = 'busy';
					}

					if(agent_status.status === 'connected') {
						agent_status.status = 'handling';
					}

					var current_status = agent_status.status;

					formatted_data.agents[k].status = current_status;
					formatted_data.agents[k].status_started = agent_status.timestamp;

					if($.inArray(current_status, ['busy', 'wrapup', 'paused']) >= 0) {
						formatted_data.agent_status[current_status][k] = agent_status;

						if(current_status === 'busy') {
							formatted_data.agents[k].call_time = self.get_time_seconds(formatted_data.current_timestamp - agent_status.timestamp)
						}
						else if(current_status === 'paused') {
							if('pause_time' in agent_status) {
								formatted_data.agents[k].call_time = self.get_time_seconds(agent_status.pause_time - (formatted_data.current_timestamp - agent_status.timestamp))
							}
							else {
								formatted_data.agents[k].call_time = self.get_time_seconds(formatted_data.current_timestamp - agent_status.timestamp)
							}
						}
						else {
							formatted_data.agents[k].call_time = self.get_time_seconds(agent_status.wait_time  - (formatted_data.current_timestamp - agent_status.timestamp));
						}
					}
					else if(current_status === 'connecting') {
						formatted_data.agents[k].current_call = { friendly_title: agent_status.caller_id_name || agent_status.caller_id_number || agent_status.call_id };
					}

					if(current_status !== 'logged_out') {
						$.each(formatted_data.agents[k].queues_list, function(queue_id, queue_data) {
							if(!(queue_id in current_agents_by_queue)) {
								current_agents_by_queue[queue_id] = 1;
							}
							else {
								current_agents_by_queue[queue_id]++;
							}
						});
					}
				}
			});
		}

		$.each(current_agents_by_queue, function(queue_id, count) {
			if(queue_id in formatted_data.queues) {
				formatted_data.queues[queue_id].current_agents = count || 0;
			}
		});

		$.each(data.agents_live_stats, function(k, agent_stats) {
			if(k in formatted_data.agents) {
				formatted_data.agents[k].missed_calls = agent_stats.missed_calls || 0;
				formatted_data.agents[k].total_calls = agent_stats.total_calls || 0;

				if('queues' in agent_stats) {
					$.each(agent_stats.queues, function(queue_id, queue_stat) {
						if(queue_id in formatted_data.agents[k].queues_list) {
							formatted_data.agents[k].queues_list[queue_id] = {
								id: queue_id || '',
								missed_calls: queue_stat.missed_calls || 0,
								total_calls: queue_stat.total_calls || 0
							};
						}
					});
				}
			}
		});

		if('stats' in data.queues_live_stats) {
			$.each(data.queues_live_stats.stats, function(index, queue_stats) {
				var k = queue_stats.queue_id,
					call_id = queue_stats.call_id;

				if(typeof formatted_data.queues[k] == "object") {
					formatted_data.queues[k].current_calls = formatted_data.queues[k].current_calls || 0;

				if('wait_time' in queue_stats && queue_stats.status !== 'abandoned') {
					formatted_data.queues[k].total_wait_time += queue_stats.wait_time;
				}

				if(queue_stats.status === 'abandoned') {
					formatted_data.queues[k].abandoned_calls++;
					formatted_data.queues[k].total_calls++;
				}
				else if(queue_stats.status === 'waiting') {
					formatted_data.calls_waiting[call_id] = queue_stats;
					formatted_data.calls_waiting[call_id].friendly_duration = self.get_time_seconds(formatted_data.current_timestamp - queue_stats.entered_timestamp);
					formatted_data.calls_waiting[call_id].friendly_title = queue_stats.caller_id_name || queue_stats.caller_id_number || call_id;
					formatted_data.queues[k].current_calls++;
				}
				else if(queue_stats.status === 'handled') {
					formatted_data.calls_in_progress[call_id] = queue_stats;
					formatted_data.agents[queue_stats.agent_id].call_time = self.get_time_seconds(formatted_data.current_timestamp - queue_stats.handled_timestamp);
					formatted_data.agents[queue_stats.agent_id].current_call = queue_stats;
					formatted_data.agents[queue_stats.agent_id].current_call.friendly_title = queue_stats.caller_id_name || queue_stats.caller_id_number || call_id;
					formatted_data.calls_in_progress[call_id].friendly_duration = self.get_time_seconds(formatted_data.current_timestamp - queue_stats.entered_timestamp);
					formatted_data.queues[k].total_calls++;

					formatted_data.queues[k].current_calls++;
				}
				else if(queue_stats.status === 'processed') {
					formatted_data.queues[k].total_calls++;
				}}
			});
		}

		$.each(formatted_data.queues, function(k, v) {
			if(v.total_calls > 0) {
				var completed_calls = v.total_calls - v.abandoned_calls;

				v.average_hold_time = self.get_time_seconds(v.total_wait_time / completed_calls);
			}
		});
		return formatted_data;
	},

	format_data: function(data) {
		var self = this,
			formatted_data = {};
		/* Formatting Queues */
		formatted_data.queues = {};

		$.each(data.queues, function(k, v) {
			formatted_data.queues[v.id] = $.extend(true, {
				current_calls: 0,
				total_calls: 0,
				current_agents: 0,
				max_agents: 0,
				average_hold_time: self.get_time_seconds(0),
				total_wait_time: 0,
				abandoned_calls: 0
			}, v);
		});

		/* Formatting Agents */
		formatted_data.agents = {};

		$.each(data.agents, function(k, v) {
			if(v.queues && v.queues.length > 0) {
				formatted_data.agents[v.id] = $.extend(true, {
					status: 'logged_out',
					missed_calls: 0,
					total_calls: 0,
					queues_list: {}
				}, v);
			}

			$.each(v.queues, function(k, queue_id) {
				if(queue_id in formatted_data.queues) {
					formatted_data.queues[queue_id].max_agents++;
					formatted_data.agents[v.id].queues_list[queue_id] = {
						missed_calls: 0,
						total_calls: 0
					};
				}
			});
		});
		formatted_data = self.format_live_data(formatted_data, data);
		return formatted_data;
	},

	render: function(_container) {
		var self = this,
		container = _container || $('#monster_content');

		// account switching for monster-ui
		self.accountId = monster.apps.auth.accountId;
		self.clean_timers();

		self.fetch_all_data(function(data) {

			var queues_html = $(monster.template(self, 'queues_dashboard', {queues: data.queues}));
			var agents_html = $(monster.template(self, 'agents_dashboard', {agents: data.agents}));
			var calls_html = $(monster.template(self, 'calls_dashboard', {progress: data.calls_in_progress, waits: data.calls_waiting} ));

			var html = $(monster.template(self, 'dashboard', {}));
			container.empty().append(html);

			var scroll_value = $('.topbar-right .list_queues_inner', container).scrollLeft() || 0;
			container.find('#dashboard-view').empty().append(agents_html);
			container.find('.topbar-right').empty().append(queues_html);
			container.find('.topbar-right .list_queues_inner').animate({ scrollLeft: scroll_value }, 0);
			container.find('#callwaiting-list').append(calls_html);

			self.poll_agents(data, container);
			(container).empty().append(html);
			self.bind_live_events(container);

			if(typeof queue_id != 'undefined') {
				self.detail_stat(queue_id, container);
			}

			self.dashboardBindEvents(container);
		});
	},

	dashboardBindEvents: function($container) {
		var self = this;

		$container.find('.js-open-cc-settings').on('click', function(e) {
			e.preventDefault();
			self.settingsRender($container);
		}).click(); // TODO: remove ".click()" after development
	},

	settingsShowMessage: function(msg, msgType, $container) {
		if(!$container) {
			$container = $('#cc-settings-content');
		}

		var msgTypeClass;

		if(typeof(msgType) === 'undefined') {
			msgType = 'info';
		}

		switch(msgType) {
			case 'warning':
				msgTypeClass = 'msg-warning';
				break;
			case 'success':
				msgTypeClass = 'msg-success';
				break;
			default: // 'info'
				msgTypeClass = 'msg-info';
		}

		var $msg = $('<div class="user-message ' + msgTypeClass + '">' + msg + '</div>')
			.prependTo($container).hide().fadeIn();

		$msg.animate({
				backgroundColor: '#ffffff',
				color: '#000000'
			}, 1000
		);

		window.setTimeout(function(){
			$msg.fadeOut(400, function() {
				$msg.remove();
			})
		}, 4000);
	},

	settingsRender: function($container, callback) {
		var self = this;
		var html = $(monster.template(self, 'settings', {}));
		$container.empty().append(html);
		self.settingsInit($container, callback);
	},

	settingsInit: function($container, callback) {
		var self = this;
		var $queuesListBox = $container.find('#queues-list-container');
		self.settingsQueuesListRender(null, $queuesListBox, function() {
			monster.ui.tooltips($container, {
				options: {
					placement: 'right',
					container: 'body'
				}
			});

			self.settingsBindEvents($container);

			// TODO: remove after development
			$('#queues-list li:first-child a').click();

			if(typeof(callback) === 'function') {
				callback();
			}
		});

	},

	settingsBindEvents: function($container) {
		var self = this;

		$container.find('.js-open-cc-dashboard').on('click', function(e) {
			e.preventDefault();
			self.render($container);
		});

		$container.find('.js-cc-create-queue').on('click', function(e) {
			e.preventDefault();
			self.settingsQueueNewInit($container);
		});
	},

	settingsQueueNewInit: function($container) {
		var self = this;
		var $parent = $container.find('#cc-settings-content');

		var $queuesList = $('#queues-list');
		$queuesList.find('.active').each(function(e, i) {
			$(this).removeClass('active');
		});
		$queuesList.find('.js-new-queue-item').remove();
		$queuesList.find('#queues-list').append('<li class="js-new-queue-item active"><a href="#">New Queue</a></li>');

		self.settingsQueueFormRender($parent);
	},

	settingsQueueFormRender: function($container, queueData, callback) {
		var self = this;

		var defaultQueueData = {
			connection_timeout: '0',
			member_timeout: '5',
			agent_wrapup_time: '30',
			record_caller: true,
			moh: {},
			notifications: {},
			max_queue_size: '0'
		};

		queueData = $.extend(true, defaultQueueData, queueData || {});
/*		var data = {
			"data": {
				"name": "test2",
				"record_caller": true,
				"moh": "1880ca1c34f3ed88b4071cda175f525e",
				"strategy": "round_robin",
				"call_recording_url": "",
				"agent_wrapup_time": "30",
				"max_queue_size": "0",
				"connection_timeout": "0",
				"enter_when_empty": false,
				"notifications": {
					"hangup": "",
					"pickup": "",
					"method": "GET"
				},


				"member_timeout": "5",
				"ui_metadata": {
					"ui": "kazoo-ui",
					"version": "3.22-0https://github.com/2600hz/kazoo-ui.gittags/3.22.096a18351d378f041d957acd3c1c94c8e6de462ef2015-10-22_01-32-14120"
				}
			},
			"verb": "PUT"
		};*/

		monster.parallel({
				users: function(callback) {
					self.callApi({
						resource: 'user.list',
						data: {
							accountId: self.accountId
						},
						success: function (users) {
							callback(null, users.data);
						}
					});
				},
				media: function(callback) {
					self.callApi({
						resource: 'media.list',
						data: {
							accountId: self.accountId
						},
						success: function(media, status) {
							callback(null, media.data);
						}
					});
				}
			},
			function(err, results) {
				if (err) {
					console.log('Error');
					console.log(err);
				} else {

					// results.media
					// results.users

					results.media.unshift(
						{
							id: '',
							name: 'Default' // TODO: i18n it
						},
						{
							id: 'silence_stream://300000',
							name: 'Silence' // TODO: i18n it
						}
					);

					var html = $(monster.template(self, 'settings_queue_form', {
						data: queueData,
						media_list: results.media
					}));

					self.vars.users = results.users;

					$container.empty().append(html);
					self.settingsQueueFormBindEvents($container);
					self.settingsQueueAgentsPanelRender(results.users, queueData.agents, $container);
				}

			});
	},

	settingsQueueAgentsPanelRender: function(usersList, selectedAgentsIdList, $container) {
		var self = this,
			agentsList,
			usersWithoutAgents;

		agentsList = self.settingsQueueAgentsPanelExtractAgentsData(selectedAgentsIdList, usersList);
		usersWithoutAgents = self.settingsQueueAgentsPanelGetUsersWithoutAgents(usersList, agentsList);


		var template = $(monster.template(self, 'settings_queue_agents', {
			agents: agentsList,
			users: usersWithoutAgents
		}));

		var $parent = $container.find('#queue-agents-content');
		$parent.html(template);

		self.settingsQueueAgentsPanelInit($parent, function(){
			self.settingsQueueAgentsPanelBindEvents($parent);
		});
	},

	settingsQueueAgentsPanelExtractAgentsData: function(selectedAgentsIdList, usersList) {
		// fill agents list
		var agentsList = [];
		for(var a=0, alen= selectedAgentsIdList.length; a<alen; a++) {
			for(var u=0, ulen= usersList.length; u<ulen; u++) {
				if(selectedAgentsIdList[a] === usersList[u].id) {
					console.log('selectedAgentsIdList[a]:');
					console.log(selectedAgentsIdList[a]);

					console.log('usersList[u]:');
					console.log(usersList[u]);
					agentsList.push(usersList[u]);
					break;
				}
			}
		}
		return agentsList;
	},

	settingsQueueAgentsPanelGetUsersWithoutAgents: function(users, agents) {
		var usersWithoutAgents = [];

		for(var u=0, ulen=users.length; u<ulen; u++) {
			for(var a=0, alen= agents.length; a<alen; a++) {
				if(agents[a].id === users[u].id) {
					users[u].isAgent = true;
					break;
				}
			}
		}

		for(u=0, ulen=users.length; u<ulen; u++) {
			if(!users[u].isAgent) {
				usersWithoutAgents.push(users[u]);
			}
		}

		return usersWithoutAgents;
	},

	settingsQueueAgentsPanelBindEvents: function($parent) {
		var self = this;
		var handledClass= 'js-handled';

		$parent.find('.js-remove-agent').not('.js-handled').on('click', function(e) {
			e.preventDefault();
			$(this).closest('li').remove();
			self.settingsQueueAgentsPanelUpdateUserTable();
		}).addClass(handledClass);

		$parent.find('.js-add-agent').not('.js-handled').on('click', function(e) {
			e.preventDefault();

			var $userContainer = $(this).closest('tr');
			var userId = $userContainer.data('user-id');
			var $agentsList = $('#queue-agents-list');
			var userName = $userContainer.find('.js-user-name').text();

			if($agentsList.find('[data-user-id="' + userId + '"]').length > 0) {
				// already exist
				return;
			}

			var userItemHTML = ('' +
				'<li data-user-id="{{id}}">' +
					'<span class="item-name">{{name}}</span>' +
					'<a href="#" class="js-remove-agent remove-agent-btn">' +
						'<i class="fa fa-remove"></i>' +
					'</a>' +
				'</li>')
					.replace('{{id}}', userId)
					.replace('{{name}}', userName);


			$agentsList.append(userItemHTML);
			self.settingsQueueAgentsPanelBindEvents($agentsList);
			self.settingsQueueAgentsPanelUpdateUserTable();
		}).addClass(handledClass);

		$parent.find('.js-edit-user').not('.js-handled').on('click', function(e) {
			e.preventDefault();

			// TODO: open popup with user settings for editing

			$(this).addClass('js-handled');
		}).addClass(handledClass);
	},

	settingsQueueAgentsPanelUpdateUserTable: function() {
		// find exist agents
		var self = this;
		var agentsIdList = [];
		var $agentsItems = $('#queue-agents-list').find('li');

		// clear user's agent property
		for(var u=0, ulen=self.vars.users.length; u<ulen; u++) {
			self.vars.users[u].isAgent = false;
		}

		$agentsItems.each(function(i, el){
			var userId = $(el).data('user-id');
			if(userId) {
				agentsIdList.push(userId);
			}
		});

		console.log('self.vars.users:');
		console.log(self.vars.users);

		self.settingsQueueAgentsPanelRender(self.vars.users, agentsIdList, $('#queue-agents-wrapper'))
	},

	settingsQueueAgentsPanelInit: function($parent, callback) {
		var table = $parent.find('#queue-users-table').DataTable({
			bStateSave: false,
			lengthMenu: [[10, 25, -1], [10, 25, 'All']],
			order: [[ 1, 'asc' ]],
			autoWidth: false,
			columnDefs: [
				{
					targets: 0,
					width: '5%'
				},
				{
					targets  : 'no-sort',
					orderable: false
				}
			],
			language: {
				search: '',
				searchPlaceholder: 'Search...'
			},
			dom: 'ftplB',
			buttons: [],
			initComplete: function(settings, json) {
				if(typeof(callback) !== 'undefined') {
					callback(settings, json);
				}
			}
		});
	},

	settingsQueueFormBindEvents: function($container) {
		var self = this;

		$container.find('.js-edit-media').on('click', function(e) {
			e.preventDefault();
		});

		$container.find('.js-create-media').on('click', function(e) {
			e.preventDefault();
		});

		$container.find('.js-save-queue').on('click', function(e) {
			e.preventDefault();

			var data = self.serializeFormElements($container.find('#queue-form'));
			var queueId = $(this).data('queue-id');

			console.log('Queue form data:');
			console.log(data);

			var agentsIdList = [];
			$('#queue-agents-list').find('li').each(function(i, el) {
				var userId = $(el).data('user-id');
				if(userId) {
					agentsIdList.push(userId);
				}
			});

			self.settingsAgentsSave(queueId, agentsIdList, function() {
				self.settingsQueueSave(queueId, data, function(){
					console.log('Queue saving complete!');
				});
			});

		});

		$container.find('.js-delete-queue').on('click', function(e) {
			e.preventDefault();
			var queueId = $(this).data('queue-id');

			// TODO: i18n it!
			monster.ui.confirm('Are you sure to remove this queue?', function() {
				self.settingsQueueRemove(queueId, function() {
					self.settingsRender($('#monster_content'), function(){
						// TODO: i18n it!
						self.settingsShowMessage('Queue was successfully removed!', 'success')
					});
				});
			});
		});
	},

	settingsQueueRemove: function(queueId, callback) {
		var self = this;

		self.callApi({
			resource: 'queues.queues_delete',
			data: {
				accountId: self.accountId,
				queuesId: queueId
			},
			success: function(data, status) {
				if(typeof(callback) === 'function') {
					callback();
				}
			}
		});
	},

	settingsAgentsSave: function(queueId, agentsIdList, callback) {
		var self = this;

		self.callApi({
			resource: 'agents.agents_update',
			data: {
				accountId: self.accountId,
				queuesId: queueId,
				data: agentsIdList
			},
			success: function(data, status) {
				console.log('Agents were saved.');
				console.log(data);

				if(typeof(callback) === 'function') {
					callback();
				}
			}
		});
	},

	serializeFormElements: function($parent, selector) {
		if(typeof(selector) === 'undefined') {
			selector = '.js-to-serialize[name]';
		}

		var result = {};
		$parent.find(selector).each(function(i, el){
			var $el = $(el);
			var name = $el.attr('name');

			if(el.tagName === 'INPUT') {
				if($el.attr('type') === 'checkbox') {
					result[name] = !!$el.is(':checked');
					return;
				}

				if(!!$el.val()) {
					result[name] = $el.val();
					return;
				}
			}

			if(el.tagName === 'SELECT' && !!$el.find('option:selected').val()) {
				result[name] = $el.find('option:selected').val();
			}
		});

		return result;
	},

	settingsQueueSave: function(queueId, queueData, callback) {
		var self = this;

		/*var data = {
			"data": {
				"connection_timeout": "0",
				"member_timeout": "5",
				"agent_wrapup_time": "30",
				"record_caller": true,
				"moh": "1880ca1c34f3ed88b4071cda175f525e",
				"notifications": {"hangup": "", "pickup": "", "method": "GET"},
				"max_queue_size": "0",
				"name": "test2",
				"strategy": "round_robin",
				"call_recording_url": "",
				"enter_when_empty": false,
				"ui_metadata": {
					"ui": "kazoo-ui",
					"version": "3.22-0https://github.com/2600hz/kazoo-ui.gittags/3.22.096a18351d378f041d957acd3c1c94c8e6de462ef2015-10-22_01-32-14120"
				}
			},
			"verb": "PUT"
		};*/

		if(queueId) {
			// Edit exist queue
			self.callApi({
				resource: 'queues.queues_update',
				data: {
					accountId: self.accountId,
			 		queuesId: queueId,
					data: queueData
				},
				success: function(data, status) {
					console.log(data);

					self.settingsQueuesListRender(queueId, null, function() {
						self.settingsQueueEditFormRender(queueId, function() {
							self.settingsShowMessage('Saving complete!'); // TODO: i18n it!
						});
					});
				}
			});
		} else {
			// Create new queue
			self.callApi({
				resource: 'queues.queues_create',
				data: {
					accountId: self.accountId,
					data: queueData
				},
				success: function(data, status) {
					console.log(data);
					self.settingsQueuesListRender(data.queue_id, null, function(){
						self.settingsQueueEditFormRender(data.queue_id, function(){
							self.settingsShowMessage('Creating complete!'); // TODO: i18n it!
						});
					});
				}
			});
		}
	},

	settingsQueuesListRender: function(activeQueueId, $parent, callback) {
		var self = this;

		if(!activeQueueId || typeof(activeQueueId) === 'undefined') {
			activeQueueId = null;
		}

		if(!$parent) {
			$parent = $('#queues-list-container');
		}

		self.callApi({
			resource: 'queues.queues_list',
			data: {
				accountId: self.accountId
			},
			success: function (data, status) {
				console.log(data);


				var map_crossbar_data = function(data) {
					var new_list = [];

					if(data.length > 0) {
						$.each(data, function(key, val) {
							new_list.push({
								id: val.id,
								title: val.name || 'No name' // TODO: i18n it!
							});
						});
					}

					new_list.sort(function(a, b) {
						return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
					});

					return new_list;
				};

				var queuesListHtml = $(monster.template(self, 'settings_queues_list', {
					queues: map_crossbar_data(data.data),
					active_queue_id: activeQueueId
				}));

				$parent.empty().append(queuesListHtml);

				self.settingsQueuesListBind($parent);

				if(typeof(callback) !== 'undefined') {
					callback();
				}
			}
		});
	},

	settingsQueuesListBind: function($container){
		var self = this;

		$container.find('.js-select-queue').on('click', function(e) {
			e.preventDefault();

			var $queuesList = $(this).closest('#queues-list');
			$queuesList.find('.active').removeClass('active');
			$queuesList.find('.js-new-queue-item').remove();

			var queueId = $(this).closest('li').addClass('active').data('id');
			console.log('Edit queue: ' + queueId);

			self.settingsQueueEditFormRender(queueId, function(){});
		})

	},

	settingsQueueEditFormRender: function(queueId, callback) {
		var self = this;

		if(!queueId || typeof(queueId) === 'undefined') {
			console.log('Error while edit queue: queue id is undefined');
			return;
		}

		self.callApi({
			resource: 'queues.queues_get',
			data: {
				accountId: self.accountId,
				queuesId: queueId
			},
			success: function(data, status) {
				console.log(data);

				var $parent = $('#cc-settings-content');
				self.settingsQueueFormRender($parent, data.data, callback);
			}
		});
	},

	fetch_all_data: function(callback) {
		var self = this;

		monster.parallel({
			queues_livestats: function(callback) {
				self.get_queues_livestats(function(_data_live_queues) {
					callback(null, _data_live_queues);
				});
			},
			agents_livestats: function(callback) {
				self.get_agents_livestats(function(_data_live_agents) {
					callback(null, _data_live_agents);
				});
			},
			agents_status: function(callback) {
				self.get_agents_status(function(_data_live_status) {
						callback(null, _data_live_status);
					},
					function(_data_live_status) {
						callback(null, {});
					}
				);
			},
			queues: function(callback) {
				self.get_queues(function(_data_queues) {
					callback(null, _data_queues);
				});
			},
			agents: function(callback) {
				self.get_agents(function(_data_agents) {
					callback(null, _data_agents);
				});
			}
		},
		function(err, results) {
			var _data = {
				queues: results.queues,
				agents: results.agents,
				agents_live_stats: results.agents_livestats,
				queues_live_stats: results.queues_livestats,
				agents_live_status: results.agents_status
			};

			_data = self.format_data(_data);

			if(typeof callback === 'function') {
				callback(_data);
			}
		});
	},

	bind_live_events: function(container) {
		var self = this;

		// list of queues
		$('.list_queues_inner > li', container).on('click', function(event) {

			queue_id = this.id;
			var $self_queue = $(self);

			if($self_queue.hasClass('active')) {
				self.current_queue_id = undefined;
				$('.agent_wrapper', container).css('display', 'inline-block');
				$('.all_data', container).show();
				$('.queue_data', container).hide();
				$('#callwaiting-list li', container).show();
				$('.icon.edit_queue', container).hide();
				$('.icon.eavesdrop_queue', container).hide();
				$('.list_queues_inner > li', container).removeClass('active');
			} else {
				self.detail_stat(queue_id, container);
			}
		});

	},

	detail_stat: function(queue_id, container) {
		var self = this,
			$self_queue = $('#'+queue_id, container);

		self.current_queue_id = queue_id;

		$('.list_queues_inner > li', container).removeClass('active');
		$self_queue.addClass('active');

		$('#callwaiting-list li', container).each(function(k, v) {
			var $v = $(v);

			if(v.getAttribute('data-queue_id') !== queue_id) {
				$v.hide();
			} else {
				$v.show();
			}
		});
	},

	clean_timers: function() {
		var self = this;

			if(self.global_timer !== false) {
				clearInterval(self.global_timer);
				self.global_timer = false;
			}

			$.each(self.map_timers, function(type, list_timers) {
				$.each(list_timers, function(k, v) {
					clearInterval(v.timer);
				});
			});

			self.map_timers = {};
		},

		/*activate_queue_stat: function(args) {
			//TODO check render global data
			var self = this,
			container = args.container || $('#monster-content');
			container.empty();
			self.render(container, function() {
				var $self_queue = $('#'+args.id, container);
				self.detail_stat(args.id, container);
			});
		},*/

		/*activate: function(_container) {
			var self = this,
			container = _container || $('#monster-content');
			container.empty();
			self.current_queue_id = undefined;
			self.hide_logout = false;
			//TODO check render global data
			self.render(container);
		},*/

		login: function(agent, callback) {
			var self = this,
			agentId = $(agent).attr('id');
			self.callApi({
					resource: 'agents.agents_toggle',
					data: {
						accountId: self.accountId,
						agentId: agentId,
						data: {status: 'login'}
					}
			});
		},

		logout: function(agent, callback) {
			var self = this,
			agentId = $(agent).attr('id');
			self.callApi({
				resource: 'agents.agents_toggle',
				data: {
					accountId: self.accountId,
					agentId: agentId,
					data: {status: 'logout'}
				}
			});
		}
	};

	return app;
});
