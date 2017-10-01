define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

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

	initApp: function(callback) {
		var self = this;

		monster.pub('auth.initApp', {
			app: self,
			callback: callback
		});
	},

	// API Calls
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
	listDevices: function (callback) {
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
	},

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

	get_queues_stats: function (callback) {
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
	},

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

	render_callwaiting_list: function (_container) {
		var self = this,
			container = _container || $('#dashboard-content');

		$('#callwaiting-list', container).empty().listpanel({
			label: 'Call Waiting',
			identifier: 'callwaiting-listview',
			data: []
		});
		$('.add_flow', container).empty().html('call_waiting_log');
	},

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

			queues_html = $(monster.template(self, 'queues_dashboard', {queues: data.queues}));
			agents_html = $(monster.template(self, 'agents_dashboard', {agents: data.agents}));
			calls_html = $(monster.template(self, 'calls_dashboard', {progress: data.calls_in_progress, waits: data.calls_waiting} ));

			html = $(monster.template(self, 'dashboard', {}));
			container.empty().append(html);

			scroll_value = $('.topbar-right .list_queues_inner', container).scrollLeft() || 0;
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

		activate_queue_stat: function(args) {
			//TODO check render global data
			var self = this,
			container = args.container || $('#monster-content');
			container.empty();
			self.render(container, function() {
				var $self_queue = $('#'+args.id, container);
				self.detail_stat(args.id, container);
			});
		},

		activate: function(_container) {
			var self = this,
			container = _container || $('#monster-content');
			container.empty();
			self.current_queue_id = undefined;
			self.hide_logout = false;
			//TODO check render global data
			self.render(container);
		},

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
