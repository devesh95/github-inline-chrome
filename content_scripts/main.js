$(document).on('ready', function() {
	console.info('Running on the PennApps Application grading page.');
	$('head').append(`<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css"></link>`);

	var appFields = $('.app');
	var githubField = appFields.eq(8);
	var githubURL = githubField.find('a').attr('href');

	var PERSONAL_ACCESS_TOKEN = '';

	if (githubURL && githubURL.length > 0) {
		// var iframe = document.createElement('iframe');
		// iframe.src = githubURL;
		// $('.content').append(iframe);

		var tokens = githubURL.split('/');
		var USERNAME = tokens[tokens.length - 1];
		var content = `<div id="github"><div class="content-section"> <div id="github-widget" data-username="${USERNAME}"></div> </div></div>`;

		githubField.after(content);

		var GitHubWidget;

		GitHubWidget = function(options) {
			var template = "github-widget";

			this.defaultConfig = {
				sortBy: 'stars', // possible: 'stars', 'updateTime'
				reposHeaderText: 'Most starred',
				maxRepos: 5
			}

			options = options || this.defaultConfig;

			this.$template = document.getElementById(template);
			this.user = options.userName || this.$template.dataset.username;

			this.url = {
				api: "https://api.github.com/users/" + this.user,
				langs: []
			};

			this.error = null;
			this.data = null;

			this.profile = {};
			this.langs = {};

			// load resources and render widget
			this.init();
		};

		GitHubWidget.prototype.init = function() {
			this.load();
			this.render();
		};

		// first call to API
		// get all profile data

		GitHubWidget.prototype.load = function() {
			var request = this.getURL(this.url.api);
			this.data = JSON.parse(request.responseText);

			if (request.status === 200) {
				var limitRequests = request.getResponseHeader('X-RateLimit-Remaining');
				console.log(limitRequests);
				this.error = null;

				this.loadRepos();

			} else {
				var limitRequests = request.getResponseHeader('X-RateLimit-Remaining');
				console.log(limitRequests);

				this.error = {
					message: this.data.message
				};

				if (Number(limitRequests) === 0) {
					// API is blocked
					var resetTime = request.getResponseHeader('X-RateLimit-Reset');
					this.error.resetDate = new Date(resetTime * 1000);

					// full message is too long, leave only important thing
					this.error.message = this.error.message.split('(')[0];
				}

				if (request.status === 404) {
					this.error.isWrongUser = true;
				}
			}
		};

		GitHubWidget.prototype.loadRepos = function() {
			var request = this.getURL(this.data.repos_url);

			this.profile.repos = JSON.parse(request.responseText);

			// get API urls to generate language stats
			for (var k in this.profile.repos) {
				this.url.langs.push(this.profile.repos[k].languages_url);
			}

			return this.profile.repos;
		};

		GitHubWidget.prototype.getRepos = function() {
			return this.profile.repos;
		}

		GitHubWidget.prototype.getTopLanguages = function(callback) {
			var langStats = []; // array of URL strings

			// get URLs with language stats for the first 15 repos
			var count = 0;
			this.url.langs.forEach(function(apiURL) {
				if (count < 15) {
					var that = this,
						request = new XMLHttpRequest();

					request.addEventListener('load', function() {

						var repoLangs = JSON.parse(request.responseText);
						langStats.push(repoLangs);

						if (langStats.length === that.url.langs.length) { // all requests were made
							calcPopularity.bind(that)();
						}

					}, false);

					request.open("GET", apiURL + '?access_token=' + PERSONAL_ACCESS_TOKEN, true);
					request.send(null);
					count++;
				}
			}, this);

			// give rank (weights) to the language
			var calcPopularity = function() {
				langStats.forEach(function(repoLangs) {
					var k, sum = 0;

					for (k in repoLangs) {
						if (repoLangs[k] !== undefined) {
							sum += repoLangs[k];
							this.langs[k] = this.langs[k] || 0;
						}
					}

					for (k in repoLangs) {
						if (repoLangs[k] !== undefined) {
							this.langs[k] += repoLangs[k] / (sum * 1.00); // force floats
						}
					}
				}, this);

				callback();
			};
		};

		GitHubWidget.prototype.render = function(options) {
			options = options || this.defaultConfig;
			console.log(options);

			var $root = this.$template;

			// clear root template element to prepare space for widget
			while ($root.hasChildNodes()) {
				$root.removeChild($root.firstChild);
			}

			// handle API errors
			if (this.error) {
				var $error = document.createElement("div");
				$error.className = "error";

				$error.innerHTML = '<span>' + this.error.message + '</span>';

				if (this.error.isWrongUser) {
					$error.innerHTML = '<span>Not found user: ' + this.user + '</span>';
				}

				if (this.error.resetDate) {
					var remainingTime = this.error.resetDate.getMinutes() - new Date().getMinutes();
					remainingTime = (remainingTime < 0) ? 60 + remainingTime : remainingTime;

					$error.innerHTML += '<span class="remain">Come back after ' + remainingTime + ' minutes</span>';
				}

				$root.appendChild($error);

				return false;
			}

			// API doesen't return errors, try to built widget
			var $profile = this.render.profile.bind(this)();

			this.getTopLanguages((function() {
				var $langs = this.render.langs.bind(this)();
			}).bind(this));

			$root.appendChild($profile);

			if (options.maxRepos > 0) {
				var $repos = this.render.repos.bind(this)(options.sortBy, options.maxRepos),
					$reposHeader = document.createElement('span');
				$reposHeader.className = "header";
				$reposHeader.appendChild(document.createTextNode(options.reposHeaderText + ' repositories'));

				// $repos.insertBefore($reposHeader, $repos.firstChild);
				// $root.appendChild($repos);
				$('.widget-top').append($reposHeader);
				$('.widget-top').append($repos);
			}
		};

		GitHubWidget.prototype.render.repos = function(sortyBy, maxRepos) {
			var reposData = this.getRepos();

			var $reposList = document.createElement('div');

			reposData.sort(function(a, b) {
				// sorted by last commit
				if (sortyBy == "stars") {
					return b.stargazers_count - a.stargazers_count;
				} else {
					return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
				}
			});

			for (var i = 0; i < maxRepos && reposData[i]; i++) {
				var updated = new Date(reposData[i].updated_at);
				var $repoLink = document.createElement('li');

				$repoLink.title = reposData[i].description;
				$repoLink.innerHTML += '<span class="star">' + reposData[i].stargazers_count + '<i class="fa fa-star" style="color: #FFDC00"></i> | </span>';
				$repoLink.innerHTML += '<span class="repo-name"><a href="' + reposData[i].html_url + '">' + reposData[i].name + '</a></span>';
				$repoLink.innerHTML += '<span class="updated"><em>&nbsp;Updated: ' + updated.toLocaleDateString() + '&nbsp;</em></span><br/>';

				$reposList.appendChild($repoLink);
			}

			$reposList.className = 'repos';
			return $reposList;
		};

		GitHubWidget.prototype.render.profile = function() {
			var profile = $(
				`<div class="widget-profile">
					<img class="user-profile-avatar" src=${this.data.avatar_url}>
					<div class="widget-top">
						<h3 class="github-name"><i class="fa fa-github"></i>&nbsp;${this.data.name}<small class="lang-container"></small></h3>
					</div>
				</div>`
			);
			return $(profile).get(0);

		};

		GitHubWidget.prototype.render.langs = function() {
			var topLangs = [];
			for (var k in this.langs) {
				topLangs.push([k, this.langs[k]]);
			}

			topLangs.sort(function(a, b) {
				return b[1] - a[1];
			});

			// generating HTML structure
			var HTMLstring = '';
			for (var i = 0; i < 3 && topLangs[i]; i++) {
				HTMLstring += "<li class='language'>" + topLangs[i][0] + "</li>";
			}

			var languages = $(`<ul class="languages">${HTMLstring}</ul>`).get(0);
			$('.lang-container').append(languages);
		};

		// handle AJAX requests to GitHub's API
		GitHubWidget.prototype.getURL = function(url, async) {
			async = async || false;

			var request = new XMLHttpRequest();
			request.open("GET", url + '?access_token=' + PERSONAL_ACCESS_TOKEN, async);
			request.send();

			return request;
		};

		var widget = new GitHubWidget();


		// Generating new widget from user input
		document.addEventListener('DOMContentLoaded', function() {

			var options = widget.defaultConfig;

			// Sort repository acording to
			// radio inputs on website

			var $sortingRadios = document.querySelectorAll('.choose-repo-sorting label');

			// sort by update time
			$sortingRadios[0].addEventListener('click', function(element) {
				element.target.classList.add('active');
				$sortingRadios[1].classList.remove('active');

				options.sortBy = 'updateTime';
				options.reposHeaderText = element.target.textContent;

				widget.render(options);

			});

			// sort by starrgazers
			$sortingRadios[1].addEventListener('click', function(element) {
				element.target.classList.add('active');
				$sortingRadios[0].classList.remove('active');

				options.sortBy = 'stars';
				options.reposHeaderText = element.target.textContent;

				widget.render(options);
			});

			// Manipulating the number of repositories

			var $inputNumber = document.getElementById('gh-reposNum');

			$inputNumber.onchange = function() {
				options.maxRepos = $inputNumber.value;

				widget.render(options);
			}

			// Creating brand new widget instance
			// for user that we type in input

			var $input = document.getElementById('gh-uname'),
				$submit = document.getElementById('gh-uname-submit');

			$submit.addEventListener('click', function(element) {
				widget = new GitHubWidget({
					userName: $input.value
				});

				element.preventDefault();
			});
		});

	}
});