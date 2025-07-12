	(function(){
		const docUrl = document.getElementById("doc-url");
		const iframe = document.getElementById("i-frame");
		const recordBtn = document.getElementById("record-btn");
		const pauseBtn = document.getElementById("pause-btn");
		const stopBtn = document.getElementById("stop-btn");
		const downloadBtn = document.getElementById("download-btn");
		const clearBtn = document.getElementById("clear-btn");

		const msgArea = document.getElementById("msg-area");
		const fileInfo = document.getElementById("file-info");

		let audioURL = "";
		let headers = null;
		let contentType = "";
		let recorder = undefined;
		let data = [];

		docUrl.addEventListener("keypress", checkKey);

		function checkKey(event) {
			//console.log(event.key);
			// αν το key του event είναι "Enter", τότε καλεί τη συνάρτηση checkUrl
			if (event.key === "Enter") {
				checkUrl(source=docUrl.value);
			}
		}

		async function checkUrl(source) {
			const validExtensions = ["audio/mp4", "audio/mpeg", "audio/mp3", "audio/webm", "audio/aac", "audio/x-aac", "audio/aacp", "audio/ogg", "application/ogg"];
			headers = await fetchHeaders(source); // global headers
			if (headers) {
				for (let pair of headers.entries()) {
					console.log(`${pair[0]}: ${pair[1]}`); // Display the headers key/value pairs
				}
			}
			contentType = (headers.get("Content-Type")) ? headers.get("Content-Type") : ""; // global contentType
			if (validExtensions.includes(contentType)) {
				audioURL = source; // global audioURL
				setMsg(msgArea, "none", "");
				fileInfo.innerHTML = `<a href=${decodedURL(source)} target="_blank">${decodeURIComponent(source)}</a>`;
				if (!document.getElementById("new-audio")) {
					recorder = setAudioRecorder(source); // global recorder
				} else {
					let newAudio = document.getElementById("new-audio");
					newAudio.src = source;
				}
			} else {
				setMsg(msgArea, "revert", "Please enter a valid stream URL in the input box");
			}
			toggleControlElements("revert");
			docUrl.value = ""; // global docUrl
			return;
		}

		async function fetchHeaders(url) {
			try {
				let response = await fetch(url, {
					method: "GET",  /* use "HEAD" - we only need the headers! */
				});
				return response.headers;
			} catch (error) {
				return new Headers();
			}
		}

		function decodedURL(source) {
			const percent = /%/;
			const space = /%20/;
			let result = source;
			if (percent.test(source)) { // contains Unicode characters
				let decoded = decodeURIComponent(source); // decode source URL
				result = decoded;
				if (space.test(source)) { // contains spaces
					let decodedWithSpaces = decoded.replaceAll(" ", "%20"); // replace all spaces with "%20" character
					result = decodedWithSpaces;
				}
			}
			return result;
		}					

		function addAudioTrack(id, src, controls = "controls", preload = "metadata", autoplay = "autoplay", crossorigin = "anonymous") {
			//let audio = new Audio();
			let audio = document.createElement("audio");
			audio.id = id;
			audio.src = src;
			audio.controls = controls;
			audio.preload = preload;
			audio.autoplay = autoplay;
			//audio.setAttribute("crossorigin", crossorigin);
			audio.crossOrigin = crossorigin;
			return audio;
		}

		function setAudioRecorder(url) {
			iframe.innerHTML = "";
			let newAudio = addAudioTrack(id = "new-audio", src = url);
			iframe.appendChild(newAudio);
			//let source = addSourceTrack(id="new-src", src=url);
			//newAudio.appendChild(source);
			/*
			let userAgent = navigator.userAgent;
			console.log(`userAgent: ${userAgent}`);
			//let captureStream = userAgent.indexOf("Firefox") === -1 ?  newAudio.captureStream() : newAudio.mozCaptureStream();
			//A MediaStream object which can be used as a source for audio data by other media processing code
			let captureStream = newAudio.captureStream ? newAudio.captureStream() : newAudio.mozCaptureStream();
			let recorder = new MediaRecorder(captureStream);
			*/
			let recorder = undefined;
			if (newAudio.captureStream) {
				let captureStream = newAudio.captureStream();
				console.log(captureStream); // give this to MediaRecorder
				recorder = new MediaRecorder(captureStream);
			} else {
				//recorder = setMediaRecorderAlter(newAudio);
				recorder = setMediaRecorder(newAudio);
			}
			return recorder;
		}

		function setMediaRecorder(mediaElement) {
			//MediaElementAudioSourceNode: MediaElementAudioSourceNode() constructor - Web APIs | MDN
			//https://developer.mozilla.org/en-US/docs/Web/API/MediaElementAudioSourceNode/MediaElementAudioSourceNode
			//javascript - Mixing Audio elements into one stream destination for use with MediaRecorder - Stack Overflow
			//https://stackoverflow.com/questions/54114613/mixing-audio-elements-into-one-stream-destination-for-use-with-mediarecorder
			let audioCtx = new AudioContext();
			let mediaStreamDestination = new MediaStreamAudioDestinationNode(audioCtx);
			let mediaElementSource = new MediaElementAudioSourceNode(audioCtx, { mediaElement: mediaElement });
			mediaElementSource.connect(mediaStreamDestination);
			console.log(mediaStreamDestination.stream); // give this to MediaRecorder

			//BaseAudioContext: createGain() method - Web APIs | MDN
			//https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createGain
			let gainNode = audioCtx.createGain();
			mediaElementSource.connect(gainNode);
			gainNode.connect(audioCtx.destination);

			return new MediaRecorder(mediaStreamDestination.stream);
		}
		
		function setMediaRecorderAlter(mediaElement) {
			//AudioContext: createMediaStreamDestination() method - Web APIs | MDN
			//https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaStreamDestination
			//AudioContext: createMediaElementSource() method - Web APIs | MDN
			//https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource
			//AudioDestinationNode - Web APIs | MDN
			//https://developer.mozilla.org/en-US/docs/Web/API/AudioDestinationNode
			//Working with the Web Audio API. The Web Audio API is a powerful and… | by Carlos A. Rojas | CarlosRojasDev
			//https://blog.carlosrojas.dev/working-with-the-web-audio-api-719b2507d452
			let audioCtx = new AudioContext();
			let destination = audioCtx.createMediaStreamDestination();

			let audioSource = audioCtx.createMediaElementSource(mediaElement);
			audioSource.connect(audioCtx.destination);

			console.log(destination.stream); // give this to MediaRecorder

			//BaseAudioContext: createGain() method - Web APIs | MDN
			//https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createGain
			let gainNode = audioCtx.createGain();
			audioSource.connect(gainNode);
			gainNode.connect(audioCtx.destination);

			return new MediaRecorder(destination.stream);
		}				

		function addSourceTrack(id, src) {
			let source = document.createElement("source");
			source.id = id;
			source.src = src;
			source.type = `${contentType}`; // global contentType
			return source;
		}

		recordBtn.addEventListener("click", function () {
			//https://whatemoji.org/red-circle/
			if (!recorder || recorder.state === "recording" || recorder.state === "paused") {
				setMsg(msgArea, "revert", "Record deactivated…");
				console.log(`Cannot record…`);
				toggleControlElements("revert");
			} else if (recorder.state === "inactive") {
				recorder.start();
				// listen to dataavailable, which gets triggered whenever we have an audio blob available
				recorder.addEventListener("dataavailable", function (event) {
					data.push(event.data); // global data
				});
				setMsg(msgArea, "revert", `${recorder.state}…`);
				console.log(`recorder.state: ${recorder.state}…`);
				toggleControlElements("none");
			}
			return;
		}, false);

		pauseBtn.addEventListener("click", function() {
			//https://emojipedia.org/pause-button
			//https://emojipedia.org/play-button
			//https://emojidb.org/right-triangle-emojis
			//https://emojidb.org/vertical-2-lines-emojis
			if (!recorder || recorder.state === "inactive") {
				setMsg(msgArea, "revert", "Pause deactivated…");
				console.log(`Cannot pause…`);
				toggleControlElements("revert");
			} else if (recorder.state === "recording") {
				recorder.pause();
				setMsg(msgArea, "revert", `${recorder.state}…`);
				console.log(`recorder.state: ${recorder.state}…`);
				this.textContent =  "▶";
				toggleControlElements("none");
			} else if (recorder.state === "paused") {
				recorder.resume();
				console.log("resume recording");
				setMsg(msgArea, "revert", `${recorder.state}…`);
				console.log(`recorder.state: ${recorder.state}…`);
				this.textContent = "⏸";
				toggleControlElements("none");
			}
			return;
		}, false);

		stopBtn.addEventListener("click", function () {
			//https://emojipedia.org/stop-button
			//https://emojisymbols.net/white-large-square/
			if (!recorder || recorder.state === "inactive" || recorder.state === "paused") {
				setMsg(msgArea, "revert", "Stop deactivated…");
				console.log(`Cannot stop…`);;
			} else if (recorder.state === "recording") {
				// Stopping the recorder will eventually trigger the `dataavailable` event and we can complete the recording process
				recorder.stop();
				setMsg(msgArea, "revert", "Recording Complete");
				console.log(`recorder.state: ${recorder.state}…`);
			}
			toggleControlElements("revert")
			return;
		}, false);

		downloadBtn.addEventListener("click", function () {
			//https://emojisymbols.net/red-circle/
			if (!recorder || !data || !data.length || recorder.state === "recording" || recorder.state === "paused") {
				setMsg(msgArea, "revert", "Download deactivated…");
				console.log(`Cannot download…`);
			} else if (data && data.length && recorder.state === "inactive") {
				setMsg(msgArea, "revert", "Downloading…");
				console.log(`Downloading…`);
				let recordedBlob = new Blob(data, { type: contentType }); // global data, contentType
				let extension = contentType.split('/')[1]; // global contentType
				let aTag = document.createElement("a");
				aTag.href = URL.createObjectURL(recordedBlob);
				//aTag.download = `${fetchFileNameFromURL(audioURL)}.${extension}`; // global audioURL
				//aTag.download = `${replaceInvalid(getFileNameFromURL(audioURL))}.${extension}`; // global audioURL
				aTag.setAttribute("download", "");
				aTag.click();
				console.log(`Successfully recorded ${formatFileSize(recordedBlob.size)} of ${recordedBlob.type} media.`);
			}
			toggleControlElements("revert");
			return;
		}, false);

		function formatFileSize(number) {
			if (number < 1024) {
				return `${number} bytes`;
			} else if (number >= 1024 && number < 1048576) {
				return `${(number / 1024).toFixed(0)} KB`;
			} else if (number >= 1048576 && number < 1073741824) {
				return `${(number / 1048576).toFixed(2)} MB`;
			} else if (number >= 1073741824) {
				return `${(number / 1073741824).toFixed(2)} GB`;
			}
		}

		function getFileExtension(fileName) {
			return fileName.substring(fileName.lastIndexOf('.') + 1);
		}

		function replaceSpaces(str) {
			return str.replaceAll(" ", "-");
		}

		function getFileNameFromURL(url) {
			//return decodedURL(url).replace(/^.*[\\\/]/, '');
			return replaceSpaces(decodeURIComponent(url)).replace(/^.*[\\\/]/, '');
		}

		function fetchFileNameFromURL(url) {
			return replaceInvalid(url.substring(url.lastIndexOf('/') + 1));
		}

		/* javascript - Regex replace a set of characters */
		/* https://stackoverflow.com/questions/31355327/regex-replace-a-set-of-characters */
		function replaceInvalid(str, char = '-') {
			const set = /[\/*?:"<>|]/g;
			return str.replace(set, char);
		}					
		
		function setMsg(element, displayState, msgText) {
			element.style.display = displayState;
			element.textContent = msgText;
			return;
		}	

		function toggleControlElements(displayState) {
			clearBtn.style.display = displayState;
			return;
		}

		// MediaRecorder API Tutorial - DEV Community
		// https://dev.to/ethand91/mediarecorder-api-tutorial-54n8
		function resetParams() {
			recorder = undefined; // global recorder
			data = []; // global audioURL
			audioURL = ""; // global audioURL
			docUrl.value = ""; // global docUrl
			docUrl.focus();
			iframe.innerHTML = ""; // global iframe
			fileInfo.innerHTML = ""; // global fileInfo
			return;
		}					

		clearBtn.addEventListener("click", clearAll);

		function clearAll() {
			setMsg(msgArea, "none", "");
			toggleControlElements("none");
			resetParams();
			return;
		}
	})();