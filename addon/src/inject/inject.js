chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		console.log("Hello. This message was sent from scripts/inject.js");
		// ----------------------------------------------------------

		function toArr(nodeList) {
			return [].slice.call(nodeList, 0);
		}

		function $$(selector) {
			return toArr(document.querySelectorAll(selector));
		}

		function getUserContent(el) {
			return el.innerHTML;
		}
		
		function getReplies(commentEl) {
			var next = commentEl.nextElementSibling;
			if (next && next.classList.contains("UFIReplyList")) {
				return getInnerComments(next);
			}
		}
		
		function getInnerComments(containerEl) {
			var firstComment = containerEl.querySelector(".UFIComment"), ret;
			if (firstComment) {
				ret = [getCommentData(firstComment)];

				var sibling = firstComment.nextElementSibling;
				while (sibling) {
					if (sibling.classList.contains("UFIComment")) {
						ret.push(getCommentData(sibling));
					}
					sibling = sibling.nextElementSibling;
				}
			}
			return ret;
		}
		
		function getCommentData(commentEl) {
			return {
				author: commentEl.querySelector(".UFICommentActorName").textContent,
				content: commentEl.querySelector(".UFICommentBody").innerHTML,
				comments: getReplies(commentEl)
			};
		}

		function getComments(postEl) {
			var viewMoreComments = postEl.querySelector(".UFIPagerLink");
			if (viewMoreComments) {
				return new Promise((resolve, reject) => {
					var initialComments = postEl.querySelectorAll(".UFIComment").length;
					viewMoreComments.click();
					var interval = setInterval(function() {
						if (postEl.querySelectorAll(".UFIComment").length > initialComments) {
							clearInterval(interval);
							clearTimeout(timeout);
							resolve(getInnerComments(postEl));
						}
					}, 30);
					
					var timeout = setTimeout(function() {
						console.log("timeout reached trying to click on view more comments");
						clearInterval(interval);
						resolve(getInnerComments(postEl));
					}, 5000);
				});
			} else {
				return Promise.resolve(getInnerComments(postEl));
			}
		}
		
		function parent(el, tagName) {
			do {
				el = el.parentNode;
			} while (el && el.tagName && (el.tagName.toUpperCase() !== tagName.toUpperCase()));
			return el;
		}
		
		function processPostAtIndex(index) {
			return new Promise((resolve, reject) => {
				console.log("processPostAtIndex: " + index);
				if (index > posts.length-1) {
					resolve(allData);
					return;
				}

				processPost(posts[index])
						.then(postData => { postData && allData.push(postData); return allData; })
						.then(() => { return processPostAtIndex(index+1) })
						.then(() => { resolve(allData); })
						.catch(handleError);
			});
		}
		
		function processPost(el) {
			return new Promise((resolve, reject) => {
				console.log("processPost");
				var authorEl = el.querySelector("h5"),
						author = authorEl.textContent,
						dateEl = authorEl.nextElementSibling,
						date = dateEl.textContent,
						tsEl = dateEl.querySelector("[data-utime]"),
						ts = tsEl.getAttribute("data-utime"),
						userContent = getUserContent(el.querySelector(".userContent")),
						mtmEl = el.querySelector(".mtm a"),
						mtm = mtmEl ? mtmEl.href : undefined,
						slugEl = dateEl.querySelector("a"),
						slug = slugEl && slugEl.href;

				if (slugs.indexOf(slug) > -1) return resolve();
				
				getComments(el)
					.then(comments => {
						var postData = {
							author: author,
							date: date,
							ts: ts,
							slug: slug,
							userContent: userContent,
							mtm: mtm,
							comments: comments
						}; 
						resolve(postData);
						return postData;
					})
					.catch(handleError);
			});
		}
		
		function scrape() {
			return new Promise((resolve, reject) => {
				posts = toArr($$("[id^=mall_post]"));
				processPostAtIndex(0).then(() => {
					resolve(allData);
				});

				//console.log("scraped " + posts.length + " posts in addition to initial " + allData.length);

				return allData;
			});
		}
		
		function sendData(data) {
			return new Promise((resolve, reject) => {
				var req = new XMLHttpRequest();
				req.open("POST", "http://localhost:9090");
				req.onload = function() {
					resolve(req.responseText);
				};
				req.send(JSON.stringify(data));
				console.log("request sent");
			});
		}
		
		var handleError = err => { console.error("error", err); };
		
		var allData, slugs, posts;

		fetch("http://localhost:8080/data/0.json")
			.then(resp => resp.json())
			.then(data => {
				allData = data;
				slugs = data.map(post => post.slug);
				return data; 
			})
			.then(scrape)
			.then(sendData)
			.then((responseText) => { return console.log("req onload: " + responseText); })
			.catch(handleError);
		
	}
	}, 10);
});

/*
 TODO:
 - view more replies
 - see more text in post
 - see more text in comments
 - author link
 - preview link
 - date for comment
 - likes on post
 - likes on comment
 - avatars
 - update comments in slugged entry
 */
