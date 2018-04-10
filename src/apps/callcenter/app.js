define(function(require){
	var $ = require('jquery'),
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
		'callcenter.queue.eavesdrop': {
			'verb': 'PUT',
			'url': 'accounts/{accountId}/queues/{queueId}/eavesdrop'
		},
		'callcenter.call.eavesdrop': {
			'verb': 'PUT',
			'url': 'accounts/{accountId}/queues/eavesdrop'
		},
		'callcenter.queues.list': {
			'verb': 'GET',
			'url': 'accounts/{accountId}/queues'
		},
		'callcenter.queues.create': {
			'verb': 'PUT',
			'url': 'accounts/{accountId}/queues'
		},
		'callcenter.queues.get': {
			'verb': 'GET',
			'url': 'accounts/{accountId}/queues/{queuesId}'
		},
		'callcenter.queues.update': {
			'verb': 'POST',
			'url': 'accounts/{accountId}/queues/{queuesId}'
		},
		'callcenter.queues.delete': {
			'verb': 'DELETE',
			'url': 'accounts/{accountId}/queues/{queuesId}'
		},
		'callcenter.queues.stats': {
			'verb': 'GET',
			'url': 'accounts/{accountId}/queues/stats'
		},
		'callcenter.agents.stats': {
			'verb': 'GET',
			'url': 'accounts/{accountId}/agents/stats'
		},
		'callcenter.agents.status': {
			'verb': 'GET',
			'url': 'accounts/{accountId}/agents/status'
		},
		'callcenter.agents.toggle': {
			'verb': 'POST',
			'url': 'accounts/{accountId}/agents/{agentId}/status'
		},
		'callcenter.agents.list': {
			'verb': 'GET',
			'url': 'accounts/{accountId}/agents'
		},
		'callcenter.agents.update': {
			'verb': 'POST',
			'url': 'accounts/{accountId}/queues/{queuesId}/roster'
		}
	},

	load: function(callback){
		var self = this;

		self.initApp(function() {
			callback && callback(self);
		});
	},

	global_timer: false,
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

	initHeaderSubmenu: function() {
		var self = this;
		var $headerMenu = $('#cc-header-menu');

		$headerMenu.find('.js-header-menu-title').on('click', function(e) {
			e.preventDefault();
			$(this).hide();
			$headerMenu.find('.js-header-menu-items').show();

			if(self.vars.hasOwnProperty('headerMenuTimeoutId')) {
				window.clearTimeout(self.vars.headerMenuTimeoutId);
			}

			self.vars.headerMenuTimeoutId = window.setTimeout(function(){
				$headerMenu.find('.js-header-menu-items').hide();
				$headerMenu.find('.js-header-menu-title').show();
			}, 5000);
		});
	},

	queue_eavesdrop: function (callback) {
		var self = this;

		monster.request({
			resource: 'callcenter.queue.eavesdrop',
			data: {
				accountId: self.accountId,
				generateError: false
			},
			success: function (queue_eavesdrop) {
				callback(queue_eavesdrop.data);
			}
		});
	},

	showEavesdropPopup: function(mode, data) {
		var self = this;

		self.getAll({
			resource: 'device.list',
			data: {
				accountId: self.accountId,
				generateError: false
			},
			success: function (devices) {
				var popup_html = $(monster.template(self, 'eavesdrop_popup', {
					devices: devices.data
				}));

				var i18n = self.i18n.active();

				$('#ring', popup_html).click(function(e) {
					e.preventDefault();

					var requestData = {
						accountId: self.accountId,
						generateError: false,
						data: {
							id: $('#object-selector', popup_html).val()
						}
					};

					if(mode === 'call') {
						requestData.data.call_id = data.call_id;
					} else if(mode === 'queue') {
						requestData.queueId = data.queue_id;
					}

					monster.request({
						resource: 'callcenter.' + mode + '.eavesdrop',
						data: requestData,
						success: function (devices) {
							popup.dialog('close');
						},
						error: function() {
							// monster.ui.alert('Eavesdrop failed');
							console.log(i18n.callcenter.eavesdrop_request_failed);
						}
					});
				});

				$('#cancel', popup_html).click(function(e) {
					e.preventDefault();
					popup.dialog('close');
				});

				var popup = monster.ui.dialog(popup_html, {
					title: i18n.callcenter.select_the_device,
					width: '450px'
				});
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
					monster.parallel({
							queues_stats: function (callback) {
								self.get_queues_stats(function (data) {
									callback(null, data);
								});
							},
							agents_stats: function (callback) {
								self.get_agents_stats(function (data) {
									callback(null, data);
								});
							},
							agents_status: function (callback) {
								self.get_agents_status(function (data) {
										callback(null, data);
									},
									function (data) {
										callback(null, {});
									}
								);
							}
						},
						function (err, results) {
							data_template = self.format_live_data(data_template, {
								agents_stats: results.agents_stats,
								queues_stats: results.queues_stats,
								agents_status: results.agents_status
							});
							self.dashboardUpdateAllData(null, data_template, self.vars.queue_id);
						}
					);
				}
			},
			huge_poll = function () {
				if ($('#dashboard-content').size() === 0) {
					self.clean_timers();
				} else {
					if (++cpt % 30 === 0) {
						self.fetch_all_data(function (data) {
							self.dashboardUpdateAllData(null, data, self.vars.queue_id);
							current_global_data = data;
						});
					} else {
						poll();
					}
				}
			};

		$.each(global_data.agents, function (k, v) {
			map_agents[v.id] = 'logged_out';
		});

		self.global_timer = setInterval(huge_poll, polling_interval * 1000);
	},

	get_queues_stats: function (callback) {
		var self = this;

		monster.request({
			resource: 'callcenter.queues.stats',
			data: {
				accountId: self.accountId,
				generateError: false
			},
			success: function (data) {
				callback(data.data);
			}
		});
	},

	get_agents_status: function (callback) {
		var self = this;

		monster.request({
			resource: 'callcenter.agents.status',
			data: {
				accountId: self.accountId,
				generateError: false
			},
			success: function (data) {
				callback(data.data);
			}
		});
	},

	get_agents_stats: function (callback) {
		var self = this;

		monster.request({
			resource: 'callcenter.agents.stats',
			data: {
				accountId: self.accountId,
				generateError: false
			},
			success: function (data) {
				callback(data.data);
			}
		});
	},

	/*get_queues_stats: function (callback) {
		var self = this;

		monster.request({
			resource: 'callcenter.queues.stats',
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

		self.getAll({
			resource: 'callcenter.queues.list',
			data: {
				accountId: self.accountId,
				generateError: false
			},
			success: function (data) {
				callback && callback(data.data);
			}
		});
	},

	get_agents: function (callback) {
		var self = this;

		self.getAll({
			resource: 'callcenter.agents.list',
			data: {
				accountId: self.accountId,
				generateError: false
			},
			success: function (agents) {
				callback(agents.data);
			}
		});
	},

	get_time_seconds: function (seconds) {
		seconds = Math.floor(seconds);
		var hours = Math.floor(seconds / 3600),
			minutes = Math.floor(seconds / 60) % 60,
			remaining_seconds = seconds % 60,
			display_time = (hours < 10 ? '0' + hours : '' + hours)
				+ ':' + (minutes < 10 ? '0' + minutes : '' + minutes)
				+ ':' + (remaining_seconds < 10 ? '0' + remaining_seconds : ''
				+ remaining_seconds);

		return seconds >= 0 ? display_time : '00:00:00';
	},


	format_live_data: function (formatted_data, data) {
		var self = this,

			current_agents_by_queue = {};
		formatted_data.current_timestamp = data.queues_stats.current_timestamp;
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

		if(data.agents_status) {
			$.each(data.agents_status, function(k, agent_status) {
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

		$.each(data.agents_stats, function(k, agent_stats) {
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

		if('stats' in data.queues_stats) {
			$.each(data.queues_stats.stats, function(index, queue_stats) {
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
		self.dashboardRender(_container);
	},

	dashboardRender: function($container) {
		var self = this;

		self.fetch_all_data(function(data) {
			self.dashboardUpdateAllData($container, data, self.vars.queue_id, function(data){
				self.poll_agents(data, $container);
			});
		});
	},

	dashboardUpdateAllData: function($container, data, queueId, callback) {
		var self = this;
		$container = $container || $('#monster_content');

		var queues_html = $(monster.template(self, 'queues_dashboard', {
			queues: data.queues
		}));

		var agents_html = $(monster.template(self, 'agents_dashboard', {
			agents: data.agents
		}));

		var calls_html = $(monster.template(self, 'calls_dashboard', {
			progress: data.calls_in_progress,
			waits: data.calls_waiting
		}));

		var html = $(monster.template(self, 'dashboard', {}));
		$container.empty().append(html);

		var scroll_value = $('.topbar-right .list_queues_inner', $container).scrollLeft() || 0;
		$container.find('#dashboard-view').empty().append(agents_html);
		$container.find('.topbar-right').empty().append(queues_html);
		$container.find('.topbar-right .list_queues_inner').animate({ scrollLeft: scroll_value }, 0);
		$container.find('#callwaiting-list').append(calls_html);

		$container.empty().append(html);
		self.bind_live_events($container);
		self.render_timers(data);

		if(typeof(queueId) !== 'undefined') {
			self.detail_stat(queueId, $container);
		}
		self.dashboardBindEvents($container);
		self.initHeaderSubmenu();

		if(typeof(callback) === 'function') {
			callback(data);
		}
	},

	render_timers: function(data) {
		var self = this;

		$.each(self.map_timers, function(type, list_timers) {
			$.each(list_timers, function(k, v) {
				clearInterval(v.timer);
			});
		});

		self.map_timers = {
			waiting: {},
			in_progress: {}
		};

		if(data.calls_waiting) {
			$.each(data.calls_waiting, function(k, v) {
				v.duration = data.current_timestamp - v.entered_timestamp;
				self.start_timer('waiting', {data: v, id: k});
			});
		}

		if(data.calls_in_progress) {
			$.each(data.calls_in_progress, function(k, v) {
				v.duration = data.current_timestamp - v.handled_timestamp;
				self.start_timer('in_progress', {data: v, id: v.agent_id});
			});
		}

		if(data.agent_status) {
			if('busy' in data.agent_status) {
				$.each(data.agent_status.busy, function(agent_id, data_status) {
					data_status.duration = data.current_timestamp - data_status.timestamp;
					self.start_timer('agent_status', {data: data_status, id: agent_id});
				});
			}

			if('wrapup' in data.agent_status) {
				$.each(data.agent_status.wrapup, function(agent_id, data_status) {
					data_status.duration = data_status.wait_time - (data.current_timestamp - data_status.timestamp);
					self.start_timer('agent_status', {data: data_status, id: agent_id}, 'decrement');
				});
			}

			if('paused' in data.agent_status) {
				$.each(data.agent_status.paused, function(agent_id, data_status) {
					if('pause_time' in data_status) {
						data_status.duration = data_status.pause_time - (data.current_timestamp - data_status.timestamp);
						self.start_timer('agent_status', {data: data_status, id: agent_id}, 'decrement');
					}
					else {
						data_status.duration = data.current_timestamp - data_status.timestamp;
						self.start_timer('agent_status', {data: data_status, id: agent_id});
					}
				});
			}
		}
	},

	start_timer: function(type, _data, _timer_type) {
		var self = this,
			$target,
			id = _data.id,
			data = _data.data,
			timer_type = _timer_type || 'increment';

		if(type === 'in_progress' || type === 'agent_status') {
			$target = $('.js-agent-item#'+id+' .js-call-time .js-time-value');
		} else if(type === 'waiting') {
			$target = $('.js-cw-item[data-call_id="'+id+'"] .js-timer');
		}

		if(!self.map_timers[type]) {
			self.map_timers[type] = {};
		}

		self.map_timers[type][id] = data;

		self.map_timers[type][id].timer = setInterval(function(){
			if($target.size() > 0) {
				if(timer_type === 'decrement') {
					var new_duration = --self.map_timers[type][id].duration;
					$target.html(self.get_time_seconds(new_duration > 0 ? new_duration : 0));
				}
				else {
					if(self.map_timers[type]) {
						$target.html(self.get_time_seconds(++self.map_timers[type][id].duration));
					}
				}
			} else {
				if(self.map_timers[type][id]) {
					clearInterval(self.map_timers[type][id].timer);
					delete self.map_timers[type][id];
				}
			}
		}, 1000);
	},

	dashboardBindEvents: function($container) {
		var self = this;

		$container.find('.js-open-cc-settings').on('click', function(e) {
			e.preventDefault();
			self.settingsRender($container, function(){
				// Open first queue
				$('#queues-list li:first-child a').click();
			});
		});
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
		var $queuesListBox = $container.find('#queues-list-container');

		self.settingsQueuesListRender(null, $queuesListBox, function() {
			monster.ui.tooltips($container, {
				options: {
					placement: 'right',
					container: 'body'
				}
			});

			self.settingsBindEvents($container);

			if(typeof(callback) === 'function') {
				callback();
			}
		});

		self.initHeaderSubmenu();
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
			record_caller: false,
			moh: {},
			notifications: {},
			max_queue_size: '0'
		};

		queueData = $.extend(true, defaultQueueData, queueData || {});

		monster.parallel({
				users: function(callback) {
					self.getAll({
						resource: 'user.list',
						data: {
							accountId: self.accountId,
							generateError: false
						},
						success: function (users) {
							callback(null, users.data);
						}
					});
				},
				media: function(callback) {
					self.getAll({
						resource: 'media.list',
						data: {
							accountId: self.accountId,
							generateError: false
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
					var i18n = self.i18n.active();
					results.media.unshift(
						{
							id: '',
							name: i18n.callcenter.settings.mediaDefault
						},
						{
							id: 'silence_stream://300000',
							name: i18n.callcenter.settings.mediaSilence
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

					if(typeof(callback) === 'function') {
						callback(results);
					}
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

		if(!selectedAgentsIdList) {
			return agentsList;
		}

		for(var a=0, alen= selectedAgentsIdList.length; a<alen; a++) {
			for(var u=0, ulen= usersList.length; u<ulen; u++) {
				if(selectedAgentsIdList[a] === usersList[u].id) {
					agentsList.push(usersList[u]);
					break;
				}
			}
		}
		return agentsList;
	},

	settingsQueueAgentsPanelGetUsersWithoutAgents: function(users, agents) {
		var usersWithoutAgents = [];

		// reset user's property "isAgent"
		for(var user=0, userLen=users.length; user<userLen; user++) {
			users[user].isAgent = false;
		}

		// set property "isAgent" to user-agents
		for(var u=0, ulen=users.length; u<ulen; u++) {
			for(var a=0, alen= agents.length; a<alen; a++) {
				if(agents[a].id === users[u].id) {
					users[u].isAgent = true;
					break;
				}
			}
		}

		// collect agents
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

			$agentsList.find('.js-empty-item').remove();
			$agentsList.append(userItemHTML);
			self.settingsQueueAgentsPanelBindEvents($agentsList);
			self.settingsQueueAgentsPanelUpdateUserTable();
		}).addClass(handledClass);
	},

	settingsQueueAgentsPanelUpdateUserTable: function() {
		// find exist agents
		var self = this;
		var agentsIdList = [];
		var $agentsItems = $('#queue-agents-list').find('li');

		$agentsItems.each(function(i, el){
			var userId = $(el).data('user-id');
			if(userId) {
				agentsIdList.push(userId);
			}
		});

		self.settingsQueueAgentsPanelRender(self.vars.users, agentsIdList, $('#queue-agents-wrapper'));
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
					width: '4%'
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
				if(typeof(callback) === 'function') {
					callback(settings, json);
				}
			}
		});
	},

	settingsQueueFormBindEvents: function($container) {
		var self = this;

		$container.find('.js-save-queue').on('click', function(e) {
			e.preventDefault();

			var data = self.serializeFormElements($container.find('#queue-form'));
			var queueId = $(this).data('queue-id');

			var agentsIdList = [];
			$('#queue-agents-list').find('li[data-user-id]').each(function(i, el) {
				var userId = $(el).data('user-id');
				if(userId) {
					agentsIdList.push(userId);
				}
			});

			self.settingsQueueSave(queueId, data, function(queueData) {
				self.settingsAgentsSave(queueData.id, agentsIdList, function(agentsIdList) {
					self.settingsQueueAgentsPanelRender(self.vars.users, agentsIdList, $('#queue-agents-wrapper'));
				});
			});

		});

		$container.find('.js-delete-queue').on('click', function(e) {
			e.preventDefault();
			var queueId = $(this).data('queue-id');

			var i18n = self.i18n.active();
			monster.ui.confirm(i18n.callcenter.settings.deleteQueueConfirmText, function() {
				self.settingsQueueRemove(queueId, function() {
					self.settingsRender($('#monster_content'), function(){
						self.settingsShowMessage(i18n.callcenter.settings.deleteQueueSuccessMessage, 'success')
					});
				});
			});
		});
	},

	settingsQueueRemove: function(queueId, callback) {
		var self = this;

		monster.request({
			resource: 'callcenter.queues.delete',
			data: {
				accountId: self.accountId,
				queuesId: queueId,
				generateError: false
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

		monster.request({
			resource: 'callcenter.agents.update',
			data: {
				accountId: self.accountId,
				generateError: false,
				queuesId: queueId,
				data: agentsIdList
			},
			success: function(data, status) {
				if(typeof(callback) === 'function') {
					callback(data.data.agents);
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

		if(queueId) {
			// Edit exist queue
			monster.request({
				resource: 'callcenter.queues.update',
				data: {
					accountId: self.accountId,
					generateError: false,
			 		queuesId: queueId,
					data: queueData
				},
				success: function(data, status) {
					self.settingsQueuesListRender(queueId, null, function() {
						self.settingsQueueEditFormRender(queueId, function() {
							var i18n = self.i18n.active();
							self.settingsShowMessage(i18n.callcenter.settings.saveQueueSuccessMessage);
							if(typeof(callback) === 'function') {
								callback(data.data);
							}
						});
					});
				}
			});
		} else {
			// Create new queue
			monster.request({
				resource: 'callcenter.queues.create',
				data: {
					accountId: self.accountId,
					generateError: false,
					data: queueData
				},
				success: function(data, status) {
					self.settingsQueuesListRender(data.data.id, null, function() {
						self.settingsQueueEditFormRender(data.data.id, function() {
							var i18n = self.i18n.active();
							self.settingsShowMessage(i18n.callcenter.settings.createQueueSuccessMessage);
							if(typeof(callback) === 'function') {
								callback(data.data);
							}
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

		self.getAll({
			resource: 'callcenter.queues.list',
			data: {
				accountId: self.accountId,
				generateError: false
			},
			success: function (data, status) {
				var i18n = self.i18n.active();

				var map_crossbar_data = function(data) {
					var new_list = [];

					if(data.length > 0) {
						$.each(data, function(key, val) {
							new_list.push({
								id: val.id,
								title: val.name || i18n.callcenter.settings.queueDefaultName
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

				if(typeof(callback) === 'function') {
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
			self.settingsQueueEditFormRender(queueId, function(){});
		})

	},

	settingsQueueEditFormRender: function(queueId, callback) {
		var self = this;

		if(!queueId || typeof(queueId) === 'undefined') {
			console.log('Error while edit queue: queue id is undefined');
			return;
		}

		monster.request({
			resource: 'callcenter.queues.get',
			data: {
				accountId: self.accountId,
				generateError: false,
				queuesId: queueId
			},
			success: function(data, status) {
				var $parent = $('#cc-settings-content');
				self.settingsQueueFormRender($parent, data.data, callback);
			}
		});
	},

	fetch_all_data: function(callback) {
		var self = this;

		monster.parallel({
			queues_stats: function(callback) {
				self.get_queues_stats(function(data) {
					callback(null, data);
				});
			},
			agents_stats: function(callback) {
				self.get_agents_stats(function(data) {
					callback(null, data);
				});
			},
			agents_status: function(callback) {
				self.get_agents_status(function(data) {
						callback(null, data);
					},
					function(data) {
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
				agents_stats: results.agents_stats,
				queues_stats: results.queues_stats,
				agents_status: results.agents_status
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
		$('.js-queues-list > li', container).on('click', function(e) {
			var $queueEl = $(this);

			self.vars.queue_id = $queueEl.attr('id');

			if($queueEl.hasClass('active')) {
				self.vars.queue_id = undefined;
				$('.agent_wrapper', container).css('display', 'inline-block');
				$('.all_data', container).show();
				$('.queue_data', container).hide();
				$('#callwaiting-list li', container).show();
				$('.icon.edit_queue', container).hide();
				$('.icon.eavesdrop_queue', container).hide();
				$('.list_queues_inner > li', container).removeClass('active');
			} else {
				self.detail_stat(self.vars.queue_id, container);
			}
		});

		$('.js-agent-item .js-eavesdrop', container).on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();

			var data = {
				call_id: $(this).data('call_id')
			};

			self.showEavesdropPopup('call', data);
		});

		$('.js-queues-list .js-edit-queue', container).on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();

			var queueId = $(this).closest('li').attr('id');
			self.settingsRender($('#monster_content'), function(){
				$('#queues-list li').filter('[data-id="' + queueId + '"]').addClass('active');
				self.settingsQueueEditFormRender(queueId, function(){})
			});
		});

		$('.js-queues-list li .js-eavesdrop', container).on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();

			var data = {
				queue_id: $(this).closest('li').attr('id')
			};

			self.showEavesdropPopup('queue', data);
		});

		$('.js-login-to-queue', container).click(function(e) {
			e.preventDefault();

			self.changeAgentInQueueStatus($(this), 'login', function(data) {});
		});

		$('.js-logout-from-queue', container).click(function(e) {
			e.preventDefault();

			self.changeAgentInQueueStatus($(this), 'logout', function(data) {});
		});
	},

	changeAgentInQueueStatus: function($btn, status, callback) {
		var self = this;

		if(status !== 'login' && status !== 'logout') {
			console.log('Unknown agent status: ' + status);
			return;
		}

		var agentId = $btn.closest('.agent_wrapper').attr('id');
		$btn.parent().find('.preloader').remove();
		$('<span class="preloader"></span>').insertAfter($btn);

		monster.request({
			resource: 'callcenter.agents.toggle',
			data: {
				accountId: self.accountId,
				agentId: agentId,
				generateError: false,
				data: {
					status: status
				}
			},
			success: function (data) {
				if(typeof(callback) === 'function') {
					callback(data);
				}
			},
			error: function() {
				if(typeof(callback) === 'function'){
					callback();
				}
			}
		});
	},

	detail_stat: function(queue_id, container) {
		var self = this,
			$self_queue = $('#' + queue_id, container);

		self.vars.queue_id = queue_id;

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

		$('.agent_wrapper', container).each(function(k, v) {
			var $v = $(v);

			if($v.data('queues').indexOf(queue_id) < 0) {
				$v.hide();
			} else {
				if(!self.hide_logout) {
					$v.css('display', 'inline-block');
				}
				$('.all_data', $v).hide();
				$('.queue_stat', $v).hide();
				$('.queue_stat[data-id=' + queue_id + ']', $v).show();
				$('.queue_data', $v).show();
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

	getAll: function(callApiData, startKey, continueData) {
		// Warning! Method works for listed data only!

		continueData = continueData || { data:[] };
		var self = this;

		if(typeof(callApiData.resource) === 'undefined') {
			self.log('Error! Api keyword is undefined');
			return;
		}

		var requestData = $.extend({
			accountId: self.accountId,
			generateError: false
		}, callApiData.data || {});

		if(typeof(startKey) !== 'undefined') {
			requestData.startKey = startKey;
		}

		var newRequestData = {
			resource: callApiData.resource,
			data: requestData,
			success: function(response){
				response.data = $.merge(continueData.data, response.data);
				if(response.next_start_key && startKey !== response.next_start_key) {
					self.getAll(callApiData, response.next_start_key, response);
					return;
				}

				if(typeof(callApiData.success) === 'function') {
					callApiData.success(response);
				}
			},
			error: callApiData.error || function(){}
		};

		if(self.requests.hasOwnProperty(callApiData.resource)) {
			monster.request(newRequestData);
		} else {
			self.callApi(newRequestData);
		}
	}
};

	return app;
});
