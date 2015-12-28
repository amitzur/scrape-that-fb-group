chrome.extension.sendMessage({}, function(response) {

	// http://stackoverflow.com/questions/10485992/hijacking-a-variable-with-a-userscript-for-chrome
	// This function is going to be stringified, and injected in the page
	var code = function() {
		console.log("injected script from injected script!");
		
		function toArr(nodeList) { 			return [].slice.call(nodeList, 0); }
		
		window.__highlight = function(selector, color) {
			toArr(document.querySelectorAll(selector)).forEach(el => { window.__highlightEl(el, color); });
		};

		window.__highlightEl = function(el, color) {
			el.style.position = "relative";
			var highlighter = document.createElement("div");
			highlighter.className = "highlighter";
			highlighter.style.cssText= "position:absolute;top:0;right:0;bottom:0;left:0;background:" + (color || "rgba(255,0,0,0.5);");
			el.appendChild(highlighter);
		};
	};
	var script = document.createElement('script');
	script.textContent = '(' + code + ')()';
	(document.head||document.documentElement).appendChild(script);
	script.parentNode.removeChild(script);
	
	
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

		function highlightEl(el) {
			el.style.position = "relative";
			var highlighter = document.createElement("div");
			highlighter.className = "highlighter";
			highlighter.style.cssText= "position:absolute;top:0;right:0;bottom:0;left:0;background:rgba(255,0,0,0.5);pointer-events:none;";
			el.appendChild(highlighter);
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
		
		function click(el) {
			console.log("clicking on: ", el);
			el.click();
			highlightEl(el);
		}
		
		function openComments(postEl, viewMoreCommentsEl) {
			return new Promise((resolve, reject) => {
				var initialComments = postEl.querySelectorAll(".UFIComment").length;
				click(viewMoreCommentsEl);
				waitFor(() => postEl.querySelectorAll(".UFIComment").length > initialComments)
					.then(() => { 
						return resolve(true); 
					})
					.catch(() => { 
						resolve(false); 
					});
			});
		}
		
		function waitFor(condition) {
			return new Promise((resolve, reject) => {
				var interval = setInterval(function() {
					if (condition()) {
						clearInterval(interval);
						clearTimeout(timeout);
						resolve();
					}
				}, 30);

				var timeout = setTimeout(function() {
					console.log("timeout reached");
					clearInterval(interval);
					reject();
				}, 5000);
			});
		}
		
		function openReplies(containerEl, retry = true) {
			function condition(link) {
				return (link.compareDocumentPosition(document) & Node.DOCUMENT_POSITION_DISCONNECTED) || /hide/i.test(link.textContent);
			}
		
			return new Promise((resolve, reject) => {
				var openRepliesLinks = toArr(containerEl.querySelectorAll(".UFIPagerLink")) // View more replies
					.concat(toArr(containerEl.querySelectorAll(".UFIReplySocialSentenceLinkText"))) // 'Some one' Replied · 4 replies
					.concat(toArr(containerEl.querySelectorAll(".fss"))).filter(el => !/hide/i.test(el.textContent)); // See more (on comment body)
					
				openRepliesLinks.forEach(click);
				
				waitFor(() => {
					return openRepliesLinks.every(condition);
				})
				.then(() => {
					return retry ? openReplies(containerEl, false) : openRepliesLinks.length > 0;
				})
				.then(didOpen => { 
					return resolve(didOpen);
				})
				.catch(() => {
					var notPassed = openRepliesLinks.filter(link => !condition(link));
					console.log.apply(console, ["not all replies were opened (" + notPassed.length + " links) trying again"].concat(notPassed));
					//if (retry) openReplies(containerEl, false)
					//	.then(didOpen => {
					//		return resolve(didOpen);
					//	})
					//	.catch(() => {
					//		console.log("tried a second time... still no work");
					//		resolve(false);
					//	});
				});
			});
		}

		function getComments(postEl) {
			var viewMoreCommentsEl = postEl.querySelector(".UFIPagerLink");
			if (viewMoreCommentsEl) {
				return new Promise((resolve, reject) => {
					openComments(postEl, viewMoreCommentsEl)
						.then(didOpen => {
							return openReplies(postEl);
						})
						.then(() => {
							return resolve(getInnerComments(postEl));
						})
						.catch(handleError);
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

				if (slugs.indexOf(slug) > -1) {
					console.log("skipping " + slug);
					return resolve();
				}
				
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
			.catch(err => {
				console.log("bad json format from server, harvesting it all...");
				return [];
			})
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
