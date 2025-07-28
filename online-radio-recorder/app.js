(function () {
    const recordBtn = document.getElementById("record-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const stopBtn = document.getElementById("stop-btn");
    const downloadBtn = document.getElementById("download-btn");
    const recSwitch = document.getElementById("rec-switch");

    const clearBtn = document.getElementById("clear-btn");

    const selectPreset = document.getElementById("select-preset");

    const msgArea = document.getElementById("msg-area");
    const fileInfo = document.getElementById("file-info");
    const sizeInfo = document.getElementById("size-info");

    const audioElem = document.getElementById("audio-elem");
    const iframeElem = document.getElementById("iframe-elem");
    //https://diesi.gr/player/js/player_new.js
    const resetAudio = "about:blank";

    const selectStation = document.getElementById("select-station");

    const INTERVAL = 1000;

    let timeoutID = 0;
    let stationInfoURL = "";
    let stationCode = "";
    let streamURL = "";
    let allCodes = {};
    let allPresets = {};
    let presetFile = "";
    let headers = null;
    let contentType = "";
    let previousTrack = { "artist": "", "title": "", "duration": "" };
    let request = null;
    let eventSource = null;
    let recorder = undefined;
    let data = [];

    let mins = 0;
    let secs = 0;
    let intervalID = 0;

    window.onload = async function () {
        //allPresets = await loadData(source = "../stations-json-files.json", type = "json"); // global allPresets
        allPresets = await loadData(source = "stations-json-files.json", type = "json"); // global allPresets
        loadPresetsFromJSON(source = allPresets)
    };

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

    //Headers: has() method - Web APIs | MDN
    //https://developer.mozilla.org/en-US/docs/Web/API/Headers/has
    async function playAudioStream(source) {
        headers = await fetchHeaders(source); // global headers
        if (headers.has("Content-Type")) {
            contentType = headers.get("Content-Type"); // global contentType
            console.log(`contentType: ${contentType}`);
            audioElem.pause();
            audioElem.src = source;
            audioElem.load();
            if (iframeElem.dataState = "active") {
                //https://diesi.gr/player/js/player_new.js
                iframeElem.src = resetAudio;
                toggleDataState(iframeElem, dataState = "inactive");
                toggleDataState(audioElem, dataState = "active");
            }
            audioElem.play();
        } else {
            iframeElem.src = source;
            if (audioElem.dataState = "active") {
                audioElem.pause();
                //https://diesi.gr/player/js/player_new.js
                audioElem.src = resetAudio;
                toggleDataState(audioElem, dataState = "inactive");
                toggleDataState(iframeElem, dataState = "active");
            }
        }
        return;
    }

    function toggleDataState(element, dataState) {
        element.setAttribute("data-state", dataState);
        return;
    }

    function toggleControlElements(displayState) {
        sizeInfo.textContent = (displayState === "none") ? "" : sizeInfo.textContent;
        return;
    }

    async function loadData(source, type = "json") {
        let responseData = await subscribe(source, type = "json");
        return responseData;
    }

    function addOption(value = "", textContent = "Select a station") {
        let newOption = document.createElement("option");
        newOption.value = value;
        newOption.textContent = textContent;
        return newOption;
    }

    function loadPresetsFromJSON(source = allPresets) {
        if (selectPreset.childElementCount > 1) {
            //if (selectStation.children.length > 1) {
            selectPreset.innerHTML = `<option value="">Select preset stations</option>`;
        }
        //for (let key of Object.keys(source)) { // iterable
        for (let key in source) { // source not iterable
            let newPreset = addOption(value = key, textContent = source[key]["name"]);
            selectPreset.appendChild(newPreset);
        }
        console.log("Presets loaded");
        return;
    }

    //selectPreset.addEventListener("input", loadPresetFile);
    selectPreset.addEventListener("change", loadPresetFile);

    async function loadPresetFile(event) {
        //prevent the default action from occurring
        event.preventDefault();
        if (event.target.value) {
            let key = event.target.value;
            presetFile = allPresets[key]["file"]; // global presetFile, allPresets
            console.log(presetFile);
        }
        if (!isEmptyObject(allPresets) && presetFile) { // global allCodes, stationCode
            allCodes = await loadData(source = presetFile, type = "json"); // global allCodes
            loadStationsFromJSON(source = allCodes);
        }
        return;
    }

    /* HTML DOM Element childElementCount Property */
    /* https://www.w3schools.com/jsref/prop_element_childelementcount.asp */
    function loadStationsFromJSON(source = allCodes) {
        if (selectStation.childElementCount > 1) {
            //if (selectStation.children.length > 1) {
            selectStation.innerHTML = `<option value="">Select a station</option>`;
        }
        //for (let code of Object.keys(source)) { // iterable
        for (let code in source) { // source not iterable
            let newStation = addOption(value = code, textContent = source[code]["name"]);
            selectStation.appendChild(newStation);
        }
        console.log("Stations loaded");
        return;
    }

    //selectStation.addEventListener("input", loadStationInfoStream);
    selectStation.addEventListener("change", loadStationInfoStream);

    function loadStationInfoStream(event) {
        //prevent the default action from occurring
        event.preventDefault();
        if (event.target.value) {
            stationCode = event.target.value; // global stationCode
            console.log(stationCode);
        }
        if (!isEmptyObject(allCodes) && stationCode) { // global allCodes, stationCode
            streamURL = allCodes[stationCode]["stream"]; // global streamURL, allCodes, stationCode
            stationInfoURL = allCodes[stationCode]["now_playing"]; // global stationInfoURL, allCodes, stationCode
            showFileInfo();
            resetResponse();
            resetDuration();
            resetEventSource();
            resetRequest();
            if (recorder && recorder.state === "recording") { // global recorder
                recorder.pause();
                setMsg(msgArea, "revert", `${capitalize(recorder.state)}…`);
                console.log(`recorder.state: ${recorder.state}…`);
                pauseBtn.textContent = "▶";
            }
            playAudioStream(streamURL);
            if (stationInfoURL === "") {
                let stationTag = `<a href="${streamURL}" target="_blank">${allCodes[stationCode]["name"]}</a>`; // global streamURL
                setStationTag(msgArea, "revert", stationTag);
                fileInfo.innerHTML = stationTag; // global fileInfo
                sizeInfo.textContent = showDuration(""); // global sizeInfo
                intervalID = setInterval(function () {
                    advanceDuration();
                    sizeInfo.textContent = showDuration(""); // global sizeInfo
                }, INTERVAL);
            } else if (getResponseType(stationInfoURL) === "evtsrc") {
                fetchTrackInfoEventSource(stationInfoURL);
            } else if (getResponseType(stationInfoURL) !== "evtsrc") {
                //fetchTrackInfoXHR(stationInfoURL, type = getResponseType(stationInfoURL));
                fetchTrackInfo(stationInfoURL, type = getResponseType(stationInfoURL));
            }
        }
        return;
    }

    function getResponseType(source) {
        if (hasSubStr(source, "radiojar") || hasSubStr(source, "diesi") || hasSubStr(source, "melodic")) {
            return "json";
        } else if (hasSubStr(source, "xspf")) {
            return "xml";
        } else if (hasSubStr(source, "currentsong") || hasSubStr(source, "ertecho")) {
            return "text";
        } else if (hasSubStr(source, "zeno")) {
            return "evtsrc";
        }
        return "";
    }

    function fetchTrackInfoEventSource(url) {
        eventSource = new EventSource(url); // global eventSource
        let stationTag = `<a href="${streamURL}" target="_blank">${allCodes[stationCode]["name"]}</a>`; // global streamURL
        setStationTag(msgArea, "revert", stationTag);
        eventSource.addEventListener("message", function (event) {
            let parsedData = JSON.parse(event.data);
            console.log(`parsedData: ${JSON.stringify(parsedData)}`);
            let streamTitle = parsedData.streamTitle;
            console.log(`streamTitle: ${streamTitle}`);
            let currentTrack = capitalize(streamTitle);
            if (previousTrack !== currentTrack) { // global previousTrack
                resetDuration();
                console.log(`previousTrack: ${previousTrack}\ncurrentTrack: ${currentTrack}`);
                previousTrack = currentTrack; // global previousTrack
                let trackTag = `<a href="${streamURL}" target="_blank">${currentTrack}</a>`; // global streamURL
                fileInfo.innerHTML = trackTag; // global fileInfo
                sizeInfo.textContent = showDuration(""); // global sizeInfo
                intervalID = setInterval(function () { // global intervalID
                    advanceDuration();
                    sizeInfo.textContent = showDuration(""); // global sizeInfo
                }, INTERVAL);
            }
        });
        eventSource.addEventListener("error", function (event) {
            console.log(`readyState: ${this.readyState}`);
            if (this.readyState === EventSource.CLOSED) {
                console.log("Connection closed"); // Connection was closed.
            }
        });
        return;
    }

    async function subscribe(url, type = "json") {
        try {
            request = new AbortController(); // global request
            let response = await fetch(url, {
                signal: request.signal,
            });
            if (response.status === 200) {
                let responseData = null;
                if (type === "json") {
                    responseData = await response.json();
                } else if (type === "xml" || type === "text") {
                    responseData = await response.text();
                }
                return responseData;
            } else {
                throw new Error(response.status);
            }
        } catch (error) {
            if (error.name === "AbortError") {
                clearTimeout(timeoutID);
                timeoutID = 0;
                console.log("Request cancelled!");
            } else if (error.name !== "AbortError") {
                console.log("Info not available");
            }
            return "";
        }
    }

    /* Long polling */
    /* https://javascript.info/long-polling */
    async function fetchTrackInfo(url, type = "json") {
        let responseData = await subscribe(url, type);
        let currentTrack = { "artist": "", "title": "", "duration": "" };
        let stationTag = `<a href="${streamURL}" target="_blank">${allCodes[stationCode]["name"]}</a>`; // global streamURL
        setStationTag(msgArea, "revert", stationTag);
        if (responseData !== "") {
            if (type === "json") {
                if (responseData.artist !== undefined) {
                    currentTrack["artist"] = capitalize(responseData.artist);
                } else if (responseData.data.artist !== undefined) {
                    currentTrack["artist"] = capitalize(responseData.data.artist);
                }
                if (responseData.title !== undefined) {
                    currentTrack["title"] = capitalize(responseData.title);
                } else if (responseData.data.song !== undefined) {
                    currentTrack["title"] = capitalize(responseData.data.song);
                }
                if (responseData.duration !== undefined) {
                    currentTrack["duration"] = toMins(responseData.duration);
                }
            } else if (type === "xml") {
                currentTrack["artist"] = capitalize(getTagContent(source = responseData, tagName = "creator"));
                currentTrack["title"] = capitalize(getTagContent(source = responseData, tagName = "title"));
            } else if (type === "text") {
                if (!responseData.includes(`"`)) {
                    currentTrack["title"] = capitalize(responseData);
                } else {
                    currentTrack["title"] = capitalize(JSON.parse(responseData));
                }
            }
            if (!objectsAreEqual(previousTrack, currentTrack)) { // global previousTrack
                resetDuration();
                console.log(`previousTrack: ${JSON.stringify(previousTrack)}\ncurrentTrack: ${JSON.stringify(currentTrack)}`);
                previousTrack = currentTrack; // global previousTrack
                let trackInfo = "";
                if (currentTrack["artist"]) {
                    trackInfo = `${currentTrack["artist"]} - ${currentTrack["title"]}`;
                } else if (currentTrack["title"]) {
                    trackInfo = `${currentTrack["title"]}`;
                }
                let trackTag = `<a href="${streamURL}" target="_blank">${trackInfo}</a>`; // global streamURL
                let durationInfo = `${currentTrack["duration"]}`;
                fileInfo.innerHTML = trackTag; // global fileInfo
                sizeInfo.textContent = showDuration(durationInfo); // global sizeInfo
                intervalID = setInterval(function () {
                    advanceDuration();
                    sizeInfo.textContent = showDuration(durationInfo); // global sizeInfo
                }, INTERVAL);
            }
            // Call fetchTrackInfo() again to get the next message
            timeoutID = setTimeout(function () {
                clearTimeout(timeoutID);
                timeoutID = 0;
                fetchTrackInfo(url, type);
            }, INTERVAL);
        } else if (responseData === "") {
            fileInfo.innerHTML = stationTag; // global fileInfo
            sizeInfo.textContent = showDuration(""); // global sizeInfo
            intervalID = setInterval(function () {
                advanceDuration();
                sizeInfo.textContent = showDuration(""); // global sizeInfo
            }, INTERVAL);
        }
        return;
    }

    /* Promise() constructor - JavaScript | MDN */
    /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise#turning_a_callback-based_api_into_a_promise-based_one */
    function subscribeXHR(url, type = "json") {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            if (type === "json") {
                xhr.responseType = "json"; // read as JSON
            } else if (type === "xml") {
                xhr.responseType = "document"; // set the response format to XML document
            } else if (type === "text") {
                xhr.responseType = "text"; // set the response format to text in a string
            }
            xhr.addEventListener("load", (event) => {
                if (xhr.status === 200) {
                    let responseData = null;
                    if (type === "json") {
                        responseData = xhr.response; // get JSON data
                    } else if (type === "xml") {
                        responseData = xhr.responseXML; // get XML document
                    } else if (type === "text") {
                        responseData = xhr.responseText; // get text data
                    }
                    resolve(responseData);
                }
            });
            xhr.addEventListener("error", (event) => {
                console.log("Info not available");
                resolve(null);
            });
            xhr.addEventListener("abort", function (event) {
                clearTimeout(timeoutID);
                timeoutID = 0;
                console.log("Request cancelled!");
                resolve(null);
            });
            xhr.send();
            request = xhr; // global request
        });
    }

    /* HTML in XMLHttpRequest - Web APIs | MDN */
    /* https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/HTML_in_XMLHttpRequest */
    async function fetchTrackInfoXHR(url, type = "json") {
        let responseData = await subscribeXHR(url, type);
        let currentTrack = { "artist": "", "title": "", "duration": "" };
        let stationTag = `<a href="${streamURL}" target="_blank">${allCodes[stationCode]["name"]}</a>`; // global streamURL
        setStationTag(msgArea, "revert", stationTag);
        if (responseData !== "") {
            let artistContent = "";
            let titleContent = "";
            if (type === "json") {
                if (responseData.artist !== undefined) {
                    currentTrack["artist"] = capitalize(responseData.artist);
                } else if (responseData.data.artist !== undefined) {
                    currentTrack["artist"] = capitalize(responseData.data.artist);
                }
                if (responseData.title !== undefined) {
                    currentTrack["title"] = capitalize(responseData.title);
                } else if (responseData.data.song !== undefined) {
                    currentTrack["title"] = capitalize(responseData.data.song);
                }
                if (responseData.duration !== undefined) {
                    currentTrack["duration"] = toMins(responseData.duration);
                }
            } else if (type === "xml") {
                if (responseData.getElementsByTagName("creator")[1] !== undefined) {
                    artistContent = responseData.getElementsByTagName("creator")[1].childNodes[0].nodeValue;
                    currentTrack["artist"] = capitalize(artistContent);
                }
                if (responseData.getElementsByTagName("title")[1].childNodes[0] !== undefined) {
                    titleContent = responseData.getElementsByTagName("title")[1].childNodes[0].nodeValue;
                    currentTrack["title"] = capitalize(titleContent);
                }
            } else if (type === "text") {
                if (!responseData.includes(`"`)) {
                    currentTrack["title"] = capitalize(responseData);
                } else {
                    currentTrack["title"] = capitalize(JSON.parse(responseData));
                }
            }
            if (!objectsAreEqual(previousTrack, currentTrack)) { // global previousTrack
                resetDuration();
                console.log(`previousTrack: ${JSON.stringify(previousTrack)}\ncurrentTrack: ${JSON.stringify(currentTrack)}`);
                previousTrack = currentTrack; // global previousTrack
                let trackInfo = "";
                if (currentTrack["artist"]) {
                    trackInfo = `${currentTrack["artist"]} - ${currentTrack["title"]}`;
                } else if (currentTrack["title"]) {
                    trackInfo = `${currentTrack["title"]}`;
                }
                let trackTag = `<a href="${streamURL}" target="_blank">${trackInfo}</a>`; // global streamURL
                let durationInfo = `${currentTrack["duration"]}`;
                fileInfo.innerHTML = trackTag; // global fileInfo
                sizeInfo.textContent = showDuration(durationInfo); // global sizeInfo
                intervalID = setInterval(function () {
                    advanceDuration();
                    sizeInfo.textContent = showDuration(durationInfo); // global sizeInfo
                }, INTERVAL);
            }
            // Call fetchTrackInfoXHR() again to get the next message
            timeoutID = setTimeout(function () {
                clearTimeout(timeoutID);
                timeoutID = 0;
                fetchTrackInfoXHR(url, type);
            }, INTERVAL);
        } else if (responseData === "") {
            fileInfo.innerHTML = stationTag; // global fileInfo
            sizeInfo.textContent = showDuration(""); // global sizeInfo
            intervalID = setInterval(function () {
                advanceDuration();
                sizeInfo.textContent = showDuration(""); // global sizeInfo
            }, INTERVAL);
        }
        return;
    }

    function setAudioRecorder(audioElem) {
        /*
        let userAgent = navigator.userAgent;
        console.log(`userAgent: ${userAgent}`);
        //let captureStream = userAgent.indexOf("Firefox") === -1 ?  audioElem.captureStream() : audioElem.mozCaptureStream();
        //A MediaStream object which can be used as a source for audio data by other media processing code
        let captureStream = audioElem.captureStream ? audioElem.captureStream() : audioElem.mozCaptureStream();
        console.log(captureStream); // give this to MediaRecorder
        let recorder = new MediaRecorder(captureStream);
        */

        // recorder = audioElem.captureStream ? setMediaRecorder(audioElem) : setMediaRecorderAlter(audioElem); // global recorder

        return setMediaRecorder(audioElem);
    }

    //1573031 - starting video recording of video html element with MediaRecorder mutes its sound
    //https://bugzilla.mozilla.org/show_bug.cgi?id=1573031#c4
    function setMediaRecorder(mediaElement) {
        //MediaStreamAudioDestinationNode - Web APIs | MDN
        //https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamAudioDestinationNode
        //MediaStreamAudioDestinationNode: stream property - Web APIs | MDN
        //https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamAudioDestinationNode/stream
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
        //adjust volume to 0.5 gain by the GainNode.gain parameter
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);

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
        //adjust volume to 0.5 gain by the GainNode.gain parameter
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);

        return new MediaRecorder(destination.stream);
    }

    recordBtn.addEventListener("click", function () {
        //if (audioElem.attributes.src === undefined || recSwitch.value === "off" || recorder.state === "recording" || recorder.state === "paused") {
        //if (audioElem.attributes.src.value === "" || recSwitch.value === "off" || recorder.state === "recording" || recorder.state === "paused") {
        if (audioElem.attributes.src.value === resetAudio || recSwitch.value === "off" || recorder.state === "recording" || recorder.state === "paused") {
            setMsg(msgArea, "revert", "Record deactivated…");
            console.log(`Cannot record…`);
        } else if (recorder.state === "inactive") {
            data = []; // global data
            recorder.start();
            // listen to dataavailable, which gets triggered whenever we have an audio blob available
            recorder.addEventListener("dataavailable", function (event) {
                data.push(event.data); // global data
            });
            setMsg(msgArea, "revert", `${capitalize(recorder.state)}…`);
            console.log(`recorder.state: ${recorder.state}…`);
        }
        return;
    }, false);

    pauseBtn.addEventListener("click", function () {
        if (recSwitch.value === "off" || recorder.state === "inactive") {
            setMsg(msgArea, "revert", "Pause deactivated…");
            console.log(`Cannot pause…`);
        } else if (recorder.state === "recording") {
            recorder.pause();
            setMsg(msgArea, "revert", `${capitalize(recorder.state)}…`);
            console.log(`recorder.state: ${recorder.state}…`);
            this.textContent = "▶";
        } else if (recorder.state === "paused") {
            recorder.resume();
            console.log("resume recording");
            setMsg(msgArea, "revert", `${capitalize(recorder.state)}…`);
            console.log(`recorder.state: ${recorder.state}…`);
            this.textContent = "⏸";
        }
        return;
    }, false);

    stopBtn.addEventListener("click", function () {
        if (recSwitch.value === "off" || recorder.state === "inactive") {
            setMsg(msgArea, "revert", "Stop deactivated…");
            console.log(`Cannot stop…`);;
        } else if (recorder.state === "recording" || recorder.state === "paused") {
            // Stopping the recorder will eventually trigger the `dataavailable` event and we can complete the recording process
            recorder.stop();
            setMsg(msgArea, "revert", "Recording Complete");
            console.log(`recorder.state: ${recorder.state}…`);
        }
        return;
    }, false);

    downloadBtn.addEventListener("click", function () {
        if (recSwitch.value === "off" || !data || !data.length || recorder.state === "recording" || recorder.state === "paused") {
            setMsg(msgArea, "revert", "Download deactivated…");
            console.log(`Cannot download…`);
        } else if (data && data.length && recorder.state === "inactive") {
            setMsg(msgArea, "revert", "Downloading…");
            console.log(`Downloading…`);
            let recordedBlob = new Blob(data, { type: contentType }); // global data, contentType
            let stationName = allCodes[stationCode]["name"] // global allCodes, stationCode
            //let extension = contentType.split('/')[1]; // global contentType
            let aTag = document.createElement("a");
            aTag.href = URL.createObjectURL(recordedBlob);
            aTag.setAttribute("download", `${replaceSpaces(stationName.toLowerCase())}.mp3`);
            aTag.click();
            console.log(`Successfully recorded ${formatFileSize(recordedBlob.size)} of ${recordedBlob.type} media.`);
        }
        return;
    }, false);

    //recSwitch.addEventListener("click", function () {
    recSwitch.addEventListener("change", function () {
        if (this.value === "off") {
            switchRecorder("on");
        } else if (this.value === "on") {
            switchRecorder("off");
        }
        console.log(`Recorder: ${capitalize(this.value)}`);
        return;
    });

    function switchRecorder(state = "on") {
        recSwitch.value = state; // global recSwitch
        recorder = (state === "on") ? setAudioRecorder(audioElem) : undefined; // global recorder,audioElem
        return;
    }

    clearBtn.addEventListener("click", clearAll);

    function clearAll() {
        //if (audioElem.attributes.src === undefined) {
        if (audioElem.attributes.src.value === resetAudio) {
            setMsg(msgArea, "none", "");
            showFileInfo();
        }
        switchRecorder("off");
        recSwitch.checked = false; // global recSwitch
        resetParams();
        resetRequest();
        resetResponse();
        resetDuration();
        resetEventSource();
        return;
    }

    function resetParams() {
        stationCode = "";
        stationInfoURL = "";
        streamURL = "";
        return;
    }

    function resetResponse() {
        clearTimeout(timeoutID); // global timeoutID
        timeoutID = 0; // global timeoutID
        console.log("Timeout cleared");
        return;
    }

    function resetEventSource() {
        if (eventSource) { // global eventSource
            eventSource.close(); // global eventSource
            console.log("Event source closed");
        }
        return;
    }

    function resetRequest() {
        if (request) { // global request
            request.abort(); // global request
            console.log("Request aborted");
        }
        return;
    }

    function resetDuration() {
        clearInterval(intervalID);
        intervalID = 0; // global intervalID
        console.log("Interval cleared");
        mins = 0; // global mins
        secs = 0; // global secs
        return;
    }
    function advanceDuration() {
        secs += 1; // global secs
        if (secs > 59) {
            mins += 1; // global mins
            secs = 0;
        }
        return;
    }
    function setDuration() {
        return `${mins}:${doubleDigits(secs)}`; // global mins, secs
    }
    function showDuration(durationText = durationInfo) {
        return (durationText !== "") ? `(${setDuration()}/${durationText})` : `(${setDuration()})`;
    }

    /* Object.is() - JavaScript | MDN */
    /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is */
    function objectsAreEqual(objA, objB) {
        if (Object.values(objA).length !== Object.values(objB).length) {
            return false;
        }
        for (let i = 0; i < Object.values(objA).length; i++) {
            //if (Object.values(objA)[i] !== Object.values(objB)[i]) {
            if (!Object.is(Object.values(objA)[i], Object.values(objB)[i])) {
                return false;
            }
        }
        return true;
    }

    /* How do I test for an empty JavaScript object? */
    /* https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object */
    function isEmptyObject(obj) {
        for (let key in obj) {
            return false;
        }
        return true;
    }

    /* javascript - Template literal inside of the RegEx */
    /* https://stackoverflow.com/questions/43390873/template-literal-inside-of-the-regex */
    function getTagContent(source, tagName = "title") {
        //const tagRegex = /(?<=<title>)(.+?)(?=<\/title>)/;
        const tagRegex = new RegExp(`(?<=<${tagName}>)(.+?)(?=<\/${tagName}>)`);
        let tagContent = "";
        if (tagRegex.test(source)) {
            tagContent = tagRegex.exec(source)[0];
        }
        return tagContent;
    }

    function hasSubStr(str, subStr = "radiojar") {
        const subStrRegex = new RegExp(`${subStr}`);
        return subStrRegex.test(str);
        //return str.includes(subStr);
    }

    /* How to Capitalize the First Letter of a String in JavaScript */
    /* https://www.freecodecamp.org/news/how-to-capitalize-the-first-letter-of-a-string-in-javascript/ */
    /* capitalize first letter of every word in a string */
    function capitalize(str = '') {
        if (typeof (str) === "string") {
            let capStr = [];
            for (word of str.split(' ')) {
                if (word !== "" && word.charAt(0) !== '(' && word.charAt(0) !== '[') { // if str has consecutive ' '
                    capStr.push(word.charAt(0).toUpperCase() + word.slice(1, word.length).toLowerCase());
                } else if (word.charAt(0) === '(' || word.charAt(0) === '[') { // if word begins with '(' or '['
                    capStr.push(word.charAt(0) + word.charAt(1).toUpperCase() + word.slice(2, word.length).toLowerCase());
                }
            }
            return capStr.join(' ');
        }
        return '';
    }

    function capitalizeAlt(str = '') {
        if (typeof (str) === "string") {
            str = str.charAt(0).toUpperCase() + str.slice(1, str.length).toLowerCase();
            strArr = Array.from(str);
            for (let i = 1; i < strArr.length; i++) {
                if (strArr[i] === ' ' && i + 1 < strArr.length) {
                    if (strArr[i + 1] !== '(' && strArr[i + 1] !== '[') {
                        strArr[i + 1] = strArr[i + 1].toUpperCase();
                    } else if (strArr[i + 1] === '(' || strArr[i + 1] === '[' && i + 2 < strArr.length) {
                        strArr[i + 2] = strArr[i + 2].toUpperCase();
                    }
                }
            }
            return strArr.join('');
        }
        return '';
    }

    function doubleDigits(numStr) {
        let prefix = (Math.abs(numStr) < 10) ? "0" : "";
        return prefix + Math.abs(numStr);
    }

    function toMins(numStr) {
        if (numStr !== "0") {
            numStr = Math.abs(numStr);
            let mins = Math.trunc(numStr / 60);
            let secs = numStr % 60;
            return `${mins}:${doubleDigits(secs)}`;
        }
        return "";
    }

    function setMsg(element, displayState, msgText) {
        element.style.display = displayState;
        //element.textContent = msgText;
        element.innerHTML = msgText;
        return;
    }

    function setStationTag(element, displayState, msgText) {
        element.style.display = displayState;
        element.innerHTML = msgText;
        return;
    }

    function showFileInfo(element = fileInfo, span = sizeInfo, fileText = "", sizeText = "") {
        //element.textContent = fileText
        element.innerHTML = fileText;
        //span.innerHTML = sizeText;
        span.textContent = sizeText;
        return;
    }

    function formatFileSize(number) {
        if (number < 1024) {
            return `${number} bytes`;
        } else if (number >= 1024 && number < 1048576) {
            return `${(number / 1024).toFixed(1)} KB`;
        } else if (number >= 1048576 && number < 1073741824) {
            return `${(number / 1048576).toFixed(1)} MB`;
        } else if (number >= 1073741824) {
            return `${(number / 1073741824).toFixed(2)} GB`;
        }
    }

    function replaceSpaces(str) {
        return str.replaceAll(" ", "-");
    }
})();

