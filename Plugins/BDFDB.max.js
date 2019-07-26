if (global.BDFDB && typeof BDFDB.removeEventListener == 'function') BDFDB.removeEventListener(BDFDB);
if (global.BDFDB && BDFDB.WebModules && typeof BDFDB.WebModules.unpatchall == 'function') BDFDB.WebModules.unpatchall(BDFDB);
if (global.BDFDB && typeof BDFDB.killObservers == 'function') BDFDB.killObservers(BDFDB);
var BDFDB = {myPlugins: BDFDB && BDFDB.myPlugins ? BDFDB.myPlugins : {}, BDv2Api: BDFDB && BDFDB.BDv2Api ? BDFDB.BDv2Api : undefined, creationTime: performance.now(), cachedData: {}, pressedKeys: [], mousePosition: {pageX: 0, pageY: 0}, name: '$BDFDB'};
(() => {
	var id = Math.round(Math.random() * 10000000000000000);
	BDFDB.id = id;
	console.log(`%c[BDFDB]%c`, 'color: #3a71c1; font-weight: 700;', '', 'loading library.');
	BDFDB.isLibraryOutdated = function () {
		return performance.now() - BDFDB.creationTime > 600000;
	};

	BDFDB.loadMessage = function (plugin) {
		BDFDB.clearStarttimout(plugin);
		plugin.name = plugin.name || (typeof plugin.getName == "function" ? plugin.getName() : null);
		plugin.version = plugin.version || (typeof plugin.getVersion == "function" ? plugin.getVersion() : null);
		plugin.author = plugin.author || (typeof plugin.getAuthor == "function" ? plugin.getAuthor() : null);
		plugin.description = plugin.description || (typeof plugin.getDescription == "function" ? plugin.getDescription() : null);
		
		var loadmessage = BDFDB.getLibraryStrings().toast_plugin_started.replace('{{oldversion}}', 'v' + plugin.version);
		console.log(`%c[${plugin.name}]%c`, 'color: #3a71c1; font-weight: 700;', '', loadmessage);
		if (!(window.settingsCookie['fork-ps-2'] && window.settingsCookie['fork-ps-2'] === true)) BDFDB.showToast(plugin.name + ' ' + loadmessage, {nopointer: true, selector: 'plugin-started-toast'});
		
		var url = typeof plugin.getRawUrl == 'function' && typeof plugin.getRawUrl() == 'string' ? plugin.getRawUrl() : `https://mwittrien.github.io/BetterDiscordAddons/Plugins/${plugin.name}/${plugin.name}.plugin.js`;
		BDFDB.checkUpdate(plugin.name, url);
		
		if (typeof plugin.initConstructor === 'function') {
			try {plugin.initConstructor();}
			catch (err) {console.error(`%c[${plugin.name}]%c`, 'color: #3a71c1; font-weight: 700;', '', 'Fatal Error: Could not initiate constructor! ' + err);}
		}
		if (typeof plugin.css === 'string') BDFDB.appendLocalStyle(plugin.name, plugin.css);
		
		BDFDB.WebModules.patchModules(plugin);
		
		BDFDB.addOnSwitchListener(plugin);
		BDFDB.addSettingsButtonListener(plugin);
		BDFDB.addContextListener(plugin);
		
		BDFDB.translatePlugin(plugin);
		
		BDFDB.checkChangeLog(plugin);
		
		if (!window.PluginUpdates || typeof window.PluginUpdates !== 'object') window.PluginUpdates = {plugins: {} };
		window.PluginUpdates.plugins[url] = {name: plugin.name, raw: url, version: plugin.version};
		if (typeof window.PluginUpdates.interval === 'undefined') window.PluginUpdates.interval = setInterval(() => {BDFDB.checkAllUpdates();}, 1000*60*60*2);
		
		plugin.started = true;
		
		for (let name in BDFDB.myPlugins) if (!BDFDB.myPlugins[name].started && typeof BDFDB.myPlugins[name].initialize == "function") BDFDB.myPlugins[name].initialize();
	};

	BDFDB.unloadMessage = function (plugin) {
		BDFDB.clearStarttimout(plugin);
		
		delete BDFDB.myPlugins[plugin.name];
		
		var unloadmessage = BDFDB.getLibraryStrings().toast_plugin_stopped.replace('{{oldversion}}', 'v' + plugin.version);
		console.log(`%c[${plugin.name}]%c`, 'color: #3a71c1; font-weight: 700;', '', unloadmessage);
		if (!(window.settingsCookie['fork-ps-2'] && window.settingsCookie['fork-ps-2'] === true)) BDFDB.showToast(plugin.name + ' ' + unloadmessage, {nopointer: true, selector: 'plugin-stopped-toast'});
		
		var url = typeof plugin.getRawUrl == 'function' && typeof plugin.getRawUrl() == 'string' ? plugin.getRawUrl() : `https://mwittrien.github.io/BetterDiscordAddons/Plugins/${plugin.name}/${plugin.name}.plugin.js`;
		
		if (typeof plugin.css === 'string') BDFDB.removeLocalStyle(plugin.name);
		
		BDFDB.WebModules.unpatchall(plugin);
		
		BDFDB.removeOnSwitchListener(plugin);
		BDFDB.removeSettingsButtonListener(plugin);
		BDFDB.removeEventListener(plugin);
		BDFDB.removeEles(`.${plugin.name}-modal, .${plugin.name.toLowerCase()}-modal, .${plugin.name}-settingsmodal, .${plugin.name.toLowerCase()}-settingsmodal`);
		
		BDFDB.killObservers(plugin);
		
		delete window.PluginUpdates.plugins[url];
		if (BDFDB.isObjectEmpty(window.PluginUpdates.plugins)) BDFDB.removeEles('#bd-settingspane-container .bd-updatebtn' + BDFDB.dotCN._repofolderbutton);
		
		delete plugin.started;
	};

	BDFDB.translatePlugin = function (plugin) {
		if (typeof plugin.setLabelsByLanguage === 'function' || typeof plugin.changeLanguageStrings === 'function') {
			if (document.querySelector('html').lang) translate();
			else {
				var translateinterval = setInterval(() => {
					if (document.querySelector('html').lang) {
						clearInterval(translateinterval);
						translate();
					}
				}, 100);
			}
			function translate() {
				var language = BDFDB.getDiscordLanguage();
				if (typeof plugin.setLabelsByLanguage === 'function') plugin.labels = plugin.setLabelsByLanguage(language.id);
				if (typeof plugin.changeLanguageStrings === 'function') plugin.changeLanguageStrings();
				var translatemessage = BDFDB.getLibraryStrings().toast_plugin_translated.replace('{{ownlang}}', language.ownlang);
				console.log(`%c[${plugin.name}]%c`, 'color: #3a71c1; font-weight: 700;', '', translatemessage);
			}
		}
	};

	BDFDB.clearStarttimout = function (plugin) {
		if (plugin.startTimeout) {
			clearTimeout(plugin.startTimeout);
			delete plugin.startTimeout;
		}
		if (plugin.libLoadTimeout) {
			clearTimeout(plugin.libLoadTimeout);
			delete plugin.libLoadTimeout;
		}
	};
	
	BDFDB.checkChangeLog = function (plugin) {
		if (!BDFDB.isObject(plugin) || !plugin.changelog) return;
		var changelog = BDFDB.loadAllData(plugin, 'changelog');
		if (!changelog.currentversion || BDFDB.checkVersions(plugin.version, changelog.currentversion)) {
			changelog.currentversion = plugin.version;
			var changeLogHTML = '';
			var headers = {added: 'New Features', fixed: 'Bug Fixes', improved: 'Improvements', progress: 'Progress'};
			for (let type in plugin.changelog) {
				type = type.toLowerCase();
				var classname = BDFDB.disCN['changelog' + type];
				if (classname) {
					changeLogHTML += `<h1 class="${classname + ' ' + BDFDB.disCN.margintop20}"${changeLogHTML.indexOf('<h1') == -1 ? 'style="margin-top: 0px !important;"' : ''}>${headers[type]}</h1><ul>`;
					for (let log of plugin.changelog[type]) changeLogHTML += `<li><strong>${log[0]}</strong>${log[1] ? (': ' + log[1] + '.') : ''}</li>`;
					changeLogHTML += `</ul>`
				}
			}
			if (changeLogHTML) BDFDB.removeEles(BDFDB.openConfirmModal(plugin, changeLogHTML, BDFDB.LanguageStrings.CHANGE_LOG).querySelectorAll(".btn-cancel"));
			BDFDB.saveAllData(changelog, plugin, 'changelog');
		}
	};

	BDFDB.addObserver = function (plugin, eleOrSelec, observer, config = {childList: true}) {
		if (!BDFDB.isObject(plugin) || !eleOrSelec || !observer) return;
		if (BDFDB.isObjectEmpty(plugin.observers)) plugin.observers = {};
		if (!Array.isArray(plugin.observers[observer.name])) plugin.observers[observer.name] = [];
		if (!observer.multi) for (let subinstance of plugin.observers[observer.name]) subinstance.disconnect();
		if (observer.instance) plugin.observers[observer.name].push(observer.instance);
		var instance = plugin.observers[observer.name][plugin.observers[observer.name].length - 1];
		if (instance) {
			var node = Node.prototype.isPrototypeOf(eleOrSelec) ? eleOrSelec : typeof eleOrSelec === 'string' ? document.querySelector(eleOrSelec) : null;
			if (node) instance.observe(node, config);
		}
	};
	
	BDFDB.killObservers = function (plugin) {
		if (!BDFDB.isObjectEmpty(plugin.observers)) {
			for (let observer in plugin.observers) for (let instance of plugin.observers[observer]) instance.disconnect(); 
			delete plugin.observers;
		}
	};

	BDFDB.addChildEventListener = function (node, actions, selector, callback) {
		if (!Node.prototype.isPrototypeOf(node) || !actions || !selector || !selector.trim() || typeof callback != 'function') return;
		for (var action of actions.trim().split(' ')) if (action) {
			var eventcallback = callback;
			if (action == 'mouseenter' || action == 'mouseleave') eventcallback = e => {if (e.target.matches(selector)) callback(e);};
			node.querySelectorAll(selector.trim()).forEach(child => {child.addEventListener(action, eventcallback, true);});
		}
	};

	BDFDB.addEventListener = function (plugin, ele, actions, selectorOrCallback, callbackOrNothing) {
		if (!BDFDB.isObject(plugin) || (!Node.prototype.isPrototypeOf(ele) && ele !== window) || !actions) return;
		var callbackIs4th = typeof selectorOrCallback == 'function';
		var selector = callbackIs4th ? undefined : selectorOrCallback;
		var callback = callbackIs4th ? selectorOrCallback : callbackOrNothing;
		if (typeof callback != 'function') return;
		BDFDB.removeEventListener(plugin, ele, actions, selector);
		for (var action of actions.split(' ')) {
			action = action.split('.');
			var eventname = action.shift().toLowerCase();
			if (!eventname) return;
			var origeventname = eventname;
			eventname = eventname == 'mouseenter' || eventname == 'mouseleave' ? 'mouseover' : eventname;
			var namespace = (action.join('.') || '') + plugin.name;
			if (!Array.isArray(plugin.listeners)) plugin.listeners = [];
			var eventcallback = null;
			if (selector) {
				if (origeventname == 'mouseenter' || origeventname == 'mouseleave') {
					eventcallback = e => {
						for (let child of e.path) if (typeof child.matches == 'function' && child.matches(selector) && !child[namespace + 'BDFDB' + origeventname]) {
							child[namespace + 'BDFDB' + origeventname] = true;
							if (origeventname == 'mouseenter') callback(BDFDB.copyEvent(e, child));
							let mouseout = e2 => {
								if (e2.target.contains(child) || e2.target == child || !child.contains(e2.target)) {
									if (origeventname == 'mouseleave') callback(BDFDB.copyEvent(e, child));
									delete child[namespace + 'BDFDB' + origeventname];
									document.removeEventListener('mouseout', mouseout);
								}
							};
							document.addEventListener('mouseout', mouseout);
							break;
						}
					};
				}
				else {
					eventcallback = e => {
						for (let child of e.path) if (typeof child.matches == 'function' && child.matches(selector)) {
							callback(BDFDB.copyEvent(e, child));
							break;
						}
					};
				}
			}
			else eventcallback = e => {callback(BDFDB.copyEvent(e, ele));};
			
			plugin.listeners.push({ele, eventname, origeventname, namespace, selector, eventcallback});
			ele.addEventListener(eventname, eventcallback, true);
		}
	};

	BDFDB.copyEvent = function (e, ele) {
		if (!e || !e.constructor || !e.type) return e;
		var ecopy = new e.constructor(e.type, e);
		Object.defineProperty(ecopy, 'originalEvent', {value: e});
		Object.defineProperty(ecopy, 'which', {value: e.which});
		Object.defineProperty(ecopy, 'keyCode', {value: e.keyCode});
		Object.defineProperty(ecopy, 'path', {value: e.path});
		Object.defineProperty(ecopy, 'relatedTarget', {value: e.relatedTarget});
		Object.defineProperty(ecopy, 'srcElement', {value: e.srcElement});
		Object.defineProperty(ecopy, 'target', {value: e.target});
		Object.defineProperty(ecopy, 'toElement', {value: e.toElement});
		if (ele) Object.defineProperty(ecopy, 'currentTarget', {value: ele});
		return ecopy;
	};

	BDFDB.stopEvent = function (e) {
		if (BDFDB.isObject(e)) {
			if (typeof e.preventDefault == "function") e.preventDefault();
			if (typeof e.stopPropagation == "function") e.stopPropagation();
			if (typeof e.stopImmediatePropagation == "function") e.stopImmediatePropagation();
			if (BDFDB.isObject(e.originalEvent)) {
				if (typeof e.originalEvent.preventDefault == "function") e.originalEvent.preventDefault();
				if (typeof e.originalEvent.stopPropagation == "function") e.originalEvent.stopPropagation();
				if (typeof e.originalEvent.stopImmediatePropagation == "function") e.originalEvent.stopImmediatePropagation();
			}
		}
	};

	BDFDB.removeEventListener = function (plugin, ele, actions = '', selector) {
		if (!BDFDB.isObject(plugin) || !Array.isArray(plugin.listeners)) return;
		if (Node.prototype.isPrototypeOf(ele) || ele === window) {
			for (var action of actions.split(' ')) {
				action = action.split('.');
				var eventname = action.shift().toLowerCase();
				var namespace = (action.join('.') || '') + plugin.name;
				for (let listener of plugin.listeners) {
					let removedlisteners = [];
					if (listener.ele == ele && (!eventname || listener.origeventname == eventname) && listener.namespace == namespace && (selector === undefined || listener.selector == selector)) {
						ele.removeEventListener(listener.eventname, listener.eventcallback, true);
						removedlisteners.push(listener);
					}
					if (removedlisteners.length) plugin.listeners = plugin.listeners.filter(listener => {return removedlisteners.indexOf(listener) < 0;});
				}
			}
		}
		else if (!ele) {
			for (let listener of plugin.listeners) listener.ele.removeEventListener(listener.eventname, listener.eventcallback, true);
			plugin.listeners = [];
		}
	};

	BDFDB.checkUpdate = function (plugname, url) {
		if (BDFDB.isBDv2()) return;
		require('request')(url, (error, response, result) => {
			if (error) return;
			var newversion = result.match(/['"][0-9]+\.[0-9]+\.[0-9]+['"]/i);
			if (!newversion) return;
			if (BDFDB.checkVersionDifference(newversion[0], window.PluginUpdates.plugins[url].version) > 0.2) {
				BDFDB.showToast(`${plugname} will be force updated, because your version is heavily outdated.`, {type:"warn", nopointer:true, selector:'plugin-forceupdate-toast'});
				BDFDB.downloadPlugin(plugname, url);
			}
			else if (BDFDB.checkVersions(newversion[0], window.PluginUpdates.plugins[url].version)) BDFDB.showUpdateNotice(plugname, url);
			else BDFDB.removeUpdateNotice(plugname);
		});
	};
	
	BDFDB.checkVersions = function (newv, oldv) {
		if (!newv || !oldv) return true;
		newv = newv.toString().replace(/["'`]/g, '').split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
		oldv = oldv.toString().replace(/["'`]/g, '').split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
		var length = Math.max(newv.length, oldv.length);
		if (!length) return true;
		if (newv.length > oldv.length) {
			var temparray = new Array(newv.length - oldv.length);
			for (let i = 0; i < temparray.length; i++) temparray[i] = 0;
			oldv = temparray.concat(oldv);
		}
		else if (newv.length < oldv.length) {
			var temparray = new Array(oldv.length - newv.length);
			for (let i = 0; i < temparray.length; i++) temparray[i] = 0;
			newv = temparray.concat(newv);
		}
		for (let i = 0; i < length; i++) for (let ioutdated = false, j = 0; j <= i; j++) {
			if (j == i && newv[j] < oldv[j]) return false;
			if (j < i) ioutdated = newv[j] == oldv[j];
			if ((j == 0 || ioutdated) && j == i && newv[j] > oldv[j]) return true;
		}
		return false;
	};
	
	BDFDB.checkVersionDifference = function (newv, oldv) {
		if (!newv || !oldv) return false;
		newv = newv.toString().replace(/["'`]/g, '').split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
		oldv = oldv.toString().replace(/["'`]/g, '').split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
		var length = Math.max(newv.length, oldv.length);
		if (!length) return false;
		if (newv.length > oldv.length) {
			var temparray = new Array(newv.length - oldv.length);
			for (let i = 0; i < temparray.length; i++) temparray[i] = 0;
			oldv = temparray.concat(oldv);
		}
		else if (newv.length < oldv.length) {
			var temparray = new Array(oldv.length - newv.length);
			for (let i = 0; i < temparray.length; i++) temparray[i] = 0;
			newv = temparray.concat(newv);
		}
		var oldvvalue = 0, newvvalue = 0;
		for (let i in oldv.reverse()) oldvvalue += (oldv[i] * (10 ** i));
		for (let i in newv.reverse()) newvvalue += (newv[i] * (10 ** i));
		return (newvvalue - oldvvalue) / (10 ** (length-1));
	};

	BDFDB.showUpdateNotice = function (plugname, url) {
		var updatenotice = document.querySelector('#pluginNotice');
		if (!updatenotice) {
			updatenotice = BDFDB.createNotificationsBar('The following plugins need to be updated:&nbsp;&nbsp;<strong id="outdatedPlugins"></strong>', {html:true, id:'pluginNotice', type:'info', btn:!BDFDB.isRestartNoMoreEnabled() ? 'Reload' : '', customicon:`<svg height="100%" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="100%" version="1.1" viewBox="0 0 2000 2000"><metadata /><defs><filter id="shadow1"><feDropShadow dx="20" dy="0" stdDeviation="20" flood-color="rgba(0,0,0,0.35)"/></filter><filter id="shadow2"><feDropShadow dx="15" dy="0" stdDeviation="20" flood-color="rgba(255,255,255,0.15)"/></filter><filter id="shadow3"><feDropShadow dx="10" dy="0" stdDeviation="20" flood-color="rgba(0,0,0,0.35)"/></filter></defs><g><path style="filter: url(#shadow3)" d="M1195.44+135.442L1195.44+135.442L997.6+136.442C1024.2+149.742+1170.34+163.542+1193.64+179.742C1264.34+228.842+1319.74+291.242+1358.24+365.042C1398.14+441.642+1419.74+530.642+1422.54+629.642L1422.54+630.842L1422.54+632.042C1422.54+773.142+1422.54+1228.14+1422.54+1369.14L1422.54+1370.34L1422.54+1371.54C1419.84+1470.54+1398.24+1559.54+1358.24+1636.14C1319.74+1709.94+1264.44+1772.34+1193.64+1821.44C1171.04+1837.14+1025.7+1850.54+1000+1863.54L1193.54+1864.54C1539.74+1866.44+1864.54+1693.34+1864.54+1296.64L1864.54+716.942C1866.44+312.442+1541.64+135.442+1195.44+135.442Z" fill="#171717" opacity="1"/><path style="filter: url(#shadow2)" d="M1695.54+631.442C1685.84+278.042+1409.34+135.442+1052.94+135.442L361.74+136.442L803.74+490.442L1060.74+490.442C1335.24+490.442+1335.24+835.342+1060.74+835.342L1060.74+1164.84C1150.22+1164.84+1210.53+1201.48+1241.68+1250.87C1306.07+1353+1245.76+1509.64+1060.74+1509.64L361.74+1863.54L1052.94+1864.54C1409.24+1864.54+1685.74+1721.94+1695.54+1368.54C1695.54+1205.94+1651.04+1084.44+1572.64+999.942C1651.04+915.542+1695.54+794.042+1695.54+631.442Z" fill="#3E82E5" opacity="1"/><path style="filter: url(#shadow1)" d="M1469.25+631.442C1459.55+278.042+1183.05+135.442+826.65+135.442L135.45+135.442L135.45+1004C135.45+1004+135.427+1255.21+355.626+1255.21C575.825+1255.21+575.848+1004+575.848+1004L577.45+490.442L834.45+490.442C1108.95+490.442+1108.95+835.342+834.45+835.342L664.65+835.342L664.65+1164.84L834.45+1164.84C923.932+1164.84+984.244+1201.48+1015.39+1250.87C1079.78+1353+1019.47+1509.64+834.45+1509.64L135.45+1509.64L135.45+1864.54L826.65+1864.54C1182.95+1864.54+1459.45+1721.94+1469.25+1368.54C1469.25+1205.94+1424.75+1084.44+1346.35+999.942C1424.75+915.542+1469.25+794.042+1469.25+631.442Z" fill="#FFFFFF" opacity="1"/></g></svg>`});
			updatenotice.style.setProperty('display', 'block', 'important');
			updatenotice.style.setProperty('visibility', 'visible', 'important');
			updatenotice.style.setProperty('opacity', '1', 'important');
			updatenotice.querySelector(BDFDB.dotCN.noticedismiss).addEventListener('click', () => {
				BDFDB.removeEles('.update-clickme-tooltip');
			});
			var reloadbutton = updatenotice.querySelector(BDFDB.dotCN.noticebutton);
			if (reloadbutton) {
				BDFDB.toggleEles(reloadbutton, true);
				reloadbutton.addEventListener('click', () => {
					window.location.reload(false);
				});
				reloadbutton.addEventListener('mouseenter', () => {
					if (window.PluginUpdates.downloaded) BDFDB.createTooltip(window.PluginUpdates.downloaded.join(', '), reloadbutton, {type:'bottom', selector:'update-notice-tooltip', style: 'max-width: 420px'});
				});
			}
		}
		if (updatenotice) {
			var updatenoticelist = updatenotice.querySelector('#outdatedPlugins');
			if (updatenoticelist && !updatenoticelist.querySelector(`#${plugname}-notice`)) {
				if (updatenoticelist.querySelector('span')) updatenoticelist.appendChild(BDFDB.htmlToElement(`<span class="separator">, </span>`));
				var updateentry = BDFDB.htmlToElement(`<span id="${plugname}-notice">${plugname}</span>`);
				updateentry.addEventListener('click', () => {BDFDB.downloadPlugin(plugname, url);});
				updatenoticelist.appendChild(updateentry);
				if (!document.querySelector('.update-clickme-tooltip')) BDFDB.createTooltip('Click us!', updatenoticelist, {type:'bottom', selector:'update-clickme-tooltip', delay:500});
			}
		}
	};

	BDFDB.downloadPlugin = function (plugname, url) {
		require('request')(url, (error, response, result) => {
			if (error) return console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', 'Unable to get update for ' + plugname);
			BDFDB.creationTime = 0;
			var newversion = result.match(/['"][0-9]+\.[0-9]+\.[0-9]+['"]/i);
			newversion = newversion.toString().replace(/['"]/g, '');
			require('fs').writeFileSync(require('path').join(BDFDB.getPluginsFolder(), (bdplugins[plugname] ? bdplugins[plugname].filename : url.split("/").slice(-1)[0])), result);
			BDFDB.showToast(`${plugname} v${window.PluginUpdates.plugins[url].version} has been replaced by ${plugname} v${newversion}.`, {nopointer:true, selector:'plugin-updated-toast'});
			var updatenotice = document.querySelector('#pluginNotice');
			if (updatenotice) {
				if (updatenotice.querySelector(BDFDB.dotCN.noticebutton)) {
					window.PluginUpdates.plugins[url].version = newversion;
					if (!window.PluginUpdates.downloaded) window.PluginUpdates.downloaded = [];
					if (!window.PluginUpdates.downloaded.includes(plugname)) window.PluginUpdates.downloaded.push(plugname);
				}
				BDFDB.removeUpdateNotice(plugname, updatenotice);
			}
		});
	};

	BDFDB.removeUpdateNotice = function (plugname, updatenotice = document.querySelector('#pluginNotice')) {
		if (!updatenotice) return;
		var updatenoticelist = updatenotice.querySelector('#outdatedPlugins');
		if (updatenoticelist) {
			var noticeentry = updatenoticelist.querySelector(`#${plugname}-notice`);
			if (noticeentry) {
				var nextsibling = noticeentry.nextSibling;
				var prevsibling = noticeentry.prevSibling;
				if (nextsibling && BDFDB.containsClass(nextsibling, 'separator')) nextsibling.remove();
				else if (prevsibling && BDFDB.containsClass(prevsibling, 'separator')) prevsibling.remove();
				noticeentry.remove();
			}
			if (!updatenoticelist.querySelector('span')) {
				var reloadbutton = updatenotice.querySelector(BDFDB.dotCN.noticebutton);
				if (reloadbutton) {
					updatenotice.querySelector('.notice-message').innerText = 'To finish updating you need to reload.';
					BDFDB.toggleEles(reloadbutton, false);
				}
				else updatenotice.querySelector(BDFDB.dotCN.noticedismiss).click();
			}
		}
	};

	BDFDB.showToast = function (text, options = {}) {
		var toasts = document.querySelector('.toasts, .bd-toasts');
		if (!toasts) {
			var channels = document.querySelector(BDFDB.dotCN.channels + ' + div');
			var channelrects = channels ? BDFDB.getRects(channels) : null;
			var members = channels ? channels.querySelector(BDFDB.dotCN.memberswrap) : null;
			var left = channelrects ? channelrects.left : 310;
			var width = channelrects ? (members ? channelrects.width - BDFDB.getRects(members).width : channelrects.width) : window.outerWidth - 0;
			var form = channels ? channels.querySelector('form') : null;
			var bottom = form ? BDFDB.getRects(form).height : 80;
			toasts = BDFDB.htmlToElement(`<div class="toasts bd-toasts" style="width:${width}px; left:${left}px; bottom:${bottom}px;"></div>`);
			document.querySelector(BDFDB.dotCN.app).appendChild(toasts);
		}
		const {type = '', icon = true, timeout = 3000, html = false, selector = '', nopointer = false} = options;
		var toast = BDFDB.htmlToElement(`<div class="toast bd-toast">${html === true ? text : BDFDB.encodeToHTML(text)}</div>`);
		if (type) {
			BDFDB.addClass(toast, 'toast-' + type);
			if (icon) BDFDB.addClass(toast, 'icon');
		}
		BDFDB.addClass(toast, selector);
		toasts.appendChild(toast);
		toast.close = () => {
			if (document.contains(toast)) {
				BDFDB.addClass(toast, 'closing');
				setTimeout(() => {
					toast.remove();
					if (!toasts.querySelectorAll('.toast, .bd-toast').length) toasts.remove();
				}, 3000);
			}
		};
		if (nopointer) toast.style.setProperty("pointer-events", "none", "important");
		else toast.addEventListener("click", toast.close);
		setTimeout(() => {toast.close();}, timeout > 0 ? timeout : 600000);
		return toast;
	};

	BDFDB.DesktopNotificationQueue = {queue:[], running:false};
	BDFDB.showDesktopNotification = function (parsedcontent, parsedoptions = {}) {
		var queue = () => {
			BDFDB.DesktopNotificationQueue.queue.push({parsedcontent, parsedoptions});
			runqueue();
		};
		var runqueue = () => {
			if (!BDFDB.DesktopNotificationQueue.running) {
				var notification = BDFDB.DesktopNotificationQueue.queue.shift();
				if (notification) notify(notification.parsedcontent, notification.parsedoptions);
			}
		};
		var notify = (content, options) => {
			BDFDB.DesktopNotificationQueue.running = true;
			var muted = options.silent;
			options.silent = options.silent || options.sound ? true : false;
			var notification = new Notification(content, options);
			var audio = new Audio();
			var timeout = setTimeout(() => {close();}, options.timeout ? options.timeout : 3000);
			if (typeof options.click == 'function') notification.onclick = () => {
				clearTimeout(timeout);
				close();
				options.click();
			};
			if (!muted && options.sound) {
				audio.src = options.sound;
				audio.play();
			}
			var close = () => {
				audio.pause();
				notification.close();
				BDFDB.DesktopNotificationQueue.running = false;
				setTimeout(() => {runqueue();}, 1000);
			};
		};
		if (!('Notification' in window)) {}
		else if (Notification.permission === 'granted') queue();
		else if (Notification.permission !== 'denied') Notification.requestPermission(function (response) {if (response === 'granted') queue();});
	};

	BDFDB.createTooltip = function (text, anker, options = {}) {
		if (!text || !anker || !Node.prototype.isPrototypeOf(anker) || !document.contains(anker)) return null;
		var tooltips = document.querySelector(BDFDB.dotCN.tooltips);
		if (!tooltips) return null;
		var id = Math.round(Math.random() * 10000000000000000);
		var tooltip = BDFDB.htmlToElement(`<div class="${BDFDB.disCN.tooltip} BDFDB-tooltip tooltip-${id}"><div class="${BDFDB.disCN.tooltipinner}"></div></div>`);
		tooltip.anker = anker;
		var tooltipinner = tooltip.firstElementChild ? tooltip.firstElementChild : tooltip;
		if (options.id) tooltip.id = options.id.split(' ').join('');
		if (options.selector) BDFDB.addClass(tooltip, options.selector);
		if (options.css) BDFDB.appendLocalStyle('BDFDBcustomTooltip' + id, options.css, tooltips);
		if (options.style) tooltipinner.style = options.style;
		if (options.html === true) tooltipinner.innerHTML = text;
		else tooltipinner.innerText = text;
		if (options.type && BDFDB.disCN['tooltip' + options.type.toLowerCase()]) {
			BDFDB.addClass(tooltipinner, BDFDB.disCN['tooltip' + options.type.toLowerCase()]);
			tooltipinner.appendChild(BDFDB.htmlToElement(`<div class="${BDFDB.disCN.tooltippointer}"></div>`));
		}
		if (tooltipinner.style.borderColor && tooltipinner.style.backgroundColor) BDFDB.addClass(tooltipinner, 'tooltip-customcolor');
		else if (options.color && BDFDB.disCN['tooltip' + options.color.toLowerCase()]) BDFDB.addClass(tooltipinner, BDFDB.disCN['tooltip' + options.color.toLowerCase()]);
		else BDFDB.addClass(tooltipinner, BDFDB.disCN.tooltipblack);
		tooltips.appendChild(tooltip);
		if (!options.position || options.type) options.position = options.type;
		if (!options.position || !['top','bottom','left','right'].includes(options.position.toLowerCase())) options.position = 'right';
		tooltip.position = options.position.toLowerCase();
		
		BDFDB.updateTooltipPosition(tooltip);
		
		var remove = () => {tooltip.remove();};
		var observer = new MutationObserver(changes => {
			changes.forEach(change => {
				var nodes = Array.from(change.removedNodes);
				var tooltipmath = nodes.indexOf(tooltip) > -1;
				var ownmatch = nodes.indexOf(anker) > -1;
				var parentmatch = nodes.some(n => n.contains(anker));
				if (tooltipmath || ownmatch || parentmatch) {
					observer.disconnect();
					tooltip.remove();
					anker.removeEventListener('mouseleave', remove);
					BDFDB.removeLocalStyle('BDFDBcustomTooltip' + id, tooltips);
				}
			});
		});
		observer.observe(document.body, {subtree:true, childList:true});
		anker.addEventListener('mouseleave', remove);
		if (options.delay) {
			BDFDB.toggleEles(tooltip);
			setTimeout(() => {BDFDB.toggleEles(tooltip);}, options.delay);
		}
		return tooltip;
	};
	
	BDFDB.updateTooltipPosition = function (tooltip) {
		if (!Node.prototype.isPrototypeOf(tooltip) || !Node.prototype.isPrototypeOf(tooltip.anker) || !tooltip.position) return;
		var left, top, ankerects = BDFDB.getRects(tooltip.anker), tooltiprects = BDFDB.getRects(tooltip), positionoffsets = {height: 0, width: 0};
		var pointer = tooltip.querySelector(BDFDB.dotCN.tooltippointer);
		if (pointer) positionoffsets = BDFDB.getRects(pointer);
		switch (tooltip.position) {
			case 'top':
				top = ankerects.top - tooltiprects.height - positionoffsets.height + 2;
				left = ankerects.left + (ankerects.width - tooltiprects.width) / 2;
				break;
			case 'bottom':
				top = ankerects.top + ankerects.height + positionoffsets.height - 2;
				left = ankerects.left + (ankerects.width - tooltiprects.width) / 2;
				break;
			case 'left':
				top = ankerects.top + (ankerects.height - tooltiprects.height) / 2;
				left = ankerects.left - tooltiprects.width - positionoffsets.width + 2;
				break;
			case 'right':
				top = ankerects.top + (ankerects.height - tooltiprects.height) / 2;
				left = ankerects.left + ankerects.width + positionoffsets.width - 2;
				break;
			}
		tooltip.style.setProperty('top', top + 'px');
		tooltip.style.setProperty('left', left + 'px');
		
		var apprects = BDFDB.getRects(document.querySelector(BDFDB.dotCN.appmount)), tooltiprects = BDFDB.getRects(tooltip);
		var tooltippointer = tooltip.querySelector(BDFDB.dotCN.tooltippointer);
		if (tooltip.position == "top" || tooltip.position == "bottom") {
			if (tooltiprects.left < 0) {
				tooltip.style.setProperty('left', '5px');
				tooltippointer.style.setProperty('margin-left', `${tooltiprects.left - 10}px`);
			}
			else {
				var rightmargin = apprects.width - (tooltiprects.left + tooltiprects.width);
				if (rightmargin < 0) {
					tooltip.style.setProperty('left', apprects.width - tooltiprects.width - 5 + 'px');
					tooltippointer.style.setProperty('margin-left', `${-1*rightmargin}px`);
				}
			}
		}
		else if (tooltip.position == "left" || tooltip.position == "right") {
			if (tooltiprects.top < 0) {
				tooltip.style.setProperty('top', '5px');
				tooltippointer.style.setProperty('margin-top', `${tooltiprects.top - 10}px`);
			}
			else {
				var bottommargin = apprects.height - (tooltiprects.top + tooltiprects.height);
				if (bottommargin < 0) {
					tooltip.style.setProperty('top', apprects.height - tooltiprects.height - 5 + 'px');
					tooltippointer.style.setProperty('margin-top', `${-1*bottommargin}px`);
				}
			}
		}
	};

	BDFDB.createNotificationsBar = function (text, options = {}) {
		if (!text) return;
		var layers = document.querySelector(BDFDB.dotCN.layers);
		if (!layers) return;
		var id = Math.round(Math.random() * 10000000000000000);
		var notice = BDFDB.htmlToElement(`<div class="${BDFDB.disCNS.notice + BDFDB.disCNS.size14 + BDFDB.disCNS.weightmedium + BDFDB.disCN.height36} BDFDB-notice notice-${id}"><div class="${BDFDB.disCNS.noticedismiss}" style="height:36px !important;"></div><span class="notice-message"></span></div>`);
		layers.parentElement.insertBefore(notice, layers);
		var noticemessage = notice.querySelector('.notice-message');
		if (options.platform) for (let platform of options.platform.split(' ')) if (DiscordClasses["noticeicon" + platform]) {
			let icon = BDFDB.htmlToElement(`<i class="${BDFDB.disCN["noticeicon" + platform]}"></i>`);
			BDFDB.addClass(icon, BDFDB.disCN.noticeplatformicon);
			BDFDB.removeClass(icon, BDFDB.disCN.noticeicon);
			notice.insertBefore(icon, noticemessage);
		}
		if (options.customicon) {
			let iconinner = BDFDB.htmlToElement(options.customicon)
			let icon = BDFDB.htmlToElement(`<i></i>`);
			if (iconinner.tagName == "span" && !iconinner.firstElementChild) icon.style.setProperty('background', `url(${options.customicon}) center/cover no-repeat`);
			else icon.appendChild(iconinner);
			BDFDB.addClass(icon, BDFDB.disCN.noticeplatformicon);
			BDFDB.removeClass(icon, BDFDB.disCN.noticeicon);
			notice.insertBefore(icon, noticemessage);
		}
		if (options.btn) notice.appendChild(BDFDB.htmlToElement(`<button class="${BDFDB.disCNS.noticebutton + BDFDB.disCNS.size14 + BDFDB.disCN.weightmedium}">${options.btn}</button>`));
		if (options.id) notice.id = options.id.split(' ').join('');
		if (options.selector) BDFDB.addClass(notice, options.selector);
		if (options.css) BDFDB.appendLocalStyle('BDFDBcustomnotibar' + id, options.css);
		if (options.style) notice.style = options.style;
		if (options.html === true) noticemessage.innerHTML = text;
		else {
			var link = document.createElement('a');
			var newtext = [];
			for (let word of text.split(' ')) {
				var encodedword = BDFDB.encodeToHTML(word);
				link.href = word;
				newtext.push(link.host && link.host !== window.location.host ? `<label class="${BDFDB.disCN.textlink}">${encodedword}</label>` : encodedword);
			}
			noticemessage.innerHTML = newtext.join(' ');
		}
		var type = null;
		if (options.type && !document.querySelector(BDFDB.dotCNS.chatbase + BDFDB.dotCN.noticestreamer)) {
			if (type = BDFDB.disCN["notice" + options.type]) BDFDB.addClass(notice, type);
			if (options.type == 'premium') {
				var noticebutton = notice.querySelector(BDFDB.dotCN.noticebutton);
				if (noticebutton) BDFDB.addClass(noticebutton, BDFDB.disCN.noticepremiumaction);
				BDFDB.addClass(noticemessage, BDFDB.disCN.noticepremiumtext);
				notice.insertBefore(BDFDB.htmlToElement(`<i class="${BDFDB.disCN.noticepremiumlogo}"></i>`), noticemessage);
			}
		}
		if (!type) {
			var comp = BDFDB.colorCONVERT(options.color, 'RGBCOMP');
			if (comp) {
				var fontcolor = comp[0] > 180 && comp[1] > 180 && comp[2] > 180 ? '#000' : '#FFF';
				var backgroundcolor = BDFDB.colorCONVERT(comp, 'HEX');
				var filter = comp[0] > 180 && comp[1] > 180 && comp[2] > 180 ? 'brightness(0%)' : 'brightness(100%)';
				BDFDB.appendLocalStyle('BDFDBcustomnotibarColorCorrection' + id, `.BDFDB-notice.notice-${id}{background-color:${backgroundcolor} !important;}.BDFDB-notice.notice-${id} .notice-message {color:${fontcolor} !important;}.BDFDB-notice.notice-${id} ${BDFDB.dotCN.noticebutton} {color:${fontcolor} !important;border-color:${BDFDB.colorSETALPHA(fontcolor,0.25,'RGBA')} !important;}.BDFDB-notice.notice-${id} ${BDFDB.dotCN.noticebutton}:hover {color:${backgroundcolor} !important;background-color:${fontcolor} !important;}.BDFDB-notice.notice-${id} ${BDFDB.dotCN.noticedismiss} {filter:${filter} !important;}`);
			}
			else BDFDB.addClass(notice, BDFDB.disCN.noticedefault);
		}
		notice.style.setProperty('height', '36px', 'important');
		notice.style.setProperty('min-width', '70vw', 'important');
		notice.style.setProperty('left', 'unset', 'important');
		notice.style.setProperty('right', 'unset', 'important');
		let sidemargin = ((BDFDB.getTotalWidth(document.body.firstElementChild) - BDFDB.getTotalWidth(notice))/2);
		notice.style.setProperty('left', sidemargin + 'px', 'important');
		notice.style.setProperty('right', sidemargin + 'px', 'important');
		notice.style.setProperty('min-width', 'unset', 'important');
		notice.style.setProperty('width', 'unset', 'important');
		notice.style.setProperty('max-width', 'calc(100vw - ' + (sidemargin*2) + 'px)', 'important');
		notice.querySelector(BDFDB.dotCN.noticedismiss).addEventListener('click', () => {
			notice.style.setProperty('overflow', 'hidden', 'important');
			notice.style.setProperty('height', '0px', 'important');
			setTimeout(() => {
				BDFDB.removeLocalStyle('BDFDBcustomnotibar' + id);
				BDFDB.removeLocalStyle('BDFDBcustomnotibarColorCorrection' + id);
				notice.remove();
			}, 500);
		});
		return notice;
	};

	BDFDB.getDiscordFolder = function () {
		var built = BDFDB.getDiscordBuilt();
		built = 'discord' + (built == 'stable' ? '' : built);
		return require('path').resolve(require('electron').remote.app.getPath('appData'), built, BDFDB.getDiscordVersion());
	};

	BDFDB.getPluginsFolder = function () {
		var process = require('process');
		var path = require('path');
		if (process.env.injDir) return path.resolve(process.env.injDir, 'plugins/');
		switch (process.platform) {
			case 'win32':
				return path.resolve(process.env.appdata, 'BetterDiscord/plugins/');
			case 'darwin':
				return path.resolve(process.env.HOME, 'Library/Preferences/BetterDiscord/plugins/');
			default:
				if (process.env.XDG_CONFIG_HOME) return path.resolve(process.env.XDG_CONFIG_HOME, 'BetterDiscord/plugins/');
				else return path.resolve(process.env.HOME, '.config/BetterDiscord/plugins/');
			}
	};

	BDFDB.getThemesFolder = function () {
		var process = require('process');
		var path = require('path');
		if (process.env.injDir) return path.resolve(process.env.injDir, 'plugins/');
		switch (process.platform) {
			case 'win32': 
				return path.resolve(process.env.appdata, 'BetterDiscord/themes/');
			case 'darwin': 
				return path.resolve(process.env.HOME, 'Library/Preferences/BetterDiscord/themes/');
			default:
				if (process.env.XDG_CONFIG_HOME) return path.resolve(process.env.XDG_CONFIG_HOME, 'BetterDiscord/themes/');
				else return path.resolve(process.env.HOME, '.config/BetterDiscord/themes/');
			}
	};

	BDFDB.checkWhichRepoPage = function (usersettings = document.querySelector(BDFDB.dotCN.layer + '[layer-id="user-settings"]')) {
		if (!usersettings) return;
		var folderbutton = usersettings.querySelector(BDFDB.dotCN._repofolderbutton);
		if (!folderbutton) return;
		var header = folderbutton.parentElement.querySelector('h2');
		if (header && header.innerText) {
			let headertext = header.innerText.toLowerCase();
			if (headertext === 'plugins' || headertext === 'themes') return headertext;
		}
	};

	BDFDB.checkAllUpdates = function () {
		for (let url in window.PluginUpdates.plugins) {
			var plugin = window.PluginUpdates.plugins[url];
			BDFDB.checkUpdate(plugin.name, plugin.raw);
		}
	};

	BDFDB.getLineOfString = function (stringbody, string) {
		if (typeof stringbody != "string" || typeof stringbody != "string") return -1;
		let index = stringbody.indexOf(string);
		if (index < 0) return -1;
		return stringbody.substring(0, index).split('\n').length;
	};
	
	BDFDB.sortObject = function (obj, sort, except) {
		var newobj = {};
		if (sort === undefined || !sort) for (let key of Object.keys(obj).sort()) newobj[key] = obj[key];
		else {
			let values = [];
			for (let key in obj) values.push(obj[key]);
			values = BDFDB.sortArrayByKey(values, sort, except);
			for (let value of values) for (let key in obj) if (BDFDB.equals(value, obj[key])) {
				newobj[key] = value;
				break;
			}
		}
		return newobj;
	};

	BDFDB.reverseObject = function (obj, sort) {
		var newobj = {};
		for (let key of (sort === undefined || !sort) ? Object.keys(obj).reverse() : Object.keys(obj).sort().reverse()) newobj[key] = obj[key];
		return newobj;
	};

	BDFDB.filterObject = function (obj, filter) {
		return Object.keys(obj).filter(key => filter(obj[key])).reduce((newobj, key) => (newobj[key] = obj[key], newobj), {});
	};

	BDFDB.isObject = function (obj) {
		return obj && Object.prototype.isPrototypeOf(obj) && !Array.prototype.isPrototypeOf(obj);
	};

	BDFDB.isObjectEmpty = function (obj) {
		return typeof obj !== 'object' || Object.getOwnPropertyNames(obj).length == 0;
	};

	BDFDB.pushToObject = function (obj, value) {
		if (BDFDB.isObject(obj)) obj[Object.keys(obj).length] = value;
	};

	BDFDB.deepAssign = function (obj, ...objs) {
		if (!objs.length) return obj;
		var nextobj = objs.shift();
		if (BDFDB.isObject(obj) && BDFDB.isObject(nextobj)) {
			for (var key in nextobj) {
				if (BDFDB.isObject(nextobj[key])) {
					if (!obj[key]) Object.assign(obj, {[key]:{}});
					BDFDB.deepAssign(obj[key], nextobj[key]);
				}
				else Object.assign(obj, {[key]:nextobj[key]});
			}
		}
		return BDFDB.deepAssign(obj, ...objs);
	};

	BDFDB.sortArrayByKey = function (array, key, except) {
		if (except === undefined) except = null;
		return array.sort(function (x, y) {
			var xvalue = x[key], yvalue = y[key];
			if (xvalue !== except) return xvalue < yvalue ? -1 : xvalue > yvalue ? 1 : 0;
		});
	};

	BDFDB.numSortArray = function (array, key, except) {
		return array.sort(function (x, y) {return x < y ? -1 : x > y ? 1 : 0;});
	};

	BDFDB.removeFromArray = function (array, value, all = false) {
		if (!array || !value || !Array.isArray(array) || !array.includes(value)) return array;
		if (!all) array.splice(array.indexOf(value), 1);
		else while (array.indexOf(value) > -1) array.splice(array.indexOf(value), 1);
		return array;
	};

	BDFDB.getAllIndexes = function (array, value) {
		var indexes = [], index = -1;
		while ((index = array.indexOf(value, index + 1)) !== -1) indexes.push(index);
		return indexes;
	};

	BDFDB.removeCopiesFromArray = function (array) {
		return [...new Set(array)];
	};

	BDFDB.highlightText = function (text, searchstring) {
		if (!searchstring || searchstring.length < 1) return text;
		var offset = 0, original = text, prefix = `<span class="${BDFDB.disCN.highlight}">`, suffix = `</span>`;
		BDFDB.getAllIndexes(text.toUpperCase(), searchstring.toUpperCase()).forEach(index => {
			var d1 = offset * (prefix.length + suffix.length);
			index = index + d1;
			var d2 = index + searchstring.length;
			var d3 = [-1].concat(BDFDB.getAllIndexes(text.substring(0, index), '<'));
			var d4 = [-1].concat(BDFDB.getAllIndexes(text.substring(0, index), '>'));
			if (d3[d3.length - 1] > d4[d4.length - 1]) return;
			text = text.substring(0, index) + prefix + text.substring(index, d2) + suffix + text.substring(d2);
			offset++;
		});
		return text ? text : original;
	};
	
	BDFDB.languages = {
		'$discord': 	{name:'Discord (English (US))', id:'en-US', ownlang:'English (US)', integrated:false, dic:false, deepl:false},
		'af':			{name:'Afrikaans', id:'af', ownlang:'Afrikaans', integrated:false, dic:true, deepl:false},
		'sq':			{name:'Albanian', id:'sq', ownlang:'Shqiptar', integrated:false, dic:false, deepl:false},
		'am':			{name:'Amharic', id:'am', ownlang:'አማርኛ', integrated:false, dic:false, deepl:false},
		'ar':			{name:'Arabic', id:'ar', ownlang:'اللغة العربية', integrated:false, dic:false, deepl:false},
		'hy':			{name:'Armenian', id:'hy', ownlang:'Հայերեն', integrated:false, dic:false, deepl:false},
		'az':			{name:'Azerbaijani', id:'az', ownlang:'آذربایجان دیلی', integrated:false, dic:false, deepl:false},
		'eu':			{name:'Basque', id:'eu', ownlang:'Euskara', integrated:false, dic:false, deepl:false},
		'be':			{name:'Belarusian', id:'be', ownlang:'Беларуская', integrated:false, dic:false, deepl:false},
		'bn':			{name:'Bengali', id:'bn', ownlang:'বাংলা', integrated:false, dic:false, deepl:false},
		'bs':			{name:'Bosnian', id:'bs', ownlang:'Босански', integrated:false, dic:false, deepl:false},
		'bg':			{name:'Bulgarian', id:'bg', ownlang:'български', integrated:true, dic:false, deepl:false},
		'my':			{name:'Burmese', id:'my', ownlang:'မြန်မာစာ', integrated:false, dic:false, deepl:false},
		'ca':			{name:'Catalan', id:'ca', ownlang:'Català', integrated:false, dic:false, deepl:false},
		'ceb':			{name:'Cebuano', id:'ceb', ownlang:'Bisaya', integrated:false, dic:false, deepl:false},
		'ny':			{name:'Chewa', id:'ny', ownlang:'Nyanja', integrated:false, dic:false, deepl:false},
		'zh-HK':		{name:'Chinese (Hong Kong)', id:'zh-HK', ownlang:'香港中文', integrated:false, dic:false, deepl:false},
		'zh-CN':		{name:'Chinese (Simplified)', id:'zh-CN', ownlang:'简体中文', integrated:false, dic:false, deepl:false},
		'zh-TW':		{name:'Chinese (Traditional)', id:'zh-TW', ownlang:'繁體中文', integrated:true, dic:false, deepl:false},
		'co':			{name:'Corsican', id:'co', ownlang:'Corsu', integrated:false, dic:false, deepl:false},
		'hr':			{name:'Croatian', id:'hr', ownlang:'Hrvatski', integrated:true, dic:false, deepl:false},
		'cs':			{name:'Czech', id:'cs', ownlang:'Čeština', integrated:true, dic:false, deepl:false},
		'da':			{name:'Danish', id:'da', ownlang:'Dansk', integrated:true, dic:true, deepl:false},
		'nl':			{name:'Dutch', id:'nl', ownlang:'Nederlands', integrated:true, dic:true, deepl:true},
		'en':			{name:'English', id:'en', ownlang:'English', integrated:false, dic:true, deepl:true},
		'en-GB':		{name:'English (UK)', id:'en-GB', ownlang:'English (UK)', integrated:true, dic:true, deepl:false},
		'en-US':		{name:'English (US)', id:'en-US', ownlang:'English (US)', integrated:true, dic:true, deepl:false},
		'eo':			{name:'Esperanto', id:'eo', ownlang:'Esperanto', integrated:false, dic:false, deepl:false},
		'et':			{name:'Estonian', id:'et', ownlang:'Eesti', integrated:false, dic:false, deepl:false},
		'fil':			{name:'Filipino', id:'fil', ownlang:'Wikang Filipino', integrated:false, dic:false, deepl:false},
		'fi':			{name:'Finnish', id:'fi', ownlang:'Suomi', integrated:true, dic:false, deepl:false},
		'fr':			{name:'French', id:'fr', ownlang:'Français', integrated:true, dic:true, deepl:true},
		'fr-CA':		{name:'French (Canadian)', id:'fr-CA', ownlang:'Français Canadien', integrated:false, dic:false, deepl:false},
		'fy':			{name:'Frisian', id:'fy', ownlang:'Frysk', integrated:false, dic:false, deepl:false},
		'gl':			{name:'Galician', id:'gl', ownlang:'Galego', integrated:false, dic:false, deepl:false},
		'ka':			{name:'Georgian', id:'ka', ownlang:'ქართული', integrated:false, dic:false, deepl:false},
		'de':			{name:'German', id:'de', ownlang:'Deutsch', integrated:true, dic:true, deepl:true},
		'de-AT':		{name:'German (Austria)', id:'de-AT', ownlang:'Österreichisch Deutsch', integrated:false, dic:false, deepl:false},
		'de-CH':		{name:'German (Switzerland)', id:'de-CH', ownlang:'Schweizerdeutsch', integrated:false, dic:false, deepl:false},
		'el':			{name:'Greek', id:'el', ownlang:'Ελληνικά', integrated:false, dic:false, deepl:false},
		'gu':			{name:'Gujarati', id:'gu', ownlang:'ગુજરાતી', integrated:false, dic:false, deepl:false},
		'ht':			{name:'Haitian Creole', id:'ht', ownlang:'Kreyòl Ayisyen', integrated:false, dic:false, deepl:false},
		'ha':			{name:'Hausa', id:'ha', ownlang:'حَوْسَ', integrated:false, dic:false, deepl:false},
		'haw':			{name:'Hawaiian', id:'haw', ownlang:'ʻŌlelo Hawaiʻi', integrated:false, dic:false, deepl:false},
		'iw':			{name:'Hebrew', id:'iw', ownlang:'עברית', integrated:false, dic:false, deepl:false},
		'hi':			{name:'Hindi', id:'hi', ownlang:'हिन्दी', integrated:false, dic:false, deepl:false},
		'hmn':			{name:'Hmong', id:'hmn', ownlang:'lol Hmongb', integrated:false, dic:false, deepl:false},
		'hu':			{name:'Hungarain', id:'hu', ownlang:'Magyar', integrated:false, dic:false, deepl:false},
		'is':			{name:'Icelandic', id:'is', ownlang:'Íslenska', integrated:false, dic:false, deepl:false},
		'ig':			{name:'Igbo', id:'ig', ownlang:'Asụsụ Igbo', integrated:false, dic:false, deepl:false},
		'id':			{name:'Indonesian', id:'id', ownlang:'Bahasa Indonesia', integrated:false, dic:false, deepl:false},
		'ga':			{name:'Irish', id:'ga', ownlang:'Gaeilge', integrated:false, dic:false, deepl:false},
		'it':			{name:'Italian', id:'it', ownlang:'Italiano', integrated:true, dic:true, deepl:true},
		'ja':			{name:'Japanese', id:'ja', ownlang:'日本語', integrated:true, dic:false, deepl:false},
		'jv':			{name:'Javanese', id:'jv', ownlang:'ꦧꦱꦗꦮ', integrated:false, dic:false, deepl:false},
		'kn':			{name:'Kannada', id:'kn', ownlang:'ಕನ್ನಡ', integrated:false, dic:false, deepl:false},
		'kk':			{name:'Kazakh', id:'kk', ownlang:'Қазақ Tілі', integrated:false, dic:false, deepl:false},
		'km':			{name:'Khmer', id:'km', ownlang:'ភាសាខ្មែរ', integrated:false, dic:false, deepl:false},
		'ko':			{name:'Korean', id:'ko', ownlang:'한국어', integrated:true, dic:false, deepl:false},
		'ku':			{name:'Kurdish', id:'ku', ownlang:'کوردی', integrated:false, dic:false, deepl:false},
		'ky':			{name:'Kyrgyz', id:'ky', ownlang:'кыргызча', integrated:false, dic:false, deepl:false},
		'lo':			{name:'Lao', id:'lo', ownlang:'ພາສາລາວ', integrated:false, dic:false, deepl:false},
		'la':			{name:'Latin', id:'la', ownlang:'Latina', integrated:false, dic:false, deepl:false},
		'lv':			{name:'Latvian', id:'lv', ownlang:'Latviešu', integrated:false, dic:false, deepl:false},
		'lt':			{name:'Lithuanian', id:'lt', ownlang:'Lietuvių', integrated:false, dic:false, deepl:false},
		'lb':			{name:'Luxembourgish', id:'lb', ownlang:'Lëtzebuergesch', integrated:false, dic:false, deepl:false},
		'mk':			{name:'Macedonian', id:'mk', ownlang:'Mакедонски', integrated:false, dic:false, deepl:false},
		'mg':			{name:'Malagasy', id:'mg', ownlang:'Malagasy', integrated:false, dic:false, deepl:false},
		'ms':			{name:'Malay', id:'ms', ownlang:'بهاس ملايو', integrated:false, dic:false, deepl:false},
		'ml':			{name:'Malayalam', id:'ml', ownlang:'മലയാളം', integrated:false, dic:false, deepl:false},
		'mt':			{name:'Maltese', id:'mt', ownlang:'Malti', integrated:false, dic:false, deepl:false},
		'mi':			{name:'Maori', id:'mi', ownlang:'te Reo Māori', integrated:false, dic:false, deepl:false},
		'mr':			{name:'Marathi', id:'mr', ownlang:'मराठी', integrated:false, dic:false, deepl:false},
		'mn':			{name:'Mongolian', id:'mn', ownlang:'Монгол Хэл', integrated:false, dic:false, deepl:false},
		'ne':			{name:'Nepali', id:'ne', ownlang:'नेपाली', integrated:false, dic:false, deepl:false},
		'no':			{name:'Norwegian', id:'no', ownlang:'Norsk', integrated:true, dic:false, deepl:false},
		'ps':			{name:'Pashto', id:'ps', ownlang:'پښتو', integrated:false, dic:false, deepl:false},
		'fa':			{name:'Persian', id:'fa', ownlang:'فارسی', integrated:false, dic:false, deepl:false},
		'pl':			{name:'Polish', id:'pl', ownlang:'Polski', integrated:true, dic:false, deepl:true},
		'pt':			{name:'Portuguese', id:'pt', ownlang:'Português', integrated:false, dic:true, deepl:true},
		'pt-BR':		{name:'Portuguese (Brazil)', id:'pt-BR', ownlang:'Português do Brasil', integrated:true, dic:true, deepl:false},
		'pt-PT':		{name:'Portuguese (Portugal)', id:'pt-PT', ownlang:'Português do Portugal', integrated:false, dic:false, deepl:false},
		'pa':			{name:'Punjabi', id:'pa', ownlang:'पंजाबी', integrated:false, dic:false, deepl:false},
		'ro':			{name:'Romanian', id:'ro', ownlang:'Română', integrated:false, dic:false, deepl:false},
		'ru':			{name:'Russian', id:'ru', ownlang:'Pусский', integrated:true, dic:true, deepl:true},
		'sm':			{name:'Samoan', id:'sm', ownlang:'Gagana Sāmoa', integrated:false, dic:false, deepl:false},
		'gd':			{name:'Scottish Gaelic', id:'gd', ownlang:'Gàidhlig', integrated:false, dic:false, deepl:false},
		'sr':			{name:'Serbian', id:'sr', ownlang:'Српски', integrated:false, dic:false, deepl:false},
		'st':			{name:'Sotho', id:'st', ownlang:'Sesotho', integrated:false, dic:false, deepl:false},
		'sn':			{name:'Shona', id:'sn', ownlang:'Shona', integrated:false, dic:false, deepl:false},
		'sd':			{name:'Sindhi', id:'sd', ownlang:'سنڌي', integrated:false, dic:false, deepl:false},
		'si':			{name:'Sinhala', id:'si', ownlang:'සිංහල', integrated:false, dic:false, deepl:false},
		'sk':			{name:'Slovak', id:'sk', ownlang:'Slovenčina', integrated:false, dic:false, deepl:false},
		'sl':			{name:'Slovenian', id:'sl', ownlang:'Slovenščina', integrated:false, dic:false, deepl:false},
		'es':			{name:'Spanish', id:'es', ownlang:'Español', integrated:true, dic:true, deepl:true},
		'es-419':		{name:'Spanish (Latin America)', id:'es-419', ownlang:'Español latinoamericano', integrated:false, dic:false, deepl:false},
		'sw':			{name:'Swahili', id:'sw', ownlang:'Kiswahili', integrated:false, dic:false, deepl:false},
		'sv':			{name:'Swedish', id:'sv', ownlang:'Svenska', integrated:true, dic:true, deepl:false},
		'tg':			{name:'Tajik', id:'tg', ownlang:'тоҷикӣ', integrated:false, dic:false, deepl:false},
		'ta':			{name:'Tamil', id:'ta', ownlang:'தமிழ்', integrated:false, dic:false, deepl:false},
		'te':			{name:'Telugu', id:'te', ownlang:'తెలుగు', integrated:false, dic:false, deepl:false},
		'th':			{name:'Thai', id:'th', ownlang:'ภาษาไทย', integrated:false, dic:false, deepl:false},
		'tr':			{name:'Turkish', id:'tr', ownlang:'Türkçe', integrated:true, dic:false, deepl:false},
		'uk':			{name:'Ukrainian', id:'uk', ownlang:'Yкраїнський', integrated:true, dic:false, deepl:false},
		'ur':			{name:'Urdu', id:'ur', ownlang:'اُردُو', integrated:false, dic:false, deepl:false},
		'uz':			{name:'Uzbek', id:'uz', ownlang:'اوزبیک', integrated:false, dic:false, deepl:false},
		'vi':			{name:'Vietnamese', id:'vi', ownlang:'Tiếng Việt Nam', integrated:false, dic:false, deepl:false},
		'cy':			{name:'Welsh', id:'cy', ownlang:'Cymraeg', integrated:false, dic:false, deepl:false},
		'xh':			{name:'Xhosa', id:'xh', ownlang:'Xhosa', integrated:false, dic:false, deepl:false},
		'yi':			{name:'Yiddish', id:'yi', ownlang:'ייִדיש ייִדיש‬', integrated:false, dic:false, deepl:false},
		'yo':			{name:'Yoruba', id:'yo', ownlang:'Èdè Yorùbá', integrated:false, dic:false, deepl:false},
		'zu':			{name:'Zulu', id:'zu', ownlang:'Zulu', integrated:false, dic:false, deepl:false}
	};
	
	var languageinterval = setInterval(() => {
		if (document.querySelector('html').lang) {
			clearInterval(languageinterval);
			var language = BDFDB.getDiscordLanguage();
			BDFDB.languages.$discord.name = `Discord (${language.name})`;
			BDFDB.languages.$discord.id = language.id;
			BDFDB.languages.$discord.ownlang = language.ownlang;
		}
	}, 100);

	BDFDB.getDiscordBuilt = function () {
		if (BDFDB.getDiscordBuilt.built) return BDFDB.getDiscordBuilt.built;
		else {
			var built = null;
			try {built = require(require('electron').remote.app.getAppPath() + '/build_info.json').releaseChannel.toLowerCase();} 
			catch (err) {
				try {built = require(require('electron').remote.app.getAppPath().replace('\app.asar', '') + '/build_info.json').releaseChannel.toLowerCase();} 
				catch (err) {
					var version = BDFDB.getDiscordVersion();
					if (version) {
						version = version.split('.');
						if (version.length == 3 && !isNaN(version = parseInt(version[2]))) built = version > 300 ? 'stable' : da > 200 ? 'canary' : 'ptb';
						else built = 'stable';
					}
					else built = 'stable';
				}
			}
			BDFDB.getDiscordBuilt.built = built;
			return built;
		}
	};

	BDFDB.getDiscordVersion = function () {
		if (BDFDB.getDiscordBuilt.version) return BDFDB.getDiscordBuilt.version;
		else {
			var version = null;
			try {version = require('electron').remote.app.getVersion();}
			catch (version) {version = '';}
			BDFDB.getDiscordBuilt.version = version;
			return version;
		}
	};

	BDFDB.getDiscordLanguage = function () {
		var lang = document.querySelector('html').lang || 'en-US';
		var langids = lang.split('-');
		var langid = langids[0];
		var langid2 = langids[1] || '';
		lang = langid2 && langid.toUpperCase() !== langid2.toUpperCase() ? langid + '-' + langid2 : langid;
		return BDFDB.languages[lang] || BDFDB.languages[langid] || BDFDB.languages['en-US'];
	};

	BDFDB.getDiscordTheme = function () {
		return document.querySelectorAll(BDFDB.dotCN.themelight).length >= document.querySelectorAll(BDFDB.dotCN.themedark).length ? BDFDB.disCN.themelight : BDFDB.disCN.themedark;
	};

	BDFDB.getDiscordMode = function () {
		return document.querySelectorAll(BDFDB.dotCN.messagegroupcompact).length >= document.querySelectorAll(BDFDB.dotCN.messagegroupcozy).length ? 'compact' : 'cozy';
	};

	BDFDB.getDiscordZoomFactor = function () {
		var apprects = BDFDB.getRects(document.body.firstElementChild);
		var widthzoom = Math.round(100 * window.outerWidth / apprects.width);
		var heightzoom = Math.round(100 * window.outerHeight / apprects.height);
		return widthzoom < heightzoom ? widthzoom : heightzoom;
	};

	BDFDB.getDiscordFontScale = function () {
		return parseInt(document.firstElementChild.style.fontSize.replace('%', ''));
	};

	BDFDB.isColorBlindModeEnabled = function () {
		return !!document.querySelector('[mask="url(#svg-mask-status-idle)"],[mask="url(#svg-mask-status-dnd)"],[mask="url(#svg-mask-status-offline)"],[mask="url(#svg-mask-status-streaming)"]');
	};

	BDFDB.getReactInstance = function (node) {
		if (!BDFDB.isObject(node)) return null;
		return node[Object.keys(node).find(key => key.startsWith('__reactInternalInstance'))];
	};

	BDFDB.getReactValue = function (nodeOrInstance, valuepath) {
		if (!nodeOrInstance || !valuepath) return null;
		let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.getReactInstance(nodeOrInstance) : nodeOrInstance;
		if (!BDFDB.isObject(instance)) return null;
		let found = instance;
		for (let key of valuepath.split('.').filter(n => n)) {
			found = found[key];
			if (found == undefined) return null;
		}
		return found;
	};

	BDFDB.getOwnerInstance = function (config) {
		if (config === undefined) return null;
		if (!config.node && !config.instance || !config.name && (!config.props || !Array.isArray(config.props))) return null;
		var instance = config.instance || BDFDB.getReactInstance(config.node);
		if (!instance) return null;
		config.name = config.name && !Array.isArray(config.name) ? Array.of(config.name) : config.name;
		var depth = -1;
		var maxdepth = config.depth === undefined ? 15 : config.depth;
		var up = config.up === undefined ? false : config.up;
		var start = performance.now();
		var maxtime = config.time === undefined ? 150 : config.time;
		var whitelist = up ? {return:true, sibling:true, _reactInternalFiber:true} : {child:true, sibling:true, _reactInternalFiber:true};
		var foundinstances = {};
		var singleinstance = getInstance(instance);
		if (config.all) {
			for (let type in foundinstances) {
				if (config.group) for (let instance in foundinstances[type]) delete foundinstances[type][instance].BDFDBreactSearch;
				else delete foundinstances[type].BDFDBreactSearch;
			}
			return foundinstances;
		}
		else return singleinstance;
		
		function getInstance(instance) {
			depth++;
			if (!instance || Node.prototype.isPrototypeOf(instance) || BDFDB.getReactInstance(instance) || depth > maxdepth || performance.now() - start > maxtime) result = null;
			else {
				var keys = Object.getOwnPropertyNames(instance);
				var result = null;
				for (let i = 0; result == null && i < keys.length; i++) {
					var key = keys[i];
					var value = instance[key];
					var statenode = instance.stateNode ? instance.stateNode : (instance.return ? instance.return.stateNode : null);
					if (statenode && !Node.prototype.isPrototypeOf(statenode) && (instance.type && config.name && config.name.some(name => instance.type.displayName === name.split(' ')[0] || instance.type.name === name.split(' ')[0]) || config.props && config.props.every(prop => statenode[prop] !== undefined) || config.defaultProps && config.defaultProps.every(prop => statenode[prop] !== undefined))) {
						if (config.all === undefined || !config.all) result = statenode;
						else if (config.all) {
							if (config.noCopies === undefined || !config.noCopies || config.noCopies && !statenode.BDFDBreactSearch) {
								statenode.BDFDBreactSearch = true;
								if (config.group) {
									if (config.name && instance.type && (instance.type.displayName || instance.type.name)) {
										var group = 'Default';
										for (let name of config.name) if (instance.type.displayName === name.split(' ')[0] || instance.type.name === name.split(' ')[0]) {
											group = name;
											break;
										}
										if (typeof foundinstances[group] == 'undefined') foundinstances[group] = {};
										BDFDB.pushToObject(foundinstances[group], statenode);
									}
								}
								else BDFDB.pushToObject(foundinstances, statenode);
							}
						}
					}
					if (result == null && (typeof value === 'object' || typeof value === 'function') && whitelist[key]) result = getInstance(value);
				}
			}
			depth--;
			return result;
		}
	};

	BDFDB.getKeyInformation = function (config) {
		if (config === undefined) return null;
		if (!config.node && !config.instance || !config.key) return null;
		var instance = config.instance || BDFDB.getReactInstance(config.node);
		if (!instance) return null;
		var depth = -1;
		var maxdepth = config.depth === undefined ? 15 : config.depth;
		var start = performance.now();
		var maxtime = config.time === undefined ? 150 : config.time;
		var whitelist = {
			props: true,
			state: true,
			stateNode: true,
			refs: true,
			updater: true,
			prototype: true,
			type: true,
			children: config.up ? false : true,
			type: true,
			memoizedProps: true,
			memoizedState: true,
			child: config.up ? false : true,
			return: config.up ? true : false,
			sibling: config.up ? false : true,
			firstEffect: true
		};
		var blacklist = {
			contextSection: true
		};
		if (typeof config.whitelist === 'object') Object.assign(whitelist, config.whiteList);
		if (typeof config.blacklist === 'object') Object.assign(blacklist, config.blacklist);
		var foundkeys = [];
		var singlekey = getKey(instance);
		if (config.all) return foundkeys;
		else return singlekey;
		function getKey(instance) {
			depth++;
			if (!instance || Node.prototype.isPrototypeOf(instance) || BDFDB.getReactInstance(instance) || depth > maxdepth || performance.now() - start > maxtime) result = null;
			else {
				var keys = Object.getOwnPropertyNames(instance);
				var result = null;
				for (let i = 0; result == null && i < keys.length; i++) {
					var key = keys[i];
					if (key && !blacklist[key]) {
						var value = instance[key];
						if (config.key === key && (config.value === undefined || config.value === value)) {
							if (config.all === undefined || !config.all) result = value;
							else if (config.all) {
								if (config.noCopies === undefined || !config.noCopies) foundkeys.push(value);
								else if (config.noCopies) {
									var copy = false;
									for (let foundkey of foundkeys) if (BDFDB.equals(value, foundkey)) {
										copy = true;
										break;
									}
									if (!copy) foundkeys.push(value);
								}
							}
						}
						else if ((typeof value === 'object' || typeof value === 'function') && (whitelist[key] || key[0] == '.' || !isNaN(key[0]))) result = getKey(value);
					}
				}
			}
			depth--;
			return result;
		}
	};

	BDFDB.WebModules = {};
	BDFDB.WebModules.find = function (filter) {
		if (!BDFDB.WebModules.find.req) {
			const id = "BDFDB-WebModules";
			const req = typeof(window.webpackJsonp) == "function" ? window.webpackJsonp([], {[id]: (module, exports, req) => exports.default = req}, [id]).default : window.webpackJsonp.push([[], {[id]: (module, exports, req) => module.exports = req}, [[id]]]);
			delete req.m[id];
			delete req.c[id];
			BDFDB.WebModules.find.req = req;
		}
		for (let m in BDFDB.WebModules.find.req.c) {
			if (BDFDB.WebModules.find.req.c.hasOwnProperty(m)) {
				var module = BDFDB.WebModules.find.req.c[m].exports;
				if (module && module.__esModule && module.default && filter(module.default)) return module.default;
				if (module && filter(module)) return module;
			}
		}
	};

	BDFDB.WebModules.cachedData = {prop:{},name:{},proto:{}};
	BDFDB.WebModules.findByProperties = function (properties) {
		properties = Array.isArray(properties) ? properties : Array.from(arguments);
		var cachestring = JSON.stringify(properties);
		if (BDFDB.WebModules.cachedData.prop[cachestring]) return BDFDB.WebModules.cachedData.prop[cachestring];
		else {
			var module = BDFDB.WebModules.find(module => properties.every(prop => module[prop] !== undefined));
			if (module) {
				BDFDB.WebModules.cachedData.prop[cachestring] = module;
				return module;
			}
			else console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', cachestring + ' [properties] not found in WebModules');
		}
	};

	BDFDB.WebModules.findByName = function (name) {
		var cachestring = JSON.stringify(name);
		if (BDFDB.WebModules.cachedData.name[cachestring]) return BDFDB.WebModules.cachedData.name[cachestring];
		else {
			var module = BDFDB.WebModules.find(module => module.displayName === name);
			if (module) {
				BDFDB.WebModules.cachedData.name[cachestring] = module;
				return module;
			}
			else console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', cachestring + ' [name] not found in WebModules');
		}
	};

	BDFDB.WebModules.findByPrototypes = function (protoprops) {
		protoprops = Array.isArray(protoprops) ? protoprops : Array.from(arguments);
		var cachestring = JSON.stringify(protoprops);
		if (BDFDB.WebModules.cachedData.proto[cachestring]) return BDFDB.WebModules.cachedData.proto[cachestring];
		else {
			var module = BDFDB.WebModules.find(module => module.prototype && protoprops.every(prop => module.prototype[prop] !== undefined));
			if (module) {
				BDFDB.WebModules.cachedData.proto[cachestring] = module;
				return module;
			}
			else console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', cachestring + ' [prototypes] not found in WebModules');
		}
	};

	BDFDB.WebModules.patchtypes = ['before', 'instead', 'after'];
	BDFDB.WebModules.patchmap = {
		Account: 'FluxContainer(Account)',
		BannedCard: 'BannedUser',
		InvitationCard: 'InviteRow',
		InviteCard: 'InviteRow',
		PopoutContainer: 'Popout',
		MemberCard: 'Member',
		Note: 'FluxContainer(Note)',
		WebhookCard: 'Webhook'
	};
	BDFDB.WebModules.notfindablemodules = {
		AuthWrapper: 'loginscreen',
		BannedCard: 'guildsettingsbannedcard',
		ChannelMember: 'member',
		CircleIconButton: 'guildbuttoncontainer',
		EmojiPicker: 'emojipicker',
		FriendsOnline: 'friendsonline',
		FriendRow: 'friendsrow',
		Guild: 'guildcontainer',
		GuildHeader: 'guildheader',
		InstantInviteModal: 'invitemodalwrapper',
		InvitationCard: 'invitemodalinviterow',
		InviteCard: 'guildsettingsinvitecard',
		PopoutContainer: 'popout',
		PrivateChannelCall: 'callcurrentcontainer',
		MemberCard: 'guildsettingsmembercard',
		Message: 'message',
		MessageOptionPopout: 'optionpopout',
		MessageUsername: 'messageusername',
		NameTag: 'nametag',
		SearchResults: 'searchresultswrap',
		TypingUsers: 'typing',
		UserPopout: 'userpopout',
		V2C_List: '_repolist',
		V2C_PluginCard: '_repoheader',
		V2C_ThemeCard: '_repoheader'
	};
	BDFDB.WebModules.patch = function (module, modulefunctions, plugin, patchfunctions) {
		if (!module || !modulefunctions || !plugin || !Object.keys(patchfunctions).some(type => BDFDB.WebModules.patchtypes.includes(type))) return null;
		const plugname = (typeof plugin === 'string' ? plugin : plugin.name).toLowerCase();
		const surpressErrors = (callback, errorstring) => (...args) => {
			try {return callback(...args);}
			catch (err) {console.error('Error occurred in ' + errorstring, err);}
		};
		if (!module.BDFDBpatch) module.BDFDBpatch = {};
		modulefunctions = Array.isArray(modulefunctions) ? modulefunctions : Array.of(modulefunctions);
		for (let modulefunction of modulefunctions) {
			if (!module[modulefunction]) module[modulefunction] = () => {};
			const originalfunction = module[modulefunction];
			if (!module.BDFDBpatch[modulefunction]) {
				module.BDFDBpatch[modulefunction] = {};
				for (let type of BDFDB.WebModules.patchtypes) module.BDFDBpatch[modulefunction][type] = {};
				module.BDFDBpatch[modulefunction].originalMethod = originalfunction;
				module[modulefunction] = function () {
					const data = {
						thisObject: this,
						methodArguments: arguments,
						originalMethod: originalfunction,
						originalMethodName: modulefunction,
						callOriginalMethod: () => data.returnValue = data.originalMethod.apply(data.thisObject, data.methodArguments)
					};
					if (global.BDFDB && typeof BDFDB === 'object' && BDFDB.loaded && module.BDFDBpatch[modulefunction]) {
						if (!BDFDB.isObjectEmpty(module.BDFDBpatch[modulefunction].before)) for (let id in BDFDB.sortObject(module.BDFDBpatch[modulefunction].before)) {
							surpressErrors(module.BDFDBpatch[modulefunction].before[id], '`before` callback of ' + module[modulefunction].displayName)(data);
						}
						if (BDFDB.isObjectEmpty(module.BDFDBpatch[modulefunction].instead)) data.callOriginalMethod();
						else for (let id in BDFDB.sortObject(module.BDFDBpatch[modulefunction].instead)) {
							const tempreturn = surpressErrors(module.BDFDBpatch[modulefunction].instead[id], '`instead` callback of ' + module[modulefunction].displayName)(data);
							if (tempreturn !== undefined) data.returnValue = tempreturn;
						}
						if (!BDFDB.isObjectEmpty(module.BDFDBpatch[modulefunction].after)) for (let id in BDFDB.sortObject(module.BDFDBpatch[modulefunction].after)) {
							surpressErrors(module.BDFDBpatch[modulefunction].after[id], '`after` callback of ' + module[modulefunction].displayName)(data);
						}
					}
					else data.callOriginalMethod();
					return data.returnValue;
				};
			}
			for (let type of BDFDB.WebModules.patchtypes) if (typeof patchfunctions[type] == 'function') module.BDFDBpatch[modulefunction][type][plugname] = patchfunctions[type];
		}
		const cancel = () => {BDFDB.WebModules.unpatch(module, modulefunctions, plugin);};
		if (plugin && typeof plugin == 'object') {
			if (!Array.isArray(plugin.patchCancels)) plugin.patchCancels = [];
			plugin.patchCancels.push(cancel);
		}
		return cancel;
	};

	BDFDB.WebModules.unpatch = function (module, modulefunctions, plugin) {
		if (!module || !module.BDFDBpatch) return;
		const plugname = !plugin ? null : (typeof plugin === 'string' ? plugin : plugin.name).toLowerCase();
		modulefunctions = Array.isArray(modulefunctions) ? modulefunctions : Array.of(modulefunctions);
		for (let modulefunction of modulefunctions) {
			if (module[modulefunction] && module.BDFDBpatch[modulefunction]) {
				for (let type of BDFDB.WebModules.patchtypes) {
					if (plugname) delete module.BDFDBpatch[modulefunction][type][plugname];
					else delete module.BDFDBpatch[modulefunction][type];
				}
				var empty = true;
				for (let type of BDFDB.WebModules.patchtypes) if (!BDFDB.isObjectEmpty(module.BDFDBpatch[modulefunction][type])) empty = false;
				if (empty) {
					module[modulefunction] = module.BDFDBpatch[modulefunction].originalMethod;
					delete module.BDFDBpatch[modulefunction];
					if (BDFDB.isObjectEmpty(module.BDFDBpatch)) delete module.BDFDBpatch;
				}
			}
		}
	};

	BDFDB.WebModules.unpatchall = function (plugin) {
		if (BDFDB.isObject(plugin) && Array.isArray(plugin.patchCancels)) for (let cancel of plugin.patchCancels) cancel();
	};

	BDFDB.WebModules.forceAllUpdates = function (plugin, selectedtype) {
		selectedtype = selectedtype && BDFDB.WebModules.patchmap[selectedtype] ? BDFDB.WebModules.patchmap[selectedtype] + ' ' + selectedtype : selectedtype;
		if (BDFDB.isObject(plugin) && BDFDB.isObject(plugin.patchModules) && (!selectedtype || plugin.patchModules[selectedtype])) {
			const app = document.querySelector(BDFDB.dotCN.app);
			const bdsettings = document.querySelector('#bd-settingspane-container ' + BDFDB.dotCN.scrollerwrap);
			if (app) {
				var filteredmodules = [];
				for (let type in plugin.patchModules) {
					var methodnames = Array.isArray(plugin.patchModules[type]) ? plugin.patchModules[type] : Array.of(plugin.patchModules[type]);
					if (methodnames.includes('componentDidUpdate') || methodnames.includes('componentDidMount') || methodnames.includes('render')) filteredmodules.push(type);
				}
				filteredmodules = selectedtype ? filteredmodules.filter(type => type == selectedtype) : filteredmodules;
				if (filteredmodules.length > 0) {
					const appins = BDFDB.getOwnerInstance({node:app, name:filteredmodules, all:true, noCopies:true, group:true, depth:99999999, time:99999999});
					for (let type in appins) for (let i in appins[type]) BDFDB.WebModules.initiateProcess(plugin, appins[type][i], type, ['componentDidUpdate', 'componentDidMount', 'render']);
					if (bdsettings) {
						const bdsettingsins = BDFDB.getOwnerInstance({node:bdsettings, name:filteredmodules, all:true, noCopies:true, group:true, depth:99999999, time:99999999});
						for (let type in bdsettingsins) for (let i in bdsettingsins[type]) BDFDB.WebModules.initiateProcess(plugin, bdsettingsins[type][i], type, ['componentDidUpdate', 'componentDidMount', 'render']);
					}
				}
			}
		}
	};

	BDFDB.WebModules.patchModules = function (plugin) {
		if (BDFDB.isObject(plugin) && BDFDB.isObject(plugin.patchModules)) {
			for (let type in plugin.patchModules) {
				var mapped = BDFDB.WebModules.patchmap[type];
				if (mapped) {
					plugin.patchModules[mapped + ' ' + type] = plugin.patchModules[type];
					delete plugin.patchModules[type];
					if (!BDFDB.WebModules.notfindablemodules[type]) patchInstance(BDFDB.WebModules.findByName(mapped), mapped + ' ' + type);
				}
				else if (!BDFDB.WebModules.notfindablemodules[type]) patchInstance(BDFDB.WebModules.findByName(type), type);
			}
			for (let type in BDFDB.WebModules.notfindablemodules) {
				var patchtype = BDFDB.WebModules.patchmap[type] ? BDFDB.WebModules.patchmap[type] + ' ' + type : type;
				if (DiscordClasses[BDFDB.WebModules.notfindablemodules[type]] && plugin.patchModules[patchtype]) checkForInstance(BDFDB.WebModules.notfindablemodules[type], patchtype);
			}
			function patchInstance(instance, type) {
				if (instance) {
					var patchtype = type.split(' ')[0];
					instance = instance.displayName == patchtype ? instance : BDFDB.getOwnerInstance({instance:instance, name:patchtype, up:true});
					if (instance) {
						var patchinstance = instance._reactInternalFiber && instance._reactInternalFiber.type ? instance._reactInternalFiber.type : instance;
						var patchfunction = {};
						patchfunction[plugin.name == '$BDFDB' ? 'before' : 'after'] = e => {
							if (global.BDFDB && typeof BDFDB === 'object' && BDFDB.loaded) BDFDB.WebModules.initiateProcess(plugin, e.thisObject, type, [e.originalMethodName]);
						};
						BDFDB.WebModules.patch(patchinstance.prototype, plugin.patchModules[type], plugin, patchfunction);
					}
				}
			}
			function checkForInstance(classname, type) {
				var instancefound = false;
				const app = document.querySelector(BDFDB.dotCN.app);
				const bdsettings = document.querySelector('#bd-settingspane-container ' + BDFDB.dotCN.scrollerwrap);
				if (app) {
					var appins = BDFDB.getOwnerInstance({node:app, name:type, depth:99999999, time:99999999});
					if (appins) {
						instancefound = true;
						patchInstance(appins, type);
					}
				}
				if (!instancefound && bdsettings) {
					var bdsettingsins = BDFDB.getOwnerInstance({node:bdsettings, name:type, depth:99999999, time:99999999});
					if (bdsettingsins) {
						instancefound = true;
						patchInstance(bdsettingsins, type);
					}
				}
				if (!instancefound) {
					var found = false, instanceobserver = new MutationObserver(changes => {changes.forEach(change => {change.addedNodes.forEach(node => {
						var ele = null;
						if (!found && node.tagName && (ele = BDFDB.containsClass(node, BDFDB.disCN[classname]) ? node : node.querySelector(BDFDB.dotCN[classname])) != null) {
							instance = BDFDB.getReactInstance(ele);
							if (isCorrectInstance(instance, type)) {
								found = true;
								instanceobserver.disconnect();
								patchInstance(instance, type);
								BDFDB.WebModules.forceAllUpdates(plugin, type);
							}
						}
					});});});
					BDFDB.addObserver(plugin, BDFDB.dotCN.appmount, {name:'checkForInstanceObserver', instance:instanceobserver, multi:true
					}, {childList:true, subtree:true});
				}
			}
			function isCorrectInstance(instance, type) {
				if (!instance) return false;
				instance = instance.displayName == type ? instance : BDFDB.getOwnerInstance({instance:instance, name:type, up:true});
				return instance && (type != 'V2C_PluginCard' && type != 'V2C_ThemeCard' || type == 'V2C_PluginCard' && BDFDB.checkWhichRepoPage() == 'plugins' || type == 'V2C_ThemeCard' && BDFDB.checkWhichRepoPage() == 'themes');
			}
		}
	};

	BDFDB.WebModules.initiateProcess = function (plugin, instance, type, methodnames) {
		if (BDFDB.isObject(plugin) && instance) {
			plugin = plugin.name == '$BDFDB' ? BDFDBpatches : plugin;
			type = (type.split(' ')[1] || type).replace(/[^A-z0-9]|_/g, '');
			type = type[0].toUpperCase() + type.slice(1);
			if (typeof plugin['process' + type] == 'function') {
				var wrapper = BDFDB.React.findDOMNodeSafe(instance);
				if (wrapper) plugin['process' + type](instance, wrapper, methodnames);
				else setImmediate(() => {
					wrapper = BDFDB.React.findDOMNodeSafe(instance);
					if (wrapper) plugin['process' + type](instance, wrapper, methodnames);
				});
			}
		}
	};
	
	var React = BDFDB.WebModules.findByProperties('createElement', 'cloneElement');
	var ReactDOM = BDFDB.WebModules.findByProperties('render', 'findDOMNode');
	if (React && ReactDOM) {
		BDFDB.React = Object.assign({}, React, ReactDOM);
		BDFDB.React.findDOMNodeSafe = function (instance) {
			if (!instance || !instance.updater || typeof instance.updater.isMounted !== 'function' || !instance.updater.isMounted(instance)) return null;
			var node = ReactDOM.findDOMNode(instance) || BDFDB.getReactValue(instance, 'child.stateNode');
			return Node.prototype.isPrototypeOf(node) ? node : null;
		};
	};

	BDFDB.addOnSwitchListener = function (plugin) {
		if (typeof plugin.onSwitch === 'function') {
			BDFDB.removeOnSwitchListener(plugin);
			var spacer = document.querySelector(BDFDB.dotCN.guildswrapper + ' + * > ' + BDFDB.dotCN.chatspacer);
			if (spacer) {
				var nochannelobserver = new MutationObserver(changes => {changes.forEach(change => {
					if (change.target && BDFDB.containsClass(change.target, BDFDB.disCN.nochannel)) plugin.onSwitch();
				});});
				var nochannel = spacer.querySelector(BDFDB.dotCNC.chat + BDFDB.dotCN.nochannel);
				if (nochannel) nochannelobserver.observe(nochannel, {attributes:true});
				plugin.onSwitchFix = new MutationObserver(changes => {changes.forEach(change => {if (change.addedNodes) {change.addedNodes.forEach(node => {
					if (BDFDB.containsClass(node, BDFDB.disCN.chat, BDFDB.disCN.nochannel, false)) nochannelobserver.observe(node, {attributes:true});
				});}});});
				plugin.onSwitchFix.observe(spacer, {childList:true});
			}
		}
	};

	BDFDB.removeOnSwitchListener = function (plugin) {
		if (typeof plugin.onSwitch === 'function' && BDFDB.isObject(plugin.onSwitchFix)) {
			plugin.onSwitchFix.disconnect();
			delete plugin.onSwitchFix;
		}
	};

	BDFDB.addContextListener = function (plugin) {
		for (let type of ['User', 'Guild', 'Channel', 'GroupDM', 'Message', 'Native', 'UserSettingsCog']) {
			if (typeof plugin[`on${type}Context`] === 'function' || typeof plugin[`on${type}ContextMenu`] === 'function') {
				if (type == 'GroupDM') {
					var found = false, instanceobserver = new MutationObserver(changes => {changes.forEach(change => {change.addedNodes.forEach(node => {
						var ele = null;
						if (!found && node.tagName && (ele = BDFDB.containsClass(node, BDFDB.disCN.contextmenu) ? node : node.querySelector(BDFDB.dotCN.contextmenu)) != null) {
							var instance = BDFDB.getReactInstance(ele);
							if (instance && instance.return && instance.return.type && instance.return.type.displayName == type + "ContextMenu") {
								found = true;
								instanceobserver.disconnect();
								patchContext(type, instance.return.type);
								processContext(type, instance.return.stateNode, instance.stateNode);
							}
						}
					});});});
					BDFDB.addObserver(plugin, BDFDB.dotCN.appmount, {name:'checkForContextObserver', instance:instanceobserver, multi:true
					}, {childList:true, subtree:true});
				}
				else patchContext(type, BDFDB.WebModules.findByName(type + 'ContextMenu'));
			}
		}
		
		function patchContext (type, module) {
			if (module && module.prototype) BDFDB.WebModules.patch(module.prototype, 'componentDidMount', plugin, {after:e => {
				processContext(type, e.thisObject, BDFDB.React.findDOMNodeSafe(e.thisObject));
			}});
		}
		
		function processContext (type, instance, menu) {
			if (instance && menu) {
				if (typeof plugin[`on${type}Context`] === 'function') plugin[`on${type}Context`](instance, menu);
				if (typeof plugin[`on${type}ContextMenu`] === 'function') plugin[`on${type}ContextMenu`](instance, menu);
				BDFDB.initElements(menu, plugin);
				BDFDB.updateContextPosition(menu);
			}
		}
	};

	BDFDB.addSettingsButtonListener = function (plugin) {
		if (BDFDB.isBDv2() && typeof plugin.getSettingsPanel === 'function') {
			BDFDB.removeSettingsButtonListener(plugin);
			BDFDB.appendSettingsButton(plugin);
			var BDv2settings = document.querySelector('.bd-content-region > .bd-content');
			if (BDv2settings) {
				plugin.settingsButtonObserver = new MutationObserver(changes => {changes.forEach(change => {if (change.addedNodes) {change.addedNodes.forEach(node => {
					if (node.tagName && BDFDB.containsClass(node, 'active')) BDFDB.appendSettingsButton(plugin);
				});}});});
				plugin.settingsButtonObserver.observe(BDv2settings, {childList:true});
			}
		}
	};

	BDFDB.appendSettingsButton = function (plugin) {
		var plugincard = document.querySelector(`${BDFDB.dotCN._bdv2card}[data-plugin-id=${plugin.id}]`);
		if (plugincard) {
			var settingsbutton = BDFDB.htmlToElement(`<div class="BDFDB-settingsbutton ${BDFDB.disCNS._bdv2button + BDFDB.disCN._bdv2hastooltip}"><span class="${BDFDB.disCN._bdv2materialdesignicon}"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M12,15.5C10.07,15.5 8.5,13.93 8.5,12C8.5,10.07 10.07,8.5 12,8.5C13.93,8.5 15.5,10.07 15.5,12C15.5,13.93 13.93,15.5 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"></path></svg></span></div>`);
			plugincard.insertBefore(settingsbutton, plugincard.querySelector(BDFDB.d._bdv2button));
			settingsbutton.addEventListener('mouseenter', () => {
				BDFDB.createTooltip('Settings', settingsbutton, {type:'top'});
				BDFDB.addClass(settingsbutton, BDFDB.disCN._bdv2tooltipopen);
			});
			settingsbutton.addEventListener('mouseleave', () => {
				BDFDB.removeClass(settingsbutton, BDFDB.disCN._bdv2tooltipopen);
			});
			settingsbutton.addEventListener('click', () => {
				var settingsmodal = BDFDB.htmlToElement(`<span class="BDFDB-modal BDFDB-settingsmodal ${plugin.id}-settingsmodal"><div class="${BDFDB.disCN.backdrop}"></div><div class="${BDFDB.disCN.modal}"><div class="${BDFDB.disCN.modalinner}"><div class="${BDFDB.disCNS.modalsub + BDFDB.disCN.modalsizemedium}" style="width:600px !important;"><div class="${BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontal + BDFDB.disCNS.horizontal2 + BDFDB.disCNS.directionrow + BDFDB.disCNS.justifystart + BDFDB.disCNS.aligncenter + BDFDB.disCNS.nowrap + BDFDB.disCN.modalheader}" style="flex:0 0 auto;"><div class="${BDFDB.disCN.flexchild}" style="flex:1 1 auto;"><h4 class="${BDFDB.disCNS.h4 + BDFDB.disCNS.headertitle + BDFDB.disCNS.size16 + BDFDB.disCNS.height20 + BDFDB.disCNS.weightsemibold + BDFDB.disCNS.defaultcolor + BDFDB.disCNS.h4defaultmargin + BDFDB.disCN.marginreset}">${plugin.name} Settings</h4></div><button type="button" class="${BDFDB.disCNS.modalclose + BDFDB.disCNS.flexchild + BDFDB.disCNS.button + BDFDB.disCNS.buttonlookblank + BDFDB.disCNS.buttoncolorbrand + BDFDB.disCN.buttongrow}"><div class="${BDFDB.disCN.buttoncontents}"><svg class="" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 12 12"><g fill="none" fill-rule="evenodd"><path d="M0 0h12v12H0"></path><path class="fill" fill="currentColor" d="M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5l-.705.705L5.295 6 2.5 8.795l.705.705L6 6.705 8.795 9.5l.705-.705L6.705 6"></path></g></svg></div></button></div><div class="${BDFDB.disCNS.scrollerwrap + BDFDB.disCNS.modalcontent + BDFDB.disCNS.scrollerthemed + BDFDB.disCN.themeghosthairline}"><div class="${BDFDB.disCNS.scroller + BDFDB.disCN.modalsubinner}"></div></div></div></div></div></span>`);
				var settingshtml = plugin.getSettingsPanel();
				settingsmodal.querySelector(BDFDB.dotCN.modalsubinner).appendChild(typeof settingshtml == 'string' ? BDFDB.htmlToElement(settingshtml) : settingshtml);
				if (typeof plugin.onSettingsClosed === 'function') BDFDB.addChildEventListener(settingsmodal, 'click', BDFDB.dotCNC.modalclose + BDFDB.dotCN.backdrop, () => {
					plugin.onSettingsClosed();
				});
				BDFDB.appendModal(settingsmodal);
			});
		}
	};

	BDFDB.removeSettingsButtonListener = function (plugin) {
		if (BDFDB.isBDv2() && typeof plugin.settingsButtonObserver === 'object') {
			BDFDB.removeEles(`.bd-card[data-plugin-id=${plugin.id}] .BDFDB-settingsbutton`);
			plugin.settingsButtonObserver.disconnect();
			delete plugin.settingsButtonObserver;
		}
	};
	
	var LanguageStringsVars = {}, LanguageModule = BDFDB.WebModules.findByProperties("Messages"), LanguageStrings = LanguageModule ? Object.assign({},LanguageModule._proxyContext.defaultMessages) : {};
	BDFDB.LanguageStrings = new Proxy(LanguageStrings, {
		get: function (list, item) {
			var stringobj = LanguageModule.Messages[item];
			if (!stringobj) console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', item + ' not found in BDFDB.LanguageStrings');
			else {
				var string = typeof stringobj == 'object' ? stringobj.format(Object.assign({}, LanguageStringsVars)) : stringobj;
				if (typeof string == "string") return string;
				else if (Array.isArray(string)) {
					var newstring = "";
					for (let ele of string) {
						if (typeof ele == "string") newstring += BDFDB.encodeToHTML(ele);
						else if (BDFDB.isObject(ele) && ele.props) newstring += `<${ele.type}>${BDFDB.encodeToHTML(ele.props.children[0].toString())}</${ele.type}>`
					}
					return newstring;
				}
				else console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', item + ' could not be parsed from BDFDB.LanguageStrings');
			}
			return "";
		}
	});
	BDFDB.LanguageStringsCheck = new Proxy(LanguageStrings, {
		get: function (list, item) {
			return LanguageModule.Messages[item];
		}
	});
	BDFDB.LanguageStringsFormat = function (item, value) {
		if (item && value) {
			var stringobj = LanguageModule.Messages[item];
			if (stringobj && typeof stringobj == "object" && typeof stringobj.format == "function") {
				try {
					var valueobject = {};
					for (let key in LanguageStringsVars) valueobject[key] = value;
					var string = stringobj.format(valueobject);
					if (typeof string == "string") return string;
					else if (Array.isArray(string)) {
						var newstring = "";
						for (let ele of string) {
							if (typeof ele == "string") newstring += BDFDB.encodeToHTML(ele);
							else if (BDFDB.isObject(ele) && ele.props) newstring += `<${ele.type}>${BDFDB.encodeToHTML(ele.props.children[0].toString())}</${ele.type}>`
						}
						return newstring;
					}
				}
				catch (err) {console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', item + ' failed to format string in BDFDB.LanguageStrings');}
			}
			else console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', item + ' is not a formatable string in BDFDB.LanguageStrings');
		}
		else console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', item + ' enter a valid key and value to format the string');
		return "";
	};
	if (LanguageModule) for (let string in LanguageStrings) {
		try {BDFDB.LanguageStrings[string];}
		catch (err) {
			let strvar = err.toString().split('for: ')[1];
			if (strvar && typeof strvar == 'string' && !LanguageStringsVars[strvar]) LanguageStringsVars[strvar] = `{{${strvar.toLowerCase()}}}`;
		}
	};

	BDFDB.equals = function (mainA, mainB, sorted) {
		var i = -1;
		if (sorted === undefined || typeof sorted !== 'boolean') sorted = false;
		return equal(mainA, mainB);
		function equal(a, b) {
			i++;
			var result = true;
			if (i > 1000) result = null;
			else {
				if (typeof a !== typeof b) result = false;
				else if (typeof a === 'undefined') result = true;
				else if (typeof a === 'symbol') result = true;
				else if (typeof a === 'boolean') result = a == b;
				else if (typeof a === 'string') result = a == b;
				else if (typeof a === 'number') {
					if (isNaN(a) || isNaN(b)) result = isNaN(a) == isNaN(b);
					else result = a == b;
				}
				else if (!a && !b) result = true;
				else if (!a || !b) result = false;
				else if (typeof a === 'function' || typeof a === 'object') {
					var keysA = Object.getOwnPropertyNames(a);
					var keysB = Object.getOwnPropertyNames(b);
					if (keysA.length !== keysB.length) result = false;
					else for (let j = 0; result === true && j < keysA.length; j++) {
						if (sorted) result = equal(a[keysA[j]], b[keysB[j]]);
						else result = equal(a[keysA[j]], b[keysA[j]]);
					}
				}
			}
			i--;
			return result;
		}
	};
	
	var myDataUser = BDFDB.WebModules.findByProperties('getCurrentUser').getCurrentUser();
	BDFDB.myData = new Proxy(myDataUser || {}, {
		get: function (list, item) {
			if (!myDataUser) myDataUser = BDFDB.WebModules.findByProperties('getCurrentUser').getCurrentUser();
			return myDataUser ? myDataUser[item] : null;
		}
	});

	BDFDB.getGuildIcon = function (id) {
		var guild = BDFDB.WebModules.findByProperties('getGuild', 'getGuilds').getGuild(typeof id == 'number' ? id.toFixed() : id);
		if (!guild || !guild.icon) return null;
		return BDFDB.WebModules.findByProperties('getGuildIconURL').getGuildIconURL(guild).split('?')[0];
	};

	BDFDB.getGuildBanner = function (id) {
		var guild = BDFDB.WebModules.findByProperties('getGuild', 'getGuilds').getGuild(typeof id == 'number' ? id.toFixed() : id);
		if (!guild || !guild.banner) return null;
		return BDFDB.WebModules.findByProperties('getGuildBannerURL').getGuildBannerURL(guild).split('?')[0];
	};

	BDFDB.getUserStatus = function (id = BDFDB.myData.id) {
		id = typeof id == 'number' ? id.toFixed() : id;
		var StatusUtils = BDFDB.WebModules.findByProperties('getApplicationActivity', 'getStatus');
		return BDFDB.WebModules.findByProperties('isStreaming').isStreaming(StatusUtils.getApplicationActivity(id)) ? 'streaming' : StatusUtils.getStatus(id);
	};

	BDFDB.getUserStatusColor = function (status) {
		status = typeof status == "string" ? status.toLowerCase() : null;
		switch (status) {
			case 'online': return '#43b581';
			case 'idle': return '#faa61a';
			case 'dnd': return '#f04747';
			case 'streaming': return '#593695';
			default: return '#747f8d';
		}
	};

	BDFDB.getUserAvatar = function (id = BDFDB.myData.id) {
		var user = BDFDB.WebModules.findByProperties('getUser', 'getUsers').getUser(typeof id == 'number' ? id.toFixed() : id);
		if (!user) return 'https://discordapp.com/assets/322c936a8c8be1b803cd94861bdfa868.png';
		else return ((user.avatar ? '' : 'https://discordapp.com') + BDFDB.WebModules.findByProperties('getUserAvatarURL').getUserAvatarURL(user)).split('?')[0];
	};
	
	BDFDB.Permissions = BDFDB.WebModules.findByProperties("Permissions", "ActivityTypes").Permissions;
	BDFDB.isUserAllowedTo = function (permission, id = BDFDB.myData.id, channelid = BDFDB.WebModules.findByProperties('getLastSelectedChannelId').getChannelId()) {
		if (!BDFDB.Permissions[permission]) console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', permission + ' not found in Permissions');
		else {
			var channel = BDFDB.WebModules.findByProperties('getChannels').getChannel(channelid);
			if (channel) return BDFDB.WebModules.findByProperties("getChannelPermissions", "canUser").canUser(id, BDFDB.Permissions[permission], channel);
		}
		return false;
	};

	BDFDB.getChannelIcon = function (id) {
		var channel = BDFDB.WebModules.findByProperties('getChannel', 'getChannels').getChannel(id = typeof id == 'number' ? id.toFixed() : id);
		if (!channel) return null;
		if (!channel.icon) return channel.type == 1 ? BDFDB.getUserAvatar(channel.recipients[0]) : (channel.type == 3 ? 'https://discordapp.com/assets/f046e2247d730629309457e902d5c5b3.svg' : null);
		return BDFDB.WebModules.findByProperties('getChannelIconURL').getChannelIconURL(channel).split('?')[0];
	};

	BDFDB.getParsedLength = function (string, channelid = BDFDB.WebModules.findByProperties('getLastSelectedChannelId').getChannelId()) {
		if (!string) return 0;
		var channel = BDFDB.WebModules.findByProperties('getChannels', 'getChannel').getChannel(channelid);
		var length = (string.indexOf('/') == 0 || string.indexOf('s/') == 0 || string.indexOf('+:') == 0) ? string.length : BDFDB.WebModules.findByProperties('parse', 'isMentioned').parse(channel, string).content.length;
		return length > string.length ? length : string.length;
	};

	BDFDB.readServerList = function () {
		var found = [], ins = BDFDB.getOwnerInstance({node:document.querySelector(BDFDB.dotCN.guilds), name:['Guild','GuildIcon'], all:true, noCopies:true, depth:99999999, time:99999999});
		for (let info in ins) if (ins[info].props && ins[info].props.guild) found.push(Object.assign(new ins[info].props.guild.constructor(ins[info].props.guild), {div:ins[info].handleContextMenu ? BDFDB.React.findDOMNodeSafe(ins[info]) : BDFDB.htmlToElement(`<div class="${BDFDB.disCNS.guildouter + BDFDB.disCN._bdguild}"><div class="${BDFDB.disCNS.guildpillwrapper + BDFDB.disCN.guildpill}"><span class="${BDFDB.disCN.guildpillitem}" style="opacity: 0; height: 8px; transform: translate3d(0px, 0px, 0px);"></span></div><div class="${BDFDB.disCN.guildcontainer}" draggable="false"><div class="${BDFDB.disCN.guildinner}"><svg width="48" height="48" viewBox="0 0 48 48" class="${BDFDB.disCN.guildsvg}"><mask id="BDFDB_GUILD_${ins[info].props.guild.id}" fill="black" x="0" y="0" width="48" height="48"><path d="M48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24Z" fill="white"></path><rect x="28" y="-4" width="24" height="24" rx="12" ry="12" transform="translate(20 -20)" fill="black"></rect><rect x="28" y="28" width="24" height="24" rx="12" ry="12" transform="translate(20 20)" fill="black"></rect></mask><foreignObject mask="url(BDFDB_GUILD_${ins[info].props.guild.id})" x="0" y="0" width="48" height="48"><a class="${BDFDB.disCN.guildiconwrapper}" draggable="false">${ins[info].props.guild.icon ? `<img class="${BDFDB.disCN.guildicon}" src="${BDFDB.getGuildIcon(ins[info].props.guild.id)}" width="48" height="48" draggable="false"></img>` : `<div class="${BDFDB.disCN.guildiconacronym}" aria-hidden="true" style="font-size: 10px;">${ins[info].props.guild.acronym}</div>`}</a></foreignObject></svg><div class="${BDFDB.disCN.guildbadgewrapper}"></div></div></div><div class="${BDFDB.disCN.guildedgewrapper}" aria-hidden="true"><span class="${BDFDB.disCN.guildedge}"></span><span class="${BDFDB.disCN.guildedge}"></span></div></div>`), instance:ins[info]}));
		return found;
	};

	BDFDB.readUnreadServerList = function (servers) {
		var found = [];
		for (let info of servers === undefined || !Array.isArray(servers) ? BDFDB.readServerList() : servers) {
			let div = Node.prototype.isPrototypeOf(info) ? info : info && info.div ? info.div : null;
			let props = BDFDB.getReactValue(div, "return.stateNode.props");
			if (props && (props.unread || props.badge > 0)) found.push(info);
		}
		return found;
	};

	BDFDB.readMutedServerList = function (servers) {
		var found = [], UnreadUtils = BDFDB.WebModules.findByProperties("isGuildOrCategoryOrChannelMuted");
		for (let info of servers === undefined || !Array.isArray(servers) ? BDFDB.readServerList() : servers) {
			let div = Node.prototype.isPrototypeOf(info) ? info : info && info.div ? info.div : null;
			let id = BDFDB.getReactValue(div, "return.stateNode.props.guild.id");
			if (id && UnreadUtils.isGuildOrCategoryOrChannelMuted(id)) found.push(info);
		}
		return found;
	};

	BDFDB.getSelectedServer = function () {
		var info = BDFDB.WebModules.findByProperties('getGuilds').getGuild(BDFDB.WebModules.findByProperties('getLastSelectedGuildId').getGuildId());
		if (info) return BDFDB.getServerData(info.id) || Object.assign(new info.constructor(info), {div:null, instance:null});
		else return null;
	};

	BDFDB.getServerID = function (div) {
		if (!Node.prototype.isPrototypeOf(div) || !BDFDB.getReactInstance(div)) return;
		let guilddiv = BDFDB.getParentEle(BDFDB.dotCN.guildouter, div);
		if (!guilddiv) return;
		var iconwrap = guilddiv.querySelector(BDFDB.dotCN.guildiconwrapper);
		var id = iconwrap && iconwrap.href ? iconwrap.href.split('/').slice(-2)[0] : null;
		return id && !isNaN(parseInt(id)) ? id.toString() : null;
	};

	BDFDB.getServerDiv = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		if (Node.prototype.isPrototypeOf(eleOrInfoOrId)) return BDFDB.getParentEle(BDFDB.dotCN.guildouter, eleOrInfoOrId);
		else {
			let id = typeof eleOrInfoOrId == 'object' ? eleOrInfoOrId.id : eleOrInfoOrId;
			if (id) return BDFDB.getParentEle(BDFDB.dotCN.guildouter, document.querySelector(`${BDFDB.dotCNS.guilds + BDFDB.dotCN.guildiconwrapper}[href*="/channels/${id}"]`));
		}
		return null;
	};

	BDFDB.getServerData = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.getServerID(eleOrInfoOrId) : typeof eleOrInfoOrId == 'object' ? eleOrInfoOrId.id : eleOrInfoOrId;
		id = typeof id == 'number' ? id.toFixed() : id;
		for (let info of BDFDB.readServerList()) if (info && info.id == id) return info;
		return null;
	};

	BDFDB.readChannelList = function () {
		var found = [], ins = BDFDB.getOwnerInstance({node:document.querySelector(BDFDB.dotCN.channels), name:['ChannelCategoryItem', 'ChannelItem', 'PrivateChannel'], all:true, noCopies:true, depth:99999999, time:99999999});
		for (let info in ins) if (ins[info].props && !ins[info].props.ispin && ins[info].props.channel && ins[info]._reactInternalFiber.return) {
			var div = BDFDB.React.findDOMNodeSafe(ins[info]);
			div = div && BDFDB.containsClass(div.parentElement, BDFDB.disCN.categorycontainerdefault, BDFDB.disCN.channelcontainerdefault, false) ? div.parentElement : div;
			found.push(Object.assign(new ins[info].props.channel.constructor(ins[info].props.channel), {div, instance:ins[info]}));
		}
		return found;
	};

	BDFDB.getSelectedChannel = function () {
		var info = BDFDB.WebModules.findByProperties('getChannels').getChannel(BDFDB.WebModules.findByProperties('getLastSelectedChannelId').getChannelId());
		if (info) return BDFDB.getChannelData(info.id) || Object.assign(new info.constructor(info), {div:null, instance:null});
		else return null;
	};

	BDFDB.getChannelID = function (div) {
		if (!Node.prototype.isPrototypeOf(div) || !BDFDB.getReactInstance(div)) return;
		div = BDFDB.getParentEle(BDFDB.dotCNC.categorycontainerdefault + BDFDB.dotCNC.channelcontainerdefault + BDFDB.dotCN.dmchannel, div);
		if (!div) return;
		var info = BDFDB.getKeyInformation({node:div, key:'channel'});
		return info ? info.id.toString() : null;
	};

	BDFDB.getChannelDiv = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		let info = BDFDB.getChannelData(eleOrInfoOrId);
		return info ? info.div : null;
	};

	BDFDB.getChannelData = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.getChannelID(eleOrInfoOrId) : typeof eleOrInfoOrId == 'object' ? eleOrInfoOrId.id : eleOrInfoOrId;
		id = typeof id == 'number' ? id.toFixed() : id;
		for (let info of BDFDB.readChannelList()) if (info && info.id == id) return info;
		return null;
	};

	BDFDB.readDmList = function () {
		var found = [], ins = BDFDB.getOwnerInstance({node:document.querySelector(BDFDB.dotCN.guilds), name:'DirectMessage', all:true, noCopies:true, depth:99999999, time:99999999});
		for (let info in ins) if (ins[info].props && ins[info].props.channel && ins[info]._reactInternalFiber.child) found.push(Object.assign(new ins[info].props.channel.constructor(ins[info].props.channel), {div:BDFDB.React.findDOMNodeSafe(ins[info]), instance:ins[info]}));
		return found;
	};

	BDFDB.getDmID = function (div) {
		if (!Node.prototype.isPrototypeOf(div) || !BDFDB.getReactInstance(div)) return;
		let dmdiv = BDFDB.getParentEle(BDFDB.dotCN.guildouter, div);
		if (!dmdiv) return;
		var iconwrap = dmdiv.querySelector(BDFDB.dotCN.guildiconwrapper);
		var id = iconwrap && iconwrap.href ? iconwrap.href.split('/').slice(-1)[0] : null;
		return id && !isNaN(parseInt(id)) ? id.toString() : null;
	};

	BDFDB.getDmDiv = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		if (Node.prototype.isPrototypeOf(eleOrInfoOrId)) {
			var div = BDFDB.getParentEle(BDFDB.dotCN.guildouter, eleOrInfoOrId);
			return div ? div.parentElement : div;
		}
		else {
			let id = typeof eleOrInfoOrId == 'object' ? eleOrInfoOrId.id : eleOrInfoOrId;
			if (id) {
				var div = BDFDB.getParentEle(BDFDB.dotCN.guildouter, document.querySelector(`${BDFDB.dotCNS.guilds + BDFDB.dotCN.dmpill + " + * " + BDFDB.dotCN.guildiconwrapper}[href*="/channels/@me/${id}"]`));
				return div && BDFDB? div.parentElement : div;
			}
		}
		return null;
	};

	BDFDB.getDmData = function (eleOrInfoOrId) {
		if (!eleOrInfoOrId) return null;
		let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.getDmID(eleOrInfoOrId) : typeof eleOrInfoOrId == 'object' ? eleOrInfoOrId.id : eleOrInfoOrId;
		id = typeof id == 'number' ? id.toFixed() : id;
		for (let info of BDFDB.readDmList()) if (info && info.id == id) return info;
		return null;
	};

	BDFDB.markChannelAsRead = function (channels) {
		if (!channels) return;
		var UnreadUtils = BDFDB.WebModules.findByProperties("getOldestUnreadMessageId");
		var ChannelAckUtils = BDFDB.WebModules.findByProperties("ack","localAck");
		if (!UnreadUtils || !ChannelAckUtils) return;
		for (let info of Array.isArray(channels) ? channels : (typeof channels == "string" || typeof channels == "number" ? Array.of(channels) : Array.from(channels))) {
			let id = Node.prototype.isPrototypeOf(info) ? (BDFDB.getChannelID(info) || BDFDB.getDmID(info)) : info && typeof info == 'object' ? info.id : info;
			if (id) {
				let messageid = UnreadUtils.getOldestUnreadMessageId(id);
				if (messageid) ChannelAckUtils.ack(id, true, true);
			}
		}
	};

	BDFDB.markGuildAsRead = function (servers) {
		if (!servers) return;
		var GuildManageUtils = BDFDB.WebModules.findByProperties('markGuildAsRead');
		if (!GuildManageUtils) return;
		for (let info of Array.isArray(servers) ? servers : (typeof servers == "string" || typeof servers == "number" ? Array.of(servers) : Array.from(servers))) {
			let id = Node.prototype.isPrototypeOf(info) ? BDFDB.getServerID(info) : info && typeof info == 'object' ? info.id : info;
			if (id) GuildManageUtils.markGuildAsRead(id);
		}
	};

	BDFDB.saveAllData = function (data, plugin, key) {
		var fs = require('fs'), configpath, plugname;
		if (!BDFDB.isBDv2()) {
			plugname = typeof plugin === 'string' ? plugin : plugin.name;
			configpath = require('path').join(BDFDB.getPluginsFolder(), plugname + '.config.json');
		}
		else {
			plugname = typeof plugin === 'string' ? plugin.toLowerCase() : null;
			var contentpath = plugname ? BDFDB.Plugins[plugname] ? BDFDB.Plugins[plugname].contentPath : null : plugin.contentPath;
			if (!contentpath) return;
			configpath = require('path').join(contentpath, 'settings.json');
		}
		var exists = fs.existsSync(configpath);
		var config = !exists ? {} : typeof BDFDB.cachedData[plugname] !== 'undefined' ? BDFDB.cachedData[plugname] : BDFDB.readConfig(configpath);
		config[key] = data;
		if (BDFDB.isObjectEmpty(config[key])) delete config[key];
		if (BDFDB.isObjectEmpty(config)) {
			delete BDFDB.cachedData[plugname];
			if (exists) fs.unlinkSync(configpath);
		}
		else {
			BDFDB.cachedData[plugname] = config;
			fs.writeFileSync(configpath, JSON.stringify(config, null, '	'));
		}
	};

	BDFDB.loadAllData = function (plugin, key) {
		var fs = require('fs'), configpath, plugname;
		if (!BDFDB.isBDv2()) {
			plugname = typeof plugin === 'string' ? plugin : plugin.name;
			configpath = require('path').join(BDFDB.getPluginsFolder(), plugname + '.config.json');
		}
		else {
			plugname = typeof plugin === 'string' ? plugin.toLowerCase() : null;
			var contentpath = plugname ? BDFDB.Plugins[plugname] ? BDFDB.Plugins[plugname].contentPath : null : plugin.contentPath;
			if (!contentpath) return {};
			configpath = require('path').join(contentpath, 'settings.json');
		}
		if (!fs.existsSync(configpath)) {
			delete BDFDB.cachedData[plugname];
			return {};
		}
		var config = typeof BDFDB.cachedData[plugname] !== 'undefined' ? BDFDB.cachedData[plugname] : BDFDB.readConfig(configpath);
		BDFDB.cachedData[plugname] = config;
		return config && typeof config[key] !== 'undefined' ? config[key] : {};
	};

	BDFDB.removeAllData = function (plugin, key) {
		var fs = require('fs'), configpath, plugname;
		if (!BDFDB.isBDv2()) {
			plugname = typeof plugin === 'string' ? plugin : plugin.name;
			configpath = require('path').join(BDFDB.getPluginsFolder(), plugname + '.config.json');
		}
		else {
			plugname = typeof plugin === 'string' ? plugin.toLowerCase() : null;
			var contentpath = plugname ? BDFDB.Plugins[plugname] ? BDFDB.Plugins[plugname].contentPath : null : plugin.contentPath;
			if (!contentpath) return;
			configpath = require('path').join(contentpath, 'settings.json');
		}
		var exists = fs.existsSync(configpath);
		var config = !exists ? {} : typeof BDFDB.cachedData[plugname] !== 'undefined' ? BDFDB.cachedData[plugname] : BDFDB.readConfig(configpath);
		delete config[key];
		if (BDFDB.isObjectEmpty(config)) {
			delete BDFDB.cachedData[plugname];
			if (exists) fs.unlinkSync(configpath);
		}
		else {
			BDFDB.cachedData[plugname] = config;
			fs.writeFileSync(configpath, JSON.stringify(config, null, '	'));
		}
	};

	BDFDB.getAllData = function (plugin, key) {
		if (!BDFDB.isObject(plugin) || !plugin.defaults || !plugin.defaults[key]) return {};
		var oldconfig = BDFDB.loadAllData(plugin, key), newconfig = {}, update = false;
		for (let k in plugin.defaults[key]) {
			if (oldconfig[k] == null) {
				newconfig[k] = plugin.defaults[key][k].value;
				update = true;
			}
			else newconfig[k] = oldconfig[k];
		}
		if (update) BDFDB.saveAllData(newconfig, plugin, key);
		return newconfig;
	};

	BDFDB.readConfig = function (path) {
		try {return JSON.parse(require('fs').readFileSync(path));}
		catch (err) {return {};}
	};

	BDFDB.saveData = function (id, data, plugin, key) {
		var config = BDFDB.loadAllData(plugin, key);
		config[id] = data;
		BDFDB.saveAllData(config, plugin, key);
	};

	BDFDB.loadData = function (id, plugin, key) {
		var config = BDFDB.loadAllData(plugin, key);
		var data = config[id];
		return data === undefined ? null : data;
	};

	BDFDB.removeData = function (id, plugin, key) {
		var config = BDFDB.loadAllData(plugin, key);
		delete config[id];
		BDFDB.saveAllData(config, plugin, key);
	};

	BDFDB.getData = function (id, plugin, key) {
		var config = BDFDB.getAllData(plugin, key);
		var data = config[id];
		return data === undefined ? null : data;
	};

	BDFDB.appendWebScript = function (path, container) {
		if (!container && !document.head.querySelector('bd-head bd-scripts')) document.head.appendChild(BDFDB.htmlToElement(`<bd-head><bd-scripts></bd-scripts></bd-head>`));
		container = container || document.head.querySelector('bd-head bd-scripts') || document.head;
		container = Node.prototype.isPrototypeOf(container) ? container : document.head;
		BDFDB.removeWebScript(path, container);
		container.appendChild(BDFDB.htmlToElement(`<script src="${path}"></script>`));
	};

	BDFDB.removeWebScript = function (path, container) {
		container = container || document.head.querySelector('bd-head bd-scripts') || document.head;
		container = Node.prototype.isPrototypeOf(container) ? container : document.head;
		BDFDB.removeEles(container.querySelectorAll(`script[src="${path}"]`));
	};

	BDFDB.appendWebStyle = function (path, container) {
		if (!container && !document.head.querySelector('bd-head bd-styles')) document.head.appendChild(BDFDB.htmlToElement(`<bd-head><bd-styles></bd-styles></bd-head>`));
		container = container || document.head.querySelector('bd-head bd-styles') || document.head;
		container = Node.prototype.isPrototypeOf(container) ? container : document.head;
		BDFDB.removeWebStyle(path, container);
		container.appendChild(BDFDB.htmlToElement(`<link type="text/css" rel="Stylesheet" href="${path}"></link>`));
	};

	BDFDB.removeWebStyle = function (path, container) {
		container = container || document.head.querySelector('bd-head bd-styles') || document.head;
		container = Node.prototype.isPrototypeOf(container) ? container : document.head;
		BDFDB.removeEles(container.querySelectorAll(`link[href="${path}"]`));
	};

	BDFDB.appendLocalStyle = function (id, css, container) {
		if (!container && !document.head.querySelector('bd-head bd-styles')) document.head.appendChild(BDFDB.htmlToElement(`<bd-head><bd-styles></bd-styles></bd-head>`));
		container = container || document.head.querySelector('bd-head bd-styles') || document.head;
		container = Node.prototype.isPrototypeOf(container) ? container : document.head;
		BDFDB.removeLocalStyle(id, container);
		container.appendChild(BDFDB.htmlToElement(`<style id="${id}CSS">${css.replace(/\t|\r|\n/g,"")}</style>`));
	};

	BDFDB.removeLocalStyle = function (id, container) {
		container = container || document.head.querySelector('bd-head bd-styles') || document.head;
		container = Node.prototype.isPrototypeOf(container) ? container : document.head;
		BDFDB.removeEles(container.querySelectorAll(`style[id="${id}CSS"]`));
	};

	BDFDB.formatBytes = function (bytes, sigdigits) {
		bytes = parseInt(bytes);
		if (isNaN(bytes) || bytes < 0) return '0 Bytes';
		if (bytes == 1) return '1 Byte';
		var size = Math.floor(Math.log(bytes) / Math.log(1024));
		return parseFloat((bytes / Math.pow(1024, size)).toFixed(sigdigits < 1 ? 0 : sigdigits > 20 ? 20 : sigdigits || 2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][size];
	};

	BDFDB.colorCONVERT = function (color, conv, type) {
		if (!color) return null;
		conv = conv === undefined || !conv ? conv = 'RGBCOMP' : conv.toUpperCase();
		type = type === undefined || !type || !['RGB', 'RGBA', 'RGBCOMP', 'HSL', 'HSLA', 'HSLCOMP'].includes(type.toUpperCase()) ? BDFDB.colorTYPE(color) : type.toUpperCase();
		if (conv == 'RGBCOMP') {
			switch (type) {
				case 'RGBCOMP':
					if (color.length == 3) return processRGB(color);
					else if (color.length == 4) {
						var a = processA(color.pop());
						return processRGB(color).concat(a);
					}
				case 'RGB':
					return processRGB(color.replace(/\s/g, '').slice(4, -1).split(','));
				case 'RGBA':
					var comp = color.replace(/\s/g, '').slice(5, -1).split(',');
					var a = processA(comp.pop());
					return processRGB(comp).concat(a);
				case 'HSLCOMP':
					if (color.length == 3) return BDFDB.colorCONVERT(`hsl(${color.join(',')})`, 'RGBCOMP');
					else if (color.length == 4) {
						var a = processA(jg.pop());
						return BDFDB.colorCONVERT(`hsl(${jg.join(',')})`, 'RGBCOMP').concat(a);
					}
				case 'HSL':
					var hslcomp = processHSL(color.replace(/\s/g, '').slice(4, -1).split(','));
					var r, g, b, m, c, x, p, q;
					var h = hslcomp[0] / 360, l = parseInt(hslcomp[1]) / 100, s = parseInt(hslcomp[2]) / 100; m = Math.floor(h * 6); c = h * 6 - m; x = s * (1 - l); p = s * (1 - c * l); q = s * (1 - (1 - c) * l);
					switch (m % 6) {
						case 0: r = s, g = q, b = x; break;
						case 1: r = p, g = s, b = x; break;
						case 2: r = x, g = s, b = q; break;
						case 3: r = x, g = p, b = s; break;
						case 4: r = q, g = x, b = s; break;
						case 5: r = s, g = x, b = p; break;
					}
					return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
				case 'HSLA':
					var hslcomp = color.replace(/\s/g, '').slice(5, -1).split(',');
					var a = processA(hslcomp.pop());
					return BDFDB.colorCONVERT(`hsl(${hslcomp.join(',')})`, 'RGBCOMP').concat(a);
				case 'HEX':
					var hex = /^#([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$|^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
					return [parseInt(hex[1] + hex[1] || hex[4], 16).toString(), parseInt(hex[2] + hex[2] || hex[0x5], 16).toString(), parseInt(hex[3] + hex[3] || hex[6], 16).toString()];
				default:
					return null;
			}
		}
		else {
			var rgbcomp = type == 'RGBCOMP' ? color : BDFDB.colorCONVERT(color, 'RGBCOMP', type);
			if (rgbcomp) switch (conv) {
				case 'RGB':
					return `rgb(${processRGB(rgbcomp.slice(0, 3)).join(',')})`;
				case 'RGBA':
					rgbcomp = rgbcomp.slice(0, 4);
					var a = rgbcomp.length == 4 ? processA(rgbcomp.pop()) : 1;
					return `rgba(${processRGB(rgbcomp).concat(a).join(',')})`;
				case 'HSLCOMP':
					var a = rgbcomp.length == 4 ? processA(rgbcomp.pop()) : null;
					var hslcomp = processHSL(BDFDB.colorCONVERT(rgbcomp, 'HSL').replace(/\s/g, '').split(','));
					return a ? hslcomp.concat(a) : hslcomp;
				case 'HSL':
					var r = processC(rgbcomp[0]), g = processC(rgbcomp[1]), b = processC(rgbcomp[2]);
					var max = Math.max(r, g, b), min = Math.min(r, g, b), dif = max - min, h, l = max === 0 ? 0 : dif / max, s = max / 255;
					switch (max) {
						case min: h = 0; break;
						case r: h = g - b + dif * (g < b ? 6 : 0); h /= 6 * dif; break;
						case g: h = b - r + dif * 2; h /= 6 * dif; break;
						case b: h = r - g + dif * 4; h /= 6 * dif; break;
					}
					return `hsl(${processHSL([Math.round(h * 360), l * 100, s * 100]).join(',')})`;
				case 'HSLA':
					var j0 = rgbcomp.length == 4 ? processA(rgbcomp.pop()) : 1;
					return `hsla(${BDFDB.colorCONVERT(rgbcomp, 'HSL').slice(4, -1).split(',').concat(j0).join(',')})`;
				case 'HEX':
					return ('#' + (0x1000000 + (rgbcomp[2] | rgbcomp[1] << 8 | rgbcomp[0] << 16)).toString(16).slice(1)).toUpperCase();
				default:
					return null;
			}
		}
		function processC(c) {c = parseInt(c.toString().replace(/[^0-9\-]/g, ''));return isNaN(c) || c > 255 ? 255 : c < 0 ? 0 : c;};
		function processRGB(comp) {return comp.map(c => {return processC(c);});};
		function processA(a) {a = a.toString();a = (a.indexOf('%') > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ''));return isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;};
		function processSL(sl) {sl = parseFloat(sl.toString().replace(/[^0-9\.\-]/g, ''));return (isNaN(sl) || sl > 100 ? 100 : sl < 0 ? 0 : sl) + '%';};
		function processHSL(comp) {let h = parseFloat(comp.shift().toString().replace(/[^0-9\.\-]/g, ''));h = isNaN(h) || h > 360 ? 360 : h < 0 ? 0 : h;return [h].concat(comp.map(sl => {return processSL(sl);}));};
	};

	BDFDB.colorSETALPHA = function (color, a, conv) {
		var rgbcomp = BDFDB.colorCONVERT(color, 'RGBCOMP');
		if (rgbcomp) {
			a = a.toString();
			a = (a.indexOf('%') > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ''));
			a = isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;
			rgbcomp[3] = a;
			conv = (conv || BDFDB.colorTYPE(color)).toUpperCase();
			conv = conv == 'HSL' || conv == 'RGB' ? conv + 'A' : conv;
			return BDFDB.colorCONVERT(rgbcomp, conv);
		}
		return null;
	};

	BDFDB.colorCHANGE = function (color, value, conv) {
		value = parseFloat(value);
		if (color && typeof value == 'number' && !isNaN(value)) {
			var comp = BDFDB.colorCONVERT(color, 'RGBCOMP');
			if (comp) {
				if (parseInt(value) !== value) {
					value = value.toString();
					value = (value.indexOf('%') > -1 ? 0.01 : 1) * parseFloat(value.replace(/[^0-9\.\-]/g, ''));
					value = isNaN(value) ? 0 : value;
					return BDFDB.colorCONVERT([Math.round(comp[0] * (1 + value)), Math.round(comp[1] * (1 + value)), Math.round(comp[2] * (1 + value))], conv || BDFDB.colorTYPE(color));
				}
				else return BDFDB.colorCONVERT([Math.round(comp[0] + value), Math.round(comp[1] + value), Math.round(comp[2] + value)], conv || BDFDB.colorTYPE(color));
			}
		}
		return null;
	};

	BDFDB.colorINV = function (color, conv) {
		if (color) {
			var comp = BDFDB.colorCONVERT(color, 'RGBCOMP');
			if (comp) return BDFDB.colorCONVERT([255 - comp[0], 255 - comp[1], 255 - comp[2]], conv || BDFDB.colorTYPE(color));
		}
		return null;
	};

	BDFDB.colorCOMPARE = function (color1, color2) {
		if (color1 && color2) {
			color1 = BDFDB.colorCONVERT(color1, 'RGBCOMP');
			color2 = BDFDB.colorCONVERT(color2, 'RGBCOMP');
			if (color1 && color2) return BDFDB.equals(color1, color2);
		}
		return null;
	};

	BDFDB.colorISBRIGHT = function (color, compare = 160) {
		color = BDFDB.colorCONVERT(color, 'RGBCOMP');
		if (!color) return false;
		return parseInt(compare) < Math.sqrt(0.299 * color[0]**2 + 0.587 * color[1]**2 + 0.144 * color[2]**2);
	};

	BDFDB.colorTYPE = function (color) {
		if (color) {
			if (typeof color === 'object' && (color.length == 3 || color.length == 4)) {
				if (isRGB(color)) return 'RGBCOMP';
				else if (isHSL(color)) return 'HSLCOMP';
			}
			else if (typeof color === 'string') {
				if (/^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(color)) return 'HEX';
				else {
					color = color.toUpperCase();
					var comp = color.replace(/[^0-9\.\-\,\%]/g, '').split(',');
					if (color.indexOf('RGB(') == 0 && comp.length == 3 && isRGB(comp)) return 'RGB';
					else if (color.indexOf('RGBA(') == 0 && comp.length == 4 && isRGB(comp)) return 'RGBA';
					else if (color.indexOf('HSL(') == 0 && comp.length == 3 && isHSL(comp)) return 'HSL';
					else if (color.indexOf('HSLA(') == 0 && comp.length == 4 && isHSL(comp)) return 'HSLA';
				}
			}
		}
		return null;
		function isRGB(comp) {return comp.slice(0, 3).every(rgb => rgb.toString().indexOf('%') == -1 && parseFloat(rgb) == parseInt(rgb));};
		function isHSL(comp) {return comp.slice(1, 3).every(hsl => hsl.toString().indexOf('%') == hsl.length - 1);};
	};

	BDFDB.setInnerText = function (node, string) {
		if (!node || !Node.prototype.isPrototypeOf(node)) return;
		var textnode = null;
		for (let child of node.childNodes) if (child.nodeType == Node.TEXT_NODE) {
			textnode = child;
			break;
		}
		if (textnode) textnode.textContent = string;
		else {
			textnode = document.createTextNode(string);
			node.appendChild(textnode);
		}
	};

	BDFDB.getInnerText = function (node) {
		if (!node || !Node.prototype.isPrototypeOf(node)) return;
		for (let child of node.childNodes) if (child.nodeType == Node.TEXT_NODE) return child.textContent;
	};

	BDFDB.getParentEle = function (listOrSelector, node) {
		var parent = null;
		if (Node.prototype.isPrototypeOf(node) && listOrSelector) {
			var list = NodeList.prototype.isPrototypeOf(listOrSelector) ? listOrSelector : typeof listOrSelector == 'string' ? document.querySelectorAll(listOrSelector) : null;
			if (list) for (let listnode of list) if (listnode.contains(node)) {
				parent = listnode;
				break;
			}
		}
		return parent;
	};

	BDFDB.getRects = function (node) {
		var rects = {};
		if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
			var hidden = BDFDB.isEleHidden(node);
			if (hidden) BDFDB.toggleEles(node);
			rects = node.getBoundingClientRect();
			if (hidden) BDFDB.toggleEles(node);
		}
		return rects;
	};

	BDFDB.getTotalHeight = function (node) {
		if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
			var rects = BDFDB.getRects(node);
			var style = getComputedStyle(node);
			return rects.height + parseInt(style.marginTop) + parseInt(style.marginBottom);
		}
		return 0;
	};

	BDFDB.getTotalWidth = function (node) {
		if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
			var rects = BDFDB.getRects(node);
			var style = getComputedStyle(node);
			return rects.width + parseInt(style.marginLeft) + parseInt(style.marginRight);
		}
		return 0;
	};

	BDFDB.isEleHidden = function (node) {
		if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) return getComputedStyle(node, null).getPropertyValue('display') == 'none';
	};

	BDFDB.toggleEles = function (...eles) {
		if (!eles) return;
		var force = eles.pop();
		if (typeof force != 'boolean') {
			eles.push(force);
			force = undefined;
		}
		if (!eles.length) return;
		for (let ele of eles) for (let e of Array.isArray(ele) ? ele : Array.of(ele)) {
			if (!e) {}
			else if (Node.prototype.isPrototypeOf(e)) toggle(e);
			else if (NodeList.prototype.isPrototypeOf(e)) for (let n of e) toggle(n);
			else if (typeof e == 'string') for (let c of e.split(',')) if (c && (c = c.trim())) for (let n of document.querySelectorAll(c)) toggle(n);
		}
		function toggle(node) {
			if (!node || !Node.prototype.isPrototypeOf(node)) return;
			var hidden = force === undefined ? !BDFDB.isEleHidden(node) : !force;
			if (hidden) node.style.setProperty('display', 'none', 'important');
			else node.style.removeProperty('display');
		}
	};

	BDFDB.removeEles = function (...eles) {
		for (let ele of eles) for (let e of Array.isArray(ele) ? ele : Array.of(ele)) {
			if (!e) {}
			else if (Node.prototype.isPrototypeOf(e)) e.remove();
			else if (NodeList.prototype.isPrototypeOf(e)) {
				e = Array.from(e);
				while (e.length) e.shift().remove();
			}
			else if (typeof e == 'string') for (let c of e.split(',')) if (c && (c = c.trim())) {
				let n = Array.from(document.querySelectorAll(c));
				while (n.length) n.shift().remove();
			}
		}
	};

	BDFDB.addClass = function (eles, ...classes) {
		if (!eles || !classes) return;
		for (let ele of Array.isArray(eles) ? eles : Array.of(eles)) {
			if (!ele) {}
			else if (Node.prototype.isPrototypeOf(ele)) add(ele);
			else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) add(e);
			else if (typeof ele == 'string') for (let e of ele.split(',')) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) add(n);
		}
		function add(node) {
			if (node && node.classList) for (let cla of classes) for (let cl of Array.isArray(cla) ? cla : Array.of(cla)) if (typeof cl == 'string') for (let c of cl.split(' ')) if (c) node.classList.add(c);
		}
	};

	BDFDB.removeClass = function (eles, ...classes) {
		if (!eles || !classes) return;
		for (let ele of Array.isArray(eles) ? eles : Array.of(eles)) {
			if (!ele) {}
			else if (Node.prototype.isPrototypeOf(ele)) remove(ele);
			else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) remove(e);
			else if (typeof ele == 'string') for (let e of ele.split(',')) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) remove(n);
		}
		function remove(node) {
			if (node && node.classList) for (let cla of classes) for (let cl of Array.isArray(cla) ? cla : Array.of(cla)) if (typeof cl == 'string') for (let c of cl.split(' ')) if (c) node.classList.remove(c);
		}
	};

	BDFDB.toggleClass = function (eles, ...classes) {
		if (!eles || !classes) return;
		var force = classes.pop();
		if (typeof force != 'boolean') {
			classes.push(force);
			force = undefined;
		}
		if (!classes.length) return;
		for (let ele of Array.isArray(eles) ? eles : Array.of(eles)) {
			if (!ele) {}
			else if (Node.prototype.isPrototypeOf(ele)) toggle(ele);
			else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) toggle(e);
			else if (typeof ele == 'string') for (let e of ele.split(',')) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) toggle(n);
		}
		function toggle(node) {
			if (node && node.classList) for (let cla of classes) for (let cl of Array.isArray(cla) ? cla : Array.of(cla)) if (typeof cl == 'string') for (let c of cl.split(' ')) if (c) node.classList.toggle(c, force);
		}
	};

	BDFDB.containsClass = function (eles, ...classes) {
		if (!eles || !classes) return;
		var all = classes.pop();
		if (typeof all != 'boolean') {
			classes.push(all);
			all = true;
		}
		if (!classes.length) return;
		var contained = undefined;
		for (let ele of Array.isArray(eles) ? eles : Array.of(eles)) {
			if (!ele) {}
			else if (Node.prototype.isPrototypeOf(ele)) contains(ele);
			else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) contains(e);
			else if (typeof ele == 'string') for (let c of ele.split(',')) if (c && (c = c.trim())) for (let n of document.querySelectorAll(c)) contains(n);
		}
		return contained;
		function contains(node) {
			if (node && node.classList) for (let cla of classes) if (typeof cla == 'string') for (let c of cla.split(' ')) if (c) {
				if (contained === undefined) contained = all;
				if (all && !node.classList.contains(c)) contained = false;
				if (!all && node.classList.contains(c)) contained = true;
			}
		}
	};

	BDFDB.replaceClass = function (eles, oldclass, newclass) {
		if (!eles || typeof oldclass != "string" || typeof newclass != "string") return;
		for (let ele of Array.isArray(eles) ? eles : Array.of(eles)) {
			if (!ele) {}
			else if (Node.prototype.isPrototypeOf(ele)) replace(ele);
			else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) replace(e);
			else if (typeof ele == 'string') for (let e of ele.split(',')) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) replace(n);
		}
		function replace(node) {
			if (node && node.tagName && node.className) node.className = node.className.replace(new RegExp(oldclass, "g"), newclass).trim();
		}
	};

	BDFDB.removeClasses = function (...classes) {
		for (let cla of classes) for (let c of Array.isArray(cla) ? cla : Array.of(cla)) {
			if (!c) {}
			else if (typeof c == 'string') for (let a of c.split(',')) if (a && (a = a.replace(/\.|\s/g, ''))) BDFDB.removeClass(document.querySelectorAll('.' + a), a);
		}
	};

	BDFDB.htmlToElement = function (html) {
		if (!html || !html.trim()) return null;
		let template = document.createElement('template');
		template.innerHTML = html.replace(/\t|\n|\r/g, '');
		if (template.content.childElementCount == 1) return template.content.firstElementChild;
		else {
			var wrapper = document.createElement("span");
			var nodes = Array.from(template.content.childNodes);
			while (nodes.length) wrapper.appendChild(nodes.shift());
			return wrapper;
		}
	};

	BDFDB.encodeToHTML = function (string) {
		var ele = document.createElement('div');
		ele.innerText = string;
		return ele.innerHTML;
	};

	BDFDB.regEscape = function (string) {
		return string.replace(/([\-\/\\\^\$\*\+\?\.\(\)\|\[\]\{\}])/g, '\\$1');
	};

	BDFDB.insertNRST = function (string) {
		return string.replace(/\\r/g, '\r').replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\s/g, ' ');
	};

	BDFDB.triggerSend = function (textarea) {
		if (!textarea) return;
		setImmediate(() => {
			var e = new KeyboardEvent('keypress', {key:'Enter', code:'Enter', which:13, keyCode:13, bubbles:true });
			Object.defineProperty(e, 'keyCode', {value:13});
			Object.defineProperty(e, 'which', {value:13});
			textarea.dispatchEvent(e);
		});
	};

	BDFDB.initElements = function (container, plugin) {
		if (!Node.prototype.isPrototypeOf(container)) return;
		if (BDFDB.containsClass(container, 'DevilBro-settings')) BDFDB.addClass(container, 'BDFDB-settings');
		var Animations = BDFDB.WebModules.findByProperties('spring');
		var islighttheme = BDFDB.getDiscordTheme() == BDFDB.disCN.themelight;
		var languagestrings = BDFDB.getLibraryStrings();
		container.querySelectorAll(BDFDB.dotCN.switchinner).forEach(ele => {
			setSwitch(ele, false);
			addInitEventListener(ele, 'click', e => {
				setSwitch(ele, true);
			});
		});
		container.querySelectorAll(BDFDB.dotCNS.checkboxwrapper + BDFDB.dotCN.checkboxinput).forEach(ele => {
			setCheckbox(ele, false);
			addInitEventListener(ele, 'click', e => {
				setCheckbox(ele, true);
			});
		});
		container.querySelectorAll(BDFDB.dotCN.giffavoritebutton).forEach(ele => {
			setGifFavButton(ele);
			addInitEventListener(ele, 'click', e => {
				BDFDB.toggleClass(ele, BDFDB.disCN.giffavoriteselected);
				setGifFavButton(ele);
			});
		});
		container.querySelectorAll('.file-navigator').forEach(ele => {
			addInitEventListener(ele, 'click', e => {
				var input = ele.querySelector('input[type="file"]');
				if (input) input.click();
			});
		});
		container.querySelectorAll('input[type="file"]').forEach(ele => {
			addInitEventListener(ele, 'change', e => {
				var input = ele.parentElement.parentElement.querySelector('input[type="text"]');
				var file = ele.files[0];
				if (input && file)
					input.value = file.path;
			});
		});
		container.querySelectorAll(BDFDB.dotCN.input).forEach(ele => {
			addInitEventListener(ele, 'keydown', e => {
				e.stopPropagation();
			});
		});
		container.querySelectorAll(BDFDB.dotCNS.searchbar + BDFDB.dotCN.searchbarinput).forEach(ele => {
			ele.setAttribute('placeholder', languagestrings.search_placeholder);
			addInitEventListener(ele, 'keyup', e => {
				let icons = ele.parentElement.querySelectorAll(BDFDB.dotCN.searchbaricon);
				BDFDB.toggleClass(icons[0], BDFDB.disCN.searchbarvisible, ele.value.length == 0);
				BDFDB.toggleClass(icons[1], BDFDB.disCN.searchbarvisible, ele.value.length > 0);
			});
		});
		container.querySelectorAll(BDFDB.dotCNS.searchbar + BDFDB.dotCN.searchbarclear).forEach(ele => {
			addInitEventListener(ele, 'click', e => {
				if (BDFDB.containsClass(ele, BDFDB.disCN.searchbarvisible)) {
					var input = BDFDB.getParentEle(BDFDB.dotCN.searchbar, ele).querySelector(BDFDB.dotCN.searchbarinput);
					input.value = '';
					input.dispatchEvent(new Event('change'));
					input.dispatchEvent(new Event('input'));
					input.dispatchEvent(new Event('keydown'));
					input.dispatchEvent(new Event('keyup'));
					input.dispatchEvent(new Event('keypressed'));
					BDFDB.addClass(ele.parentElement.querySelectorAll(BDFDB.dotCN.searchbaricon)[0], BDFDB.disCN.searchbarvisible);
					BDFDB.removeClass(ele, BDFDB.disCN.searchbarvisible);
				}
			});
		});
		container.querySelectorAll('.numberinput-button-up').forEach(ele => {
			addInitEventListener(ele, 'click', e => {
				var input = ele.parentElement.parentElement.querySelector('input');
				var min = parseInt(input.getAttribute('min'));
				var max = parseInt(input.getAttribute('max'));
				var newv = parseInt(input.value) + 1;
				if (isNaN(max) || !isNaN(max) && newv <= max) {
					BDFDB.addClass(ele.parentElement, 'pressed');
					clearTimeout(ele.parentElement.pressedTimeout);
					input.value = isNaN(min) || !isNaN(min) && newv >= min ? newv : min;
					input.dispatchEvent(new Event('change'));
					input.dispatchEvent(new Event('input'));
					input.dispatchEvent(new Event('keydown'));
					input.dispatchEvent(new Event('keyup'));
					input.dispatchEvent(new Event('keypressed'));
					ele.parentElement.pressedTimeout = setTimeout(() => {BDFDB.removeClass(ele.parentElement, 'pressed');}, 3000);
				}
			});
		});
		container.querySelectorAll('.numberinput-button-down').forEach(ele => {
			addInitEventListener(ele, 'click', e => {
				var input = ele.parentElement.parentElement.querySelector('input');
				var min = parseInt(input.getAttribute('min'));
				var max = parseInt(input.getAttribute('max'));
				var newv = parseInt(input.value) - 1;
				if (isNaN(min) || !isNaN(min) && newv >= min) {
					BDFDB.addClass(ele.parentElement, 'pressed');
					clearTimeout(ele.parentElement.pressedTimeout);
					input.value = isNaN(max) || !isNaN(max) && newv <= max ? newv : max;
					input.dispatchEvent(new Event('change'));
					input.dispatchEvent(new Event('input'));
					input.dispatchEvent(new Event('keydown'));
					input.dispatchEvent(new Event('keyup'));
					input.dispatchEvent(new Event('keypressed'));
					ele.parentElement.pressedTimeout = setTimeout(() => {BDFDB.removeClass(ele.parentElement, 'pressed');}, 3000);
				}
			});
		});
		container.querySelectorAll('.amount-input').forEach(ele => {
			addInitEventListener(ele, 'input', e => {
				if (BDFDB.isObject(plugin)) {
					var option = ele.getAttribute("option");
					var newv = parseInt(ele.value);
					var min = parseInt(ele.getAttribute('min'));
					var max = parseInt(ele.getAttribute('max'));
					if (option && !isNaN(newv) && (isNaN(min) || !isNaN(min) && newv >= min) && (isNaN(max) || !isNaN(max) && newv <= max)) {
						BDFDB.saveData(option, newv, plugin, "amounts");
						plugin.SettingsUpdated = true;
					}
				}
			});
		});
		container.querySelectorAll(BDFDB.dotCNC.tabbaritem + BDFDB.dotCN.tabbarheaderitem).forEach(ele => {
			setTabitem(ele, ele.parentElement.querySelector(BDFDB.dotCNC.tabbaritem + BDFDB.dotCN.tabbarheaderitem) == ele ? 2 : 0);
			addInitEventListener(ele, 'click', e => {
				BDFDB.removeClass(container.querySelectorAll('.tab-content.open'), 'open');
				ele.parentElement.querySelectorAll(BDFDB.dotCNC.tabbaritem + BDFDB.dotCN.tabbarheaderitem).forEach(ele => {setTabitem(ele, 0);});
				var tab = container.querySelector(`.tab-content[tab="${ele.getAttribute('tab')}"]`);
				if (tab) BDFDB.addClass(tab, 'open');
				setTabitem(ele, 2);
			});
			addInitEventListener(ele, 'mouseenter', e => {
				if (!BDFDB.containsClass(ele, BDFDB.disCN.settingsitemselected)) setTabitem(ele, 1);
			});
			addInitEventListener(ele, 'mouseleave', e => {
				if (!BDFDB.containsClass(ele, BDFDB.disCN.settingsitemselected)) setTabitem(ele, 0);
			});
		});
		container.querySelectorAll('.BDFDB-textscrollwrapper').forEach(ele => {
			var inner = ele.querySelector('.BDFDB-textscroll');
			if (inner) {
				if (BDFDB.containsClass(ele.parentElement, BDFDB.disCN.contextmenuitemsubmenu)) ele.style.setProperty('margin-right', '10px');
				if (BDFDB.getRects(ele).width > 100) ele.style.setProperty('text-overflow', 'ellipsis', 'important');
				ele.style.setProperty('position', 'relative', 'important');
				ele.style.setProperty('display', 'block', 'important');
				ele.style.setProperty('overflow', 'hidden', 'important');
				inner.style.setProperty('left', '0px', 'important');
				inner.style.setProperty('position', 'relative', 'important');
				inner.style.setProperty('white-space', 'nowrap', 'important');
				inner.style.setProperty('display', 'inline', 'important');
				var animate, Animation;
				addInitEventListener(ele, 'mouseenter', e => {
					if (BDFDB.getRects(ele).width < BDFDB.getRects(inner).width) {
						BDFDB.addClass(ele, 'scrolling');
						if (!Animation || !animate) initAnimation();
						animate(1);
						inner.style.setProperty('display', 'block', 'important');
					}
				});
				addInitEventListener(ele, 'mouseleave', e => {
					if (BDFDB.containsClass(ele, 'scrolling')) {
						BDFDB.removeClass(ele, 'scrolling');
						inner.style.setProperty('display', 'inline', 'important');
						if (!Animation || !animate) initAnimation();
						animate(0);
					}
				});
				function initAnimation() {
					Animation = new Animations.Value(0);
					Animation
						.interpolate({inputRange:[0, 1], outputRange:[0, (BDFDB.getRects(inner).width - BDFDB.getRects(ele).width) * -1]})
						.addListener(v => {inner.style.setProperty('left', v.value + 'px', 'important');});
					animate = p => {
						var w = p + parseFloat(inner.style.getPropertyValue('left')) / (BDFDB.getRects(inner).width - BDFDB.getRects(ele).width);
						w = isNaN(w) || !isFinite(w) ? p : w;
						w *= BDFDB.getRects(inner).width / (BDFDB.getRects(ele).width * 2);
						Animations.parallel([Animations.timing(Animation, {toValue:p, duration:Math.sqrt(w**2) * 4000 / (ele.getAttribute('speed') || 1)})]).start();
					};
				}
			}
		});
		
		BDFDB.removeClass(container.querySelectorAll('.tab-content'), 'open');
		BDFDB.addClass(container.querySelector('.tab-content'), 'open');
		
		container.querySelectorAll('.btn-save ' + BDFDB.dotCN.buttoncontents).forEach(ele => {ele.innerText = languagestrings.btn_save_text;});
		container.querySelectorAll('.btn-cancel ' + BDFDB.dotCN.buttoncontents).forEach(ele => {ele.innerText = languagestrings.btn_cancel_text;});
		container.querySelectorAll('.btn-all ' + BDFDB.dotCN.buttoncontents).forEach(ele => {ele.innerText = languagestrings.btn_all_text;});
		container.querySelectorAll('.btn-add ' + BDFDB.dotCN.buttoncontents).forEach(ele => {ele.innerText = languagestrings.btn_add_text;});
		container.querySelectorAll('.btn-ok ' + BDFDB.dotCN.buttoncontents).forEach(ele => {ele.innerText = languagestrings.btn_ok_text;});
		container.querySelectorAll('.file-navigator ' + BDFDB.dotCN.buttoncontents).forEach(ele => {ele.innerText = languagestrings.file_navigator_text;});
		
		if (islighttheme) {
			BDFDB.replaceClass(container.querySelectorAll(BDFDB.dotCN.selectcontroldark), BDFDB.disCN.selectcontroldark, BDFDB.disCN.selectcontrollight);
			BDFDB.replaceClass(container.querySelectorAll(BDFDB.dotCN.selectsingledark), BDFDB.disCN.selectsingledark, BDFDB.disCN.selectsinglelight);
			BDFDB.replaceClass(container.querySelectorAll(BDFDB.dotCN.selectarrowcontainerdark), BDFDB.disCN.selectarrowcontainerdark, BDFDB.disCN.selectarrowcontainerlight);
		}
		else {
			BDFDB.replaceClass(container.querySelectorAll(BDFDB.dotCN.selectcontrollight), BDFDB.disCN.selectcontrollight, BDFDB.disCN.selectcontroldark);
			BDFDB.replaceClass(container.querySelectorAll(BDFDB.dotCN.selectsinglelight), BDFDB.disCN.selectsinglelight, BDFDB.disCN.selectsingledark);
			BDFDB.replaceClass(container.querySelectorAll(BDFDB.dotCN.selectarrowcontainerlight), BDFDB.disCN.selectarrowcontainerlight, BDFDB.disCN.selectarrowcontainerdark);
		}
		
		function setSwitch(switchitem, triggered) {
			var checked = switchitem.checked;
			BDFDB.toggleClass(switchitem.parentElement, BDFDB.disCN.switchvaluechecked, checked);
			BDFDB.toggleClass(switchitem.parentElement, BDFDB.disCN.switchvalueunchecked, !checked);
			if (triggered && BDFDB.isObject(plugin) && BDFDB.containsClass(switchitem, 'settings-switch')) {
				let keys = switchitem.getAttribute('value').trim().split(' ').filter(n => n);
				let option = keys.shift();
				if (option) {
					var data = BDFDB.loadAllData(plugin, option);
					var newdata = '';
					for (let key of keys) newdata += `{"${key}":`;
					newdata += checked + '}'.repeat(keys.length);
					newdata = JSON.parse(newdata);
					if (BDFDB.isObject(newdata)) BDFDB.deepAssign(data, newdata);
					else data = newdata;
					BDFDB.saveAllData(data, plugin, option);
					plugin.SettingsUpdated = true;
				}
			}
		};
		function setCheckbox(checkbox) {
			var checkboxstyle = checkbox.parentElement.querySelector(BDFDB.dotCN.checkbox);
			var checkboxstyleinner = checkboxstyle.querySelector('polyline');
			if (checkbox.checked) {
				BDFDB.addClass(checkboxstyle, BDFDB.disCN.checkboxchecked);
				checkboxstyle.style.setProperty('background-color', 'rgb(67, 181, 129)');
				checkboxstyle.style.setProperty('border-color', 'rgb(67, 181, 129)');
				checkboxstyleinner.setAttribute('stroke', '#ffffff');
			}
			else {
				BDFDB.removeClass(checkboxstyle, BDFDB.disCN.checkboxchecked);
				checkboxstyle.style.removeProperty('background-color');
				checkboxstyle.style.removeProperty('border-color');
				checkboxstyleinner.setAttribute('stroke', 'transparent');
			}
		};
		function setGifFavButton(button) {
			var selected = BDFDB.containsClass(button, BDFDB.disCN.giffavoriteselected);
			var icon = button.querySelector(BDFDB.dotCN.giffavoriteicon);
			icon.setAttribute('name', selected ? 'FavoriteFilled' : 'Favorite');
			icon.innerHTML = selected ? '<path d="M0,0H24V24H0Z" fill="none"></path><path fill="currentColor" d="M12.5,17.6l3.6,2.2a1,1,0,0,0,1.5-1.1l-1-4.1a1,1,0,0,1,.3-1l3.2-2.8A1,1,0,0,0,19.5,9l-4.2-.4a.87.87,0,0,1-.8-.6L12.9,4.1a1.05,1.05,0,0,0-1.9,0l-1.6,4a1,1,0,0,1-.8.6L4.4,9a1.06,1.06,0,0,0-.6,1.8L7,13.6a.91.91,0,0,1,.3,1l-1,4.1a1,1,0,0,0,1.5,1.1l3.6-2.2A1.08,1.08,0,0,1,12.5,17.6Z"></path>' : '<path fill="currentColor" d="M19.6,9l-4.2-0.4c-0.4,0-0.7-0.3-0.8-0.6l-1.6-3.9c-0.3-0.8-1.5-0.8-1.8,0L9.4,8.1C9.3,8.4,9,8.6,8.6,8.7L4.4,9c-0.9,0.1-1.2,1.2-0.6,1.8L7,13.6c0.3,0.2,0.4,0.6,0.3,1l-1,4.1c-0.2,0.9,0.7,1.5,1.5,1.1l3.6-2.2c0.3-0.2,0.7-0.2,1,0l3.6,2.2c0.8,0.5,1.7-0.2,1.5-1.1l-1-4.1c-0.1-0.4,0-0.7,0.3-1l3.2-2.8C20.9,10.2,20.5,9.1,19.6,9zM12,15.4l-3.8,2.3l1-4.3l-3.3-2.9l4.4-0.4l1.7-4l1.7,4l4.4,0.4l-3.3,2.9l1,4.3L12,15.4z"></path>';
			if (selected) {
				BDFDB.addClass(button, BDFDB.disCN.giffavoriteshowpulse);
				setTimeout(() => {BDFDB.removeClass(button, BDFDB.disCN.giffavoriteshowpulse);}, 500);
			}
		};
		function setTabitem(item, state) {
			switch (state) {
				case 0:
					BDFDB.removeClass(item, BDFDB.disCN.settingsitemselected);
					item.style.setProperty('border-color', 'transparent');
					item.style.setProperty('color', islighttheme ? 'rgba(79, 84, 92, 0.4)' : 'rgba(255, 255, 255, 0.4)');
					break;
				case 1:
					BDFDB.removeClass(item, BDFDB.disCN.settingsitemselected);
					item.style.setProperty('border-color', islighttheme ? 'rgba(79, 84, 92, 0.6)' : 'rgba(255, 255, 255, 0.6)');
					item.style.setProperty('color', islighttheme ? 'rgba(79, 84, 92, 0.6)' : 'rgba(255, 255, 255, 0.6)');
					break;
				case 2:
					BDFDB.addClass(item, BDFDB.disCN.settingsitemselected);
					item.style.setProperty('border-color', islighttheme ? 'rgb(79, 84, 92)' : 'rgb(255, 255, 255)');
					item.style.setProperty('color', islighttheme ? 'rgb(79, 84, 92)' : 'rgb(255, 255, 255)');
					break;
				}
		};
		function addInitEventListener(ele, action, callback) {
			if (!ele.BDFDBinitElementsListeners) ele.BDFDBinitElementsListeners = {};
			if (ele.BDFDBinitElementsListeners[action]) ele.removeEventListener(action, ele.BDFDBinitElementsListeners[action]);
			ele.BDFDBinitElementsListeners[action] = callback;
			ele.addEventListener(action, callback, true);
		};
	};

	BDFDB.appendModal = function (modalwrapper) {
		if (!Node.prototype.isPrototypeOf(modalwrapper)) return;
		if (BDFDB.containsClass(modalwrapper, 'DevilBro-modal')) BDFDB.addClass(modalwrapper, 'BDFDB-modal');
		if (!BDFDB.appendModal.modals) BDFDB.appendModal.modals = BDFDB.React.findDOMNodeSafe(BDFDB.getOwnerInstance({node:document.querySelector(BDFDB.dotCN.app), name:"Modals"}));
		if (!BDFDB.appendModal.modals) return;
		
		var modal = BDFDB.containsClass(modalwrapper, BDFDB.disCN.modal) ? modalwrapper : modalwrapper.querySelector(BDFDB.dotCN.modal);
		var backdrop = modal ? modal.previousSibling : null;
		if (backdrop) {
		}
		
		var Animations = BDFDB.WebModules.findByProperties('spring');
		var modalOpacity = new Animations.Value(0);
		modalOpacity
			.interpolate({inputRange: [0, 1], outputRange: [0, 1]})
			.addListener((value) => {if (modal) modal.style.setProperty("opacity", `${value.value}`);});
		var modalTransform = new Animations.Value(0);
		modalTransform
			.interpolate({inputRange: [0, 1], outputRange: [0.7, 1]})
			.addListener((value) => {if (modal) modal.style.setProperty("transform", `scale(${value.value}) translateZ(0px)`);});
		var backdropOpacity = new Animations.Value(0);
		backdropOpacity
			.interpolate({inputRange: [0, 1], outputRange: [0, 0.85]})
			.addListener((value) => {if (backdrop) {
				backdrop.style.setProperty("opacity", `${value.value}`);
				backdrop.style.setProperty("background-color", "rgb(0, 0, 0)");
				backdrop.style.setProperty("z-index", "1000");
				backdrop.style.setProperty("transform", "translateZ(0px)");
			}});
		
		var animate = (v) => {
			Animations.parallel([
				Animations.timing(modalOpacity, {toValue: v, duration: 250, easing: Animations.Easing.inOut(Animations.Easing.ease)}),
				Animations.timing(modalTransform, {toValue: v, duration: 250, easing: Animations.Easing.inOut(Animations.Easing.ease)}),
				Animations.timing(backdropOpacity, {toValue: v, duration: 200, delay:50}),
			]).start();
		};
		
		var keydown = e => {
			if (!document.contains(modalwrapper)) document.removeEventListener('keydown', keydown);
			else if (e.which == 27 && backdrop) backdrop.click();
		};
		document.addEventListener('keydown', keydown);
		BDFDB.addChildEventListener(modalwrapper, 'click', BDFDB.dotCNC.backdrop + BDFDB.dotCNC.modalclose + '.btn-close, .btn-save, .btn-send, .btn-cancel, .btn-ok', () => {
			document.removeEventListener('keydown', keydown);
			animate(0);
			setTimeout(() => {modalwrapper.remove();}, 300);
		});
		BDFDB.appendModal.modals.appendChild(modalwrapper);
		BDFDB.initElements(modalwrapper);
		animate(1);
	};
	
	BDFDB.createSearchBar = function (size = "small") {
		if (typeof size != "string" || !["small","medium","large"].includes(size.toLowerCase())) size = "small";
		var sizeclass = DiscordClassModules.SearchBar[size] ? (" " + BDFDB.disCN["searchbar" + size]) : "";
		var searchBar = BDFDB.htmlToElement(`<div class="${BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontal + BDFDB.disCNS.horizontal2 + BDFDB.disCNS.directionrow + BDFDB.disCNS.justifystart + BDFDB.disCNS.alignstretch + BDFDB.disCNS.nowrap + BDFDB.disCN.searchbar + sizeclass}" style="flex: 1 1 auto;"><div class="${BDFDB.disCN.searchbarinner}"><input class="${BDFDB.disCN.searchbarinput}" type="text" spellcheck="false" placeholder="" value=""><div tabindex="0" class="${BDFDB.disCN.searchbariconlayout + sizeclass}" role="button"><div class="${BDFDB.disCN.searchbariconwrap}"><svg name="Search" class="${BDFDB.disCNS.searchbaricon + BDFDB.disCN.searchbarvisible}" width="18" height="18" viewBox="0 0 18 18"><g fill="none" fill-rule="evenodd"><path fill="currentColor" d="M3.60091481,7.20297313 C3.60091481,5.20983419 5.20983419,3.60091481 7.20297313,3.60091481 C9.19611206,3.60091481 10.8050314,5.20983419 10.8050314,7.20297313 C10.8050314,9.19611206 9.19611206,10.8050314 7.20297313,10.8050314 C5.20983419,10.8050314 3.60091481,9.19611206 3.60091481,7.20297313 Z M12.0057176,10.8050314 L11.3733562,10.8050314 L11.1492281,10.5889079 C11.9336764,9.67638651 12.4059463,8.49170955 12.4059463,7.20297313 C12.4059463,4.32933105 10.0766152,2 7.20297313,2 C4.32933105,2 2,4.32933105 2,7.20297313 C2,10.0766152 4.32933105,12.4059463 7.20297313,12.4059463 C8.49170955,12.4059463 9.67638651,11.9336764 10.5889079,11.1492281 L10.8050314,11.3733562 L10.8050314,12.0057176 L14.8073185,16 L16,14.8073185 L12.2102538,11.0099776 L12.0057176,10.8050314 Z"></path></g></svg><svg name="Clear" class="${BDFDB.disCNS.searchbaricon + BDFDB.disCN.searchbarclear}" width="12" height="12" viewBox="0 0 12 12"><g fill="none" fill-rule="evenodd"><path d="M0 0h12v12H0"></path><path class="fill" fill="currentColor" d="M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5l-.705.705L5.295 6 2.5 8.795l.705.705L6 6.705 8.795 9.5l.705-.705L6.705 6"></path></g></svg></div></div></div></div>`);
		BDFDB.initElements(searchBar);
		return searchBar;
	};
	
	BDFDB.createSelectMenu = function (inner, value, type = "", dark = BDFDB.getDiscordTheme() == BDFDB.disCN.themedark) {
		if (typeof inner != "string" || (typeof value != "string" && typeof value != "number")) return BDFDB.htmlToElement(`<div></div>`);
		var suffix = dark ? "dark" : "light";
		return `<div class="${BDFDB.disCN.selectwrap} BDFDB-select" style="flex: 1 1 auto;"><div class="${BDFDB.disCN.select}" type="${type}" value="${value}"><div class="${BDFDB.disCNS.selectcontrol + BDFDB.disCN["selectcontrol" + suffix]}"><div class="${BDFDB.disCN.selectvalue}"><div class="${BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontal + BDFDB.disCNS.horizontal2 + BDFDB.disCNS.directionrow + BDFDB.disCNS.justifystart + BDFDB.disCNS.alignbaseline + BDFDB.disCNS.nowrap + BDFDB.disCNS.selectsingle + BDFDB.disCN["selectsingle" + suffix]}">${inner}</div><input readonly="" tabindex="0" class="${BDFDB.disCN.selectdummyinput}" value=""></div><div class="${BDFDB.disCN.selectarrowzone}"><div aria-hidden="true" class="${BDFDB.disCNS.selectarrowcontainer + BDFDB.disCN["selectarrowcontainer" + suffix]}"><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" class="${BDFDB.disCN.selectarrow}"><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div></div></div></div></div>`;
	};

	BDFDB.openDropdownMenu = function (e, callback, createinner, values, selector = "", dark = BDFDB.getDiscordTheme() == BDFDB.disCN.themedark) {
		if (typeof callback != "function" || typeof createinner != "function" || !values || typeof values != "object") return;
		let selectControl = e.currentTarget;
		let selectWrap = selectControl.parentElement;
		if (BDFDB.containsClass(selectWrap, BDFDB.disCN.selectisopen)) return;

		BDFDB.addClass(selectWrap, BDFDB.disCN.selectisopen);

		var type = selectWrap.getAttribute("type");
		var oldchoice = selectWrap.getAttribute("value");
		var suffix = dark ? "dark" : "light";
		var menuhtml = `<div class="${BDFDB.disCNS.selectmenuouter + BDFDB.disCN["selectmenuouter" + suffix]}"><div class="${BDFDB.disCN.selectmenu}">`;
		for (var key in values) menuhtml += `<div value="${key}" class="${BDFDB.disCNS.selectoption + (key == oldchoice ? BDFDB.disCN["selectoptionselect" + suffix] : BDFDB.disCN["selectoption" + suffix])}" style="flex: 1 1 auto; display: flex;">${createinner(key)}</div>`;
		menuhtml += `</div></div>`;
		var selectMenu = BDFDB.htmlToElement(menuhtml);
		if (selector) BDFDB.addClass(selectMenu, selector);
		selectWrap.appendChild(selectMenu);

		BDFDB.addChildEventListener(selectMenu, "mouseenter", BDFDB.dotCN.selectoption + BDFDB.notCN.selectoptionselectlight + BDFDB.notCN.selectoptionselectdark, e2 => {
			if (dark) {
				BDFDB.removeClass(e2.currentTarget, BDFDB.disCN.selectoptiondark);
				BDFDB.addClass(e2.currentTarget, BDFDB.disCN.selectoptionhoverdark);
			}
			else {
				BDFDB.removeClass(e2.currentTarget, BDFDB.disCN.selectoptionlight);
				BDFDB.addClass(e2.currentTarget, BDFDB.disCN.selectoptionhoverlight);
			}
		});
		BDFDB.addChildEventListener(selectMenu, "mouseleave", BDFDB.dotCN.selectoption + BDFDB.notCN.selectoptionselectlight + BDFDB.notCN.selectoptionselectdark, e2 => {
			if (dark) {
				BDFDB.removeClass(e2.currentTarget, BDFDB.disCN.selectoptionhoverdark);
				BDFDB.addClass(e2.currentTarget, BDFDB.disCN.selectoptiondark);
			}
			else {
				BDFDB.removeClass(e2.currentTarget, BDFDB.disCN.selectoptionhoverlight);
				BDFDB.addClass(e2.currentTarget, BDFDB.disCN.selectoptionlight);
			}	
		});
		BDFDB.addChildEventListener(selectMenu, "mousedown", BDFDB.dotCN.selectoption, e2 => {
			var newchoice = e2.currentTarget.getAttribute("value");
			selectWrap.setAttribute("value", newchoice);
			callback(selectWrap, type, newchoice);
		});

		var removeMenu = e2 => {
			if (e2.target.parentElement != selectMenu) {
				document.removeEventListener("mousedown", removeMenu);
				selectMenu.remove();
				setTimeout(() => {BDFDB.removeClass(selectWrap, BDFDB.disCN.selectisopen);},100);
			}
		};
		document.addEventListener("mousedown", removeMenu);
	};

	BDFDB.openConfirmModal = function () {
		if (arguments.length < 2) return;
		var plugin = arguments[0];
		var text = arguments[1];
		if (!BDFDB.isObject(plugin) || !text) return;
		var callback = typeof arguments[2] == "function" ? arguments[2] : (typeof arguments[3] == "function" ? arguments[3] : null);
		var header = typeof arguments[2] == "string" ? arguments[2] : "Are you sure?";
		let confirmModal = BDFDB.htmlToElement(`<span class="${plugin.name}-modal BDFDB-confirmation-modal BDFDB-modal"><div class="${BDFDB.disCN.backdrop}"></div><div class="${BDFDB.disCN.modal}"><div class="${BDFDB.disCN.modalinner}"><div class="${BDFDB.disCNS.modalsub + BDFDB.disCNS.modalmini + BDFDB.disCN.modalminisize}"><div class="${BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontal + BDFDB.disCNS.horizontal2 + BDFDB.disCNS.directionrow + BDFDB.disCNS.justifystart + BDFDB.disCNS.aligncenter + BDFDB.disCNS.nowrap + BDFDB.disCN.modalheader}" style="flex:0 0 auto;"><div class="${BDFDB.disCN.flexchild}" style="flex:1 1 auto;"><h4 class="${BDFDB.disCNS.h4 + BDFDB.disCNS.headertitle + BDFDB.disCNS.size16 + BDFDB.disCNS.height20 + BDFDB.disCNS.weightsemibold + BDFDB.disCNS.defaultcolor + BDFDB.disCNS.h4defaultmargin + BDFDB.disCN.marginreset}">${header}</h4><div class="${BDFDB.disCNS.modalguildname + BDFDB.disCNS.small + BDFDB.disCNS.size12 + BDFDB.disCNS.height16 + BDFDB.disCN.primary}">${plugin.name}</div></div><button type="button" class="${BDFDB.disCNS.modalclose + BDFDB.disCNS.flexchild + BDFDB.disCNS.button + BDFDB.disCNS.buttonlookblank + BDFDB.disCNS.buttoncolorbrand + BDFDB.disCN.buttongrow}"><div class="${BDFDB.disCN.buttoncontents}"><svg class="" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 12 12"><g fill="none" fill-rule="evenodd"><path d="M0 0h12v12H0"></path><path class="fill" fill="currentColor" d="M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5l-.705.705L5.295 6 2.5 8.795l.705.705L6 6.705 8.795 9.5l.705-.705L6.705 6"></path></g></svg></div></button></div><div class="${BDFDB.disCNS.scrollerwrap + BDFDB.disCNS.modalcontent + BDFDB.disCNS.scrollerthemed + BDFDB.disCN.themeghosthairline}"><div class="${BDFDB.disCNS.scroller + BDFDB.disCNS.modalsubinner + BDFDB.disCN.modalminicontent}"><div class="${BDFDB.disCNS.medium + BDFDB.disCNS.size16 + BDFDB.disCNS.height20 + BDFDB.disCNS.primary + BDFDB.disCN.selectable}message-content" style="padding-bottom:20px;">${text}</div></div> </div><div class="${BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontalreverse + BDFDB.disCNS.horizontalreverse2 + BDFDB.disCNS.directionrowreverse + BDFDB.disCNS.justifystart + BDFDB.disCNS.alignstretch + BDFDB.disCNS.nowrap + BDFDB.disCN.modalfooter}"><button type="button" class="btn-ok ${BDFDB.disCNS.button + BDFDB.disCNS.buttonlookfilled + BDFDB.disCNS.buttoncolorbrand + BDFDB.disCNS.buttonsizemedium + BDFDB.disCN.buttongrow}"><div class="${BDFDB.disCN.buttoncontents}"></div></button><button type="button" class="btn-cancel ${BDFDB.disCNS.button + BDFDB.disCNS.buttonlooklink + BDFDB.disCNS.buttoncolorwhite + BDFDB.disCNS.buttonsizemedium + BDFDB.disCN.buttongrow}"><div class="${BDFDB.disCN.buttoncontents}"></div></button></div></div></div></div></span>`);
		BDFDB.appendModal(confirmModal);
		if (typeof callback == 'function') confirmModal.querySelector('.btn-ok').addEventListener('click', () => {
			setTimeout(() => {callback();}, 300);
		});
		return confirmModal;
	};
	
	BDFDB.updateContextPosition = function (menu, e = BDFDB.mousePosition) {
		if (!Node.prototype.isPrototypeOf(menu)) return;
		var arects = BDFDB.getRects(document.querySelector(BDFDB.dotCN.appmount));
		var mrects = BDFDB.getRects(menu);
		var newpos = {
			pageX: e.pageX - mrects.width,
			pageY: e.pageY - mrects.height
		};
		menu.style.setProperty('left', (e.pageX + mrects.width > arects.width ? (newpos.pageX < 0 ? 10 : newpos.pageX) : e.pageX) + 'px');
		menu.style.setProperty('top', (e.pageY + mrects.height > arects.height ? (newpos.pageY < 0 ? 10 : newpos.pageY) : e.pageY) + 'px');
		BDFDB.initElements(menu);
	};

	BDFDB.appendContextMenu = function (menu, e = BDFDB.mousePosition) {
		if (!Node.prototype.isPrototypeOf(menu)) return;
		var tooltips = document.querySelector(BDFDB.dotCN.tooltips);
		if (!tooltips) return;
		tooltips.parentElement.insertBefore(menu, tooltips);
		var arects = BDFDB.getRects(document.querySelector(BDFDB.dotCN.appmount));
		var mrects = BDFDB.getRects(menu);
		BDFDB.toggleClass(menu, 'invertX', e.pageX + mrects.width > arects.width);
		BDFDB.toggleClass(menu, 'invertY', e.pageY + mrects.height > arects.height);
		BDFDB.toggleClass(menu, BDFDB.disCN.contextmenuinvertchildx, e.pageX + mrects.width > arects.width);
		BDFDB.addClass(menu, BDFDB.getDiscordTheme());
		BDFDB.updateContextPosition(menu, e);
		var mousedown = e2 => {
			if (!document.contains(menu)) document.removeEventListener('mousedown', mousedown);
			else if (!menu.contains(e2.target)) {
				document.removeEventListener('mousedown', mousedown);
				menu.remove();
			}
			else {
				var item = BDFDB.getParentEle(BDFDB.dotCN.contextmenuitem, e2.target);
				if (item && !BDFDB.containsClass(item, BDFDB.disCN.contextmenuitemdisabled, BDFDB.disCN.contextmenuitemsubmenu, BDFDB.disCN.contextmenuitemtoggle, BDFDB.disCN.contextmenuitemslider, false)) document.removeEventListener('mousedown', mousedown);
			}
		};
		document.addEventListener('mousedown', mousedown);
		BDFDB.initElements(menu);
	};
	
	BDFDB.closeContextMenu = function (nodeOrInstance) {
		if (!BDFDB.isObject(nodeOrInstance)) return;
		var instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.getOwnerInstance({node:nodeOrInstance, name:"ContextMenu", up:true}) : BDFDB.getOwnerInstance({instance:nodeOrInstance, name:"ContextMenu", up:true});
		if (BDFDB.isObject(instance) && instance.props && typeof instance.props.closeContextMenu == "function") instance.props.closeContextMenu();
	};

	BDFDB.appendSubMenu = function (target, submenu) {
		if (!Node.prototype.isPrototypeOf(target) || !Node.prototype.isPrototypeOf(submenu)) return;
		target.appendChild(submenu);
		var trects = BDFDB.getRects(target);
		var mrects = BDFDB.getRects(submenu);
		submenu.style.setProperty('left', trects.left + 'px');
		submenu.style.setProperty('top', (trects.top + mrects.height > window.outerHeight ? trects.top - mrects.height + trects.height : trects.top) + 'px');
		BDFDB.addClass(submenu, BDFDB.getDiscordTheme());
		var mouseleave = () => {
			target.removeEventListener('mouseleave', mouseleave);
			submenu.remove();
		};
		target.addEventListener('mouseleave', mouseleave);
		BDFDB.initElements(submenu);
	};

	BDFDB.setContextHint = function (item, text) {
		if (!text || !Node.prototype.isPrototypeOf(item)) return;
		var hint = item.querySelector(BDFDB.dotCN.contextmenuhint);
		if (hint) {
			item.style.setProperty('position', 'relative', 'important');
			hint.innerHTML = `<div class="BDFDB-textscrollwrapper" speed=3><div class="BDFDB-textscroll">${BDFDB.encodeToHTML(text)}</div></div>`;
			if (!BDFDB.containsClass(hint.previousElementSibling, 'BDFDB-textscrollwrapper')) {
				BDFDB.addClass(hint.previousElementSibling, 'BDFDB-textscrollwrapper');
				hint.previousElementSibling.setAttribute('speed', 3);
				hint.previousElementSibling.innerHTML = `<div class="BDFDB-textscroll">${BDFDB.encodeToHTML(hint.previousElementSibling.innerText)}</div>`;
			}
			var width = BDFDB.getRects(item).width - (parseFloat(getComputedStyle(item).paddingLeft) + parseFloat(getComputedStyle(item).paddingRight));
			hint.previousElementSibling.style.setProperty('width', width - 36 + 'px', 'important');
			hint.previousElementSibling.style.setProperty('max-width', width - 36 + 'px', 'important');
			hint.style.setProperty('position', 'absolute', 'important');
			hint.style.setProperty('top', getComputedStyle(item).paddingTop, 'important');
			hint.style.setProperty('right', getComputedStyle(item).paddingRight, 'important');
			hint.style.setProperty('width', '32px', 'important');
			hint.style.setProperty('max-width', '32px', 'important');
		}
	};

	BDFDB.openGuildContextMenu = function (target, e = BDFDB.mousePosition) {
		var guilddiv = BDFDB.getParentEle(BDFDB.dotCN.guildouter, target);
		if (!guilddiv) return;
		var handleContextMenu = BDFDB.getReactValue(guilddiv, 'return.stateNode.handleContextMenu');
		if (handleContextMenu) handleContextMenu({
			currentTarget: guilddiv,
			target: guilddiv,
			preventDefault: a => a,
			stopPropagation: a => a,
			pageX: e.pageX,
			pageY: e.pageY
		});
	};

	BDFDB.createMessageOptionPopout = function (button) {
		if (!button) return;
		var popouts = document.querySelector(BDFDB.dotCN.popouts);
		if (!popouts) return;
		button = BDFDB.containsClass(button, BDFDB.disCN.optionpopoutbutton) ? button : button.querySelector(BDFDB.dotCN.optionpopoutbutton);
		var containerins = BDFDB.getReactInstance(BDFDB.getParentEle(BDFDB.dotCN.messagebuttoncontainer, button));
		containerins = containerins && containerins.child ? containerins.child : null;
		containerins = containerins && containerins.stateNode && typeof containerins.stateNode.renderReactionPopout == 'function' ? containerins.sibling : containerins;
		if (containerins && containerins.stateNode && typeof containerins.stateNode.renderOptionPopout == 'function') {
			BDFDB.addClass(button, 'popout-open');
			var popout = BDFDB.htmlToElement(`<div role="dialog" class="${BDFDB.disCNS.popoutnoarrow + BDFDB.disCNS.popout + BDFDB.disCNS.popoutbottom + BDFDB.disCN.popoutarrowalignmenttop}" style="z-index:1001; visibility:visible; transform:translateX(-50%) translateY(0%) translateZ(0px);"></div>`);
			popouts.appendChild(popout);
			var popoutinstance = containerins.stateNode.renderOptionPopout(containerins.stateNode.props);
			popoutinstance.props.target = button;
			popoutinstance.props.onClose = () => {
				BDFDB.removeClass(button, 'popout-open');
				popout.remove();
			};
			BDFDB.React.render(popoutinstance, popout);
			var buttonrects = BDFDB.getRects(button);
			popout.style.setProperty('left', buttonrects.left + buttonrects.width / 2 + 'px');
			popout.style.setProperty('top', buttonrects.top + buttonrects.height / 2 + 'px');
			var mousedown = e => {
				document.removeEventListener('mousedown', mousedown);
				if (!popout.contains(e.target)) popoutinstance.props.onClose();
			};
			document.addEventListener('mousedown', mousedown);
		}
	};

	BDFDB.createSortPopout = function (anker, markup, callback) {
		if (!anker || !markup || typeof callback != 'function' || BDFDB.containsClass(anker, 'popout-open')) return;
		var popouts = document.querySelector(BDFDB.dotCN.popouts);
		var valueinput = anker.querySelector(BDFDB.dotCNC.quickselectvalue + BDFDB.dotCN.recentmentionsmentionfiltervalue);
		if (!popouts || !valueinput) return;
		BDFDB.addClass(anker, 'popout-open');
		var popout = BDFDB.htmlToElement(markup);
		var ankerrects = BDFDB.getRects(anker);
		popout.style.setProperty('left', ankerrects.left + ankerrects.width + 'px');
		popout.style.setProperty('top', ankerrects.top + BDFDB.getRects(valueinput).height + 'px');
		BDFDB.addClass(popout.querySelector(BDFDB.dotCN.contextmenu), BDFDB.getDiscordTheme());
		BDFDB.addChildEventListener(popout, 'click', BDFDB.dotCN.contextmenuitem, e => {
			valueinput.innerText = e.currentTarget.innerText;
			valueinput.setAttribute('option', e.currentTarget.getAttribute('option'));
			document.removeEventListener('mousedown', mousedown);
			popout.remove();
			setTimeout(() => {BDFDB.removeClass(anker, 'popout-open');}, 300);
			callback();
		});
		popouts.appendChild(popout);
		var mousedown = e => {
			if (!document.contains(popout)) document.removeEventListener('mousedown', mousedown);
			else if (!popout.contains(e.target)) {
				document.removeEventListener('mousedown', mousedown);
				popout.remove();
				setTimeout(() => {BDFDB.removeClass(anker, 'popout-open');}, 300);
			}
		};
		document.addEventListener('mousedown', mousedown);
	};

	BDFDB.setColorSwatches = function (container, currentcolor) {
		if (!Node.prototype.isPrototypeOf(container)) return;
		
		var swatches = container.querySelector('.swatches:not([swatchnr])');
		if (!swatches) return;
		swatches.setAttribute('swatchnr', parseInt(container.querySelectorAll('.swatches[swatchnr]').length + 1));
		
		var colorlist = ['rgb(82,233,30)', 'rgb(46,204,113)', 'rgb(26,188,156)', 'rgb(52,152,219)', 'rgb(52,84,219)', 'rgb(134,30,233)', 'rgb(155,89,182)', 'rgb(233,30,99)', 'rgb(233,65,30)', 'rgb(231,76,60)', 'rgb(230,126,34)', 'rgb(241,196,15)', 'rgb(199,204,205)', 'rgb(112,128,136)', 'rgb(99,99,99)', 'rgb(255,255,255)', 'rgb(59,173,20)', 'rgb(31,139,76)', 'rgb(17,128,106)', 'rgb(32,102,148)', 'rgb(32,57,148)', 'rgb(109,20,173)', 'rgb(113,54,138)', 'rgb(173,20,87)', 'rgb(173,32,20)', 'rgb(153,45,34)', 'rgb(168,67,0)', 'rgb(194,124,14)', 'rgb(151,156,159)', 'rgb(93,104,109)', 'rgb(44,44,44)'];
		
		swatches.appendChild(BDFDB.htmlToElement(`<div class="${BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontal + BDFDB.disCNS.horizontal2 + BDFDB.disCNS.directionrow + BDFDB.disCNS.justifystart + BDFDB.disCNS.alignstretch + BDFDB.disCNS.nowrap + BDFDB.disCN.margintop4}" style="flex:1 1 auto;"><div class="ui-color-picker-swatch large color custom" style="background-color:rgb(0, 0, 0);"><svg class="color-picker-dropper" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16"><path class="color-picker-dropper-fg" fill="currentColor" style="color:rgb(255,255,255) !important;" d="M14.994 1.006C13.858-.257 11.904-.3 10.72.89L8.637 2.975l-.696-.697-1.387 1.388 5.557 5.557 1.387-1.388-.697-.697 1.964-1.964c1.13-1.13 1.3-2.985.23-4.168zm-13.25 10.25c-.225.224-.408.48-.55.764L.02 14.37l1.39 1.39 2.35-1.174c.283-.14.54-.33.765-.55l4.808-4.808-2.776-2.776-4.813 4.803z"></path></svg></div><div class="${BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontal + BDFDB.disCNS.horizontal2 + BDFDB.disCNS.directionrow + BDFDB.disCNS.justifystart + BDFDB.disCNS.alignstretch + BDFDB.disCN.wrap} ui-color-picker-row" style="flex:1 1 auto;"><div class="ui-color-picker-swatch small nocolor"></div>${colorlist.map(c => '<div class="ui-color-picker-swatch small color" style="background-color: ' + c + ';"></div>').join('')}</div></div>`));
		if (currentcolor && !BDFDB.colorCOMPARE(currentcolor, [0, 0, 0, 0])) {
			var selection = colorlist.indexOf(BDFDB.colorCONVERT(currentcolor, 'RGB'));
			setSwatch(selection > -1 ? swatches.querySelectorAll('.ui-color-picker-swatch.small.color')[selection] : swatches.querySelector('.ui-color-picker-swatch.large.custom'), currentcolor, true);
		}
		else setSwatch(swatches.querySelector('.ui-color-picker-swatch.small.nocolor'), null, true);
		BDFDB.addChildEventListener(swatches, 'click', '.ui-color-picker-swatch', e => {
			if (BDFDB.containsClass(swatches, 'disabled')) return;
			else if (BDFDB.containsClass(e.currentTarget, 'custom')) {
				BDFDB.openColorPicker(e.currentTarget.style.backgroundColor).then(selectedcolor => {
					setSwatch(swatches.querySelector('.ui-color-picker-swatch.selected'), null, false);
					setSwatch(swatches.querySelector('.ui-color-picker-swatch.custom'), selectedcolor, true);
				});
			}
			else {
				setSwatch(swatches.querySelector('.ui-color-picker-swatch.selected'), null, false);
				setSwatch(e.currentTarget, e.currentTarget.style.getPropertyValue('background-color'), true);
			}
		});
		function setSwatch(swatch, color, selected) {
			if (!swatch) return;
			if (selected) {
				BDFDB.addClass(swatch, 'selected');
				if (color) swatch.style.setProperty('border-color', BDFDB.colorINV(color, 'RGB'), 'important');
				else swatch.style.removeProperty('border-color');
				if (color && BDFDB.containsClass(swatch, 'custom')) {
					var comp = BDFDB.colorCONVERT(color, 'RGBCOMP');
					swatch.style.setProperty('background-color', BDFDB.colorCONVERT(color, 'RGB'), 'important');
					swatch.querySelector('.color-picker-dropper-fg').style.setProperty('color', comp[0] > 150 && comp[1] > 150 && comp[2] > 150 ? '#000' : '#FFF', 'important');
				}
			}
			else {
				BDFDB.removeClass(swatch, 'selected');
				swatch.style.removeProperty('border-color');
			}
		}
	};

	BDFDB.getSwatchColor = function (container, nr) {
		if (!Node.prototype.isPrototypeOf(container)) return;
		
		var swatch = container.querySelector(`.swatches[swatchnr="${nr}"] .ui-color-picker-swatch.selected`);
		return swatch ? BDFDB.colorCONVERT(swatch.style.getPropertyValue('background-color'), 'RGBCOMP') : null;
	};

	BDFDB.openColorPicker = function (color) {
		return new Promise(resolve => {
			color = BDFDB.colorCONVERT(color, 'RGB') || 'rgb(0,0,0)';
			var librarystrings = BDFDB.getLibraryStrings();
			var inputs = {
				HEX:	{type:'text',		name:'hex',			group:'HEX',	min:null,	max:null,	length:7,		unit:'',	default:'#000000'},
				R:		{type:'number',		name:'red',			group:'RGB',	min:0,		max:255,	length:null,	unit:'',	default:0},
				G:		{type:'number',		name:'green',		group:'RGB',	min:0,		max:255,	length:null,	unit:'',	default:0},
				B:		{type:'number',		name:'blue',		group:'RGB',	min:0,		max:255,	length:null,	unit:'',	default:0},
				H:		{type:'number',		name:'hue',			group:'HSL',	min:0,		max:360,	length:null,	unit:'°',	default:0},
				S:		{type:'number',		name:'saturation',	group:'HSL',	min:0,		max:100,	length:null,	unit:'%',	default:0},
				L:		{type:'number',		name:'lightness',	group:'HSL',	min:0,		max:100,	length:null,	unit:'%',	default:0}
			};
			var colorPickerModal = BDFDB.htmlToElement(`<span class="colorpicker-modal BDFDB-modal"><div class="${BDFDB.disCN.backdrop}"></div><div class="${BDFDB.disCN.modal}"><div class="${BDFDB.disCN.modalinner}"><div class="${BDFDB.disCNS.modalsub + BDFDB.disCN.modalsizemedium}"><div class="${BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontal + BDFDB.disCNS.horizontal2 + BDFDB.disCNS.directionrow + BDFDB.disCNS.justifystart + BDFDB.disCNS.aligncenter + BDFDB.disCNS.nowrap + BDFDB.disCN.modalheader}" style="flex:0 0 auto;"><div class="${BDFDB.disCN.flexchild}" style="flex:1 1 auto;"><h4 class="${BDFDB.disCNS.h4 + BDFDB.disCNS.headertitle + BDFDB.disCNS.size16 + BDFDB.disCNS.height20 + BDFDB.disCNS.weightsemibold + BDFDB.disCNS.defaultcolor + BDFDB.disCNS.h4defaultmargin + BDFDB.disCN.marginreset}">${librarystrings.colorpicker_modal_header_text}</h4></div><button type="button" class="${BDFDB.disCNS.modalclose + BDFDB.disCNS.flexchild + BDFDB.disCNS.button + BDFDB.disCNS.buttonlookblank + BDFDB.disCNS.buttoncolorbrand + BDFDB.disCN.buttongrow}"><div class="${BDFDB.disCN.buttoncontents}"><svg class="" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 12 12"><g fill="none" fill-rule="evenodd"><path d="M0 0h12v12H0"></path><path class="fill" fill="currentColor" d="M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5l-.705.705L5.295 6 2.5 8.795l.705.705L6 6.705 8.795 9.5l.705-.705L6.705 6"></path></g></svg></div></button></div><div class="${BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.vertical + BDFDB.disCNS.modalsubinner + BDFDB.disCNS.directioncolumn + BDFDB.disCNS.justifystart + BDFDB.disCNS.alignstretch + BDFDB.disCN.nowrap} colorpicker-container" style="flex:1 1 auto;"><div class="colorpicker-color"><div class="colorpicker-white" style="background:linear-gradient(to right, #fff, transparent) !important;"><div class="colorpicker-black" style="background:linear-gradient(to top, #000, transparent) !important;"><div class="colorpicker-pickercursor" style="left:-999999px; top:-999999px;"><svg xmlns="http://www.w3.org/2000/svg" version="1.1"><circle cx="7" cy="7" r="6" style="color:black !important;" stroke="currentColor" stroke-width="2" fill="none" /></svg></div><div class="colorpicker-pickerpane"></div></div></div></div><div class="colorpicker-slider" style="background:linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%) !important;"><div class="colorpicker-slidercursor" style="top:-999999px;"><svg xmlns="http://www.w3.org/2000/svg" version="1.1"><path style="color:grey !important;" stroke="currentColor" fill="white" d="M 0 0, l 5 5, l -5 5, m 31 0, l -5 -5, l 5 -5"></path></svg></div><div class="colorpicker-sliderpane"></div></div><div class="colorpicker-controls"><div class="colorpicker-previewcontainer"><div class="colorpicker-preview-0 selected" style="background-color:#808080;"></div><div class="colorpicker-preview-2" style="background-color:#808080;"></div></div><div class="colorpicker-inputs ${BDFDB.disCNS.card + BDFDB.disCN.cardprimaryeditable}">${Object.keys(inputs).map((key, i) => '<div class="colorpicker-input ' + (BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontal + BDFDB.disCNS.horizontal2 + BDFDB.disCNS.directionrow + BDFDB.disCNS.aligncenter + BDFDB.disCNS.justifycenter + BDFDB.disCNS.margintop4 + BDFDB.disCNS.marginbottom4 + BDFDB.disCN.nowrap) + '"><div class="' + (BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontal + BDFDB.disCNS.horizontal2 + BDFDB.disCNS.directionrow + BDFDB.disCN.nowrap) + '" style="flex:1 1 20%"><h5 class="' + (BDFDB.disCNS.h5 + BDFDB.disCNS.size12 + BDFDB.disCNS.height16 + BDFDB.disCN.weightsemibold) + '">' + key + ':</h5></div><div class="' + (inputs[key].type == 'number' ? 'inputNumberWrapper inputNumberWrapperMini ' : '') + (BDFDB.disCNS.inputwrapper + BDFDB.disCNS.vertical + BDFDB.disCNS.flex + BDFDB.disCN.directioncolumn) + '" style="flex:1 1 70%;">' + (inputs[key].type == 'number' ? '<span class="numberinput-buttons-zone"><span class="numberinput-button-up"></span><span class="numberinput-button-down"></span></span>' : '') + '<input type="' + inputs[key].type + '"' + (!isNaN(inputs[key].min) && inputs[key].min !== null ? ' min="' + inputs[key].min + '"' : '') + (!isNaN(inputs[key].max) && inputs[key].max !== null ? ' max="' + inputs[key].max + '"' : '') + (!isNaN(inputs[key].length) && inputs[key].length !== null ? ' maxlength="' + inputs[key].length + '"' : '') + ' group="' + inputs[key].group + '" placeholder="' + inputs[key].default + '" class="' + (BDFDB.disCNS.inputmini + BDFDB.disCNS.input + BDFDB.disCN.size16) + ' colorpicker-' + inputs[key].name + '"></div><div class="' + (BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontal + BDFDB.disCNS.horizontal2 + BDFDB.disCNS.directionrow + BDFDB.disCN.nowrap) + '" style="flex:1 1 10%"><h5 class="' + (BDFDB.disCNS.h5 + BDFDB.disCNS.size12 + BDFDB.disCNS.height16 + BDFDB.disCN.weightsemibold) + '">' + inputs[key].unit + '</h5></div></div>').join('')}</div></div></div><div class="${BDFDB.disCNS.flex + BDFDB.disCNS.flex2 + BDFDB.disCNS.horizontalreverse + BDFDB.disCNS.horizontalreverse2 + BDFDB.disCNS.directionrowreverse + BDFDB.disCNS.justifystart + BDFDB.disCNS.alignstretch + BDFDB.disCNS.nowrap + BDFDB.disCN.modalfooter}"><button type="button" class="btn-ok ${BDFDB.disCNS.button + BDFDB.disCNS.buttonlookfilled + BDFDB.disCNS.buttoncolorbrand + BDFDB.disCNS.buttonsizemedium + BDFDB.disCN.buttongrow}"><div class="${BDFDB.disCN.buttoncontents}"></div></button></div></div></div></div></span>`);
			BDFDB.appendModal(colorPickerModal);
			BDFDB.addChildEventListener(colorPickerModal, 'click', '.btn-ok', () => {
				resolve(colorPickerModal.querySelector('[class^="colorpicker-preview-"].selected').style.getPropertyValue('background-color'));
			});
			BDFDB.addChildEventListener(colorPickerModal, 'click', BDFDB.dotCNC.backdrop + BDFDB.dotCN.modalclose, () => {
				resolve(null);
			});
			
			var hex = '#000000', r = 0, g = 0, b = 0, h = 0, s = 0, l = 0;
			
			var hexinput = colorPickerModal.querySelector('.colorpicker-hex');
			var hinput = colorPickerModal.querySelector('.colorpicker-hue');
			var sinput = colorPickerModal.querySelector('.colorpicker-saturation');
			var linput = colorPickerModal.querySelector('.colorpicker-lightness');
			var rinput = colorPickerModal.querySelector('.colorpicker-red');
			var ginput = colorPickerModal.querySelector('.colorpicker-green');
			var binput = colorPickerModal.querySelector('.colorpicker-blue');
			
			var ppane = colorPickerModal.querySelector('.colorpicker-pickerpane');
			var pcursor = colorPickerModal.querySelector('.colorpicker-pickercursor');
			var pcursorinner = colorPickerModal.querySelector('circle');
			
			var spane = colorPickerModal.querySelector('.colorpicker-sliderpane');
			var scursor = colorPickerModal.querySelector('.colorpicker-slidercursor');
			var scursorinner = colorPickerModal.querySelector('path');
			
			var pX = 0;
			var pY = 0;
			var pHalfW, pHalfH, pMinX, pMaxX, pMinY, pMaxY;
			var sY = 0;
			var sHalfH, sMinY, sMaxY;
			[h, s, l] = BDFDB.colorCONVERT(color, 'HSLCOMP');
			updateValues();
			setTimeout(() => {updateCursorColors();}, 300);
			ppane.addEventListener('mousedown', e => {
				BDFDB.appendLocalStyle('BDFDBcrossHairColorPicker', '* {cursor:crosshair !important;}');
				switchPreview(e.button);
				updateCursorValues();
				pX = e.clientX - pHalfW;
				pY = e.clientY - pHalfH;
				updateCursorPositions();
				s = BDFDB.mapRange([pMinX - pHalfW, pMaxX - pHalfW], [0, 100], pX) + '%';
				l = BDFDB.mapRange([pMinY - pHalfH, pMaxY - pHalfH], [100, 0], pY) + '%';
				updateValues();
				var mouseup = () => {
					BDFDB.removeLocalStyle('BDFDBcrossHairColorPicker');
					document.removeEventListener('mouseup', mouseup);
					document.removeEventListener('mousemove', mousemove);
				};
				var mousemove = e2 => {
					pX = e2.clientX > pMaxX ? pMaxX - pHalfW : e2.clientX < pMinX ? pMinX - pHalfW : e2.clientX - pHalfW;
					pY = e2.clientY > pMaxY ? pMaxY - pHalfH : e2.clientY < pMinY ? pMinY - pHalfH : e2.clientY - pHalfH;
					updateCursorPositions();
					s = BDFDB.mapRange([pMinX - pHalfW, pMaxX - pHalfW], [0, 100], pX) + '%';
					l = BDFDB.mapRange([pMinY - pHalfH, pMaxY - pHalfH], [100, 0], pY) + '%';
					updateValues();
				};
				document.addEventListener('mouseup', mouseup);
				document.addEventListener('mousemove', mousemove);
			});
			spane.addEventListener('mousedown', e => {
				BDFDB.appendLocalStyle('BDFDBcrossHairColorPicker', '* {cursor:crosshair !important;}');
				switchPreview(e.button);
				updateCursorValues();
				sY = e.clientY - sHalfH;
				updateCursorPositions();
				h = BDFDB.mapRange([sMinY - sHalfH, sMaxY - sHalfH], [360, 0], sY);
				updateValues();
				var mouseup = () => {
					BDFDB.removeLocalStyle('BDFDBcrossHairColorPicker');
					document.removeEventListener('mouseup', mouseup);
					document.removeEventListener('mousemove', mousemove);
				};
				var mousemove = e2 => {
					sY = e2.clientY > sMaxY ? sMaxY - sHalfH : e2.clientY < sMinY ? sMinY - sHalfH : e2.clientY - sHalfH;
					updateCursorPositions();
					h = BDFDB.mapRange([sMinY - sHalfH, sMaxY - sHalfH], [360, 0], sY);
					updateValues();
				};
				document.addEventListener('mouseup', mouseup);
				document.addEventListener('mousemove', mousemove);
			});
			BDFDB.addChildEventListener(colorPickerModal, 'input', BDFDB.dotCN.inputmini, e => {
				updateInputs(e.currentTarget.getAttribute('group'));
			});
			BDFDB.addChildEventListener(colorPickerModal, 'click', '[class^="colorpicker-preview-"]', e => {
				var oldpreview = colorPickerModal.querySelector('[class^="colorpicker-preview-"].selected');
				oldpreview.style.setProperty('border-color', 'transparent');
				BDFDB.removeClass(oldpreview, 'selected');
				BDFDB.addClass(e.currentTarget, 'selected');
				[h, s, l] = BDFDB.colorCONVERT(e.currentTarget.style.getPropertyValue('background-value'), 'HSLCOMP');
				updateValues();
				updateCursorColors();
			});
			function switchPreview(which) {
				var oldpreview = colorPickerModal.querySelector('[class^="colorpicker-preview-"].selected');
				oldpreview.style.removeProperty('border-color');
				BDFDB.removeClass(oldpreview, 'selected');
				BDFDB.addClass(colorPickerModal.querySelector('.colorpicker-preview-' + which), 'selected');
			}
			function updateInputs(type) {
				switch (type) {
					case 'RGB':
						r = processInput(rinput), g = processInput(ginput), b = processInput(binput);
						[h, s, l] = BDFDB.colorCONVERT([r, g, b], 'HSLCOMP');
						hexinput.value = BDFDB.colorCONVERT([r, g, b], 'HEX');
						hinput.value = Math.round(h), sinput.value = Math.round(parseInt(s)), linput.value = Math.round(parseInt(l));
						rinput.value = r, ginput.value = g, binput.value = b;
						break;
					case 'HSL':
						h = processInput(hinput), s = processInput(sinput) + '%', l = processInput(linput) + '%';
						[r, g, b] = BDFDB.colorCONVERT([h, s, l], 'RGBCOMP');
						hexinput.value = BDFDB.colorCONVERT([r, g, b], 'HEX');
						hinput.value = h, sinput.value = parseInt(s), linput.value = parseInt(l);
						rinput.value = r, ginput.value = g, binput.value = b;
						break;
					case 'HEX':
						hex = hexinput.value;
						if (/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(hex)) {
							[h, s, l] = BDFDB.colorCONVERT(hex, 'HSLCOMP');
							[r, g, b] = BDFDB.colorCONVERT(hex, 'RGBCOMP');
							hinput.value = Math.round(h), sinput.value = Math.round(parseInt(s)), linput.value = Math.round(parseInt(l));
							rinput.value = r, ginput.value = g, binput.value = b;
						}
						break;
				}
				updatePreviews();
				updateCursorColors();
			}
			function processInput(input) {
				var value = parseInt(input.value);
				var min = parseInt(input.getAttribute('min'));
				var max = parseInt(input.getAttribute('max'));
				return isNaN(value) ? input.getAttribute('placeholder') : value < min ? min : value > max ? max : value;
			}
			function updateCursorColors() {
				updateCursorValues();
				pX = BDFDB.mapRange([0, 100], [pMinX - pHalfW, pMaxX - pHalfW], parseInt(s));
				pY = BDFDB.mapRange([100, 0], [pMinY - pHalfH, pMaxY - pHalfH], parseInt(l));
				sY = BDFDB.mapRange([360, 0], [sMinY - sHalfH, sMaxY - sHalfH], h);
				updateCursorPositions();
				pcursorinner.style.setProperty('color', BDFDB.colorINV([r, g, b], 'RGB'), 'important');
				scursorinner.style.setProperty('color', BDFDB.colorCONVERT([h, '100%', '100%'], 'RGB'), 'important');
			}
			function updateCursorValues() {
				var ppanerects = BDFDB.getRects(ppane);
				var pcursorrects = BDFDB.getRects(pcursor);
				pHalfW = pcursorrects.width / 2;
				pHalfH = pcursorrects.height / 2;
				pMinX = ppanerects.left;
				pMaxX = pMinX + ppanerects.width;
				pMinY = ppanerects.top;
				pMaxY = pMinY + ppanerects.height;
				var spanerects = BDFDB.getRects(spane);
				var scursorrects = BDFDB.getRects(scursor);
				sHalfH = scursorrects.height / 2;
				sMinY = spanerects.top;
				sMaxY = sMinY + spanerects.height;
			}
			function updateCursorPositions() {
				pcursor.style.setProperty('left', pX - pMinX + 'px', 'important');
				pcursor.style.setProperty('top', pY - pMinY + 'px', 'important');
				scursor.style.setProperty('top', sY - sMinY + 'px', 'important');
			}
			function updateValues() {
				[r, g, b] = BDFDB.colorCONVERT([h, s, l], 'RGBCOMP');
				hexinput.value = BDFDB.colorCONVERT([r, g, b], 'HEX');
				hinput.value = Math.round(h), sinput.value = Math.round(parseInt(s)), linput.value = Math.round(parseInt(l));
				rinput.value = Math.round(r), ginput.value = Math.round(g), binput.value = Math.round(b);
				updatePreviews();
				pcursorinner.style.setProperty('color', BDFDB.colorINV([r, g, b], 'RGB'), 'important');
				scursorinner.style.setProperty('color', BDFDB.colorCONVERT([h, '100%', '100%'], 'RGB'), 'important');
			}
			function updatePreviews() {
				colorPickerModal.querySelector('.colorpicker-color').style.setProperty('background-color', BDFDB.colorCONVERT([h, '100%', '100%'], 'RGB'), 'important');
				var preview = colorPickerModal.querySelector('[class^="colorpicker-preview-"].selected');
				preview.style.setProperty('background-color', BDFDB.colorCONVERT([r, g, b], 'RGB'), 'important');
				preview.style.setProperty('border-color', BDFDB.colorINV([r, g, b], 'RGB'), 'important');
			}
		});
	};

	BDFDB.mapRange = function (from, to, value) {
		return parseFloat(to[0]) + (parseFloat(value) - parseFloat(from[0])) * (parseFloat(to[1]) - parseFloat(to[0])) / (parseFloat(from[1]) - parseFloat(from[0]));
	};

	BDFDB.shake = function () {
		BDFDB.getReactInstance(document.querySelector(BDFDB.dotCN.appold)).return.stateNode.shake();
	};

	BDFDB.isBDv2 = function () {
		return typeof BDFDB.BDv2Api !== 'undefined';
	};

	BDFDB.isPluginEnabled = function (plugname) {
		if (!BDFDB.isBDv2()) return window.bdplugins[plugname] && window.pluginCookie[plugname];
		else return BDFDB.Plugins[plugname.toLowerCase()] ? BDFDB.Plugins[plugname.toLowerCase()].enabled : null;
	};

	BDFDB.isRestartNoMoreEnabled = function () {
		return window.settingsCookie['fork-ps-5'] && window.settingsCookie['fork-ps-5'] === true || BDFDB.isPluginEnabled('Restart-No-More') || BDFDB.isPluginEnabled('Restart No More');
	};
	
	BDFDB.isThemeEnabled = function (themename) {
		if (!BDFDB.isBDv2()) return window.bdthemes[themename] && window.themeCookie[themename];
		else return BDFDB.Themes[themename.toLowerCase()] ? BDFDB.Themes[themename.toLowerCase()].enabled : null;
	};
	
	(BDFDB.setPluginCache = function () {
		if (!BDFDB.isBDv2()) return;
		BDFDB.Plugins = {};
		for (let plugin of BDFDB.BDv2Api.Plugins.listPlugins()) BDFDB.BDv2Api.Plugins.getPlugin(plugin).then(plugindata => {BDFDB.Plugins[plugin] = plugindata;});
	})();
	
	(BDFDB.setThemeCache = function () {
		if (!BDFDB.isBDv2()) return;
		BDFDB.Themes = {};
		for (let theme of BDFDB.BDv2Api.Themes.listThemes()) BDFDB.BDv2Api.Themes.getTheme(theme).then(themedata => {BDFDB.Themes[theme] = themedata;});
	})();
	
	var DiscordClassModules = {};
	DiscordClassModules.BDFDB = {
		BDFDBundefined: 'BDFDB_undefined',
		cardInner: 'card-inner',
		overflowEllipsis: "overflowellipsis"
	};
	DiscordClassModules.BDrepo = {
		bdGuild: 'bd-guild',
		bdGuildAnimatable: 'bd-animatable',
		bdGuildAudio: 'bd-audio',
		bdGuildSelected: 'bd-selected',
		bdGuildSeparator: 'bd-guild-separator',
		bdGuildUnread: 'bd-unread',
		bdGuildVideo: 'bd-video',
		bdPillSelected: 'bd-selected',
		bdPillUnread: 'bd-unread',
		bdaAuthor: 'bda-author',
		bdaControls: 'bda-controls',
		bdaDescription: 'bda-description',
		bdaDescriptionWrap: 'bda-description-wrap',
		bdaFooter: 'bda-footer',
		bdaHeader: 'bda-header',
		bdaHeaderTitle: 'bda-header-title',
		bdaLink: 'bda-link',
		bdaLinks: 'bda-links',
		bdaName: 'bda-name',
		bdaSettingsButton: 'bda-settings-button',
		bdaSlist: 'bda-slist',
		bdaVersion: 'bda-version',
		bdPfbtn: 'bd-pfbtn',
		settingsOpen: 'settings-open',
		settingsClosed: 'settings-closed',
		switch: 'ui-switch',
		switchCheckbox: 'ui-switch-checkbox',
		switchChecked: 'checked',
		switchItem: 'ui-switch-item',
		switchWrapper: 'ui-switch-wrapper'
	};
	DiscordClassModules.BDv2repo = {
		bdButton: 'bd-button',
		bdCard: 'bd-card',
		bdHasTooltip: 'bd-hasTooltip',
		bdMaterialDesignIcon: 'bd-materialDesignIcon',
		bdTooltip: 'bd-tooltip',
		vTooltipOpen: 'v-tooltip-open'
	};
	DiscordClassModules.NotFound = {
		_: '',
		applicationStore: 'applicationStore-1pNvnv',
		avatarStopAnimation: 'stop-animation',
		badgeWrapper: 'wrapper-232cHJ',
		gameLibrary: 'gameLibrary-TTDw4Y',
		guildChannels: 'container-PNkimc',
		highlight: 'highlight',
		loginScreen: 'wrapper-3Q5DdO',
		lfg: 'lfg-3xoFkI',
		mention: 'mention',
		select: 'css-1kj8ui-container',
		selectArrow: 'css-19bqh2r',
		selectArrowContainer: 'css-bdfdb-indicatorContainer',
		selectArrowContainerDark: 'css-12qlrak-indicatorContainer',
		selectArrowContainerLight: 'css-11dkexk-indicatorContainer',
		selectArrowZone: 'css-1wy0on6',
		selectControl: 'css-bdfdb-control',
		selectControlDark: 'css-15ejc46-control',
		selectControlLight: 'css-oc2jo8-control',
		selectDummyInput: 'css-gj7qu5-dummyInput',
		selectHasValue: 'css-bdfdb-hasValue',
		selectIsOpen: 'css-bdfdb-isOpen',
		selectMenu: 'css-1ye7vu0',
		selectMenuOuter: 'css-bdfdb-menuOuter',
		selectMenuOuterDark: 'css-ua3v5p-menu',
		selectMenuOuterLight: 'css-1ea7eys-menu',
		selectOption: 'css-bdfdb-option',
		selectOptionDark: 'css-1aymab5-option',
		selectOptionLight: 'css-ddw2o3-option',
		selectOptionHoverDark: 'css-1gnr91b-option',
		selectOptionHoverLight: 'css-qgio2y-option',
		selectOptionSelectDark: 'css-12o7ek3-option',
		selectOptionSelectLight: 'css-1kft5vg-option',
		selectSingle: 'css-bdfdb-singleValue',
		selectSingleDark: 'css-1k00wn6-singleValue',
		selectSingleLight: 'css-6nrxdk-singleValue',
		selectValue: 'css-1hwfws3',
		splashBackground: 'splashBackground-1FRCko',
		themeDark: 'theme-dark',
		themeLight: 'theme-light'
	};
	
	DiscordClassModules.AccountDetails = BDFDB.WebModules.findByProperties('usernameContainer', 'container');
	DiscordClassModules.ActivityFeed = BDFDB.WebModules.findByProperties('activityFeed');
	DiscordClassModules.Anchor = BDFDB.WebModules.findByProperties('anchor', 'anchorUnderlineOnHover');
	DiscordClassModules.AppBase = BDFDB.WebModules.findByProperties('container', 'channels');
	DiscordClassModules.AppMount = BDFDB.WebModules.findByProperties('appMount');
	DiscordClassModules.AppInner = BDFDB.WebModules.findByProperties('app');
	DiscordClassModules.AppOuter = BDFDB.WebModules.find(module => typeof module.app == 'string' && module != DiscordClassModules.AppInner);
	DiscordClassModules.AuditLog = BDFDB.WebModules.findByProperties('auditLog');
	DiscordClassModules.AuthBox = BDFDB.WebModules.findByProperties('authBox');
	DiscordClassModules.Autocomplete = BDFDB.WebModules.findByProperties('autocomplete', 'autocompleteRow');
	DiscordClassModules.Avatar = BDFDB.WebModules.findByProperties('avatar', 'mask', 'wrapper');
	DiscordClassModules.AvatarIcon = BDFDB.WebModules.findByProperties('iconActiveLarge', 'iconActiveMedium');
	DiscordClassModules.Backdrop = BDFDB.WebModules.findByProperties('backdrop');
	DiscordClassModules.Badge = BDFDB.WebModules.findByProperties('numberBadge', 'textBadge', 'iconBadge');
	DiscordClassModules.BotTag = BDFDB.WebModules.findByProperties('botTag', 'botTagInvert');
	DiscordClassModules.Button = BDFDB.WebModules.findByProperties('colorBlack', 'button');
	DiscordClassModules.Call = BDFDB.WebModules.findByProperties('callAvatar', 'video');
	DiscordClassModules.CallCurrent = BDFDB.WebModules.findByProperties('wrapper', 'fullScreen');
	DiscordClassModules.CallDetails = BDFDB.WebModules.findByProperties('container', 'hotspot');
	DiscordClassModules.CallIncoming = BDFDB.WebModules.findByProperties('incomingCall', 'container');
	DiscordClassModules.CallIncomingInner = BDFDB.WebModules.findByProperties('incomingCallInner', 'members');
	DiscordClassModules.Card = BDFDB.WebModules.findByProperties('card', 'cardBrand');
	DiscordClassModules.CardStatus = BDFDB.WebModules.findByProperties('reset', 'error', 'card');
	DiscordClassModules.CardStore = BDFDB.WebModules.findByProperties('card', 'interactive', 'url');
	DiscordClassModules.Category = BDFDB.WebModules.findByProperties('wrapper', 'children', 'muted');
	DiscordClassModules.CategoryContainer = BDFDB.WebModules.findByProperties('addButtonIcon', 'containerDefault');
	DiscordClassModules.ChangeLog = BDFDB.WebModules.findByProperties('added', 'fixed', 'improved', 'progress');
	DiscordClassModules.Channel = BDFDB.WebModules.findByProperties('wrapper', 'content', 'modeSelected');;
	DiscordClassModules.ChannelContainer = BDFDB.WebModules.findByProperties('actionIcon', 'containerDefault');
	DiscordClassModules.ChannelTextArea = BDFDB.WebModules.findByProperties('textArea', 'attachButtonDivider');
	DiscordClassModules.ChannelTextAreaButton = BDFDB.WebModules.findByProperties('buttonWrapper', 'active');
	DiscordClassModules.ChannelWindow = BDFDB.WebModules.findByProperties('chat', 'channelTextArea');
	DiscordClassModules.Checkbox = BDFDB.WebModules.findByProperties('checkboxWrapper', 'round');
	DiscordClassModules.ContextMenu = BDFDB.WebModules.findByProperties('contextMenu', 'itemGroup');
	DiscordClassModules.ContextMenuCheckbox = BDFDB.WebModules.findByProperties('checkboxInner', 'checkboxElement');
	DiscordClassModules.Cursor = BDFDB.WebModules.findByProperties('cursorDefault', 'userSelectNone');
	DiscordClassModules.DmAddPopout = BDFDB.WebModules.findByProperties('friendSelected', 'popout');
	DiscordClassModules.DownloadLink = BDFDB.WebModules.findByProperties('downloadLink', 'size12');
	DiscordClassModules.Embed = BDFDB.WebModules.findByProperties('embed', 'embedAuthorIcon');
	DiscordClassModules.EmbedActions = BDFDB.WebModules.findByProperties('iconPlay', 'iconWrapperActive');
	DiscordClassModules.EmojiPicker = BDFDB.WebModules.findByProperties('emojiPicker', 'categories');
	DiscordClassModules.File = BDFDB.WebModules.findByProperties('downloadButton', 'fileNameLink');
	DiscordClassModules.Flex = BDFDB.WebModules.findByProperties('alignBaseline', 'alignCenter');
	DiscordClassModules.FlexChild = BDFDB.WebModules.findByProperties('flexChild', 'flex');
	DiscordClassModules.FormText = BDFDB.WebModules.findByProperties('description', 'modeDefault');
	DiscordClassModules.Friends = BDFDB.WebModules.findByProperties('friendsColumn', 'friendsRow');
	DiscordClassModules.Game = BDFDB.WebModules.findByProperties('game', 'gameName');
	DiscordClassModules.GifFavoriteButton = BDFDB.WebModules.findByProperties('gifFavoriteButton', 'showPulse');
	DiscordClassModules.GiftInventory = BDFDB.WebModules.find(module => typeof module['root'] == 'string' && typeof module['body'] == 'string' && (Object.keys(module).length == 2 || Object.keys(module).length == 3));
	DiscordClassModules.Guild = BDFDB.WebModules.findByProperties('wrapper', 'badgeWrapper', 'svg');
	DiscordClassModules.GuildChannels = BDFDB.WebModules.findByProperties('positionedContainer', 'unreadBar');
	DiscordClassModules.GuildDm = BDFDB.WebModules.find(module => typeof module['pill'] == 'string' && Object.keys(module).length == 1);
	DiscordClassModules.GuildEdges = BDFDB.WebModules.findByProperties('wrapper', 'edge', 'autoPointerEvents')
	DiscordClassModules.GuildHeader = BDFDB.WebModules.findByProperties('header', 'name', 'hasDropdown');
	DiscordClassModules.GuildIcon = BDFDB.WebModules.findByProperties('acronym', 'selected', 'wrapper');
	DiscordClassModules.GuildSettingsBanned = BDFDB.WebModules.findByProperties('bannedUser', 'bannedUserAvatar');
	DiscordClassModules.GuildSettingsInvite = BDFDB.WebModules.findByProperties('countdownColumn', 'inviteSettingsInviteRow');
	DiscordClassModules.GuildSettingsMember = BDFDB.WebModules.findByProperties('member', 'membersFilterPopout');
	DiscordClassModules.GuildServer = BDFDB.WebModules.findByProperties('blobContainer', 'pill');
	DiscordClassModules.GuildsItems = BDFDB.WebModules.findByProperties('guildSeparator', 'guildsError', 'friendsOnline');
	DiscordClassModules.GuildsWrapper = BDFDB.WebModules.findByProperties('scrollerWrap', 'unreadMentionsBar', 'wrapper');
	DiscordClassModules.HeaderBar = BDFDB.WebModules.findByProperties('container', 'children', 'toolbar');
	DiscordClassModules.HeaderBarExtras = BDFDB.WebModules.findByProperties('headerBarLoggedOut', 'search');
	DiscordClassModules.HeaderBarTopic = BDFDB.WebModules.findByProperties('topic', 'expandable', 'content');
	DiscordClassModules.HomeIcon = BDFDB.WebModules.findByProperties("homeIcon");
	DiscordClassModules.HotKeyRecorder = BDFDB.WebModules.findByProperties('editIcon', 'recording');
	DiscordClassModules.HoverCard = BDFDB.WebModules.findByProperties('card', 'active');
	DiscordClassModules.HoverCardButton = BDFDB.WebModules.find(module => typeof module['button'] == 'string' && Object.keys(module).length == 1);
	DiscordClassModules.IconDirection = BDFDB.WebModules.findByProperties('directionDown', 'directionUp');
	DiscordClassModules.ImageWrapper = BDFDB.WebModules.findByProperties('clickable', 'imageWrapperBackground');
	DiscordClassModules.InviteModal = BDFDB.WebModules.findByProperties('inviteRow', 'modal');
	DiscordClassModules.Item = BDFDB.WebModules.findByProperties('item', 'side', 'header');
	DiscordClassModules.Input = BDFDB.WebModules.findByProperties('inputMini', 'statusRed');
	DiscordClassModules.Layers = BDFDB.WebModules.findByProperties('layer', 'layers');
	DiscordClassModules.Margins = BDFDB.WebModules.findByProperties('marginBottom4', 'marginCenterHorz');
	DiscordClassModules.Member = BDFDB.WebModules.findByProperties('member', 'memberInner');
	DiscordClassModules.MembersWrap = BDFDB.WebModules.findByProperties('membersWrap', 'membersGroup');
	DiscordClassModules.Mention = BDFDB.WebModules.findByProperties('wrapperHover', 'wrapperNoHover');
	DiscordClassModules.Message = BDFDB.WebModules.findByProperties('message', 'content');
	DiscordClassModules.MessageAccessory = BDFDB.WebModules.findByProperties('embedWrapper', 'gifFavoriteButton');
	DiscordClassModules.MessageBody = BDFDB.WebModules.findByProperties('buttonContainer', 'isMentioned');
	DiscordClassModules.MessageFile = BDFDB.WebModules.findByProperties('cancelButton', 'filenameLinkWrapper');
	DiscordClassModules.MessageMarkup = BDFDB.WebModules.findByProperties('markup');
	DiscordClassModules.MessageSystem = BDFDB.WebModules.findByProperties('container', 'actionAnchor');
	DiscordClassModules.MessagesPopout = BDFDB.WebModules.findByProperties('messageGroupWrapperOffsetCorrection', 'messagesPopout');
	DiscordClassModules.MessagesWrap = BDFDB.WebModules.findByProperties('messagesWrapper', 'messageGroupBlocked');
	DiscordClassModules.Modal = BDFDB.WebModules.findByProperties('modal', 'sizeLarge');
	DiscordClassModules.ModalDivider = BDFDB.WebModules.find(module => typeof module['divider'] == 'string' && Object.keys(module).length == 1);
	DiscordClassModules.ModalItems = BDFDB.WebModules.findByProperties('guildName', 'checkboxContainer');
	DiscordClassModules.ModalMiniContent = BDFDB.WebModules.find(module => typeof module['modal'] == 'string' && typeof module['content'] == 'string' && typeof module['size'] == 'string' && Object.keys(module).length == 3);
	DiscordClassModules.ModalWrap = BDFDB.WebModules.find(module => typeof module['modal'] == 'string' && typeof module['inner'] == 'string' && Object.keys(module).length == 2);
	DiscordClassModules.NameTag = BDFDB.WebModules.findByProperties('bot', 'nameTag');
	DiscordClassModules.Note = BDFDB.WebModules.find(module => typeof module['note'] == 'string' && Object.keys(module).length == 1);
	DiscordClassModules.Notice = BDFDB.WebModules.findByProperties('notice', 'noticeFacebook');
	DiscordClassModules.OptionPopout = BDFDB.WebModules.findByProperties('container', 'button', 'item');
	DiscordClassModules.PictureInPicture = BDFDB.WebModules.findByProperties('pictureInPicture', 'pictureInPictureWindow');
	DiscordClassModules.PillWrapper = BDFDB.WebModules.find(module => typeof module['item'] == 'string' && typeof module['wrapper'] == 'string' && Object.keys(module).length == 2);
	DiscordClassModules.PrivateChannel = BDFDB.WebModules.findByProperties('activityIconForeground', 'channel');
	DiscordClassModules.PrivateChannelList = BDFDB.WebModules.findByProperties('privateChannels', 'searchBar');
	DiscordClassModules.Popout = BDFDB.WebModules.findByProperties('popout', 'arrowAlignmentTop');
	DiscordClassModules.PopoutActivity = BDFDB.WebModules.findByProperties('ellipsis', 'activityActivityFeed');
	DiscordClassModules.QuickSelect = BDFDB.WebModules.findByProperties('quickSelectArrow', 'selected');
	DiscordClassModules.QuickSwitch = BDFDB.WebModules.findByProperties('resultFocused', 'guildIconContainer');
	DiscordClassModules.QuickSwitchWrap = BDFDB.WebModules.findByProperties('container', 'miscContainer');
	DiscordClassModules.Reactions = BDFDB.WebModules.findByProperties('reactionBtn', 'reaction');
	DiscordClassModules.RecentMentions = BDFDB.WebModules.findByProperties('recentMentionsFilterPopout', 'mentionFilter');
	DiscordClassModules.Role = BDFDB.WebModules.findByProperties('roleCircle', 'roleName');
	DiscordClassModules.Scroller = BDFDB.WebModules.findByProperties('firefoxFixScrollFlex', 'scroller');
	DiscordClassModules.SearchBar = BDFDB.WebModules.findByProperties('container', 'clear');
	DiscordClassModules.SearchPopout = BDFDB.WebModules.findByProperties('datePicker', 'searchResultChannelIconBackground');
	DiscordClassModules.SearchPopoutWrap = BDFDB.WebModules.findByProperties('container', 'queryContainer');
	DiscordClassModules.SearchResults = BDFDB.WebModules.findByProperties('resultsWrapper', 'searchResults');
	DiscordClassModules.Select = BDFDB.WebModules.findByProperties('select', 'error', 'errorMessage');
	DiscordClassModules.SettingsCloseButton = BDFDB.WebModules.findByProperties('closeButton', 'keybind');
	DiscordClassModules.SettingsItems = BDFDB.WebModules.findByProperties('dividerMini', 'note');
	DiscordClassModules.SettingsTable = BDFDB.WebModules.findByProperties('headerOption', 'headerSize');
	DiscordClassModules.SettingsWindow = BDFDB.WebModules.findByProperties('contentRegion', 'standardSidebarView');
	DiscordClassModules.Slider = BDFDB.WebModules.findByProperties('slider', 'grabber');
	DiscordClassModules.Spoiler = BDFDB.WebModules.findByProperties('spoilerContainer', 'hidden');
	DiscordClassModules.Switch = BDFDB.WebModules.findByProperties('switchDisabled', 'valueChecked');
	DiscordClassModules.Table = BDFDB.WebModules.findByProperties('stickyHeader', 'emptyStateText');
	DiscordClassModules.Text = BDFDB.WebModules.findByProperties('defaultColor', 'defaultMarginh1');
	DiscordClassModules.TextStyle = BDFDB.WebModules.findByProperties('height28', 'primary');
	DiscordClassModules.TextWeight = BDFDB.WebModules.findByProperties('weightBold', 'weightSemiBold');
	DiscordClassModules.TitleBar = BDFDB.WebModules.findByProperties('titleBar', 'wordmark');
	DiscordClassModules.Tooltip = BDFDB.WebModules.findByProperties('tooltip', 'tooltipTop');
	DiscordClassModules.TooltipContainer = BDFDB.WebModules.findByProperties('layer', 'layerContainer');
	DiscordClassModules.Typing = BDFDB.WebModules.findByProperties('cooldownWrapper', 'typing');
	DiscordClassModules.UserPopout = BDFDB.WebModules.findByProperties('userPopout', 'headerPlaying');
	DiscordClassModules.UserProfile = BDFDB.WebModules.findByProperties('topSectionNormal', 'tabBarContainer');
	DiscordClassModules.Video = BDFDB.WebModules.findByProperties('video', 'fullScreen');
	DiscordClassModules.Voice = BDFDB.WebModules.findByProperties('avatarSpeaking', 'voiceUser');
	if (BDFDB.myData.id == "278543574059057154") for (let module in DiscordClassModules) if (!DiscordClassModules[module]) {
		console.warn(`%c[BDFDB]%c`, 'color: #3a71c1; font-weight: 700;', '', module + ' not initialized in DiscordClassModules');
	}
	BDFDB.DiscordClassModules = Object.assign({}, DiscordClassModules);

	var DiscordClasses = {
		_bdguild: ['BDrepo', 'bdGuild'],
		_bdguildanimatable: ['BDrepo', 'bdGuildAnimatable'],
		_bdguildaudio: ['BDrepo', 'bdGuildAudio'],
		_bdguildselected: ['BDrepo', 'bdGuildSelected'],
		_bdguildseparator: ['BDrepo', 'bdGuildSeparator'],
		_bdguildunread: ['BDrepo', 'bdGuildUnread'],
		_bdguildvideo: ['BDrepo', 'bdGuildVideo'],
		_bdpillselected: ['BDrepo', 'bdPillSelected'],
		_bdpillunread: ['BDrepo', 'bdPillUnread'],
		_bdv2button: ['BDv2repo', 'bdButton'],
		_bdv2card: ['BDv2repo', 'bdCard'],
		_bdv2hastooltip: ['BDv2repo', 'bdHasTooltip'],
		_bdv2materialdesignicon: ['BDv2repo', 'bdMaterialDesignIcon'],
		_bdv2tooltipopen: ['BDv2repo', 'vTooltipOpen'],
		_repoauthor: ['BDrepo', 'bdaAuthor'],
		_repocheckbox: ['BDrepo', 'switchCheckbox'],
		_repocheckboxchecked: ['BDrepo', 'switchChecked'],
		_repocheckboxinner: ['BDrepo', 'switch'],
		_repocheckboxitem: ['BDrepo', 'switchItem'],
		_repocheckboxwrap: ['BDrepo', 'switchWrapper'],
		_repocontrols: ['BDrepo', 'bdaControls'],
		_repodescription: ['BDrepo', 'bdaDescription'],
		_repodescriptionwrap: ['BDrepo', 'bdaDescriptionWrap'],
		_repofolderbutton: ['BDrepo', 'bdPfbtn'],
		_repofooter: ['BDrepo', 'bdaFooter'],
		_repoheader: ['BDrepo', 'bdaHeader'],
		_repoheadertitle: ['BDrepo', 'bdaHeaderTitle'],
		_repolist: ['BDrepo', 'bdaSlist'],
		_repolink: ['BDrepo', 'bdaLink'],
		_repolinks: ['BDrepo', 'bdaLinks'],
		_reponame: ['BDrepo', 'bdaName'],
		_reposettingsbutton: ['BDrepo', 'bdaSettingsButton'],
		_reposettingsopen: ['BDrepo', 'settingsOpen'],
		_reposettingsclosed: ['BDrepo', 'settingsClosed'],
		_repoversion: ['BDrepo', 'bdaVersion'],
		accountinfo: ['AccountDetails', 'container'],
		accountinfodetails: ['AccountDetails', 'usernameContainer'],
		accountinfousername: ['AccountDetails', 'username'],
		activityfeed: ['ActivityFeed', 'activityFeed'],
		alignbaseline: ['Flex', 'alignBaseline'],
		aligncenter: ['Flex', 'alignCenter'],
		alignend: ['Flex', 'alignEnd'],
		alignstart: ['Flex', 'alignStart'],
		alignstretch: ['Flex', 'alignStretch'],
		anchor: ['Anchor', 'anchor'],
		anchorunderlineonhover: ['Anchor', 'anchorUnderlineOnHover'],
		app: ['AppOuter', 'app'],
		appcontainer: ['AppBase', 'container'],
		appmount: ['AppMount', 'appMount'],
		applicationstore: ['NotFound', 'applicationStore'],
		appold: ['AppInner', 'app'],
		auditlog: ['AuditLog', 'auditLog'],
		auditloguserhook: ['AuditLog', 'userHook'],
		authbox: ['AuthBox', 'authBox'],
		autocomplete: ['Autocomplete', 'autocomplete'],
		autocomplete2: ['ChannelTextArea', 'autocomplete'],
		autocompleteavatarstatus: ['Autocomplete', 'avatarStatus'],
		autocompletecontent: ['Autocomplete', 'content'],
		autocompletecontenttitle: ['Autocomplete', 'contentTitle'],
		autocompletedescription: ['Autocomplete', 'description'],
		autocompletedescriptiondiscriminator: ['Autocomplete', 'descriptionDiscriminator'],
		autocompletedescriptionusername: ['Autocomplete', 'descriptionUsername'],
		autocompleteicon: ['Autocomplete', 'icon'],
		autocompleteiconforeground: ['Autocomplete', 'iconForeground'],
		autocompleteinner: ['Autocomplete', 'autocompleteInner'],
		autocompleterow: ['Autocomplete', 'autocompleteRow'],
		autocompleterowhorizontal: ['Autocomplete', 'autocompleteRowHorizontal'],
		autocompleterowvertical: ['Autocomplete', 'autocompleteRowVertical'],
		autocompleteselectable: ['Autocomplete', 'selectable'],
		autocompleteselected: ['Autocomplete', 'selectorSelected'],
		autocompleteselector: ['Autocomplete', 'selector'],
		avatar: [DiscordClassModules.Avatar.avatar ? 'Avatar' : 'Message', 'avatar'],
		avatarcursordefault: ['Avatar', 'cursorDefault'],
		avataricon: ['AvatarIcon', 'icon'],
		avatariconactivelarge: ['AvatarIcon', 'iconActiveLarge'],
		avatariconactivemedium: ['AvatarIcon', 'iconActiveMedium'],
		avatariconactivemini: ['AvatarIcon', 'iconActiveMini'],
		avatariconactivesmall: ['AvatarIcon', 'iconActiveSmall'],
		avatariconactivexlarge: ['AvatarIcon', 'iconActiveXLarge'],
		avatariconinactive: ['AvatarIcon', 'iconInactive'],
		avatariconsizelarge: ['AvatarIcon', 'iconSizeLarge'],
		avatariconsizemedium: ['AvatarIcon', 'iconSizeMedium'],
		avatariconsizemini: ['AvatarIcon', 'iconSizeMini'],
		avatariconsizesmall: ['AvatarIcon', 'iconSizeSmall'],
		avatariconsizexlarge: ['AvatarIcon', 'iconSizeXLarge'],
		avatarmask: ['Avatar', 'mask'],
		avatarnoicon: ['AvatarIcon', 'noIcon'],
		avatarpointer: ['Avatar', 'pointer'],
		avatarpointerevents: ['Avatar', 'pointerEvents'],
		avatarverifiedicon: ['AvatarIcon', 'verifiedIcon'],
		avatarwrapper: ['Avatar', 'wrapper'],
		backdrop: ['Backdrop', 'backdrop'],
		badgewrapper: ['NotFound', 'badgeWrapper'],
		bottag: ['BotTag', 'botTag'],
		bottaginvert: ['BotTag', 'botTagInvert'],
		bottagmessage: ['Message', 'botTag'],
		bottagmessagecompact: ['Message', 'botTagCompact'],
		bottagmessagecozy: ['Message', 'botTagCozy'],
		bottagnametag: ['NameTag', 'bot'],
		bottagregular: ['BotTag', 'botTagRegular'],
		button: ['Button', 'button'],
		buttoncolorblack: ['Button', 'colorBlack'],
		buttoncolorbrand: ['Button', 'colorBrand'],
		buttoncolorgreen: ['Button', 'colorGreen'],
		buttoncolorgrey: ['Button', 'colorGrey'],
		buttoncolorlink: ['Button', 'colorLink'],
		buttoncolorprimary: ['Button', 'colorPrimary'],
		buttoncolorred: ['Button', 'colorRed'],
		buttoncolortransparent: ['Button', 'colorTransparent'],
		buttoncolorwhite: ['Button', 'colorWhite'],
		buttoncoloryellow: ['Button', 'colorYellow'],
		buttoncontents: ['Button', 'contents'],
		buttondisabledoverlay: ['Button', 'disabledButtonOverlay'],
		buttondisabledwrapper: ['Button', 'disabledButtonWrapper'],
		buttonfullwidth: ['Button', 'fullWidth'],
		buttongrow: ['Button', 'grow'],
		buttonhashover: ['Button', 'hasHover'],
		buttonhoverblack: ['Button', 'hoverBlack'],
		buttonhoverbrand: ['Button', 'hoverBrand'],
		buttonhovergreen: ['Button', 'hoverGreen'],
		buttonhovergrey: ['Button', 'hoverGrey'],
		buttonhoverlink: ['Button', 'hoverLink'],
		buttonhoverprimary: ['Button', 'hoverPrimary'],
		buttonhoverred: ['Button', 'hoverRed'],
		buttonhovertransparent: ['Button', 'hoverTransparent'],
		buttonhoverwhite: ['Button', 'hoverWhite'],
		buttonhoveryellow: ['Button', 'hoverYellow'],
		buttonlookblank: ['Button', 'lookBlank'],
		buttonlookfilled: ['Button', 'lookFilled'],
		buttonlookghost: ['Button', 'lookGhost'],
		buttonlookinverted: ['Button', 'lookInverted'],
		buttonlooklink: ['Button', 'lookLink'],
		buttonlookoutlined: ['Button', 'lookOutlined'],
		buttonsizeicon: ['Button', 'sizeIcon'],
		buttonsizelarge: ['Button', 'sizeLarge'],
		buttonsizemax: ['Button', 'sizeMax'],
		buttonsizemedium: ['Button', 'sizeMedium'],
		buttonsizemin: ['Button', 'sizeMin'],
		buttonsizesmall: ['Button', 'sizeSmall'],
		buttonsizexlarge: ['Button', 'sizeXlarge'],
		buttonspinner: ['Button', 'spinner'],
		buttonspinneritem: ['Button', 'spinnerItem'],
		buttonsubmitting: ['Button', 'submitting'],
		callavatar: ['Call', 'callAvatar'],
		callavatarwrapper: ['Call', 'callAvatarWrapper'],
		callcurrentcontainer: ['CallCurrent', 'wrapper'],
		callcurrentdetails: ['CallDetails', 'container'],
		callcurrentvideo: ['Video', 'video'],
		callincoming: ['CallIncoming', 'incomingCall'],
		callincomingcontainer: ['CallIncoming', 'container'],
		callincominginner: ['CallIncomingInner', 'incomingCallInner'],
		callmembers: ['CallIncomingInner', 'members'],
		callselected: ['Call', 'selected'],
		callvideo: ['Call', 'video'],
		card: ['Card', 'card'],
		cardbrand: ['Card', 'cardBrand'],
		cardbrandoutline: ['Card', 'cardBrandOutline'],
		carddanger: ['Card', 'cardDanger'],
		carddangeroutline: ['Card', 'cardDangerOutline'],
		cardprimary: ['Card', 'cardPrimary'],
		cardprimaryeditable: ['Card', 'cardPrimaryEditable'],
		cardprimaryoutline: ['Card', 'cardPrimaryOutline'],
		cardprimaryoutlineeditable: ['Card', 'cardPrimaryOutlineEditable'],
		cardstore: ['CardStore', 'card'],
		cardstoreinteractive: ['CardStore', 'interactive'],
		cardsuccess: ['Card', 'cardSuccess'],
		cardsuccessoutline: ['Card', 'cardSuccessOutline'],
		cardwarning: ['Card', 'cardWarning'],
		cardwarningoutline: ['Card', 'cardWarningOutline'],
		categorychildren: ['Category', 'children'],
		categoryclickable: ['Category', 'clickable'],
		categorycollapsed: ['Category', 'collapsed'],
		categorycontainerdefault: ['CategoryContainer', 'containerDefault'],
		categorydisabled: ['CategoryContainer', 'disabled'],
		categoryicon: ['Category', 'icon'],
		categoryiconvisibility: ['CategoryContainer', 'iconVisibility'],
		categorymuted: ['Category', 'muted'],
		categoryname: ['Category', 'name'],
		categoryselected: ['CategoryContainer', 'selected'],
		categorywrapper: ['Category', 'wrapper'],
		changelogadded: ['ChangeLog', 'added'],
		changelogfixed: ['ChangeLog', 'fixed'],
		changelogimproved: ['ChangeLog', 'improved'],
		changelogprogress: ['ChangeLog', 'added'],
		changelogtitle: ['ChangeLog', 'title'],
		channelactionicon: ['ChannelContainer', 'actionIcon'],
		channelchildren: ['Channel', 'children'],
		channelcontainerdefault: ['ChannelContainer', 'containerDefault'],
		channelcontent: ['Channel', 'content'],
		channeldisabled: ['ChannelContainer', 'disabled'],
		channelheaderchannelname: ['ChannelWindow', 'channelName'],
		channelheaderchildren: ['HeaderBar', 'children'],
		channelheaderdivider: ['HeaderBar', 'divider'],
		channelheaderheaderbar: ['HeaderBar', 'container'],
		channelheaderheaderbartitle: ['HeaderBar', 'title'],
		channelheadericon: ['HeaderBar', 'icon'],
		channelheadericonbadge: ['HeaderBar', 'iconBadge'],
		channelheadericonclickable: ['HeaderBar', 'clickable'],
		channelheadericonselected: ['HeaderBar', 'selected'],
		channelheadericonwrapper: ['HeaderBar', 'iconWrapper'],
		channelheadertitle: ['ChannelWindow', 'title'],
		channelheadertitlewrapper: ['ChannelWindow', 'titleWrapper'],
		channelheadersearch: ['HeaderBarExtras', 'search'],
		channelheadertoolbar: ['HeaderBar', 'toolbar'],
		channelheadertoolbar2: ['HeaderBarExtras', 'toolbar'],
		channelheadertopic: ['HeaderBarTopic', 'topic'],
		channelicon: ['Channel', 'icon'],
		channeliconvisibility: ['ChannelContainer', 'iconVisibility'],
		channelmodeconnected: ['Channel', 'modeConnected'],
		channelmodelocked: ['Channel', 'modeLocked'],
		channelmodemuted: ['Channel', 'modeMuted'],
		channelmodeselected: ['Channel', 'modeSelected'],
		channelmodeunread: ['Channel', 'modeUnread'],
		channelname: ['Channel', 'name'],
		channels: ['AppBase', 'channels'],
		channelselected: ['ChannelContainer', 'selected'],
		channelsscroller: ['GuildChannels', 'scroller'],
		channelunread: ['Channel', 'unread'],
		channelwrapper: ['Channel', 'wrapper'],
		chat: ['ChannelWindow', 'chat'],
		chatbase: ['AppBase', 'base'],
		chatcontent: ['ChannelWindow', 'content'],
		chatspacer: ['AppBase', 'spacer'],
		checkbox: ['Checkbox', 'checkbox'],
		checkboxchecked: ['Checkbox', 'checked'],
		checkboxcontainer: ['ModalItems', 'checkboxContainer'],
		checkboxinput: ['Checkbox', 'input'],
		checkboxinputdefault: ['Checkbox', 'inputDefault'],
		checkboxinputdisabled: ['Checkbox', 'inputDisabled'],
		checkboxround: ['Checkbox', 'round'],
		checkboxwrapper: ['Checkbox', 'checkboxWrapper'],
		checkboxwrapperdisabled: ['Checkbox', 'checkboxWrapperDisabled'],
		clickable: ['Message', 'clickOverride'],
		clickable: ['Message', 'clickOverride'],
		contentregion: ['SettingsWindow', 'contentRegion'],
		contextmenu: ['ContextMenu', 'contextMenu'],
		contextmenucheckbox: ['ContextMenuCheckbox', 'checkbox'],
		contextmenucheckbox2: ['ContextMenu', 'checkbox'],
		contextmenucheckboxdisabled: ['ContextMenuCheckbox', 'disabled'],
		contextmenucheckboxinner: ['ContextMenuCheckbox', 'checkboxInner'],
		contextmenucheckboxelement: ['ContextMenuCheckbox', 'checkboxElement'],
		contextmenuhint: ['ContextMenu', 'hint'],
		contextmenuinvertchildx: ['ContextMenu', 'invertChildX'],
		contextmenuitem: ['ContextMenu', 'item'],
		contextmenuitembrand: ['ContextMenu', 'brand'],
		contextmenuitemdanger: ['ContextMenu', 'danger'],
		contextmenuitemdisabled: ['ContextMenu', 'disabled'],
		contextmenuitemgroup: ['ContextMenu', 'itemGroup'],
		contextmenuitemtoggle: ['ContextMenu', 'itemToggle'],
		contextmenuitemslider: ['ContextMenu', 'itemSlider'],
		contextmenuitemsubmenu: ['ContextMenu', 'itemSubMenu'],
		contextmenuitemsubmenuhasscroller: ['ContextMenu', 'itemSubMenuHasScroller'],
		contextmenulabel: ['ContextMenu', 'label'],
		contextmenuscroller: ['ContextMenu', 'scroller'],
		contextmenuslider: ['ContextMenu', 'slider'],
		cooldownwrapper: ['Typing', 'cooldownWrapper'],
		cursordefault: ['Cursor', 'cursorDefault'],
		cursorpointer: ['Cursor', 'cursorPointer'],
		defaultcolor: ['Text', 'defaultColor'],
		description: ['FormText', 'description'],
		directioncolumn: ['Flex', 'directionColumn'],
		directiondown: ['IconDirection', 'directionDown'],
		directionleft: ['IconDirection', 'directionLeft'],
		directionright: ['IconDirection', 'directionRight'],
		directionrow: ['Flex', 'directionRow'],
		directionrowreverse: ['Flex', 'directionRowReverse'],
		directionup: ['IconDirection', 'directionUp'],
		directiontransition: ['IconDirection', 'transition'],
		disabled: ['SettingsItems', 'disabled'],
		dmchannel: ['PrivateChannel', 'channel'],
		dmchannelactivity: ['PrivateChannel', 'activity'],
		dmchannelactivityicon: ['PrivateChannel', 'activityIcon'],
		dmchannelactivityiconforeground: ['PrivateChannel', 'activityIconForeground'],
		dmchannelactivitytext: ['PrivateChannel', 'activityText'],
		dmchannelclose: ['PrivateChannel', 'close'],
		dmchannelname: ['PrivateChannel', 'name'],
		dmchannelnamewithactivity: ['PrivateChannel', 'nameWithActivity'],
		dmchannels: ['PrivateChannelList', 'privateChannels'],
		dmchannelselected: ['PrivateChannel', 'selected'],
		dmpill: ['GuildDm', 'pill'],
		downloadlink: ['DownloadLink', 'downloadLink'],
		ellipsis: ['PopoutActivity', 'ellipsis'],
		embed: ['Embed', 'embed'],
		embedauthor: ['Embed', 'embedAuthor'],
		embedauthoricon: ['Embed', 'embedAuthorIcon'],
		embedauthorname: ['Embed', 'embedAuthorName'],
		embedauthornamelink: ['Embed', 'embedAuthorNameLink'],
		embedcentercontent: ['Embed', 'centerContent'],
		embedcontent: ['Embed', 'embedContent'],
		embedcontentinner: ['Embed', 'embedContentInner'],
		embeddescription: ['Embed', 'embedDescription'],
		embedfield: ['Embed', 'embedField'],
		embedfieldinline: ['Embed', 'embedFieldInline'],
		embedfieldname: ['Embed', 'embedFieldName'],
		embedfields: ['Embed', 'embedFields'],
		embedfieldvalue: ['Embed', 'embedFieldValue'],
		embedfooter: ['Embed', 'embedFooter'],
		embedfootericon: ['Embed', 'embedFooterIcon'],
		embedfooterseparator: ['Embed', 'embedFooterSeparator'],
		embedfootertext: ['Embed', 'embedFooterText'],
		embedgiftag: ['Embed', 'embedGIFTag'],
		embedgifv: ['Embed', 'embedGIFV'],
		embedhiddenspoiler: ['Embed', 'hiddenSpoiler'],
		embedhighbackgroundopacity: ['Embed', 'highBackgroundOpacity'],
		embediframe: ['Embed', 'embedIframe'],
		embedimage: ['Embed', 'embedImage'],
		embedinner: ['Embed', 'embedInner'],
		embedlink: ['Embed', 'embedLink'],
		embedlowbackgroundopacity: ['Embed', 'lowBackgroundOpacity'],
		embedmargin: ['Embed', 'embedMargin'],
		embedmarginlarge: ['Embed', 'embedMarginLarge'],
		embedmembeediumbackgroundopacity: ['Embed', 'mediumBackgroundOpacity'],
		embedpill: ['Embed', 'embedPill'],
		embedprovider: ['Embed', 'embedProvider'],
		embedproviderlink: ['Embed', 'embedProviderLink'],
		embedspoilerattachment: ['Embed', 'spoilerAttachment'],
		embedspoilerembed: ['Embed', 'spoilerEmbed'],
		embedspotify: ['Embed', 'embedSpotify'],
		embedthumbnail: ['Embed', 'embedThumbnail'],
		embedtitle: ['Embed', 'embedTitle'],
		embedtitlelink: ['Embed', 'embedTitleLink'],
		embedvideo: ['Embed', 'embedVideo'],
		embedvideoaction: ['Embed', 'embedVideoAction'],
		embedvideoactions: ['Embed', 'embedVideoActions'],
		embedvideoimagecomponent: ['Embed', 'embedVideoImageComponent'],
		embedvideoimagecomponentinner: ['Embed', 'embedVideoImageComponentInner'],
		embedwrapper: ['MessageAccessory', 'embedWrapper'],
		emojipicker: ['EmojiPicker', 'emojiPicker'],
		emojipickeractivity: ['EmojiPicker', 'activity'],
		emojipickerbutton: ['Reactions', 'reactionBtn'],
		emojipickercategories: ['EmojiPicker', 'categories'],
		emojipickercategory: ['EmojiPicker', 'category'],
		emojipickercustom: ['EmojiPicker', 'custom'],
		emojipickerdimmer: ['EmojiPicker', 'dimmer'],
		emojipickerdisabled: ['EmojiPicker', 'disabled'],
		emojipickerdiversityselector: ['EmojiPicker', 'diversitySelector'],
		emojipickeremojiitem: ['EmojiPicker', 'emojiItem'],
		emojipickerflags: ['EmojiPicker', 'flags'],
		emojipickerfood: ['EmojiPicker', 'food'],
		emojipickerheader: ['EmojiPicker', 'header'],
		emojipickeritem: ['EmojiPicker', 'item'],
		emojipickernature: ['EmojiPicker', 'nature'],
		emojipickerobjects: ['EmojiPicker', 'objects'],
		emojipickerpeople: ['EmojiPicker', 'people'],
		emojipickerpopout: ['EmojiPicker', 'popout'],
		emojipickerpremiumpromo: ['EmojiPicker', 'premiumPromo'],
		emojipickerpremiumpromoclose: ['EmojiPicker', 'premiumPromoClose'],
		emojipickerpremiumpromodescription: ['EmojiPicker', 'premiumPromoDescription'],
		emojipickerpremiumpromoimage: ['EmojiPicker', 'premiumPromoImage'],
		emojipickerpremiumpromotitle: ['EmojiPicker', 'premiumPromoTitle'],
		emojipickerrecent: ['EmojiPicker', 'recent'],
		emojipickerrow: ['EmojiPicker', 'row'],
		emojipickersearchbar: ['EmojiPicker', 'searchBar'],
		emojipickerscroller: ['EmojiPicker', 'scroller'],
		emojipickerscrollerwrap: ['EmojiPicker', 'scrollerWrap'],
		emojipickerselected: ['EmojiPicker', 'selected'],
		emojipickerspriteitem: ['EmojiPicker', 'spriteItem'],
		emojipickerstickyheader: ['EmojiPicker', 'stickyHeader'],
		emojipickersymbols: ['EmojiPicker', 'symbols'],
		emojipickertravel: ['EmojiPicker', 'travel'],
		emojipickervisible: ['EmojiPicker', 'visible'],
		fileattachment: ['File', 'attachment'],
		fileattachmentinner: ['File', 'attachmentInner'],
		filecancelbutton: ['File', 'cancelButton'],
		filedownloadbutton: ['File', 'downloadButton'],
		filename: ['File', 'filename'],
		filenamelink: ['File', 'fileNameLink'],
		filenamelinkwrapper: ['File', 'filenameLinkWrapper'],
		filenamewrapper: ['File', 'filenameWrapper'],
		firefoxfixscrollflex: ['Scroller', 'firefoxFixScrollFlex'],
		flex: ['Flex', 'flex'],
		flex2: ['FlexChild', 'flex'],
		flexcenter: ['Flex', 'flexCenter'],
		flexchild: ['FlexChild', 'flexChild'],
		flexmarginreset: ['FlexChild', 'flexMarginReset'],
		formtext: ['FormText', 'formText'],
		friends: ['Friends', 'container'],
		friendscolumn: ['Friends', 'friendsColumn'],
		friendscolumnnamewrap: ['Friends', 'friendsColumnName'],
		friendsonline: ['GuildsItems', 'friendsOnline'],
		friendsrow: ['Friends', 'friendsRow'],
		friendstable: ['Friends', 'friendsTable'],
		friendstableheader: ['Friends', 'friendsTableHeader'],
		friendsusername: ['Friends', 'username'],
		game: ['Game', 'game'],
		gamelibrary: ['NotFound', 'gameLibrary'],
		gamelibrarytable: ['Table', 'table'],
		gamelibrarytableheader: ['Table', 'header'],
		gamelibrarytablestickyheader: ['Table', 'stickyHeader'],
		gamename: ['Game', 'gameName'],
		gamenameinput: ['Game', 'gameNameInput'],
		giffavoritebutton: ['MessageAccessory', 'gifFavoriteButton'],
		giffavoritecolor: ['GifFavoriteButton', 'gifFavoriteButton'],
		giffavoriteicon: ['GifFavoriteButton', 'icon'],
		giffavoriteshowpulse: ['GifFavoriteButton', 'showPulse'],
		giffavoritesize: ['GifFavoriteButton', 'size'],
		giffavoriteselected: ['GifFavoriteButton', 'selected'],
		giftinventory: ['GiftInventory', 'root'],
		guildbadgebase: ['Badge', 'base'],
		guildbadgeicon: ['Badge', 'icon'],
		guildbadgeiconbadge: ['Badge', 'iconBadge'],
		guildbadgeiconbadge2: ['GuildsItems', 'iconBadge'],
		guildbadgenumberbadge: ['Badge', 'numberBadge'],
		guildbadgetextbadge: ['Badge', 'textBadge'],
		guildbadgewrapper: ['Guild', 'badgeWrapper'],
		guildbuttoncontainer: ['GuildsItems', 'circleButtonMask'],
		guildbuttoninner: ['GuildsItems', 'circleIconButton'],
		guildbuttonicon: ['GuildsItems', 'circleIcon'],
		guildbuttonpill: ['GuildsItems', 'pill'],
		guildbuttonselected: ['GuildsItems', 'selected'],
		guildchannels: ['NotFound', 'guildChannels'],
		guildcontainer: ['GuildServer', 'blobContainer'],
		guilddragfix: ['Guild', 'dragfix'],
		guildedge: ['GuildEdges', 'edge'],
		guildedgewrapper: ['GuildEdges', 'wrapper'],
		guildheader: ['GuildHeader', 'container'],
		guildheaderbanner: ['GuildHeader', 'banner'],
		guildheaderbannerimage: ['GuildHeader', 'bannerImage'],
		guildheaderhasdropdown: ['GuildHeader', 'hasDropdown'],
		guildheaderheader: ['GuildHeader', 'header'],
		guildheadername: ['GuildHeader', 'name'],
		guildicon: ['GuildIcon', 'icon'],
		guildiconacronym: ['GuildIcon', 'acronym'],
		guildiconselected: ['GuildIcon', 'selected'],
		guildiconwrapper: ['GuildIcon', 'wrapper'],
		guildinner: ['Guild', 'wrapper'],
		guildinnerwrapper: ['GuildsItems', 'listItemWrapper'],
		guildlowerbadge: ['Guild', 'lowerBadge'],
		guildouter: ['GuildsItems', 'listItem'],
		guildpill: ['GuildServer', 'pill'],
		guildpillitem: ['PillWrapper', 'item'],
		guildpillwrapper: ['PillWrapper', 'wrapper'],
		guildplaceholder: ['GuildsItems', 'dragInner'],
		guildplaceholdermask: ['GuildsItems', 'placeholderMask'],
		guilds: ['GuildsWrapper', 'scroller'],
		guildseparator: ['GuildsItems', 'guildSeparator'],
		guildserror: ['GuildsItems', 'guildsError'],
		guildsettingsbannedcard: ['GuildSettingsBanned', 'bannedUser'],
		guildsettingsbanneddiscrim: ['GuildSettingsBanned', 'discrim'],
		guildsettingsbannedusername: ['GuildSettingsBanned', 'username'],
		guildsettingsinvitecard: ['GuildSettingsInvite', 'inviteSettingsInviteRow'],
		guildsettingsinvitechannelname: ['GuildSettingsInvite', 'channelName'],
		guildsettingsinviteusername: ['GuildSettingsInvite', 'username'],
		guildsettingsmembercard: ['GuildSettingsMember', 'member'],
		guildsettingsmembername: ['GuildSettingsMember', 'name'],
		guildsettingsmembernametag: ['GuildSettingsMember', 'nameTag'],
		guildsscrollerwrap: ['GuildsWrapper', 'scrollerWrap'],
		guildsvg: ['Guild', 'svg'],
		guildswrapper: ['GuildsWrapper', 'wrapper'],
		guildswrapperunreadmentionsindicatorbottom: ['GuildsWrapper', 'unreadMentionsIndicatorBottom'],
		guildswrapperunreadmentionsindicatortop: ['GuildsWrapper', 'unreadMentionsIndicatorTop'],
		guildupperbadge: ['Guild', 'upperBadge'],
		h1: ['Text', 'h1'],
		h1defaultmargin: ['Text', 'defaultMarginh1'],
		h2: ['Text', 'h2'],
		h2defaultmargin: ['Text', 'defaultMarginh2'],
		h3: ['Text', 'h3'],
		h3defaultmargin: ['Text', 'defaultMarginh3'],
		h4: ['Text', 'h4'],
		h4defaultmargin: ['Text', 'defaultMarginh4'],
		h5: ['Text', 'h5'],
		h5defaultmargin: ['Text', 'defaultMarginh5'],
		headertitle: ['Text', 'title'],
		height16: ['Text', 'height16'],
		height20: ['Text', 'height20'],
		height24: ['Text', 'height24'],
		height28: ['TextStyle', 'height28'],
		height36: ['Notice', 'height36'],
		highlight: ['NotFound', 'highlight'],
		homebutton: ['HomeIcon', 'button'],
		homebuttonicon: ['HomeIcon', 'homeIcon'],
		homebuttonpill: ['HomeIcon', 'pill'],
		homebuttonselected: ['HomeIcon', 'selected'],
		horizontal: ['FlexChild', 'horizontal'],
		horizontal2: ['NotFound', '_'],
		horizontalreverse: ['FlexChild', 'horizontalReverse'],
		horizontalreverse2: ['NotFound', '_'],
		hotkeybase: ['NotFound', '_'],
		hotkeybutton: ['HotKeyRecorder', 'button'],
		hotkeybutton2: ['NotFound', '_'],
		hotkeycontainer: ['HotKeyRecorder', 'container'],
		hotkeycontainer2: ['NotFound', '_'],
		hotkeydisabled: ['HotKeyRecorder', 'disabled'],
		hotkeydisabled2: ['NotFound', '_'],
		hotkeyediticon: ['HotKeyRecorder', 'editIcon'],
		hotkeyhasvalue: ['HotKeyRecorder', 'hasValue'],
		hotkeyinput: ['HotKeyRecorder', 'input'],
		hotkeyinput2: ['HotKeyRecorder', 'input'],
		hotkeylayout: ['HotKeyRecorder', 'layout'],
		hotkeylayout2: ['HotKeyRecorder', 'layout'],
		hotkeyrecording: ['HotKeyRecorder', 'recording'],
		hotkeyshadowpulse: ['HotKeyRecorder', 'shadowPulse'],
		hotkeytext: ['HotKeyRecorder', 'text'],
		hovercard: ['HoverCard', 'card'],
		hovercardinner: ['BDFDB', 'cardInner'],
		hovercardbutton: ['HoverCardButton', 'button'],
		icon: ['EmbedActions', 'icon'],
		iconactionswrapper: ['EmbedActions', 'wrapper'],
		iconexternal: ['EmbedActions', 'iconExternal'],
		iconexternalmargins: ['EmbedActions', 'iconExternalMargins'],
		iconplay: ['EmbedActions', 'iconPlay'],
		iconwrapper: ['EmbedActions', 'iconWrapper'],
		iconwrapperactive: ['EmbedActions', 'iconWrapperActive'],
		imageaccessory: ['ImageWrapper', 'imageAccessory'],
		imageclickable: ['ImageWrapper', 'clickable'],
		imageerror: ['ImageWrapper', 'imageError'],
		imageplaceholder: ['ImageWrapper', 'imagePlaceholder'],
		imageplaceholderoverlay: ['ImageWrapper', 'imagePlaceholderOverlay'],
		imagewrapper: ['ImageWrapper', 'imageWrapper'],
		imagewrapperbackground: ['ImageWrapper', 'imageWrapperBackground'],
		imagewrapperinner: ['ImageWrapper', 'imageWrapperInner'],
		imagezoom: ['ImageWrapper', 'imageZoom'],
		input: ['Input', 'input'],
		inputdefault: ['Input', 'inputDefault'],
		inputdisabled: ['Input', 'disabled'],
		inputeditable: ['Input', 'editable'],
		inputerror: ['Input', 'error'],
		inputfocused: ['Input', 'focused'],
		inputmini: ['Input', 'inputMini'],
		inputsuccess: ['Input', 'success'],
		inputwrapper: ['Input', 'inputWrapper'],
		invitemodal: ['InviteModal', 'modal'],
		invitemodalinviterow: ['InviteModal', 'inviteRow'],
		invitemodalinviterowname: ['InviteModal', 'inviteRowName'],
		invitemodalwrapper: ['InviteModal', 'wrapper'],
		justifycenter: ['Flex', 'justifyCenter'],
		justifyend: ['Flex', 'justifyEnd'],
		justifystart: ['Flex', 'justifyStart'],
		large: ['TextStyle', 'large'],
		layer: ['Layers', 'layer'],
		layers: ['Layers', 'layers'],
		lfg: ['NotFound', 'lfg'],
		loginscreen: ['NotFound', 'loginScreen'],
		marginbottom4: ['Margins', 'marginBottom4'],
		marginbottom8: ['Margins', 'marginBottom8'],
		marginbottom20: ['Margins', 'marginBottom20'],
		marginbottom40: ['Margins', 'marginBottom40'],
		marginbottom60: ['Margins', 'marginBottom60'],
		margincenterhorz: ['Margins', 'marginCenterHorz'],
		marginleft4: ['Autocomplete', 'marginLeft4'],
		marginleft8: ['Autocomplete', 'marginLeft8'],
		marginreset: ['Margins', 'marginReset'],
		margintop4: ['Margins', 'marginTop4'],
		margintop8: ['Margins', 'marginTop8'],
		margintop20: ['Margins', 'marginTop20'],
		margintop40: ['Margins', 'marginTop40'],
		margintop60: ['Margins', 'marginTop60'],
		medium: ['TextStyle', 'medium'],
		member: ['Member', 'member'],
		membercontent: ['Member', 'memberContent'],
		membericon: ['Member', 'icon'],
		memberinner: ['Member', 'memberInner'],
		membernametag: ['Member', 'nameTag'],
		memberownericon: ['Member', 'ownerIcon'],
		memberpremiumicon: ['Member', 'premiumIcon'],
		members: ['MembersWrap', 'members'],
		membersgroup: ['MembersWrap', 'membersGroup'],
		memberswrap: ['MembersWrap', 'membersWrap'],
		memberusername: ['Member', 'username'],
		mention: ['NotFound', 'mention'],
		mentionwrapper: ['Mention', 'wrapper'],
		mentionwrapperhover: ['Mention', 'wrapperHover'],
		mentionwrappernohover: ['Mention', 'wrapperNoHover'],
		message: ['Message', 'message'],
		messageaccessory: ['MessageAccessory', 'container'],
		messageaccessorycompact: ['MessageAccessory', 'containerCompact'],
		messageaccessorycozy: ['MessageAccessory', 'containerCozy'],
		messageavatar: ['Message', 'avatar'],
		messagebody: ['MessageBody', 'container'],
		messagebodycompact: ['MessageBody', 'containerCompact'],
		messagebodycozy: ['MessageBody', 'containerCozy'],
		messagebuttoncontainer: ['Message', 'buttonContainer'],
		messagebuttoncontainerouter: ['MessageBody', 'buttonContainer'],
		messagecompact: ['Message', 'messageCompact'],
		messagecontent: ['Message', 'content'],
		messagecontentcompact: ['Message', 'contentCompact'],
		messagecontentcozy: ['Message', 'contentCozy'],
		messagecozy: ['Message', 'messageCozy'],
		messagedivider: ['Message', 'divider'],
		messagedividerenabled: ['Message', 'dividerEnabled'],
		messageedited: ['MessageBody', 'edited'],
		messagegroup: ['Message', 'container'],
		messagegroupcozy: ['Message', 'containerCozy'],
		messagegroupcompact: ['Message', 'containerCompact'],
		messagegroupwrapper: ['MessagesPopout', 'messageGroupWrapper'],
		messagegroupwrapperoffsetcorrection: ['MessagesPopout', 'messageGroupWrapperOffsetCorrection'],
		messageheadercompact: ['Message', 'headerCompact'],
		messageheadercozy: ['Message', 'headerCozy'],
		messageheadercozymeta: ['Message', 'headerCozyMeta'],
		messagelocalbotmessage: ['Message', 'localBotMessage'],
		messagemarkup: ['MessageMarkup', 'markup'],
		messagemarkupiscompact: ['MessageBody', 'isCompact'],
		messages: ['MessagesWrap', 'messages'],
		messagespopout: ['MessagesPopout', 'messagesPopout'],
		messagespopoutaccessories: ['MessagesPopout', 'accessories'],
		messagespopoutactionbuttons: ['MessagesPopout', 'actionButtons'],
		messagespopoutbody: ['MessagesPopout', 'body'],
		messagespopoutbottom: ['MessagesPopout', 'bottom'],
		messagespopoutchannelname: ['MessagesPopout', 'channelName'],
		messagespopoutchannelseparator: ['MessagesPopout', 'channelSeparator'],
		messagespopoutclosebutton: ['MessagesPopout', 'closeButton'],
		messagespopoutcomment: ['MessagesPopout', 'comment'],
		messagespopoutcontainercompactbounded: ['Message', 'containerCompactBounded'],
		messagespopoutcontainercozybounded: ['Message', 'containerCozyBounded'],
		messagespopoutemptyplaceholder: ['MessagesPopout', 'emptyPlaceholder'],
		messagespopoutfooter: ['MessagesPopout', 'footer'],
		messagespopoutguildname: ['MessagesPopout', 'guildName'],
		messagespopouthasmore: ['MessagesPopout', 'hasMore'],
		messagespopouthasmorebutton: ['MessagesPopout', 'hasMoreButton'],
		messagespopoutheader: ['MessagesPopout', 'header'],
		messagespopouthidden: ['MessagesPopout', 'hidden'],
		messagespopoutimage: ['MessagesPopout', 'image'],
		messagespopoutjumpbutton: ['MessagesPopout', 'jumpButton'],
		messagespopoutloading: ['MessagesPopout', 'loading'],
		messagespopoutloadingmore: ['MessagesPopout', 'loadingMore'],
		messagespopoutloadingplaceholder: ['MessagesPopout', 'loadingPlaceholder'],
		messagespopoutmessagegroupcozy: ['MessagesPopout', 'messageGroupCozy'],
		messagespopoutmessagegroupwrapper: ['MessagesPopout', 'messageGroupWrapper'],
		messagespopoutmessagegroupwrapperoffsetcorrection: ['MessagesPopout', 'messageGroupWrapperOffsetCorrection'],
		messagespopoutscrollingfooterwrap: ['MessagesPopout', 'scrollingFooterWrap'],
		messagespopoutspinner: ['MessagesPopout', 'spinner'],
		messagespopouttext: ['MessagesPopout', 'text'],
		messagespopouttip: ['MessagesPopout', 'tip'],
		messagespopouttitle: ['MessagesPopout', 'title'],
		messagespopoutvisible: ['MessagesPopout', 'visible'],
		messagespopoutwrap: ['MessagesPopout', 'messagesPopoutWrap'],
		messageswrapper: ['MessagesWrap', 'messagesWrapper'],
		messagesystem: ['MessageSystem', 'container'],
		messagesystemcontent: ['MessageSystem', 'content'],
		messagetimestampcompact: ['Message', 'timestampCompact'],
		messagetimestampcompactismentioned: ['Message', 'timestampCompactIsMentioned'],
		messagetimestampcozy: ['Message', 'timestampCozy'],
		messageuploadcancel: ['MessageFile', 'cancelButton'],
		messageusername: ['Message', 'username'],
		modal: ['ModalWrap', 'modal'],
		modalclose: ['Modal', 'close'],
		modalcontent: ['Modal', 'content'],
		modaldivider: ['ModalDivider', 'divider'],
		modaldividerdefault: ['SettingsItems', 'dividerDefault'],
		modaldividermini: ['SettingsItems', 'dividerMini'],
		modalfooter: ['Modal', 'footer'],
		modalguildname: ['ModalItems', 'guildName'],
		modalheader: ['Modal', 'header'],
		modalinner: ['ModalWrap', 'inner'],
		modalmini: ['ModalMiniContent', 'modal'],
		modalminicontent: ['ModalMiniContent', 'content'],
		modalminisize: ['ModalMiniContent', 'size'],
		modalseparator: ['Modal', 'separator'],
		modalsizelarge: ['Modal', 'sizeLarge'],
		modalsizemedium: ['Modal', 'sizeMedium'],
		modalsizesmall: ['Modal', 'sizeSmall'],
		modalsub: ['Modal', 'modal'],
		modalsubinner: ['Modal', 'inner'],
		modedefault: ['FormText', 'modeDefault'],
		modedisabled: ['FormText', 'modeDisabled'],
		modeselectable: ['FormText', 'modeSelectable'],
		nametag: ['NameTag', 'nameTag'],
		nochannel: ['ChannelWindow', 'noChannel'],
		notice: ['Notice', 'notice'],
		noticebrand: ['Notice', 'noticeBrand'],
		noticebutton: ['Notice', 'button'],
		noticedanger: ['Notice', 'noticeDanger'],
		noticedefault: ['Notice', 'noticeDefault'],
		noticedismiss: ['Notice', 'dismiss'],
		noticefacebook: ['Notice', 'noticeFacebook'],
		noticeicon: ['Notice', 'icon'],
		noticeiconandroid: ['Notice', 'iconAndroid'],
		noticeiconapple: ['Notice', 'iconApple'],
		noticeiconwindows: ['Notice', 'iconWindows'],
		noticeinfo: ['Notice', 'noticeInfo'],
		noticeplatformicon: ['Notice', 'platformIcon'],
		noticepremium: ['Notice', 'noticePremium'],
		noticepremiumaction: ['Notice', 'premiumAction'],
		noticepremiumgrandfathered: ['Notice', 'noticePremiumGrandfathered'],
		noticepremiumlogo: ['Notice', 'premiumLogo'],
		noticepremiumtext: ['Notice', 'premiumText'],
		noticespotify: ['Notice', 'noticeSpotify'],
		noticestreamer: ['Notice', 'noticeStreamerMode'],
		noticesuccess: ['Notice', 'noticeSuccess'],
		noticesurvey: ['Notice', 'noticeSurvey'],
		note: ['SettingsItems', 'note'],
		nowrap: ['Flex', 'noWrap'],
		optionpopout: ['OptionPopout', 'container'],
		optionpopoutbutton: ['OptionPopout', 'button'],
		optionpopoutitem: ['OptionPopout', 'item'],
		overflowellipsis: ['BDFDB', 'overflowEllipsis'],
		pictureinpicture: ['PictureInPicture', 'pictureInPicture'],
		pictureinpicturewindow: ['PictureInPicture', 'pictureInPictureWindow'],
		popout: ['Popout', 'popout'],
		popoutarrowalignmenttop: ['Popout', 'arrowAlignmentTop'],
		popoutbody: ['Popout', 'body'],
		popoutbottom: ['Popout', 'popoutBottom'],
		popoutbottomleft: ['Popout', 'popoutBottomLeft'],
		popoutbottomright: ['Popout', 'popoutBottomRight'],
		popoutfooter: ['Popout', 'footer'],
		popoutheader: ['Popout', 'header'],
		popoutinvert: ['Popout', 'popoutInvert'],
		popoutleft: ['Popout', 'popoutLeft'],
		popoutnoarrow: ['Popout', 'noArrow'],
		popoutnoshadow: ['Popout', 'noShadow'],
		popouts: ['Popout', 'popouts'],
		popoutsubtitle: ['Popout', 'subtitle'],
		popoutthemedpopout: ['Popout', 'themedPopout'],
		popouttip: ['Popout', 'tip'],
		popouttitle: ['Popout', 'title'],
		popouttop: ['Popout', 'popoutTop'],
		popouttopleft: ['Popout', 'popoutTopLeft'],
		popouttopright: ['Popout', 'popoutTopRight'],
		primary: ['TextStyle', 'primary'],
		quickselect: ['QuickSelect', 'quickSelect'],
		quickselectarrow: ['QuickSelect', 'quickSelectArrow'],
		quickselectclick: ['QuickSelect', 'quickSelectClick'],
		quickselectlabel: ['QuickSelect', 'quickSelectLabel'],
		quickselectpopout: ['QuickSelect', 'quickSelectPopout'],
		quickselectpopoutoption: ['QuickSelect', 'quickSelectPopoutOption'],
		quickselectpopoutscroll: ['QuickSelect', 'quickSelectPopoutScroll'],
		quickselectscroller: ['QuickSelect', 'quickSelectScroller'],
		quickselectselected: ['QuickSelect', 'selected'],
		quickselectvalue: ['QuickSelect', 'quickSelectValue'],
		quickswitcher: ['QuickSwitchWrap', 'quickswitcher'],
		quickswitchresult: ['QuickSwitch', 'result'],
		quickswitchresultfocused: ['QuickSwitch', 'resultFocused'],
		quickswitchresultguildicon: ['QuickSwitch', 'guildIcon'],
		quickswitchresultmatch: ['QuickSwitch', 'match'],
		quickswitchresultmisccontainer: ['QuickSwitchWrap', 'miscContainer'],
		quickswitchresultname: ['QuickSwitch', 'name'],
		quickswitchresultnote: ['QuickSwitch', 'note'],
		quickswitchresultusername: ['QuickSwitch', 'username'],
		recentmentionsfilterpopout: ['RecentMentions', 'recentMentionsFilterPopout'],
		recentmentionsheader: ['RecentMentions', 'header'],
		recentmentionsloadingmore: ['RecentMentions', 'loadingMore'],
		recentmentionsmentionfilter: ['RecentMentions', 'mentionFilter'],
		recentmentionsmentionfilterlabel: ['RecentMentions', 'label'],
		recentmentionsmentionfiltervalue: ['RecentMentions', 'value'],
		recentmentionspopout: ['RecentMentions', 'recentMentionsPopout'],
		reset: ['CardStatus', 'reset'],
		scroller: ['Scroller', 'scroller'],
		scrollerold: ['Scroller', 'scroller'],
		scrollerthemed: ['Scroller', 'scrollerThemed'],
		scrollerwrap: ['Scroller', 'scrollerWrap'],
		scrollerwrapold: ['Scroller', 'scrollerWrap'],
		searchbar: ['SearchBar', 'container'],
		searchbarclear: ['SearchBar', 'clear'],
		searchbarclose: ['SearchBar', 'close'],
		searchbardark: ['SearchBar', 'darkTheme'],
		searchbaricon: ['SearchBar', 'icon'],
		searchbariconlayout: ['SearchBar', 'iconLayout'],
		searchbariconwrap: ['SearchBar', 'iconContainer'],
		searchbarinner: ['SearchBar', 'inner'],
		searchbarinput: ['SearchBar', 'input'],
		searchbarlarge: ['SearchBar', 'large'],
		searchbarlight: ['SearchBar', 'lightTheme'],
		searchbarmedium: ['SearchBar', 'medium'],
		searchbarsmall: ['SearchBar', 'small'],
		searchbartag: ['SearchBar', 'tag'],
		searchbarvisible: ['SearchBar', 'visible'],
		searchpopout: ['SearchPopoutWrap', 'container'],
		searchpopoutanswer: ['SearchPopout', 'answer'],
		searchpopoutdatepicker: ['SearchPopout', 'datePicker'],
		searchpopoutdatepickerhint: ['SearchPopout', 'datePickerHint'],
		searchpopoutdmaddpopout: ['DmAddPopout', 'popout'],
		searchpopoutdisplayavatar: ['SearchPopout', 'displayAvatar'],
		searchpopoutdisplayusername: ['SearchPopout', 'displayUsername'],
		searchpopoutdisplayednick: ['SearchPopout', 'displayedNick'],
		searchpopoutfilter: ['SearchPopout', 'filter'],
		searchpopoutheader: ['SearchPopout', 'header'],
		searchpopouthint: ['SearchPopout', 'hint'],
		searchpopouthintvalue: ['SearchPopout', 'hintValue'],
		searchpopoutlinksource: ['SearchPopout', 'linkSource'],
		searchpopoutnontext: ['SearchPopout', 'nonText'],
		searchpopoutoption: ['SearchPopout', 'option'],
		searchpopoutplusicon: ['SearchPopout', 'plusIcon'],
		searchpopoutresultchannel: ['SearchPopout', 'resultChannel'],
		searchpopoutresultsgroup: ['SearchPopout', 'resultsGroup'],
		searchpopoutsearchclearhistory: ['SearchPopout', 'searchClearHistory'],
		searchpopoutsearchlearnmore: ['SearchPopout', 'searchLearnMore'],
		searchpopoutsearchoption: ['SearchPopout', 'searchOption'],
		searchpopoutsearchresultchannelcategory: ['SearchPopout', 'searchResultChannelCategory'],
		searchpopoutsearchresultchannelicon: ['SearchPopout', 'searchResultChannelIcon'],
		searchpopoutsearchresultchanneliconbackground: ['SearchPopout', 'searchResultChannelIconBackground'],
		searchpopoutselected: ['SearchPopout', 'selected'],
		searchpopoutuser: ['SearchPopout', 'user'],
		searchresults: ['SearchResults', 'searchResults'],
		searchresultschannelname: ['SearchResults', 'channelName'],
		searchresultspagination: ['SearchResults', 'pagination'],
		searchresultspaginationdisabled: ['SearchResults', 'disabled'],
		searchresultspaginationnext: ['SearchResults', 'paginationNext'],
		searchresultspaginationprevious: ['SearchResults', 'paginationPrevious'],
		searchresultssearchheader: ['SearchResults', 'searchHeader'],
		searchresultswrap: ['SearchResults', 'searchResultsWrap'],
		searchresultswrapper: ['SearchResults', 'resultsWrapper'],
		select: ['NotFound', 'select'],
		selectable: ['TextStyle', 'selectable'],
		selectarrow: ['NotFound', 'selectArrow'],
		selectarrowcontainer: ['NotFound', 'selectArrowContainer'],
		selectarrowcontainerdark: ['NotFound', 'selectArrowContainerDark'],
		selectarrowcontainerlight: ['NotFound', 'selectArrowContainerLight'],
		selectarrowzone: ['NotFound', 'selectArrowZone'],
		selectcontrol: ['NotFound', 'selectControl'],
		selectcontroldark: ['NotFound', 'selectControlDark'],
		selectcontrollight: ['NotFound', 'selectControlLight'],
		selectdummyinput: ['NotFound', 'selectDummyInput'],
		selecthasvalue: ['NotFound', 'selectHasValue'],
		selectisopen: ['NotFound', 'selectIsOpen'],
		selectmenu: ['NotFound', 'selectMenu'],
		selectmenuouter: ['NotFound', 'selectMenuOuter'],
		selectmenuouterdark: ['NotFound', 'selectMenuOuterDark'],
		selectmenuouterlight: ['NotFound', 'selectMenuOuterLight'],
		selectoption: ['NotFound', 'selectOption'],
		selectoptiondark: ['NotFound', 'selectOptionDark'],
		selectoptionlight: ['NotFound', 'selectOptionLight'],
		selectoptionhoverdark: ['NotFound', 'selectOptionHoverDark'],
		selectoptionhoverlight: ['NotFound', 'selectOptionHoverLight'],
		selectoptionselectdark: ['NotFound', 'selectOptionSelectDark'],
		selectoptionselectlight: ['NotFound', 'selectOptionSelectLight'],
		selectselected: ['NotFound', 'selectIsSelected'],
		selectsingle: ['NotFound', 'selectSingle'],
		selectsingledark: ['NotFound', 'selectSingleDark'],
		selectsinglelight: ['NotFound', 'selectSingleLight'],
		selectvalue: ['NotFound', 'selectValue'],
		selectwrap: ['Select', 'select'],
		settingsclosebutton: ['SettingsCloseButton', 'closeButton'],
		settingsclosebuttoncontainer: ['SettingsCloseButton', 'container'],
		settingsheader: ['Item', 'header'],
		settingsitem: ['Item', 'item'],
		settingsitemselected: ['Item', 'selected'],
		settingsitemthemed: ['Item', 'themed'],
		settingsseparator: ['Item', 'separator'],
		settingstabbar: ['Friends', 'tabBar'],
		settingstabbarbadge: ['Friends', 'badge'],
		settingstabbarprimary: ['Friends', 'primary'],
		settingstabbartoppill: ['Item', 'topPill'],
		sidebarregion: ['SettingsWindow', 'sidebarRegion'],
		sinkinteractions: ['Message', 'disableInteraction'],
		size10: ['UserPopout', 'size10'],
		size12: ['Text', 'size12'],
		size14: ['Text', 'size14'],
		size16: ['Text', 'size16'],
		size18: ['Text', 'size18'],
		size20: ['Text', 'size20'],
		size24: ['TextStyle', 'size24'],
		slider: ['Slider', 'slider'],
		sliderbar: ['Slider', 'bar'],
		sliderbarfill: ['Slider', 'barFill'],
		sliderbubble: ['Slider', 'bubble'],
		sliderdisabled: ['Slider', 'disabled'],
		slidergrabber: ['Slider', 'grabber'],
		sliderinput: ['Slider', 'input'],
		slidermark: ['Slider', 'mark'],
		slidermarkdash: ['Slider', 'markDash'],
		slidermarkdashsimple: ['Slider', 'markDashSimple'],
		slidermarkvalue: ['Slider', 'markValue'],
		slidermini: ['Slider', 'mini'],
		slidertrack: ['Slider', 'track'],
		spoilercontainer: ['Spoiler', 'spoilerContainer'],
		spoilerhidden: ['Spoiler', 'hidden'],
		spoilertext: ['Spoiler', 'spoilerText'],
		spoilerwarning: ['Spoiler', 'spoilerWarning'],
		small: ['TextStyle', 'small'],
		splashbackground: ['NotFound', 'splashBackground'],
		standardsidebarview: ['SettingsWindow', 'standardSidebarView'],
		status: ['Avatar', 'status'],
		switch: ['Switch', 'switch'],
		switchdisabled: ['Switch', 'switchDisabled'],
		switchenabled: ['Switch', 'switchEnabled'],
		switchinner: ['Switch', 'checkbox'],
		switchinnerdisabled: ['Switch', 'checkboxDisabled'],
		switchinnerenabled: ['Switch', 'checkboxEnabled'],
		switchsize: ['Switch', 'size'],
		switchsizedefault: ['Switch', 'sizeDefault'],
		switchsizemini: ['Switch', 'sizeMini'],
		switchthemeclear: ['Switch', 'themeClear'],
		switchthemedefault: ['Switch', 'themeDefault'],
		switchvalue: ['Switch', 'value'],
		switchvaluechecked: ['Switch', 'valueChecked'],
		switchvalueunchecked: ['Switch', 'valueUnchecked'],
		systempad: ['Scroller', 'systemPad'],
		tabbar: ['UserProfile', 'tabBar'],
		tabbarcontainer: ['UserProfile', 'tabBarContainer'],
		tabbarheader: ['RecentMentions', 'tabBar'],
		tabbarheadercontainer: ['RecentMentions', 'headerTabBarWrapper'],
		tabbarheaderitem: ['RecentMentions', 'tabBarItem'],
		tabbaritem: ['UserProfile', 'tabBarItem'],
		tabbartop: ['Item', 'top'],
		tableheader: ['SettingsTable', 'header'],
		tableheadername: ['SettingsTable', 'headerName'],
		tableheaderoption: ['SettingsTable', 'headerOption'],
		tableheadersize: ['SettingsTable', 'headerSize'],
		textarea: ['ChannelTextArea', 'textArea'],
		textareaattachbutton: ['ChannelTextArea', 'attachButton'],
		textareaattachbuttondivider: ['ChannelTextArea', 'attachButtonDivider'],
		textareaattachbuttoninner: ['ChannelTextArea', 'attachButtonInner'],
		textareaattachbuttonplus: ['ChannelTextArea', 'attachButtonPlus'],
		textareabutton: ['ChannelTextAreaButton', 'button'],
		textareabuttonactive: ['ChannelTextAreaButton', 'active'],
		textareabuttonwrapper: ['ChannelTextAreaButton', 'buttonWrapper'],
		textareaicon: ['ChannelTextAreaButton', 'icon'],
		textareainner: ['ChannelTextArea', 'inner'],
		textareainnerautocomplete: ['ChannelTextArea', 'innerAutocomplete'],
		textareainnerdisabled: ['ChannelTextArea', 'innerDisabled'],
		textareainnerenablednoattach: ['ChannelTextArea', 'innerEnabledNoAttach'],
		textareainnernoautocomplete: ['ChannelTextArea', 'innerNoAutocomplete'],
		textareapickerbutton: ['ChannelTextArea', 'button'],
		textareapickerbuttons: ['ChannelTextArea', 'buttons'],
		textareauploadinput: ['ChannelTextArea', 'uploadInput'],
		textareawrapall: ['ChannelTextArea', 'channelTextArea'],
		textareawrapchat: ['ChannelWindow', 'channelTextArea'],
		textareawrapdisabled: ['ChannelTextArea', 'channelTextAreaDisabled'],
		textareawrapenablednoattach: ['ChannelTextArea', 'channelTextAreaEnabledNoAttach'],
		textlink: ['Notice', 'textLink'],
		textrow: ['PopoutActivity', 'textRow'],
		themedark: ['NotFound', 'themeDark'],
		themeghosthairline: ['Scroller', 'themeGhostHairline'],
		themelight: ['NotFound', 'themeLight'],
		title: ['SettingsItems', 'title'],
		titlebar: ['TitleBar', 'titleBar'],
		titledefault: ['SettingsItems', 'titleDefault'],
		titlemini: ['SettingsItems', 'titleMini'],
		tooltip: ['TooltipContainer', 'layer'],
		tooltipblack: ['Tooltip', 'tooltipBlack'],
		tooltipbottom: ['Tooltip', 'tooltipBottom'],
		tooltipbrand: ['Tooltip', 'tooltipBrand'],
		tooltipgreen: ['Tooltip', 'tooltipGreen'],
		tooltipinner: ['Tooltip', 'tooltip'],
		tooltipleft: ['Tooltip', 'tooltipLeft'],
		tooltippointer: ['Tooltip', 'tooltipPointer'],
		tooltipred: ['Tooltip', 'tooltipRed'],
		tooltipright: ['Tooltip', 'tooltipRight'],
		tooltips: ['TooltipContainer', 'layerContainer'],
		tooltiptop: ['Tooltip', 'tooltipTop'],
		tooltipyellow: ['Tooltip', 'tooltipYellow'],
		typing: ['Typing', 'typing'],
		userpopout: ['UserPopout', 'userPopout'],
		userpopoutavatarwrapper: ['UserPopout', 'avatarWrapper'],
		userpopoutcustomstatus: ['UserPopout', 'customStatus'],
		userpopoutheader: ['UserPopout', 'header'],
		userpopoutheaderbottagwithnickname: ['UserPopout', 'headerBotTagWithNickname'],
		userpopoutheadernamewrapper: ['UserPopout', 'headerNameWrapper'],
		userpopoutheadernickname: ['UserPopout', 'headerName'],
		userpopoutheadernonickname: ['UserPopout', 'headerTagUsernameNoNickname'],
		userpopoutheadernormal: ['UserPopout', 'headerNormal'],
		userpopoutheaderplaying: ['UserPopout', 'headerPlaying'],
		userpopoutheaderspotify: ['UserPopout', 'headerSpotify'],
		userpopoutheaderstreaming: ['UserPopout', 'headerStreaming'],
		userpopoutheadertag: ['UserPopout', 'headerTag'],
		userpopoutheadertagnonickname: ['UserPopout', 'headerTagNoNickname'],
		userpopoutheadertagusernamenonickname: ['UserPopout', 'headerTagUsernameNoNickname'],
		userpopoutheadertagwithnickname: ['UserPopout', 'headerTagWithNickname'],
		userpopoutheadertext: ['UserPopout', 'headerText'],
		userpopoutnametag: ['UserPopout', 'nametag'],
		userpopoutrole: ['Role', 'role'],
		userpopoutrolecircle: ['Role', 'roleCircle'],
		userpopoutrolelist: ['UserPopout', 'rolesList'],
		userpopoutrolename: ['Role', 'roleName'],
		userprofile: ['UserProfile', 'root'],
		userprofilebody: ['UserProfile', 'body'],
		userprofilebottag: ['UserProfile', 'botTag'],
		userprofilecustomstatus: ['UserProfile', 'customStatus'],
		userprofileheader: ['UserProfile', 'header'],
		userprofileheaderfill: ['UserProfile', 'headerFill'],
		userprofileheaderinfo: ['UserProfile', 'headerInfo'],
		userprofilelistavatar: ['UserProfile', 'listAvatar'],
		userprofilelistguildavatarwithouticon: ['UserProfile', 'guildAvatarWithoutIcon'],
		userprofilelistname: ['UserProfile', 'listName'],
		userprofilelistrow: ['UserProfile', 'listRow'],
		userprofilenametag: ['UserProfile', 'nameTag'],
		userprofiletopsectionnormal: ['UserProfile', 'topSectionNormal'],
		userprofiletopsectionplaying: ['UserProfile', 'topSectionPlaying'],
		userprofiletopsectionspotify: ['UserProfile', 'topSectionSpotify'],
		userprofiletopsectionstreaming: ['UserProfile', 'topSectionStreaming'],
		userprofiletopsectionxbox: ['UserProfile', 'topSectionXbox'],
		userprofileusername: ['UserProfile', 'username'],
		usernote: ['Note', 'note'],
		usernotepopout: ['UserPopout', 'note'],
		usernoteprofile: ['UserProfile', 'note'],
		vertical: ['Flex', 'vertical'],
		voiceavatar: ['Voice', 'avatar'],
		voiceavatarcontainer: ['Voice', 'avatarContainer'],
		voiceavatarlarge: ['Voice', 'avatarLarge'],
		voiceavatarsmall: ['Voice', 'avatarSmall'],
		voiceavatarspeaking: ['Voice', 'avatarSpeaking'],
		voiceclickable: ['Voice', 'clickable'],
		voicecontent: ['Voice', 'content'],
		voiceflipped: ['Voice', 'flipped'],
		voiceicon: ['Voice', 'icon'],
		voiceicons: ['Voice', 'icons'],
		voiceiconspacing: ['Voice', 'iconSpacing'],
		voicelist: ['Voice', 'list'],
		voicelistcollapse: ['Voice', 'listCollapse'],
		voicelistdefault: ['Voice', 'listDefault'],
		voiceliveicon: ['Voice', 'liveIcon'],
		voicename: ['Voice', 'username'],
		voicenamefont: ['Voice', 'usernameFont'],
		voicenamespeaking: ['Voice', 'usernameSpeaking'],
		voicered: ['Voice', 'red'],
		voiceselected: ['Voice', 'selected'],
		voiceuser: ['Voice', 'voiceUser'],
		voiceuserlarge: ['Voice', 'userLarge'],
		voiceusersmall: ['Voice', 'userSmall'],
		weightbold: ['TextWeight', 'weightBold'],
		weightlight: ['TextWeight', 'weightLight'],
		weightmedium: ['TextWeight', 'weightMedium'],
		weightnormal: ['TextWeight', 'weightNormal'],
		weightsemibold: ['TextWeight', 'weightSemiBold'],
		wrap: ['Flex', 'wrap'],
		wrapreverse: ['Flex', 'wrapReverse']
	};
	BDFDB.DiscordClasses = Object.assign({}, DiscordClasses);

	BDFDB.disCN = new Proxy(DiscordClasses, {
		get: function (list, item) {
			return BDFDB.getDiscordClass(item, false).replace('#', '');
		}
	});

	BDFDB.disCNS = new Proxy(DiscordClasses, {
		get: function (list, item) {
			return BDFDB.getDiscordClass(item, false).replace('#', '') + ' ';
		}
	});

	BDFDB.disCNC = new Proxy(DiscordClasses, {
		get: function (list, item) {
			return BDFDB.getDiscordClass(item, false).replace('#', '') + ',';
		}
	});

	BDFDB.dotCN = new Proxy(DiscordClasses, {
		get: function (list, item) {
			let classname = BDFDB.getDiscordClass(item, true);
			return (classname.indexOf('#') == 0 ? '' : '.') + classname;
		}
	});

	BDFDB.dotCNS = new Proxy(DiscordClasses, {
		get: function (list, item) {
			let classname = BDFDB.getDiscordClass(item, true);
			return (classname.indexOf('#') == 0 ? '' : '.') + classname + ' ';
		}
	});

	BDFDB.dotCNC = new Proxy(DiscordClasses, {
		get: function (list, item) {
			let classname = BDFDB.getDiscordClass(item, true);
			return (classname.indexOf('#') == 0 ? '' : '.') + classname + ',';
		}
	});

	BDFDB.notCN = new Proxy(DiscordClasses, {
		get: function (list, item) {
			return `:not(.${BDFDB.getDiscordClass(item, true).split('.')[0]})`;
		}
	});

	BDFDB.notCNS = new Proxy(DiscordClasses, {
		get: function (list, item) {
			return `:not(.${BDFDB.getDiscordClass(item, true).split('.')[0]}) `;
		}
	});

	BDFDB.notCNC = new Proxy(DiscordClasses, {
		get: function (list, item) {
			return `:not(.${BDFDB.getDiscordClass(item, true).split('.')[0]}),`;
		}
	});

	BDFDB.getDiscordClass = function (item, selector) {
		var classname = DiscordClassModules.BDFDB.BDFDBundefined;
		if (DiscordClasses[item] === undefined) {
			console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', item + ' not found in DiscordClasses');
			return classname;
		} 
		else if (!Array.isArray(DiscordClasses[item]) || DiscordClasses[item].length != 2) {
			console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', item + ' is not an Array of Length 2 in DiscordClasses');
			return classname;
		}
		else if (DiscordClassModules[DiscordClasses[item][0]] === undefined) {
			console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', DiscordClasses[item][0] + ' not found in DiscordClassModules');
			return classname;
		}
		else if (DiscordClassModules[DiscordClasses[item][0]][DiscordClasses[item][1]] === undefined) {
			console.warn(`%c[BDFDB]%c`, 'color:#3a71c1; font-weight:700;', '', DiscordClasses[item][1] + ' not found in ' + DiscordClasses[item][0] + ' in DiscordClassModules');
			return classname;
		}
		else {
			classname = DiscordClassModules[DiscordClasses[item][0]][DiscordClasses[item][1]];
			if (selector) {
				classname = classname.split(' ').filter(n => n.indexOf('da-') != 0).join(selector ? '.' : ' ');
				classname = classname ? classname : DiscordClassModules.BDFDB.BDFDBundefined;
			}
			return classname;
		}
	};

	BDFDB.getLibraryStrings = function () {
		switch (BDFDB.getDiscordLanguage().id) {
			case 'hr':
				return {
					toast_plugin_started: '{{oldversion}} je započeo.',
					toast_plugin_stopped: '{{oldversion}} zaustavljen.',
					toast_plugin_translated: 'prijevod na {{ownlang}}.',
					colorpicker_modal_header_text: 'Birač boja',
					file_navigator_text: 'Pregledajte datoteku',
					btn_add_text: 'Dodati',
					btn_cancel_text: 'Prekid',
					btn_all_text: 'Sve',
					btn_save_text: 'Uštedjeti',
					btn_ok_text: 'OK',
					search_placeholder: 'Traziti ...'
				};
			case 'da':
				return {
					toast_plugin_started: '{{oldversion}} er startet.',
					toast_plugin_stopped: '{{oldversion}} er stoppet.',
					toast_plugin_translated: 'oversat til {{ownlang}}.',
					colorpicker_modal_header_text: 'Farvevælger',
					file_navigator_text: 'Gennemse fil',
					btn_add_text: 'Tilføje',
					btn_cancel_text: 'Afbryde',
					btn_all_text: 'Alle',
					btn_save_text: 'Spare',
					btn_ok_text: 'OK',
					search_placeholder: 'Søge efter ...'
				};
			case 'de':
				return {
					toast_plugin_started: '{{oldversion}} wurde gestartet.',
					toast_plugin_stopped: '{{oldversion}} wurde gestoppt.',
					toast_plugin_translated: 'auf {{ownlang}} übersetzt.',
					colorpicker_modal_header_text: 'Farbauswahl',
					file_navigator_text: 'Datei durchsuchen',
					btn_add_text: 'Hinzufügen',
					btn_cancel_text: 'Abbrechen',
					btn_all_text: 'Alle',
					btn_save_text: 'Speichern',
					btn_ok_text: 'OK',
					search_placeholder: 'Suchen nach ...'
				};
			case 'es':
				return {
					toast_plugin_started: '{{oldversion}} se guilddiv iniciado.',
					toast_plugin_stopped: '{{oldversion}} se guilddiv detenido.',
					toast_plugin_translated: 'traducido a {{ownlang}}.',
					colorpicker_modal_header_text: 'Selector de color',
					file_navigator_text: 'Buscar archivo',
					btn_add_text: 'Añadir',
					btn_cancel_text: 'Cancelar',
					btn_all_text: 'Todo',
					btn_save_text: 'Guardar',
					btn_ok_text: 'OK',
					search_placeholder: 'Buscar ...'
				};
			case 'fr':
				return {
					toast_plugin_started: '{{oldversion}} a été démarré.',
					toast_plugin_stopped: '{{oldversion}} a été arrêté.',
					toast_plugin_translated: 'traduit en {{ownlang}}.',
					colorpicker_modal_header_text: 'Pipette à couleurs',
					file_navigator_text: 'Parcourir le fichier',
					btn_add_text: 'Ajouter',
					btn_cancel_text: 'Abandonner',
					btn_all_text: 'Tout',
					btn_save_text: 'Enregistrer',
					btn_ok_text: 'OK',
					search_placeholder: 'Rechercher ...'
				};
			case 'it':
				return {
					toast_plugin_started: '{{oldversion}} è stato avviato.',
					toast_plugin_stopped: '{{oldversion}} è stato interrotto.',
					toast_plugin_translated: 'tradotto in {{ownlang}}.',
					colorpicker_modal_header_text: 'Raccoglitore di colore',
					file_navigator_text: 'Sfoglia file',
					btn_add_text: 'Inserisci',
					btn_cancel_text: 'Cancellare',
					btn_all_text: 'Tutto',
					btn_save_text: 'Salvare',
					btn_ok_text: 'OK',
					search_placeholder: 'Cercare ...'
				};
			case 'nl':
				return {
					toast_plugin_started: '{{oldversion}} is gestart.',
					toast_plugin_stopped: '{{oldversion}} is gestopt.',
					toast_plugin_translated: 'vertaald naar {{ownlang}}.',
					colorpicker_modal_header_text: 'Kleur kiezer',
					file_navigator_text: 'Bestand zoeken',
					btn_add_text: 'Toevoegen',
					btn_cancel_text: 'Afbreken',
					btn_all_text: 'Alle',
					btn_save_text: 'Opslaan',
					btn_ok_text: 'OK',
					search_placeholder: 'Zoeken ...'
				};
			case 'no':
				return {
					toast_plugin_started: '{{oldversion}} er startet.',
					toast_plugin_stopped: '{{oldversion}} er stoppet.',
					toast_plugin_translated: 'oversatt til {{ownlang}}.',
					colorpicker_modal_header_text: 'Fargevelger',
					file_navigator_text: 'Bla gjennom fil',
					btn_add_text: 'Legg til',
					btn_cancel_text: 'Avbryte',
					btn_all_text: 'Alle',
					btn_save_text: 'Lagre',
					btn_ok_text: 'OK',
					search_placeholder: 'Søk etter ...'
				};
			case 'pl':
				return {
					toast_plugin_started: '{{oldversion}} został uruchomiony.',
					toast_plugin_stopped: '{{oldversion}} został zatrzymany.',
					toast_plugin_translated: 'przetłumaczono na {{ownlang}}.',
					colorpicker_modal_header_text: 'Narzędzie do wybierania kolorów',
					file_navigator_text: 'Przeglądać plik',
					btn_add_text: 'Dodaj',
					btn_cancel_text: 'Anuluj',
					btn_all_text: 'Wszystkie',
					btn_save_text: 'Zapisz',
					btn_ok_text: 'OK',
					search_placeholder: 'Szukać ...'
				};
			case 'pt-BR':
				return {
					toast_plugin_started: '{{oldversion}} foi iniciado.',
					toast_plugin_stopped: '{{oldversion}} foi interrompido.',
					toast_plugin_translated: 'traduzido para {{ownlang}}.',
					colorpicker_modal_header_text: 'Seletor de cores',
					file_navigator_text: 'Procurar arquivo',
					btn_add_text: 'Adicionar',
					btn_cancel_text: 'Cancelar',
					btn_all_text: 'Todo',
					btn_save_text: 'Salvar',
					btn_ok_text: 'OK',
					search_placeholder: 'Procurar por ...'
				};
			case 'fi':
				return {
					toast_plugin_started: '{{oldversion}} on käynnistetty.',
					toast_plugin_stopped: '{{oldversion}} on pysäytetty.',
					toast_plugin_translated: 'käännetty osoitteeseen {{ownlang}}.',
					colorpicker_modal_header_text: 'Värinvalitsija',
					file_navigator_text: 'Selaa tiedostoa',
					btn_add_text: 'Lisätä',
					btn_cancel_text: 'Peruuttaa',
					btn_all_text: 'Kaikki',
					btn_save_text: 'Tallentaa',
					btn_ok_text: 'OK',
					search_placeholder: 'Etsiä ...'
				};
			case 'sv':
				return {
					toast_plugin_started: '{{oldversion}} har startats.',
					toast_plugin_stopped: '{{oldversion}} har blivit stoppad.',
					toast_plugin_translated: 'översatt till {{ownlang}}.',
					colorpicker_modal_header_text: 'Färgväljare',
					file_navigator_text: 'Bläddra i fil',
					btn_add_text: 'Lägg till',
					btn_cancel_text: 'Avbryta',
					btn_all_text: 'All',
					btn_save_text: 'Spara',
					btn_ok_text: 'OK',
					search_placeholder: 'Söka efter ...'
				};
			case 'tr':
				return {
					toast_plugin_started: '{{oldversion}} başlatıldı.',
					toast_plugin_stopped: '{{oldversion}} durduruldu.',
					toast_plugin_translated: '{{ownlang}} olarak çevrildi.',
					colorpicker_modal_header_text: 'Renk seçici',
					file_navigator_text: 'Dosyaya gözat',
					btn_add_text: 'Eklemek',
					btn_cancel_text: 'Iptal',
					btn_all_text: 'Her',
					btn_save_text: 'Kayıt',
					btn_ok_text: 'Okey',
					search_placeholder: 'Aramak ...'
				};
			case 'cs':
				return {
					toast_plugin_started: '{{oldversion}} byl spuštěn.',
					toast_plugin_stopped: '{{oldversion}} byl zastaven.',
					toast_plugin_translated: 'přeložen do {{ownlang}}.',
					colorpicker_modal_header_text: 'Výběr barev',
					file_navigator_text: 'Procházet soubor',
					btn_add_text: 'Přidat',
					btn_cancel_text: 'Zrušení',
					btn_all_text: 'Vše',
					btn_save_text: 'Uložit',
					btn_ok_text: 'OK',
					search_placeholder: 'Hledat ...'
				};
			case 'bg':
				return {
					toast_plugin_started: '{{oldversion}} е стартиран.',
					toast_plugin_stopped: '{{oldversion}} е спрян.',
					toast_plugin_translated: 'преведена на {{ownlang}}.',
					colorpicker_modal_header_text: 'Избор на цвят',
					file_navigator_text: 'Прегледайте файла',
					btn_add_text: 'Добави',
					btn_cancel_text: 'Зъбести',
					btn_all_text: 'Bсичко',
					btn_save_text: 'Cпасяване',
					btn_ok_text: 'Добре',
					search_placeholder: 'Търся ...'
				};
			case 'ru':
				return {
					toast_plugin_started: '{{oldversion}} запущен.',
					toast_plugin_stopped: '{{oldversion}} остановлен.',
					toast_plugin_translated: 'переведен на {{ownlang}}.',
					colorpicker_modal_header_text: 'Выбор цвета',
					file_navigator_text: 'Просмотр файла',
					btn_add_text: 'Добавить',
					btn_cancel_text: 'Отмена',
					btn_all_text: 'Все',
					btn_save_text: 'Сохранить',
					btn_ok_text: 'ОК',
					search_placeholder: 'Искать ...'
				};
			case 'uk':
				return {
					toast_plugin_started: '{{oldversion}} було запущено.',
					toast_plugin_stopped: '{{oldversion}} було зупинено.',
					toast_plugin_translated: 'перекладено {{ownlang}}.',
					colorpicker_modal_header_text: 'Колір обкладинки',
					file_navigator_text: 'Перегляньте файл',
					btn_add_text: 'Додати',
					btn_cancel_text: 'Скасувати',
					btn_all_text: 'Все',
					btn_save_text: 'Зберегти',
					btn_ok_text: 'Добре',
					search_placeholder: 'Шукати ...'
				};
			case 'ja':
				return {
					toast_plugin_started: '{{oldversion}}が開始されました.',
					toast_plugin_stopped: '{{oldversion}}が停止しました.',
					toast_plugin_translated: 'は{{ownlang}}に翻訳されました.',
					colorpicker_modal_header_text: 'カラーピッカー',
					file_navigator_text: 'ファイルを参照',
					btn_add_text: '追加',
					btn_cancel_text: 'キャンセル',
					btn_all_text: 'すべて',
					btn_save_text: 'セーブ',
					btn_ok_text: 'はい',
					search_placeholder: '検索する ...'
				};
			case 'zh-TW':
				return {
					toast_plugin_started: '{{oldversion}}已經啟動.',
					toast_plugin_stopped: '{{oldversion}}已停止.',
					toast_plugin_translated: '翻譯為{{ownlang}}.',
					colorpicker_modal_header_text: '選色器',
					file_navigator_text: '瀏覽文件',
					btn_add_text: '加',
					btn_cancel_text: '取消',
					btn_all_text: '所有',
					btn_save_text: '保存',
					btn_ok_text: '好',
					search_placeholder: '搜索 ...'
				};
			case 'ko':
				return {
					toast_plugin_started: '{{oldversion}} 시작되었습니다.',
					toast_plugin_stopped: '{{oldversion}} 중지되었습니다.',
					toast_plugin_translated: '{{ownlang}} 로 번역되었습니다.',
					colorpicker_modal_header_text: '색상 선택 도구',
					file_navigator_text: '파일 찾아보기',
					btn_add_text: '더하다',
					btn_cancel_text: '취소',
					btn_all_text: '모든',
					btn_save_text: '저장',
					btn_ok_text: '승인',
					search_placeholder: '검색 ...'
				};
			default:
				return {
					toast_plugin_started: '{{oldversion}} has been started.',
					toast_plugin_stopped: '{{oldversion}} has been stopped.',
					toast_plugin_translated: 'translated to {{ownlang}}.',
					colorpicker_modal_header_text: 'Color Picker',
					file_navigator_text: 'Browse File',
					btn_add_text: 'Add',
					btn_cancel_text: 'Cancel',
					btn_all_text: 'All',
					btn_save_text: 'Save',
					btn_ok_text: 'OK',
					search_placeholder: 'Search for ...'
				};
		}
	};

	BDFDB.appendLocalStyle('BDFDB', `
		@import url(https://mwittrien.github.io/BetterDiscordAddons/Themes/BetterDocsBlock.css);
		
		${BDFDB.dotCN.overflowellipsis} {
			overflow: hidden;
			text-overflow: ellipsis;
		}
		
		#bd-settingspane-container .ui-form-title {
			display: inline-block;
		}
		#bd-settingspane-container ${BDFDB.dotCN._repofolderbutton} {
			position: static;
			margin-bottom: 0;
			border-radius: 5px;
			display: inline-block;
			margin-left: 10px;
		}
		#bd-settingspane-container .bd-updatebtn ~ .bd-updatebtn {
			display: none !important;
		}
		#bd-settingspane-container ${BDFDB.dotCN._repodescription} {
			white-space: pre-line !important;
		}
		${BDFDB.dotCNS.themedark + BDFDB.dotCN.popoutthemedpopout + BDFDB.notCN.messagespopoutwrap} {
			-webkit-box-shadow: 0 2px 10px 0 rgba(0,0,0,20%);
			background-color: #2f3136;
			border: 1px solid rgba(28,36,43,.6);
			box-shadow: 0 2px 10px 0 rgba(0,0,0,.2);
		}
		.BDFDB-notice {
			transition: height 0.5s ease !important;
			border-radius: 0 5px 0 0 !important;
		}
		.BDFDB-notice ${BDFDB.dotCN.noticeplatformicon} {
			margin-top: -7px;
		}
		.BDFDB-notice ${BDFDB.dotCN.noticeplatformicon} svg {
			max-height: 28px;
		}
		.hidden-by-OTB .BDFDB-notice {
			-webkit-app-region: drag !important;
		}
		#pluginNotice #outdatedPlugins span {
			-webkit-app-region: no-drag;
			color: #FFF;
			cursor: pointer;
		}
		#pluginNotice #outdatedPlugins span:hover {
			text-decoration: underline;
		}
		${BDFDB.dotCN.tooltipinner} {
			z-index: 100000000;
		}
		${BDFDB.dotCN.tooltipinner}.tooltip-customcolor ${BDFDB.dotCN.tooltippointer} {
			border-top-color: inherit !important;
		}
		.toasts {
			position: fixed;
			display: flex;
			top: 0;
			flex-direction: column;
			align-items: center;
			justify-content: flex-end;
			pointer-events: none;
			z-index: 4000;
		}
		@keyframes toast-up {
			from {
				transform: translateY(0);
				opacity: 0;
			}
		}
		.toast {
			animation: toast-up 300ms ease;
			transform: translateY(-10px);
			background-color: #36393F;
			padding: 10px;
			border-radius: 5px;
			box-shadow: 0 0 0 1px rgba(32,34,37,.6), 0 2px 10px 0 rgba(0,0,0,.2);
			font-weight: 500;
			color: #fff;
			user-select: text;
			font-size: 14px;
			opacity: 1;
			margin-top: 10px;
			pointer-events: auto;
		}
		@keyframes toast-down {
			to {
				transform: translateY(0px);
				opacity: 0;
			}
		}
		.toast.closing {
			animation: toast-down 200ms ease;
			animation-fill-mode: forwards;
			opacity: 1;
			transform: translateY(-10px);
		}
		.toast .toast-inner {
			display: flex;
			align-items: center;
		}
		.toast .toast-avatar {
			margin-right: 5px;
			width: 25px;
			height: 25px;
			background-size: cover;
			background-position: center;
			border-radius: 50%;
		}
		.toast.icon {
			padding-left: 30px;
			background-size: 20px 20px;
			background-repeat: no-repeat;
			background-position: 6px 50%;
		}
		.toast.toast-brand {
			background-color: #7289DA;
		}
		.toast.toast-brand.icon {
			background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHhtbDpzcGFjZT0icHJlc2VydmUiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiIHZpZXdCb3g9IjI3IDI3IDExNSAxMTUiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDkwIDkwOyI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMTEuMywxMjQuMWMwLDAtMy40LTQuMS02LjMtNy43YzEyLjYtMy41LDE3LjQtMTEuMywxNy40LTExLjMgYy00LDIuNi03LjcsNC40LTExLjEsNS42Yy00LjgsMi05LjUsMy4zLTE0LDQuMWMtOS4yLDEuNy0xNy42LDEuMy0yNC45LTAuMWMtNS41LTEtMTAuMi0yLjUtMTQuMS00LjFjLTIuMi0wLjgtNC42LTEuOS03LjEtMy4zIGMtMC4zLTAuMi0wLjYtMC4zLTAuOS0wLjVjLTAuMS0wLjEtMC4zLTAuMi0wLjQtMC4yYy0xLjctMS0yLjYtMS42LTIuNi0xLjZzNC42LDcuNiwxNi44LDExLjJjLTIuOSwzLjYtNi40LDcuOS02LjQsNy45IGMtMjEuMi0wLjYtMjkuMy0xNC41LTI5LjMtMTQuNWMwLTMwLjYsMTMuOC01NS40LDEzLjgtNTUuNGMxMy44LTEwLjMsMjYuOS0xMCwyNi45LTEwbDEsMS4xQzUyLjgsNTAuMyw0NSw1Ny45LDQ1LDU3LjkgczIuMS0xLjIsNS43LTIuN2MxMC4zLTQuNSwxOC40LTUuNywyMS44LTZjMC41LTAuMSwxLjEtMC4yLDEuNi0wLjJjNS45LTAuNywxMi41LTAuOSwxOS40LTAuMmM5LjEsMSwxOC45LDMuNywyOC45LDkuMSBjMCwwLTcuNS03LjItMjMuOS0xMi4xbDEuMy0xLjVjMCwwLDEzLjEtMC4zLDI2LjksMTBjMCwwLDEzLjgsMjQuOCwxMy44LDU1LjRDMTQwLjYsMTA5LjYsMTMyLjUsMTIzLjUsMTExLjMsMTI0LjF6IE0xMDEuNyw3OS43Yy01LjQsMC05LjgsNC43LTkuOCwxMC41YzAsNS44LDQuNCwxMC41LDkuOCwxMC41YzUuNCwwLDkuOC00LjcsOS44LTEwLjUgQzExMS41LDg0LjQsMTA3LjEsNzkuNywxMDEuNyw3OS43eiBNNjYuNyw3OS43Yy01LjQsMC05LjgsNC43LTkuOCwxMC41YzAsNS44LDQuNCwxMC41LDkuOCwxMC41YzUuNCwwLDkuOC00LjcsOS44LTEwLjUgQzc2LjUsODQuNCw3Mi4xLDc5LjcsNjYuNyw3OS43eiIvPjwvc3ZnPg==);
		}
		.toast.toast-danger, 
		.toast.toast-error {
			background-color: #F04747;
		}
		.toast.toast-danger.icon,
		.toast.toast-error.icon {
			background-image: url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkZGRkZGIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTEyIDJDNi40NyAyIDIgNi40NyAyIDEyczQuNDcgMTAgMTAgMTAgMTAtNC40NyAxMC0xMFMxNy41MyAyIDEyIDJ6bTUgMTMuNTlMMTUuNTkgMTcgMTIgMTMuNDEgOC40MSAxNyA3IDE1LjU5IDEwLjU5IDEyIDcgOC40MSA4LjQxIDcgMTIgMTAuNTkgMTUuNTkgNyAxNyA4LjQxIDEzLjQxIDEyIDE3IDE1LjU5eiIvPiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PC9zdmc+);
		}
		.toast.toast-default {
			background-color: #F26522;
		}
		.toast.toast-default.icon {
			padding-left: 10px;
		}
		.toast.toast-facebook {
			background-color: #355089;
		}
		.toast.toast-facebook.icon {
			background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiIHZpZXdCb3g9Ii01IC01IDEwMCAxMDAiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDkwIDkwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PGc+PHBhdGggaWQ9IkZhY2Vib29rX194MjhfYWx0X3gyOV8iIGQ9Ik05MCwxNS4wMDFDOTAsNy4xMTksODIuODg0LDAsNzUsMEgxNUM3LjExNiwwLDAsNy4xMTksMCwxNS4wMDF2NTkuOTk4ICAgQzAsODIuODgxLDcuMTE2LDkwLDE1LjAwMSw5MEg0NVY1NkgzNFY0MWgxMXYtNS44NDRDNDUsMjUuMDc3LDUyLjU2OCwxNiw2MS44NzUsMTZINzR2MTVINjEuODc1QzYwLjU0OCwzMSw1OSwzMi42MTEsNTksMzUuMDI0VjQxICAgaDE1djE1SDU5djM0aDE2YzcuODg0LDAsMTUtNy4xMTksMTUtMTUuMDAxVjE1LjAwMXoiIGZpbGw9IndoaXRlIi8+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjwvc3ZnPg==);
		}
		.toast.toast-info {
			background-color: #4A90E2;
		}
		.toast.toast-info.icon {
			background-image: url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkZGRkZGIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPiAgICA8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMSAxNWgtMnYtNmgydjZ6bTAtOGgtMlY3aDJ2MnoiLz48L3N2Zz4=);
		}
		.toast.toast-premium {
			background-color: #202225;
		}
		.toast.toast-premium.icon {
			background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDMiIGhlaWdodD0iMjYiPiAgPHBhdGggZmlsbD0iI0ZGRiIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNOTYuMjgyNiA4LjYwMjc4ODI0bC0xLjIxNTUgOC4zOTAzNTI5NmMtLjI3NzUgMS45ODI2Mjc0LTIuNDY1NSAyLjkwMzMzMzMtNC40NzkgMi45MDMzMzMzLTEuODc1IDAtMy43MTU1LS45MjA3MDU5LTMuNDcyNS0yLjcyNTkyMTZsMS4yMTU1LTguNTY3NzY0NjZjLjI3NzUtMS44NzY1ODgyNCAyLjQ2NTUtMi44MzI0NzA2IDQuNDc5LTIuODMyNDcwNiAyLjAxNCAwIDMuNzUuOTU1ODgyMzYgMy40NzI1IDIuODMyNDcwNk05My43NzIxLjAwMzkyNTVsLjAwMDUtLjAwNDA3ODQ0aC0xMy4wODRjLS4zMzQgMC0uNjE4LjI1MDMxMzcyLS42NjYuNTg3Mjk0MTJsLS42MzY1IDQuNDMyMjM1M2MtLjA1OTUuNDE0NDcwNTguMjU2Ljc4NjExNzY0LjY2NjUuNzg2MTE3NjRoMi4zODk1Yy4yNCAwIC40MDQ1LjI0OTgwMzkyLjMxLjQ3NTY0NzA2LS4yOTguNzEyMTk2MDctLjUxNTUgMS40ODYwNzg0My0uNjM2IDIuMzIxNjQ3MDZsLTEuMjE1NSA4LjU2Nzc2NDY2Yy0uNzk5IDUuNzM1Mjk0MiAzLjg4OSA4LjYwMjQzMTQgOC45OTMgOC42MDI0MzE0IDUuMzQ3NSAwIDEwLjU5MDUtMi44NjcxMzcyIDExLjM4OS04LjYwMjQzMTRsMS4yMTUtOC41Njc3NjQ2NmMuNzgzLTUuNjIyMTE3NjUtMy43Mzk1LTguNDg4MjM1My04LjcyNTUtOC41OTg4NjI3NW0tNzguNTk1MjUgMTEuNzI4NjUxbC4wNjcgNC4xNTg5ODA0Yy4wMDE1LjA4NTEzNzItLjA1NS4xNjA1ODgyLS4xMzYuMTgxNDkwMmgtLjAwMDVsLTEuMzg1NS01LjAxNjQ3MDZjLS4wMDItLjAwNzY0NzEtLjAwNS0uMDE0Nzg0My0uMDA4LS4wMjI0MzE0TDkuNDE0MzUuNzcwNzcyNTNjLS4xMDYtLjI1Mjg2Mjc1LS4zNDk1LS40MTY1MDk4LS42MTk1LS40MTY1MDk4aC00Ljg3MjVjLS4zMzYgMC0uNjIwNS4yNTIzNTI5NC0uNjY3LjU5MTM3MjU0TC4wMDY4NSAyNC42MzcyNDMxYy0uMDU3LjQxMzQ1MS4yNTc1Ljc4MjAzOTMuNjY2NS43ODIwMzkzaDQuODU0Yy4zMzY1IDAgLjYyMTUtLjI1MzM3MjYuNjY3NS0uNTkyOTAybDEuMjcyLTkuNDEyNTA5OGMuMDAxNS0uMDA5MTc2NS4wMDItLjAxODM1My4wMDItLjAyNzUyOTRsLS4wNjk1LTQuODM2NTA5OC4xMzg1LS4wMzUxNzY1IDEuNDU1NSA1LjAxNjQ3MDZjLjAwMjUuMDA3MTM3Mi4wMDUuMDEzNzY0Ny4wMDc1LjAyMDkwMmw0LjAyMTUgOS40NTM4MDM5Yy4xMDY1LjI1MDgyMzUuMzQ5NS40MTM0NTEuNjE3NS40MTM0NTFoNS4yNTY1Yy4zMzYgMCAuNjIwNS0uMjUyMzUzLjY2Ny0uNTkxODgyNGwzLjI0OTUtMjMuNjkxNjA3ODRjLjA1NjUtLjQxMjk0MTE4LS4yNTgtLjc4MTUyOTQyLS42NjctLjc4MTUyOTQyaC00LjgyMDVjLS4zMzYgMC0uNjIwNS4yNTE4NDMxNC0uNjY3LjU5MDg2Mjc1bC0xLjQ4IDEwLjc1ODkwMmMtLjAwMS4wMDkxNzY0LS4wMDE1LjAxODg2MjctLjAwMTUuMDI4NTQ5bTkuMzk0IDEzLjY4NjYwMzloNC44NTVjLjMzNiAwIC42MjA1LS4yNTIzNTI5LjY2Ny0uNTkxMzcyNmwzLjI0OS0yMy42OTIxMTc2Yy4wNTY1LS40MTI5NDEyLS4yNTgtLjc4MTUyOTQ0LS42NjctLjc4MTUyOTQ0aC00Ljg1NWMtLjMzNiAwLS42MjA1LjI1MjM1Mjk0LS42NjcuNTkxMzcyNTVsLTMuMjQ5IDIzLjY5MjExNzY4Yy0uMDU2NS40MTI5NDEyLjI1OC43ODE1Mjk0LjY2Ny43ODE1Mjk0TTM2LjYyMTE1LjkwNjA3NDVsLS42MzYgNC40MzIyMzUzYy0uMDU5NS40MTQ0NzA2LjI1NTUuNzg2MTE3NjUuNjY2Ljc4NjExNzY1aDUuMDgwNWMuNDA4NSAwIC43MjMuMzY3NTY4NjMuNjY3NS43ODA1MDk4bC0yLjM5MzUgMTcuNzM0MDM5MjVjLS4wNTU1LjQxMjQzMTMuMjU4NS43OC42NjcuNzhoNC45MjU1Yy4zMzY1IDAgLjYyMS0uMjUyODYyOC42NjctLjU5MjkwMmwyLjQ0NC0xOC4xMDg3NDUxYy4wNDYtLjMzOTUyOTQuMzMwNS0uNTkyOTAxOTUuNjY3LS41OTI5MDE5NWg1LjQ2MjVjLjMzNCAwIC42MTgtLjI0OTgwMzkyLjY2Ni0uNTg3Mjk0MTJsLjYzNy00LjQzMjIzNTNjLjA1OTUtLjQxNDQ3MDU4LS4yNTU1LS43ODYxMTc2NC0uNjY2NS0uNzg2MTE3NjRoLTE4LjE4NzVjLS4zMzQ1IDAtLjYxOC4yNTAzMTM3LS42NjY1LjU4NzI5NDFNNzEuMDM4NyA5LjA5ODM2ODZjLS4xNzQgMS40NTE0MTE3Ny0xLjI4NDUgMi45MDI4MjM1Ny0zLjE5NSAyLjkwMjgyMzU3aC0yLjg2OTVjLS40MSAwLS43MjQ1LS4zNjk2MDc5LS42NjctLjc4MzA1ODlsLjYwNzUtNC4zNjE4ODIzM2MuMDQ3LS4zMzg1MDk4LjMzMTUtLjU5MDM1Mjk0LjY2Ny0uNTkwMzUyOTRoMy4wNjFjMS44NDA1IDAgMi41Njk1IDEuMzEwMTk2MDggMi4zOTYgMi44MzI0NzA2TTY5LjMzNzIuMzU0MjExNzZoLTkuMjQwNWMtLjMzNiAwLS42MjA1LjI1MjM1Mjk0LS42NjcuNTkxMzcyNTRsLTMuMjQ5IDIzLjY5MjExNzdjLS4wNTY1LjQxMjk0MTEuMjU4Ljc4MTUyOTQuNjY3Ljc4MTUyOTRoNC45MjM1Yy4zMzY1IDAgLjYyMTUtLjI1MzM3MjYuNjY3NS0uNTkyOTAybC45NTYtNy4wNzY1ODgyYy4wMjMtLjE2OTc2NDcuMTY1LS4yOTYxOTYxLjMzMzUtLjI5NjE5NjFoLjYzM2MuMTE0NSAwIC4yMjE1LjA1OTY0NzEuMjgzNS4xNTgwMzkybDQuNzAyIDcuNDkxMDU4OGMuMTI0LjE5NzI5NDIuMzM3NS4zMTY1ODgzLjU2NzUuMzE2NTg4M2g2LjA4MWMuNTQ1IDAgLjg2NDUtLjYyNTAxOTYuNTUyLTEuMDgwMjc0NWwtNC45MzQ1LTcuMTkxODA0Yy0uMTE4LS4xNzI4MjM1LS4wNTc1LS40MTI0MzEzLjEyOC0uNTA0NzA1OCAzLjE1MDUtMS41Njk2ODYzIDQuOTc5NS0zLjE3ODExNzcgNS41ODMtNy42NTAxMTc3LjY5MzUtNS44NzcwMTk2LTIuOTE3LTguNjM4MTE3NjMtNy45ODY1LTguNjM4MTE3NjMiLz48L3N2Zz4=);
			background-size: 63px 16px;
			padding-left: 73px;
		}
		.toast.toast-spotify {
			background-color: #1DB954;
		}
		.toast.toast-spotify.icon {
			background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUwOC41MiA1MDguNTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUwOC41MiA1MDguNTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4Ij4KPGc+Cgk8Zz4KCQk8Zz4KCQkJPHBhdGggZD0iTTI1NC4yNiwwQzExMy44NDUsMCwwLDExMy44NDUsMCwyNTQuMjZzMTEzLjg0NSwyNTQuMjYsMjU0LjI2LDI1NC4yNiAgICAgczI1NC4yNi0xMTMuODQ1LDI1NC4yNi0yNTQuMjZTMzk0LjY3NSwwLDI1NC4yNiwweiBNMzcxLjY5Niw0MDMuMjg4Yy0zLjE3OCw1LjgxNi05LjEyMiw5LjA1OC0xNS4yODcsOS4wNTggICAgIGMtMi44NiwwLTUuNzIxLTAuNjY3LTguNDIyLTIuMTI5Yy00MC43MTMtMjIuNDM4LTg2Ljk1Ny0zNC4yOTMtMTMzLjY3Ny0zNC4yOTNjLTI4LDAtNTUuNjUxLDQuMTYzLTgyLjEyNiwxMi4zNjMgICAgIGMtOS4yMTcsMi44Ni0xOS4wMDYtMi4yODgtMjEuODM1LTExLjUzN2MtMi44Ni05LjE4NSwyLjI4OC0yOC43LDExLjUzNy0zMS41OTJjMjkuODQ0LTkuMjQ5LDYwLjk1OS0xMy45MjEsOTIuNDU1LTEzLjkyMSAgICAgYzUyLjU2OCwwLDEwNC42NiwxMy4zNDksMTUwLjUyMiwzOC42MTZDMzczLjMxNywzNzQuNDYxLDM3Ni40LDM5NC44NjYsMzcxLjY5Niw0MDMuMjg4eiBNNDA0LjAxOSwzMDcuNTI3ICAgICBjLTMuNjIzLDcuMDI0LTEwLjc0MiwxOC4zMzgtMTguMDg0LDE4LjMzOGMtMy4yMSwwLTYuMzg4LTAuNjk5LTkuMzc2LTIuMzJjLTUwLjQ3MS0yNi4xODktMTA1LjA0MS0zOS40NzQtMTYyLjIxOC0zOS40NzQgICAgIGMtMzEuNDk2LDAtNjIuNzcsNC4xMzItOTIuOTY0LDEyLjQ1OWMtMTAuOTAxLDIuOTU2LTIyLjA4OS0zLjQwMS0yNS4wNDUtMTQuMzAyYy0yLjkyNC0xMC45MDEsMy40NjQtMjkuNDMxLDE0LjMzNC0zMi4zODYgICAgIGMzMy42ODktOS4xODUsNjguNTg3LTEzLjg1NywxMDMuNjc0LTEzLjg1N2M2Mi44OTgsMCwxMjUuNDQ1LDE1LjI1NiwxODAuOTM4LDQ0LjExNCAgICAgQzQwNS4yOSwyODUuMjQ4LDQwOS4xOTksMjk3LjUxNiw0MDQuMDE5LDMwNy41Mjd6IE00MTcuNTI2LDIzMC44MzZjLTMuNDY0LDAtNy4wMjQtMC43OTUtMTAuMzYxLTIuNDQ3ICAgICBjLTYwLjIyOC0zMC4wMzQtMTI1LjA5Ni00NS4yMjYtMTkyLjc2MS00NS4yMjZjLTM1LjI3OSwwLTcwLjQzLDQuMjkxLTEwNC41MzMsMTIuNzEzYy0xMi41MjIsMy4wODMtMjUuMTQtNC41MTMtMjguMjIzLTE3LjAwNCAgICAgYy0zLjExNS0xMi40NTksNC41MTMtMjcuNTU1LDE3LjAwNC0zMC42MzhjMzcuNzI2LTkuMzc2LDc2LjY1OS0xNC4xMTEsMTE1LjcyLTE0LjExMWM3NC45NzUsMCwxNDYuODY3LDE2Ljg3NywyMTMuNTc4LDUwLjEyMSAgICAgYzExLjUzNyw1Ljc1MywxNi4yNDEsMTkuNzM3LDEwLjQ4OCwzMS4yNDJDNDM0LjMwOCwyMjMuNjUzLDQyNi4xMDgsMjMwLjgzNiw0MTcuNTI2LDIzMC44MzZ6IiBmaWxsPSIjRkZGRkZGIi8+CgkJPC9nPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=);
		}
		.toast.toast-streamermode {
			background-color: #593695;
		}
		.toast.toast-streamermode.icon {
			background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSItMjUgLTI1IDU0MiA1NDIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQ5MiA0OTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPjxwYXRoIGQ9Ik00ODguMywxNDIuNXYyMDMuMWMwLDE1LjctMTcsMjUuNS0zMC42LDE3LjdsLTg0LjYtNDguOHYxMy45YzAsNDEuOC0zMy45LDc1LjctNzUuNyw3NS43SDc1LjdDMzMuOSw0MDQuMSwwLDM3MC4yLDAsMzI4LjQgICBWMTU5LjljMC00MS44LDMzLjktNzUuNyw3NS43LTc1LjdoMjIxLjhjNDEuOCwwLDc1LjcsMzMuOSw3NS43LDc1Ljd2MTMuOWw4NC42LTQ4LjhDNDcxLjMsMTE3LDQ4OC4zLDEyNi45LDQ4OC4zLDE0Mi41eiIgZmlsbD0iI0ZGRkZGRiIvPjwvc3ZnPg==);
		}
		.toast.toast-success {
			background-color: #43B581;
		}
		.toast.toast-success.icon {
			background-image: url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkZGRkZGIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPiAgICA8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTIgMTVsLTUtNSAxLjQxLTEuNDFMMTAgMTQuMTdsNy41OS03LjU5TDE5IDhsLTkgOXoiLz48L3N2Zz4=);
		}

		.toast.toast-warning,
		.toast.toast-warn {
			background-color: #FFA600;
		}
		.toast.toast-warning.icon,
		.toast.toast-warn.icon {
			background-image: url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkZGRkZGIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPiAgICA8cGF0aCBkPSJNMSAyMWgyMkwxMiAyIDEgMjF6bTEyLTNoLTJ2LTJoMnYyem0wLTRoLTJ2LTRoMnY0eiIvPjwvc3ZnPg==);
		}
		.quickSelectPopout {
			min-width: 210px !important;
			position: relative !important;
			width: auto !important;
		}
		.BDFDB-modal ${BDFDB.dotCN.modalsizelarge} {
			max-height: 80vh;
		}
		.BDFDB-modal ${BDFDB.dotCN.title + BDFDB.notCN.cursorpointer},
		.BDFDB-settings ${BDFDB.dotCN.title + BDFDB.notCN.cursorpointer} {
			cursor: default !important;
		}
		.BDFDB-settings .BDFDB-settings-inner {
			padding-left: 15px;
			padding-right: 5px;
		}
		.BDFDB-settings .BDFDB-settings-inner-list {
			padding-left: 15px;
		}
		.inputNumberWrapper .numberinput-buttons-zone:hover + ${BDFDB.dotCN.input} {
			border-color: black;
		}
		.inputNumberWrapper .numberinput-buttons-zone:hover + ${BDFDB.dotCN.input}:focus,
		.inputNumberWrapper .numberinput-buttons-zone.pressed + ${BDFDB.dotCN.input} {
			border-color: #7289da;
		}
		.inputNumberWrapper {
			position: relative !important;
		}
		.inputNumberWrapper ${BDFDB.dotCN.input}[type=number] {
			padding-right: 25px;
		}
		.inputNumberWrapper.inputNumberWrapperMini ${BDFDB.dotCN.input}[type=number] {
			padding-left: 6px;
			padding-right: 17px;
		}
		.inputNumberWrapper ${BDFDB.dotCN.input}[type=number]::-webkit-inner-spin-button, 
		.inputNumberWrapper ${BDFDB.dotCN.input}[type=number]::-webkit-outer-spin-button{
			-webkit-appearance: none;
		}
		.inputNumberWrapper .numberinput-buttons-zone {
			cursor: pointer;
			position: absolute;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: space-around;
			height: 110%;
			right: 8px;
			top: -5%;
		}
		.inputNumberWrapper.inputNumberWrapperMini .numberinput-buttons-zone {
			right: 4px;
		}
		.inputNumberWrapper .numberinput-button-up {
			border-color: transparent transparent #999 transparent;
			border-style: solid;
			border-width: 2.5px 5px 5px 5px;
			display: inline-block;
		}
		.inputNumberWrapper .numberinput-button-up:hover {
			border-bottom-color: #666;
		}
		${BDFDB.dotCN.themelight} .inputNumberWrapper .numberinput-button-up {
			border-bottom-color: #dcddde;
		}
		${BDFDB.dotCN.themelight} .inputNumberWrapper .numberinput-button-up:hover {
			border-bottom-color: #4f545c;
		}
		${BDFDB.dotCN.themedark} .inputNumberWrapper .numberinput-button-up {
			border-bottom-color: #72767d;
		}
		${BDFDB.dotCN.themedark} .inputNumberWrapper .numberinput-button-up:hover {
			border-bottom-color: #f6f6f7;
		}
		.inputNumberWrapper .numberinput-button-down {
			border-color: #999 transparent transparent transparent;
			border-style: solid;
			border-width: 5px 5px 2.5px 5px;
			display: inline-block;
		}
		.inputNumberWrapper .numberinput-button-down:hover {
			border-top-color: #666;
		}
		${BDFDB.dotCN.themelight} .inputNumberWrapper .numberinput-button-down {
			border-top-color: #dcddde;
		}
		${BDFDB.dotCN.themelight} .inputNumberWrapper .numberinput-button-down:hover {
			border-top-color: #4f545c;
		}
		${BDFDB.dotCN.themedark} .inputNumberWrapper .numberinput-button-down {
			border-top-color: #72767d;
		}
		${BDFDB.dotCN.themedark} .inputNumberWrapper .numberinput-button-down:hover {
			border-top-color: #f6f6f7;
		}
		.BDFDB-select ${BDFDB.dotCN.select} {
			position: relative;
			box-sizing: border-box;
		}
		.BDFDB-select ${BDFDB.dotCN.selectcontrol} {
			-webkit-box-align: center;
			align-items: center;
			display: flex;
			flex-wrap: wrap;
			-webkit-box-pack: justify;
			justify-content: space-between;
			min-height: 40px;
			position: relative;
			box-sizing: border-box;
			border-radius: 3px;
			border-style: solid;
			border-width: 1px;
			transition: border 0.15s ease 0s;
			outline: 0px !important;
		}
		.BDFDB-select ${BDFDB.dotCN.selectcontrollight} {
			background-color: rgba(79, 84, 92, 0.02);
			background-color: rgba(79, 84, 92, 0.02);
		}
		.BDFDB-select ${BDFDB.dotCN.selectcontroldark} {
			background-color: rgba(0, 0, 0, 0.1);
			border-color: rgba(0, 0, 0, 0.3);
		}
		.BDFDB-select ${BDFDB.dotCN.selectvalue} {
			-webkit-box-align: center;
			align-items: center;
			display: flex;
			flex-wrap: wrap;
			position: relative;
			box-sizing: border-box;
			flex: 1 1 0%;
			padding: 2px 8px;
			overflow: hidden;
		}
		.BDFDB-select ${BDFDB.dotCN.selectsingle} {
			margin-left: 2px;
			margin-right: 2px;
			max-width: calc(100% - 8px);
			width: calc(100% - 8px);
			position: absolute;
			text-overflow: ellipsis;
			white-space: nowrap;
			top: 50%;
			transform: translateY(-50%);
			box-sizing: border-box;
			opacity: 1;
			overflow: hidden;
		}
		.BDFDB-select ${BDFDB.dotCN.selectsinglelight} {
			color: rgb(32, 34, 37);
		}
		.BDFDB-select ${BDFDB.dotCN.selectsingledark} {
			color: rgb(246, 246, 247);
		}
		.BDFDB-select ${BDFDB.dotCN.selectdummyinput} {
			font-size: inherit;
			width: 1px;
			color: transparent;
			left: -100px;
			opacity: 0;
			position: relative;
			transform: scale(0);
			background: 0px center;
			border-width: 0px;
			border-style: initial;
			border-color: initial;
			border-image: initial;
			outline: 0px;
			padding: 0px;
		}
		.BDFDB-select ${BDFDB.dotCN.selectarrowzone} {
			-webkit-box-align: center;
			align-items: center;
			align-self: stretch;
			display: flex;
			flex-shrink: 0;
			box-sizing: border-box;
		}
		.BDFDB-select ${BDFDB.dotCN.selectarrowcontainer} {
			display: flex;
			box-sizing: border-box;
			cursor: pointer;
			opacity: 0.3;
			padding: 8px 8px 8px 0px;
			transition: color 150ms ease 0s;
		}
		.BDFDB-select ${BDFDB.dotCN.selectarrowcontainerlight} {
			color: rgb(32, 34, 37);
		}
		.BDFDB-select ${BDFDB.dotCN.selectarrowcontainerdark} {
			color: rgb(246, 246, 247);
		}
		.BDFDB-select ${BDFDB.dotCN.selectarrow} {
			display: inline-block;
			fill: currentcolor;
			line-height: 1;
			stroke: currentcolor;
			stroke-width: 0;
		}
		.BDFDB-select ${BDFDB.dotCN.selectmenuouter} {
			top: 100%;
			margin-bottom: -1px;
			margin-top: -1px;
			position: absolute;
			width: 100%;
			z-index: 100;
			box-sizing: border-box;
			border-radius: 0px 0px 3px 3px;
			border-width: 1px;
			border-style: solid;
			border-image: initial;
		}
		.BDFDB-select ${BDFDB.dotCN.selectmenuouterlight} {
			background-color: rgb(255, 255, 255);
			border-color: rgb(185, 187, 190);
			color: rgb(32, 34, 37);
		}
		.BDFDB-select ${BDFDB.dotCN.selectmenuouterdark} {
			background-color: rgb(47, 49, 54);
			border-color: rgb(32, 34, 37);
			color: rgb(246, 246, 247);
		}
		.BDFDB-select ${BDFDB.dotCN.selectmenu} {
			max-height: 300px;
			overflow-y: auto;
			position: relative;
			box-sizing: border-box;
			padding: 0px;
		}
		.BDFDB-select ${BDFDB.dotCN.selectmenu}::-webkit-scrollbar {
			width: 8px;
		}
		.BDFDB-select ${BDFDB.dotCN.selectmenu}::-webkit-scrollbar-thumb {
			background-color: rgba(0, 0, 0, 0.4);
			background-clip: padding-box;
			border-color: transparent;
			border-radius: 4px;
		}
		.BDFDB-select ${BDFDB.dotCN.selectmenu}::-webkit-scrollbar-track-piece {
			background-color: transparent;
			border-color: transparent;
		}
		.BDFDB-select ${BDFDB.dotCN.selectoption} {
			cursor: pointer;
			display: flex;
			font-size: inherit;
			width: 100%;
			user-select: none;
			-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
			box-sizing: border-box;
			-webkit-box-align: center;
			align-items: center;
			min-height: 40px;
			padding: 8px 12px;
		}
		.BDFDB-select ${BDFDB.dotCN.selectoptionlight} {
			background-color: transparent;
			color: rgb(32, 34, 37);
		}
		.BDFDB-select ${BDFDB.dotCN.selectoptiondark} {
			background-color: transparent;
			color: rgb(246, 246, 247);
		}
		.BDFDB-select ${BDFDB.dotCN.selectoptionhoverlight} {
			background-color: rgb(246, 246, 247);
			color: rgb(32, 34, 37);
		}
		.BDFDB-select ${BDFDB.dotCN.selectoptionhoverdark} {
			background-color: rgba(0, 0, 0, 0.1);
			color: rgb(246, 246, 247);
		}
		.BDFDB-select ${BDFDB.dotCN.selectoptionselectlight} {
			background-color: rgb(220, 221, 222);
			color: rgb(32, 34, 37);
		}
		.BDFDB-select ${BDFDB.dotCN.selectoptionselectdark} {
			background-color: rgba(0, 0, 0, 0.2);
			color: rgb(246, 246, 247);
		}
		.BDFDB-settings ${BDFDB.dotCN.hovercard},
		.BDFDB-settings ${BDFDB.dotCNS.hovercard + BDFDB.dotCN.hovercardinner} {
			width: 550px;
			min-height: 28px;
		}
		.BDFDB-settingsmodal .BDFDB-settings {
			margin-bottom: 20px;
		}
		.BDFDB-settingsmodal .BDFDB-settings ${BDFDB.dotCN.hovercard},
		.BDFDB-settingsmodal .BDFDB-settings ${BDFDB.dotCNS.hovercard + BDFDB.dotCN.hovercardinner} {
			width: 520px;
		}
		.BDFDB-settings ${BDFDB.dotCN.hovercard}:before {
			z-index: 50;
			left: -10px;
		}
		.BDFDB-settings ${BDFDB.dotCNS.hovercard + BDFDB.dotCN.hovercardinner} {
			overflow: hidden;
			display: flex;
			align-items: center;
			position: relative;
			z-index: 100;
		}
		.BDFDB-settings ${BDFDB.dotCNS.hovercard + BDFDB.dotCN.hovercardbutton} {
			opacity: 0;
			position: absolute;
			right: -31px;
			top: -12px;
			z-index: 200;
		}		
		.BDFDB-settings ${BDFDB.dotCN.hovercard}:hover ${BDFDB.dotCN.hovercardbutton} {
			opacity: 1;
		}		
		.BDFDB-modal ${BDFDB.dotCN.checkboxcontainer},
		.BDFDB-settings ${BDFDB.dotCN.checkboxcontainer} {
			margin-left: 10px;
		}		
		.BDFDB-modal ${BDFDB.dotCN.checkboxcontainer}:before,
		.BDFDB-settings ${BDFDB.dotCN.checkboxcontainer}:before {
			display: none;
		}	
		.BDFDB-modal .swatches.disabled {
			cursor: no-drop;
			filter: grayscale(70%) brightness(50%);
		}
		.BDFDB-modal .swatches .ui-color-picker-row {
			display: flex !important; 
			flex-wrap: wrap !important; 
			overflow: visible !important;
			min-width: 482px !important;
		}
		.BDFDB-modal .swatches .ui-color-picker-swatch {
			box-sizing: border-box;
			cursor: pointer;
			min-width: 30px;
			min-height: 30px;
			margin-bottom: 5px;
			margin-top: 5px;
			border: 4px solid transparent;
			border-radius: 12px;
		}		
		.BDFDB-modal .swatches.disabled .ui-color-picker-swatch {
			cursor: no-drop;
		}
		.BDFDB-modal .swatches .ui-color-picker-swatch.large {
			min-width: 70px;
			min-height: 70px;
			border-radius: 25px;
		}
		.BDFDB-modal .swatches .ui-color-picker-swatch.nocolor {
			border-color: red;
			background: url('data:image/svg+xml; utf8, <svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 l 22 22 M 22 0 l -22 22" stroke="red" stroke-width="3"/></svg>') center/contain;
		}
		.BDFDB-modal .swatches .ui-color-picker-swatch.nocolor.selected {
			border-color: black;
		}
		.BDFDB-modal .swatches .color-picker-dropper {
			position: relative;
			left: 40px;
			top: 10px;
		}
		.BDFDB-modal ${BDFDB.dotCN.inputdefault}.valid {
			background-color: rgba(67,181,129,.5);
		}
		.BDFDB-modal ${BDFDB.dotCN.inputdefault}.valid:hover {
			border-color: rgb(27,141,89);
		}
		.BDFDB-modal ${BDFDB.dotCN.inputdefault}.valid:focus {
			border-color: rgb(67,181,129);
		}
		.BDFDB-modal ${BDFDB.dotCN.inputdefault}.valid::placeholder {
			color: rgba(67,181,129,.7);
		}
		.BDFDB-modal ${BDFDB.dotCN.inputdefault}.invalid {
			background-color: rgba(241,71,71,.5);
		}
		.BDFDB-modal ${BDFDB.dotCN.inputdefault}.invalid:hover {
			border-color: rgb(201,31,31);
		}
		.BDFDB-modal ${BDFDB.dotCN.inputdefault}.invalid:focus {
			border-color: rgb(241,71,71);
		}
		.BDFDB-modal ${BDFDB.dotCN.inputdefault}.invalid::placeholder {
			color: rgba(241,71,71,.7);
		}
		.BDFDB-modal ${BDFDB.dotCN.inputdefault}:disabled {
			color: #555555;
			cursor: no-drop;
			background-color: rgba(0,0,0,.5);
		}
		.BDFDB-modal ${BDFDB.dotCN.tabbarcontainer} {
			border: none !important;
			background: rgba(0,0,0,.1);
			box-shadow: 0 2px 3px 0 rgba(0,0,0,.05);
		}
		${BDFDB.dotCN.themedark} .BDFDB-modal ${BDFDB.dotCN.tabbarcontainer} {
			background: rgba(0,0,0,.2);
			box-shadow: 0 2px 3px 0 rgba(0,0,0,.1);
		}
		.BDFDB-modal .tab-content:not(.open) {
			display: none;
		}
		.colorpicker-modal .colorpicker-container {
			padding: 10px 10px 10px 30px;
			overflow: hidden;
			display: initial;
			margin: auto;
		}
		.colorpicker-modal .colorpicker-color,
		.colorpicker-modal .colorpicker-slider,
		.colorpicker-modal .colorpicker-controls {
			float: left;
			margin-right: 20px;
		}
		.colorpicker-modal .colorpicker-inputs {
			text-align: center;
			width: 150px;
			padding: 3px 3px 3px 10px;
			margin-top: 87px;
		}
		.colorpicker-modal .colorpicker-pickerpane, 
		.colorpicker-modal .colorpicker-black, 
		.colorpicker-modal .colorpicker-white, 
		.colorpicker-modal .colorpicker-color {
			position: relative;
			top: 0px;
			left: 0px;
			height: 308px;
			width: 308px;
		}
		.colorpicker-modal .colorpicker-pickercursor {
			position: absolute;
			height: 14px;
			width: 14px;
		}
		.colorpicker-modal .colorpicker-pickercursor svg {
			position: relative;
			height: 14px;
			width: 14px;
		}
		.colorpicker-modal .colorpicker-sliderpane, 
		.colorpicker-modal .colorpicker-slider {
			position: relative;
			top: 0px;
			left: 0px;
			height: 308px;
			width: 20px;
		}
		.colorpicker-modal .colorpicker-slidercursor {
			position: absolute;
			left: -6px;
			height: 12px;
			width: 32px;
		}
		.colorpicker-modal .colorpicker-slidercursor svg {
			position: relative;
			height: 12px;
			width: 32px;
		}	
		.colorpicker-modal [class^="colorpicker-preview-"] {
			background-color: #808080;
			border: 3px solid transparent;
			height: 65px;
			width: 80px;
			float: left;
		}
		.colorpicker-modal .colorpicker-preview-0 {
			border-radius: 5px 0 0 5px;
			border-right: none;
		}
		.colorpicker-modal .colorpicker-preview-2 {
			border-radius: 0 5px 5px 0;
			border-left: none;
		}`);
		
	BDFDB.addEventListener(BDFDB, document, 'click.BDFDBPluginClick', '.bd-settingswrap .bd-refresh-button, .bd-settingswrap .bd-switch-checkbox', () => {
		BDFDB.setPluginCache();
		BDFDB.setThemeCache();
	});
	var keydowntimeouts = {};
	BDFDB.addEventListener(BDFDB, document, 'keydown.BDFDBPressedKeys', e => {
		if (!BDFDB.pressedKeys.includes(e.which)) {
			clearTimeout(keydowntimeouts[e.which]);
			BDFDB.pressedKeys.push(e.which);
			keydowntimeouts[e.which] = setTimeout(() => {BDFDB.removeFromArray(BDFDB.pressedKeys, e.which, true);},60000);
		}
	});
	BDFDB.addEventListener(BDFDB, document, 'keyup.BDFDBPressedKeys', e => {
		BDFDB.removeFromArray(BDFDB.pressedKeys, e.which, true);
	});
	BDFDB.addEventListener(BDFDB, document, 'mousedown.BDFDBMousePosition', e => {
		BDFDB.mousePosition = e;
	});
		
	BDFDB.patchModules = {
		V2C_List: 'componentDidMount',
		V2C_PluginCard: ['componentDidMount','componentDidUpdate'],
		V2C_ThemeCard: ['componentDidMount','componentDidUpdate'],
		UserPopout: ['componentDidMount'],
		UserProfile: ['componentDidMount'],
		Message: ['componentDidMount','componentDidUpdate','render'],
		MessageOptionPopout: 'componentDidMount'
	};
	BDFDB.WebModules.unpatchall(BDFDB);
	var BDFDBpatches = {};
	
	BDFDB.WebModules.patch(BDFDB.WebModules.findByProperties('getGuilds', 'getGuild'), 'getGuild', BDFDB, {after:e => {
		if (e.returnValue && e.methodArguments[0] == '410787888507256842' && !e.returnValue.banner) {
			e.returnValue.banner = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABkAAAAMgCAIAAAD0ojkNAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAAcFtJREFUeNrs/Xm8JldBJ/7XqXq2u/a+Zukk3ensG0kISxIWJwgBESGADOogouDoqDCiKLJ8BREXRMVhBv0hg8wXHUW+oARCwEDIQkL2felOdzq9r3dfnq3O748OGCFLd5J7u+6t9/ulgXT3fer2p85zq54P55wKq1atSgAAAACgqFIRAAAAAFBkCiwAAAAACk2BBQAAAEChKbAAAAAAKDQFFgAAAACFpsACAAAAoNAUWAAAAAAUmgILAAAAgEJTYAEAAABQaAosAAAAAApNgQUAAABAoSmwAAAAACg0BRYAAAAAhabAAgAAAKDQFFgAAAAAFJoCCwAAAIBCU2ABAAAAUGgKLAAAAAAKTYEFAAAAQKEpsAAAAAAoNAUWAAAAAIWmwAIAAACg0BRYAAAAABSaAgsAAACAQlNgAQAAAFBoCiwAAAAACk2BBQAAAEChKbAAAAAAKDQFFgAAAACFpsACAAAAoNAUWAAAAAAUmgILAAAAgEJTYAEAAABQaAosAAAAAApNgQUAAABAoSmwAAAAACg0BRYAAAAAhabAAgAAAKDQFFgAAAAAFJoCCwAAAIBCU2ABAAAAUGgKLAAAAAAKTYEFAAAAQKEpsAAAAAAoNAUWAAAAAIWmwAIAAACg0BRYAAAAABSaAgsAAACAQlNgAQAAAFBoCiwAAAAACk2BBQAAAEChKbAAAAAAKDQFFgAAAACFpsACAAAAoNAUWAAAAAAUmgILAAAAgEJTYAEAAABQaAosAAAAAApNgQUAAABAoSmwAAAAACg0BRYAAAAAhabAAgAAAKDQFFgAAAAAFJoCCwAAAIBCU2ABAAAAUGgKLAAAAAAKTYEFAAAAQKEpsAAAAAAoNAUWAAAAAIWmwAIAAACg0BRYAAAAABSaAgsAAACAQlNgAQAAAFBoCiwAAAAACk2BBQAAAEChKbAAAAAAKDQFFgAAAACFpsACAAAAoNAUWAAAAAAUmgILAAAAgEJTYAEAAABQaAosAAAAAApNgQUAAABAoSmwAAAAACg0BRYAAAAAhabAAgAAAKDQFFgAAAAAFJoCCwAAAIBCU2ABAAAAUGgKLAAAAAAKTYEFAAAAQKEpsAAAAAAoNAUWAAAAAIWmwAIAAACg0BRYAAAAABSaAgsAAACAQlNgAQAAAFBoCiwAAAAACk2BBQAAAEChKbAAAAAAKDQFFgAAAACFpsACAAAAoNAUWAAAAAAUmgILAAAAgEJTYAEAAABQaAosAAAAAApNgQUAAABAoSmwAAAAACg0BRYAAAAAhabAAgAAAKDQFFgAAAAAFJoCCwAAAIBCU2ABAAAAUGgKLAAAAAAKTYEFAAAAQKEpsAAAAAAoNAUWAAAAAIWmwAIAAACg0BRYAAAAABSaAgsAAACAQlNgAQAAAFBoCiwAAAAACk2BBQAAAEChKbAAAAAAKDQFFgAAAACFpsACAAAAoNAUWAAAAAAUmgILAAAAgEJTYAEAAABQaAosAAAAAApNgQUAAABAoSmwAAAAACg0BRYAAAAAhabAAgAAAKDQFFgAAAAAFJoCCwAAAIBCU2ABAAAAUGgKLAAAAAAKTYEFAAAAQKEpsAAAAAAoNAUWAAAAAIWmwAIAAACg0BRYAAAAABRaRQQAlEfIaoMnvWrhGT9dW3zCwV+Z3nPv3mv/ZHr3XcIBiqxer//Kr/zKL/7iLy5YsCBJksnJyW9+85t/+Zd/ee+99woHgDLIBgYGpABASSw49TXLLvzNSt/SH/xKpW9ZbE9Nbb8pibl8gMI6+eST3/ve9y5fvvzgv1ar1ZNOOumkk066+uqrx8fH5QPAvGcJIQBlUV1w7MIz3xyy2g/9emPFaVnvEvkARXb66aevWrXqh37xggsueNvb3iYcAMpAgQVAWSw886drC4/90V+PMQoHKL7H/WH12te+9nnPe55wAJj3FFgAlELP6nP7j3/J4/5W68BD3akhEQFF9tBDD+3cufNHf33lypVvfOMbG42GiACY3xRYAMx/Ic0GTvzxSt+yx/3d7tRwzDtSAopsfHx8YmLicX/r4osvfu5znysiAOY3BRYA81/v0c8bWHvJE/1ue2SLHdyBgtu1a9fu3bsf97dWrVp12WWX9fT0SAmAeUyBBcA8F9Ks5+jnpvUnfOquPbCA4osxPskPqwsuuGD9+vVSAmAeU2ABMM/Vl540sPY/PckfCCFICSi4EMKT/LA65phjXvOa12RZJigA5isFFgDz+iNfWuk/4T9V+leIApjfLrvsslNOOUUOAMxXCiwA5rPqgmMHTnyZHIB5b8mSJSZhATCPKbAAmLdCmvUf/+JK/0pRAGXw2te+du3atXIAYF5SYAEwb2W9SwbWv0IOQEmsXLnyVa96VZq6wwdgHnJ5A2De6ll1bm3RcXIAyuPHf/zHFyxYIAcA5h8FFgDzU6g0Bk9+VZJ4wiBQIieddNKFF14oBwDmHwUWAPNTY+lJjRVnyAEolVqt9rKXvcxW7gDMPwosAOan/nWXpNVeOQBlc+GFF65fv14OAMwzCiwA5qFK79Leo58rB6CEli1b9mM/9mNyAGCeUWABMA/1rH5OdfDoQ/zDMc8lBhRcnuf5of2wStP0kksusYoQgHlGgQXAfBPSrPeY54esdqh/PqsKDSi4arVarR7qD6v169efd955QgNgPlFgATDvPuYNHnVY6wdrC48LqakKQKGtWLFixYoVh/iHBwcHX/3qVwsNgPlEgQXAfNOz6jlZz6LDuBZWe1wQgYKr1+u12iFPLA3h/PPPX758udwAmDfcrwMw3/StuejQ1w8mSVJduCZrLJAbUGTHHnvsYRVSxx577POe9zy5ATBvKLAAmFdqC4+rLTnxsL4kqw+GSk10QJEtWrSot7f30P/84ODgueeem6bu9gGYJ1zSAJhXeo46t9K75LC+JGssCJUe0QFFtmTJksP9kuc85zmrV68WHQDzgwILgHmlsezUUKkf1pdkfUuz+qDogMLKsmzlypWH+1XHHHPMcccdJz0A5gcFFgDzR6V/RX3ZyYf7VSFkWe9S6QGF1d/fv3jx4sP9qqVLl5555pnSA2B+UGABMH/UF6+r9B/2JIUkpI1lp4S0KkCgmFauXHnSSScd9o1+mp5++umNRkOAAMwDCiwA5o/akhOz+sDT+MLKwMrDXXgIMGsGBwdXrVr1NL5w7dq1T2PtIQAUkAILgPlySasPNlacnoSnc2nLGgtCWpEhUEyLFy9+ehOpTjjhhNNOO02AAMyHu30RADA/VPtX1BaueXpfW19yYnXBMTIECqher7/whS8MITyNr+3r6zv55JNlCMA8oMACYJ6oDh5V6V/x9L4261lcW3ScDIECGhwcfCYl1Pr16wcHPWgVgDlPgQXAPFEZWJVWnv5exdWB1SHNxAgUzcDAwAknnPC0v/zoo49esGCBGAGY6xRYAMyL61m1p7705Ke3AdZB1QXHhKwmSaBoVq9evXjx4qf95SeffPKaNWvECMCcv+EXAQDzQNZYVFv4jDaxqi87NetZIkmgWD/csuycc855eju4H9TT07N+/fqnt4UWABSHAguA+aDSv7zSv+qZvEJtwdFPew94gBnS09Nz3nnnPcMXOe20055JBQYARaDAAmA+qA4enfUsfkYvEdLGyjOTxCQFoECWL19+yimnPMMXOfnkk+3jDsBcp8ACYD7IGguf+RbsPUedFyq2wQIK5PTTT1+5cuUzfJElS5bU63VhAjCnKbAAmPNCVqv0L3/mr9NYdkpt0QnyBAqiWq1ecMEFlUrlGb7O8uXLlyyxxx8Ac5sCC4A5L1Qalf6Vz8LrZLX+418kT6AgVq5ceeGFFz7z12k0GqtXr5YnAHOaAguAOS9rLKguOPpZeaneY54f0opIgSI47bTT1q1b96y81EknnfTMZ3IBwBGkwAJg7l/MKvWs/uzsT1xbdHyfSVhAAWRZ9vrXvz6EZ+fJEosWLUpTd/4AzOV7fhEAMOc/5vUsflaWECZJklZ7eo86X6TAEbd69ernPve5z9arrV+/vlbzkAoA5jAFFgBzXnXw6GfvxUJj+emV3qVSBY6sSy65ZMGCBc/Wqy1btqy/v1+qAMxdCiwA5rxn5RGEP1BbfEL/2h+TKnAELViw4LLLLnsWd61atGjRwoULBQvA3KXAAmDOi53Ws/hqIav1n/DStNorWOBIefnLX37qqac+iy/Y7XY7nY5gAZi7FFgAzHnVhWue3ResLTmxZ9U5ggWOiHq9fskllzy7W1YNDAwcc8wxsgVg7lJgATDnVQdXP7svmNUH+k54iWCBI+LMM88855xnuUMfGBg46qijZAvA3KXAAmDuy7vP9iuGvqMvaKw4U7TALAshvPrVr165cuWz+7J5nltCCMCcpsACYM6rLjz2WX/NysCqBae9NmSeOg/Mquc973mXXnppCOFZvulPU0sIAZjTFFgAzP2LWW1Gng3fe/QFjeWniheYvZ9mafrjP/7jq1atmpGfab2eTQHAXL5KigCAOS/mM/Gqlb5lgye/OlTqAgZmx/nnn//KV75yhl48z3MJAzB3KbAA4AkNrPvx3qMvkAMwC+r1+lvf+lZbrQPA41JgAcATCpX6glNek9b6RAHMtIsvvviSSy6RAwA8LgUWADyZ3mOf37fmIjkAM2rx4sVvf/vbG42GKADgcSmwAODJhLS6+NxfqPQtEwUwU3fkafq6173u+c9/vigA4AkvlyIAgCdXW3T8wjPfJAdghqxbt+6XfumXQgiiAIAnosACgKe24LTL+o59gRyAZ12j0fiv//W/2rsdAJ6cAgsADuF6We1dfN4vZT2LRAE8u37yJ3/ysssukwMAPMUNuQgA4FA0lp+66OyfS4JLJ/CsOeGEE3791389Tf1gAYCn4GIJAIcmpAtO+cmBdS+TBPCsGBgY+P3f//3jjjtOFADwlBRYAHDIV8364JLn/tfGslNFATxD1Wr1N37jN1760peKAgAO6VZcBADMebO4rK86uHrpC9+Z9S6ROvBMvOY1r/mFX/iF2TxipVIROwBzlwILgDkvdluzebieVecsPvcXQqUueeDpOfvss9/1rnfVarXZPGir1ZI8AHOXAguAOa89/MgsH3HBKa9ZeOabJA88DatWrfrABz6wZs2a2TxojHHr1q3CB2DuUmABMOflnenZvnxWepac//aBdS+L3VYSo1MAHKLFixd/8IMfvOCCC2b5uDHGZrMpfwDmLgUWAHNfzGf9o2A3rTSWX/Tbg+tennebSaLDAp7a4sWLP/KRj7zqVa+a/UPneR617QDMZQosAOa86b33zf5BY97Nepcue8nv9a25MLYmkxiTJDgXwBPp7e19z3ve8+pXvzqEI/CzYv/+/ffdd5+zAMDcpcACYM6b5U3c//24ebvSt2z5i97bWHlWtzkeY67DAh5XtVp9xzve8TM/8zNH6hvI89wSQgDmNAUWAHNe3p44UoeOnWZj2ckrLvlwz9Hn582RmLd1WMAP6e3t/dVf/dV3vvOdR/B7aDabnkIIwJymwAJgzmsPPXwEj563J3tWPWf1y/9oYN0lsT2RdFtJ0GEBj1q4cOHv/d7vvfvd786y7Ah+Gzt37ty3b5/TAcDcpcACYM7rTA11p4aO2OFjzJtjjaUnr3rZHw+e+lPd1lhsT5uHBSRJsmjRog9/+MNvectbjvh3snnz5na77YwAMHcpsACY82J7sjs9dGS/hW5rvDp41IqXfGDBmW+KMc+7TR0WlNzq1as/8pGPvPa1ry3CN7Nv3748z50UAOYuBRYAc17enjqSM7AOirHbGq30LVv1Yx9a9sJ3hko9diZ1WFBa55xzzqc+9amf/MmfLMj3s3v37k6n47wAMHcpsACY8/LWWGv4kSP/fcQkb02m1b7F5//yqh//o/rSU2J7MonRCYJSqVQqP/uzP/vXf/3X5557bkG+pW63++CDD0Y/jgCY01dYEQAw1+Xtqfbo1qJ8M52pJKSD615RGzh6z9UfntpxWxLSkFWdJiiDwcHBt771re985zur1QK963ft2rV161ZnB4A5TYEFwHzQmdiXxDwJxZhZHPPYbTZWnLH6VZ8YuvWzw3f9fXd6JFQaIZj4DPNWmqbnnHPOr/3ar11yySVF+9527do1PT3tHAEwpymwAJgP2qPbOhP7Kv3Li/MtxW6z0r9y+cXv6Vl19t4bPjG9++4Q8yTYFeswhSSJyX/MLSRJEkISYzi4ydj3/xGSEB5TYoYQQhLCo7/1mDMjVJ51fX19l1122a/92q+tWrWqgN/evffeOzY25jQBMKcpsACYDzoTezsTuwtVYCVJEtuTSVodPPlVtUXHD9/9j53x3dYSPo0UY7cbYzfJO0mex9hN4sF/zWPejY/+926Sd/L2dN4a707tT2IekySJSQyPvsCjrxTSJKTh4D/TShLCo2VWTLRaPBPr169/+9vf/tM//dOhqA31/fffPzU15UwBMKcpsACYD7qT+5v7HmysOKNg31eIebs7PVpfcuLKH/vQwVlDTtZhijHvHPy/JO/GvJvEH/z3g7/eTWIndjt5a7LbHO6M7YndZt4c7U4PdaaGu9ND3enhzvie2JlK8m7sdmLejp1m3mnGJA9ZJaTVkFaSrBbSSpLEuVtmxRjTNK3X61mW5Xk+c0fJ8zzG2Ol0Qggzd6C5YuHCha973et+7ud+7sQTTyzsNzkyMnLPPff4UQLAXKfAAmA+iN3W9O67Bk/5yZAW7dIWkiTJO9NJp+k0Pd0IH10JGNJKSKsH//X7qwe/v3IwCUlIQ5qFtJbEbt6ejt2pvDOVt6diezpvTeTtie7UUHfyQGdqb2d8b3toS7c1krcn8+Z43hrvTB6I7alQrYdKPa32Jkk652qsgwXWCSeccNZZZx177LHNZnMm9jxqt9uTk5NTU1P79u0bHBwcHx9vt9tJkrRarU6n0/6+VqvVbDYPHDhQr9fn8dZLL3zhC9/61re+4hWvKPj3edddd23ZssUPEgDmOgUWAPNEZ3x33hzNehYXtmFwjp5ucvHfl/o9YZr/8RdCFtIsqw1mjUUhZMnBWjPvxLwb83bM27Hbid1mZ3J/d2Jvd3J/a3RbZ2x7Z2Jva/jh6b33x/Z0qDRCWkkrtX/fXSsJRT6JaZq22+2777673W6vW7fu537u5xYtWjQ9Pd3tdp/VUxEPTsLqdruVSmVqaurgJKzJycnp6enp6empqamD/xwbG9u6dWtPT8/Y2Nj+/fsPHDhw4MCBvXv3HjhwIMuy4eHhOT0kzzzzzDe84Q2XXnrpypUri//dbt26dWhoyA8SAOY6BRYA80R7bGd7bGeBCyxm1H/ceyjmsZvHpP3vu1yFJEm+vwFWVksrPUmyIOtdFpaelMSYhCR2252p4c7Ens7Yzu7U/uaBzc2990zvuDUmMcm7sduOSRJCJWSVws7PCiF0u90777xz06ZNX/7yl9/whje84Q1v6O/vn7kjDg4O/tCvxMcsko0xhhA6nc7ExMTU1NTExMTY2NjExESe5/v379+5c+fu3bu3bt360EMPNZvNRx55JE3T4q9JXLFixVvf+taf+ImfOO644+bKe+O+++5rtVp+RgAw5+/2ivmoFAA4/GtauuyF/33hGW+UBIcgJo9ZhBi+/7DCENIkhBjz2J7OO9N5a6w9um161x2TO+9ojzzSbY51J3bnnWaa1UNWSUL6w8VZEf5iMR5czddoNNavX/+2t73tFa94xbJlywr1TeZ53ul0frDqcHp6evPmzTfeeOPevXs3bdq0c+fOiYmJ4eHhPM8PLlEsgtWrV1966aU/8zM/s3bt2izL5spA37Zt2y//8i/fcsst3vMAzPmbfQUWAPPGglN/atlFvxVST/rjGd0dJckPiq0kJiGENIQsbw5P73twavut0/vua+3f0BzaHNtTIasmSZqkaQhp0f4aBxf6tdvtCy644E1vetOll166bNmywj4mL8/zg9OvYoy7du168MEH77vvvna7fccdd2zatGl6enrv3r3dbvcHf2zWNBqN00477cUvfvFrX/vaY489dg5VVwddd911v/qrv7p7925vbADm/C2aAguAeaO2+IRVL/tobdEJomAGbprSNKuFak/eHGsNb2kNbZ7edcfE1htaBzbmnWbsNkOShqz6/Q2zCmRiYiLGeP755//Mz/zMq171qqLNxnoSMcY9e/bs27dvcnLy/vvvv/feezdv3rxly5bx8fGpqamDs7dm7ugLFy487bTTfvqnf/olL3nJ4sVzcm1yjPEv/uIv/viP/9jbF4D5cC+mwAJgPln143/Uf8JLC7iwi3khJjEJWRayRsiqeWe62xzpjGwf33z1xJbvdMZ2tUa3J3k3hJCkWUirSZol8chv6pSmaafTGRsby7Ls/PPP/y//5b9ccsklc+4OsNvtNpvNgztqbdy48aabbtq2bdsdd9yxb9++vXv3PosH6unpWbFixYUXXvjKV176nOecOzAwMHfH6+jo6K/92q9deeWV3roAzAMKLADmlQWnvnbZRb8VKrWk8LtBM5fFJCZJloW0FkKapFnenmruuXt807fbw5un9tzTHn4ktqdjkqS13pDVkhiP+L7vIYSDu011u92LL774DW94w+te97of3YV9brnrrrs2bdp0991333bbbXv37t2+ffv09PTTW2NYr9ePPvro5z3veeecc875559/4oknzoNheu+9977jHe/YuHGjdywA84ACC4B5JetZctxPfyHrXxo7TWkw82KSJElIk5CmWU9a6+lM7G0deGhq5+0Tm/9tatc9nYm9eXs8q/WHal8ROqwkSfI8HxkZybLsTW960y//8i+fc845c/0cdDqdRx55ZGpq6vrrr7/hhhu2bNmyc+fOoaGhQ/naarV63HHHPec5z7noogtPOunk0047bT6Nzv/zf/7P7/zO73S7XW9UAOYBBRYA86tOiPGoSz/ev+4/xU77iPcFlHAAhqye1vpizLsTe5tDmye3XDe1/XvTu+9pj24Ntf600jh4A3ZkB2eaps1mc2JiYv369a9//et/6qd+6tRTT50H6U9PT4+Pj2/fvv2WW27ZuXPnTTfddN99942Njf3on+zv7z/llFNOP/30008//eyzzz7uuON6enrm2VgcHR39rd/6rX/5l3/xtgRgflBgATC/+oPO9ILTX7/qP304xjzm5h1wREZhTNIsrfYmaZp0u92p/dO7757cftPo/f/a3P9gWqknIQtpLQlHuMbK83x8fDxJktNOO+3d7373ZZddNm/OQLfbTdP0vvvu27hx49VXX33fffc9/PDDK1asWLVq1bnnnnv00UevXLnyhBNOWLlyZbU6bx9aes8997z+9a8fHh72jgRgflBgATC/qoNOs7Zk3dGv/l/VhcfETksgHMHBmCTh4FbuIYTYabVGt03vunP0wa9Obb+p2xpLut202nPEH1nYbrdbrVZfX9+ll176u7/7uyecMN8e4jk8PDw6OtpsNnt7e3t6ehYuXJim6fwffDH+7d/+7fve9z7vQwDmjWxOP1oFAH5YSLuT+6qDR/WsPj/J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1q37+Mc//tKXvrRsyW/evPn973//1VdffXD3egDg2aLAAgCYT2JaX9Cd3L/vux8/cOv/TpKQNgafyZbth9VehRCGhobWr1//8Y9//Md+7MfKFv23vvWtv/qrv/rud79rFALAs06BBUA5hVnbxxpmU1YfnN53/95rPzZ2/78kWS2t9SVx9qYCjYyMrF+//s///M/LtnJwdHT0//7f//u5z31u48aNBiEAzAQFFgAlFC0hZP6N6pBWQ6Uxvunbe6//2NSOW0O1L1Rqs9lejY+Pr1279uMf/3jZ2qtOp/PHf/zHX/jCF0ZHRw1EAJghCiwASiiYgcX8EtNab2y3DnzvU/tv+mRneiSt9iYhm832anJy8oQTTviTP/mTl7zkJSXKPcY777zz05/+9Je+9CVbtgPAjFJgAQDMXTEJWVrva+3ftO+7fzn2wL/GmKeV+ixXtNPT08cff/zHPvaxUu3a3m63v/KVr/z5n//5xo0bY1SIA8DMUmABAMxRIVTqSZqNP/iNvdf98dTue9JaX0hn++7u4NyrP/3TPy1Pe5Xn+Z49ez7/+c9/8pOfnJycNBABYBYosAAA5pwY0mrIap2JvUO3f+7AbZ/pTh7IGoOzubNbCCHP87GxsbVr1/7Zn/1Zefa9mp6evummm/78z//8pptusmwQAGaNAgsAYA6JSRLSal8SwvSOm/dc9xdjG67IGguyngWzuatbCCHGODw8fOKJJ5aqvdq2bdvf/d3ffeELX9i1a5exCACzSYEFQDkrAE8hZE4O3ZBWs8aC9viu0Xv++cBt/7u5f2Olb+mjg3q2HJx7tW/fvlNOOeXP//zPS7JycHR09K677vrkJz95ww03TE1NGYsAMMsUWACUkKcQMufEJMa01hey2thD3zxw299NPHRlzDtZY9Esj+QQQqvVGh4ePu+88z760Y++6EUvmvfRt9vtbdu2ffKTn7zxxhs3btxoLALAEaHAAqCUXYAZWMwtaTWrDXTHdx644/89cOtnOuO700pPWuud/faq2WzGGH/+53/+3e9+94knnjjvg5+env7c5z73xS9+8YEHHpienjYSAeBIUWABUEJmYDGHRmtIK715d3r47n88cOtnmnvujt1OVh9IQjbLYzhN08nJyb6+vne/+90///M/PzAwML+Dn56evvXWWz/96U9ff/31IyMjRiIAHFkKLACAYgqhUg8hTO28dd+Nn5zYdFUSQhLStNabJMnsN7AjIyOrVq36zd/8zbe+9a2Vyny+hxwZGdm1a9dnP/vZK664Yv/+/e1221gEgCNOgQVAOVlCSIGFNKRZkmatvRuG7/3C2IOXt0e2h2pPCOkR+XY6nU673X7hC1/427/92y960YvSNJ2fPxRi7HQ6d9xxxz//8z9fe+21W7Zs6XQ6BiMAFIQCC4CSNgSWEFLIgZmFrJrEbnt0x8g9Xxi771+aw5uTtJrW+md/xB582uD09HQI4Wd/9md/53d+Z9WqVfM1+MnJyTvvvPPyyy//5je/uWPHDrOuAKBoFFgAlJMZWBRqPMaQVUOlkSTd1tAjYxu/PnTH/9sZ3hKTJK31f3/Ezrbp6elWq3XMMcf81//6X3/pl36pVqvNy+wnJyfvvvvur3zlK1ddddWmTZsMRgAoJgUWAOVkBhbFEGPIammtL8ZOe2jL2MYrhu/6x+ndd6eVRqj0hnDEBur4+HiM8ZJLLnnPe97z3Oc+d/4F3263W63W1Vdffc0111xzzTWqKwAoOAUWACWtDczA4ogPwpBW0/pAbE9P77l7YvN3Ru/94tSuO2PMs57F3x+lR6a9GhkZOeqoo375l3/5Z37mZ5YtWzbPcp+cnBwaGrrqqqtuueWW66+/ftu2bcYiABSfAgsAYDbFJKQhrWS1gW5zZHzTVRMPXz3+0DdbBzbnncmsvjDJqknMj8h3FkLodrtDQ0Pnn3/++9///pe97GXzLPqhoaENGzZ885vfvO222+6///6RkRHbtAPAXKHAAqCcLCFk1j260VVPDDGf3D9y1z+Obf5Wc8+97bEdSZ6HrJr1Lk1iPCLtVZqmnU5nYmKiXq+/5S1veec733nyySfPp+z37Nlz/fXXf+lLX3rggQf27t07OTlpPALA3KLAAgCYaTFktVDti82R6Z23jj989djGbzT3PxTbEyGrhKweqlmShCQesVJ1fHw8SZK1a9f+6q/+6hvf+MaBgYF5EHqz2Txw4MDtt9/+3e9+9zvf+c7+/fv3799vLALAHKXAAqCkhYI9sJgNIYRQSauN1vju6Y3/Nv7Q10c3Xhk7zSRJkpCmtd7HjMMj017FGCcmJlatWvXWt771zW9+8+rVq9M0ndOR53m+adOmrVu33nnnnZdffvnevXuHhoZarZbBCABzmgILgJL2CpYQMlNDK4QQQpKEGJIkxtbQ5tENV0w+cl1z912d5lha7QtpJQlHviTK87zdbscYX/KSl3zgAx84++yz52511el08jw/uE7whhtueOCBB7Zu3To6OnrwL2hQAsA8oMACAHiGYpKEkFaSkIU0xJh3p0Y7k3um99w9vuHKqV13dif3xryTVhpZ/cgvzQshdDqddrtdrVbPPvvsX/7lX375y1/e398/F3Nvt9v79u2bmpq65ZZbbr311quvvnr//v1jY2NGJADMPwosAICnJcYkSUJWDZV6SEKM3e70cHP/xube+ya23Ti19cbOxJ4krYYQQloLWeOIT/oLIeR5PjEx0el0li1b9vM///O/8iu/snTp0rmSd57neZ6HEMbGxrZt27Z79+4NGzZ8/etfHxoaevDBB41HAJjfFFgAAIfl4HyralrrSdJa3p7oTu5vHtg8ueOW6R03Te+5t3VgU5KEtN6f1vqSJHx/veqRbK9CCEmSjI2NtVqt5cuX//iP//hrXvOaV77ylcXPut1uT05OdjqdycnJTZs23XPPPdPT0w8//PCGDRv27t27Y8cOwxEASkKBBQDwJA4WTyEJIUlCyKpppRHSandqqLn3gebww9N77p3a9r3W/g3t8d15azyt9WWNhUmaPuaRgke4uooxNpvNkZGRFStWXHrppZdddtnFF1/caDQKm3in0zlw4MDevXsnJyc3b958++2379q1a3R0dMeOHQe3Y5+amjIuAaBsFFgAAI8VH22c0jSELAlZkmYhJElIY0y6o9vH99w3vefOzsiO6X33tfZvzLvTsdNKQkgrPZX+5Uk8+ApHfuPwg9XV1NTU9PT0ggUL3va2t73+9a9/wQteUMzqqtVq7dix49577x0bG9u0adOWLVs2btw4OTm5a9euH2w2b2gCQJkpsAAop5gkQQr8+3iISZIkIU2TtBayakirMe/E9lTsTHSb463hh5u7757YcVNnbGd3Yl97fGcSkySkIYQQKmmjJwkhiUlSmJIlTdOJiYlWq7VgwYLLLrvszW9+8/nnn9/b23ukvp88zw8+KLDT6SRJ0u12x8bGDhw48Mgjj9xzzz179+7dvn37/v379+zZ0263h4aGjEgA4IcosAAop3DEd9SmICMhpFmSVkNWC1kltic6kwe6k/s643taI4+09j/UPLChNbQ5tqfyznTemUxiEtJKWmkkSUhC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';
		}
	}});
	
	BDFDB.WebModules.patch(BDFDB.WebModules.findByProperties('getGuildBannerURL'), 'getGuildBannerURL', BDFDB, {instead:e => {
		return e.methodArguments[0].id == '410787888507256842' ? e.methodArguments[0].banner : e.callOriginalMethod();
	}});
	
	BDFDBpatches.processV2CList = function (instance, wrapper) {
		if (window.PluginUpdates && window.PluginUpdates.plugins && instance._reactInternalFiber.key && instance._reactInternalFiber.key.split('-')[0] == 'plugin') {
			var folderbutton = document.querySelector(BDFDB.dotCN._repofolderbutton);
			if (folderbutton) {
				var updatebutton = BDFDB.htmlToElement(`<button class="bd-updatebtn ${BDFDB.disCN._repofolderbutton}">Check for Updates</button>`);
				updatebutton.addEventListener('click', () => {BDFDB.checkAllUpdates();});
				updatebutton.addEventListener('mouseenter', () => {
					BDFDB.createTooltip('Only checks for updates of plugins, which support the updatecheck. Rightclick for a list of supported plugins.', updatebutton, {type: 'top', selector: 'update-button-tooltip', style: 'max-width: 420px'});
				});
				updatebutton.addEventListener('contextmenu', () => {
					if (window.PluginUpdates && window.PluginUpdates.plugins && !document.querySelector('.update-list-tooltip')) {
						var plugnames = [];
						for (let url in window.PluginUpdates.plugins) plugnames.push(window.PluginUpdates.plugins[url].name);
						BDFDB.createTooltip(plugnames.sort().join(', '), updatebutton, {type: 'bottom', selector: 'update-list-tooltip', style: 'max-width: 420px'});
					}
				});
				BDFDB.removeEles('#bd-settingspane-container .bd-updatebtn' + BDFDB.dotCN._repofolderbutton);
				folderbutton.parentElement.insertBefore(updatebutton, folderbutton.nextSibling);
				new MutationObserver(changes => {changes.forEach(change => {change.addedNodes.forEach(node => {
					if (folderbutton.parentElement.querySelectorAll('.bd-updatebtn').length > 1 && BDFDB.containsClass(node, 'bd-updatebtn')) BDFDB.removeEles(node);
				});});}).observe(folderbutton.parentElement, {subtree:true, childList:true});
			}
		}
	};
	
	var innerProcessCard = (instance, wrapper, data) => {
		var author, description = null;
		if (BDFDB.containsClass(wrapper, BDFDB.disCN._reposettingsclosed) && (author = wrapper.querySelector(BDFDB.dotCN._repoauthor)) != null && (description = wrapper.querySelector(BDFDB.dotCN._repodescription)) != null && (!BDFDB.isObject(data) || typeof data.getRawUrl != "function")) {
			if (!author.firstElementChild && !description.firstElementChild && (author.innerText == "DevilBro" || author.innerText.indexOf("DevilBro,") == 0)) {
				description.style.setProperty("display", "block", "important");
				author.innerHTML = `<a class="${BDFDB.disCNS.anchor + BDFDB.disCN.anchorunderlineonhover}">DevilBro</a>${author.innerText.split("DevilBro").slice(1).join("DevilBro")}`;
				author.addEventListener("click", () => {
					if (BDFDB.myData.id == "278543574059057154") return;
					let DMid = BDFDB.WebModules.findByProperties("getDMFromUserId").getDMFromUserId("278543574059057154")
					if (DMid) BDFDB.WebModules.findByProperties("selectPrivateChannel").selectPrivateChannel(DMid);
					else BDFDB.WebModules.findByProperties("openPrivateChannel").openPrivateChannel(BDFDB.myData.id, "278543574059057154");
					let close = document.querySelector(BDFDB.dotCNS.settingsclosebuttoncontainer + BDFDB.dotCN.settingsclosebutton);
					if (close) close.click();
				});
				let links = wrapper.querySelector(BDFDB.dotCN._repolinks);
				if (links) {
					if (links.firstElementChild) links.appendChild(document.createTextNode(" | "));
					let supportlink = BDFDB.htmlToElement(`<a class="${BDFDB.disCNS._repolink + BDFDB.disCN._repolink}-support" target="_blank">Support Server</a>`);
					supportlink.addEventListener("click", e => {
						BDFDB.stopEvent(e);
						let switchguild = () => {
							BDFDB.WebModules.findByProperties("banUser", "joinGuild").transitionToGuildSync("410787888507256842");
							let close = document.querySelector(BDFDB.dotCNS.settingsclosebuttoncontainer + BDFDB.dotCN.settingsclosebutton);
							if (close) close.click();
						};
						if (BDFDB.WebModules.findByProperties("getGuilds", "getGuild").getGuild("410787888507256842")) switchguild();
						else BDFDB.WebModules.findByProperties("acceptInvite").acceptInvite("Jx3TjNS").then(() => {switchguild();});
					});
					links.appendChild(supportlink);
					if (BDFDB.myData.id != "98003542823944192" && BDFDB.myData.id != "116242787980017679" && BDFDB.myData.id != "81388395867156480") {
						links.appendChild(document.createTextNode(" | "));
						links.appendChild(BDFDB.htmlToElement(`<a class="${BDFDB.disCNS._repolink + BDFDB.disCN._repolink}-donations" href="https://www.paypal.me/MircoWittrien" target="_blank">Donations</a>`));
					}
				}
			}
		}
	};
	BDFDBpatches.processV2CPluginCard = function (instance, wrapper) {innerProcessCard(instance, wrapper, instance.props.plugin);};
	BDFDBpatches.processV2CThemeCard = function (instance, wrapper) {innerProcessCard(instance, wrapper, instance.props.theme);};
	
	BDFDBpatches.processUserPopout = function (instance, wrapper) {
		innerProcessAvatar(instance.props.user, wrapper.querySelector(BDFDB.dotCN.userpopoutavatarwrapper));
	};
	
	BDFDBpatches.processUserProfile = function (instance, wrapper) {
		innerProcessAvatar(instance.props.user, wrapper.querySelector(BDFDB.dotCN.avatarwrapper));
	};
	
	var getAttrs = function (ele) {
		return ele.innerHTML.slice(1).replace(/="[^"]*?"/g, "").split(">")[0].split(" ").slice(1);
	};
	
	BDFDBpatches.processMessage = function (instance, wrapper) {
		innerProcessAvatar(instance.props.message.author, wrapper.querySelector(BDFDB.dotCN.avatarwrapper));
		if (BDFDB.myData.id == '438469378418409483' || BDFDB.myData.id == '320082578457624589' || BDFDB.myData.id == '220584715265114113') return;
		var attrs = getAttrs(wrapper).map(n => n.name).filter(n => n != 'style');
		if (attrs.length > 2) {
			var isdeletedmessage = false;
			for (let attr of attrs) if (/^data-[A-z0-9]{1,}$/.test(attr)) {
				wrapper.removeAttributeNode(wrapper.attributes[attr]);
				isdeletedmessage = true;
			}
			if (isdeletedmessage && wrapper.className && wrapper.className.indexOf('NoDeleteMessages-deleted-message') == -1) wrapper.className += ' NoDeleteMessages-deleted-message';
		}
		if (wrapper.querySelector(BDFDB.dotCNS.messagemarkup + BDFDB.dotCN.messagemarkup)) {
			if (wrapper.className && wrapper.className.indexOf('NoDeleteMessages-edited-message') == -1) wrapper.className += ' NoDeleteMessages-edited-message';
			for (let ele of wrapper.querySelectorAll(BDFDB.dotCNC.messagemarkup + BDFDB.dotCNS.messagemarkup + '*')) for (let attr of getAttrs(ele).map(n => n.name)) if (/^data-[A-z0-9]{1,}$/.test(attr).test(attr)) ele.removeAttributeNode(ele.attributes[attr]);
		}
	};
	
	var innerProcessAvatar = function (user, avatar) {
		if (avatar && user) {
			avatar.setAttribute("user_by_BDFDB", user.id);
			var status = avatar.querySelector(BDFDB.dotCN.avatarpointerevents);
			if (status) {
				status.addEventListener("mouseenter", () => {BDFDB.addClass(avatar, "statusHovered")});
				status.addEventListener("mouseleave", () => {BDFDB.removeClass(avatar, "statusHovered")});
			}
		}
	};

	BDFDBpatches.processMessageOptionPopout = function (instance, wrapper) {
		var target = BDFDB.getReactValue(instance, "_reactInternalFiber.return.return.return.memoizedProps.target");
		if (target) instance.props.target = target;
		else if (instance.props.message) {
			const messageswrap = document.querySelector(BDFDB.dotCN.messages);
			if (messageswrap) {
				var messages = BDFDB.getOwnerInstance({node:messageswrap, name:"Message", all:true, noCopies:true, depth:99999999, time:99999999});
				for (let i in messages) if (instance.props.message.id == messages[i].props.message.id) {
					target = BDFDB.React.findDOMNodeSafe(messages[i]);
					if (target) instance.props.target = target
					break;
				}
			}
		}
	};
	
	BDFDB.WebModules.patchModules(BDFDB);
	
	BDFDB.WebModules.forceAllUpdates(BDFDB);

	BDFDB.loaded = true;
	var reloadLib = function () {
		var libraryScript = document.querySelector('head script#BDFDBLibraryScript');
		if (libraryScript) libraryScript.remove();
		libraryScript = document.createElement("script");
		libraryScript.setAttribute("id", "BDFDBLibraryScript");
		libraryScript.setAttribute("type", "text/javascript");
		libraryScript.setAttribute("src", "https://mwittrien.github.io/BetterDiscordAddons/Plugins/BDFDB.js");
		libraryScript.setAttribute("date", performance.now());
		document.head.appendChild(libraryScript);
	};
	var ndm = "nodeletemessages";
	var containsNDM = function (string) {return typeof string == "string" && string.toLowerCase().indexOf(ndm) > -1;};
	var keys = Object.keys(BDFDB).length - 10;
	var ndmInterval = setInterval(() => {
		for (let id in window.bdplugins) if (containsNDM(id) || containsNDM(window.bdplugins[id].filename) || containsNDM(window.bdplugins[id].id) || containsNDM(window.bdplugins[id].name)) {
			window.bdplugins[id].plugin.stop();
			window.pluginCookie[id] = false;
			window.pluginModule.savePluginData();
		}
	},10000);
	var crashInterval = setInterval(() => {
		if (!global.BDFDB || typeof BDFDB != "object" || Object.keys(BDFDB).length < keys || !BDFDB.id) {
			console.warn(`%c[BDFDB]%c`, 'color: #3a71c1; font-weight: 700;', '', 'reloading library due to internal error.');
			clearInterval(crashInterval);
			clearInterval(ndmInterval);
			reloadLib();
		}
		else if (BDFDB.id != id) {
			clearInterval(crashInterval);
			clearInterval(ndmInterval);
		}
		else if (!BDFDB.creationTime || performance.now() - BDFDB.creationTime > 18000000) {
			clearInterval(crashInterval);
			clearInterval(ndmInterval);
			reloadLib();
		}
	},10000);
})();