/* Sort an Object by Value in JavaScript (How To Guide) | by ryan | Medium */
/* https://archive.is/2025.07.22-120505/https://medium.com/@ryan_forrester_/sort-an-object-by-value-in-javascript-how-to-guide-3ef492e630af */
function sortObjectByPropertyValueStr(obj, prop) {
    return Object.fromEntries(
        //Object.entries(obj).sort(([, a], [, b]) => a.prop.localeCompare(b.prop))
        Object.entries(obj).sort(([, a], [, b]) => a[prop].localeCompare(b[prop]))
    );
}
function sortObjectByPropertyValueNum(obj, prop) {
    return Object.fromEntries(
        Object.entries(obj).sort(([, a], [, b]) => a.prop - b.prop)
    );
}

function isObject(obj) {
    return typeof (obj) === 'object' && !Array.isArray(obj) && obj !== null;
}

/* What is the correct way to check for string equality in JavaScript? */
/* https://stackoverflow.com/questions/3586775/what-is-the-correct-way-to-check-for-string-equality-in-javascript */
/* String.prototype.localeCompare() - JavaScript | MDN */
/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare */
function isEquivStr(aStr = "", bStr = "") {
    if (aStr.length !== bStr.length) {
        return false;
    }
    return aStr.localeCompare(bStr) === 0;
}

/* javascript - Regex replace a set of characters */
/* https://stackoverflow.com/questions/31355327/regex-replace-a-set-of-characters */
function replaceInvalid(str, char = '-') {
    const set = /[\/*?:"<>|]/g;
    return str.replace(set, char);
}

/* Blob: text() method - Web APIs | MDN */
/* https://developer.mozilla.org/en-US/docs/Web/API/Blob/text */
async function readJsonFileBlob(jsonFile) {
    try {
        let fileBlob = new Blob([jsonFile], { type: "text/plain" });
        let fileContent = await fileBlob.text();
        return JSON.parse(fileContent);
    } catch (error) {
        return JSON.parse("{}");
    }
}

/* Blob: text() method - Web APIs | MDN */
/* https://developer.mozilla.org/en-US/docs/Web/API/Blob/text */
async function readJsonFile(jsonFile) {
    try {
        let fileContent = await jsonFile.text();
        return JSON.parse(fileContent);
    } catch (error) {
        return JSON.parse("{}");
    }
}

/* Response: json() method - Web APIs | MDN */
/* https://developer.mozilla.org/en-US/docs/Web/API/Response/json */
async function readJsonFileResponse(jsonFile) {
    try {
        let response = await new Response(jsonFile);
        if (response.ok) {
            let fileContent = await response.json();
            return fileContent;
        }
    } catch (error) {
        return JSON.parse("{}");
    }
}

/* FileReader: FileReader() constructor - Web APIs | MDN */
/* https://developer.mozilla.org/en-US/docs/Web/API/FileReader/FileReader */
/* FileReader: readAsText() method - Web APIs | MDN */
/* https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsText */
/* Promise() constructor - JavaScript | MDN */
/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise#turning_a_callback-based_api_into_a_promise-based_one */
function readJsonFileReader(jsonFile) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.readAsText(jsonFile);
        // useCapture: false - The handler is executed in the bubbling phase, inner first, to outer
        reader.addEventListener("load", function (event) {
            try {
                resolve(JSON.parse(event.target.result));
            } catch (error) {
                resolve(JSON.parse("{}"));
            }
        }, false);
    });
}
function readJson(jsonFile) {
    let reader = new FileReader();
    // useCapture: false - The handler is executed in the bubbling phase, inner first, to outer
    reader.addEventListener("load", function (event) {
        try {
            allCodes = JSON.parse(event.target.result); // global allCodes
            //allCodes = JSON.parse(reader.result); // global allCodes
            loadStationsFromJSON(source = allCodes);
            return;
        } catch (error) {
            allCodes = JSON.parse("{}"); // global allCodes
            return;
        }
    }, false);
    reader.readAsText(jsonFile);
    return;
}