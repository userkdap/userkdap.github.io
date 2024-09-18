        (function () {

        const docUrl = document.getElementById("doc-url");

        const uploadStation = document.getElementById("upload-station");
        const openStation = document.getElementById("open-station");
        const clickToLoad = document.getElementById("load-stations");
        const clickToExport = document.getElementById("export-stations");
        const clearBtn = document.getElementById("clear-btn");
        const msgArea = document.getElementById("msg-area");
        const fileInfo = document.getElementById("file-info");
        const sizeInfo = document.getElementById("size-info");

        const dropbox = document.getElementById("dropbox");

        const iframe = document.getElementById("i-frame");

        const selectStation = document.getElementById("select-station");

        const INTERVAL = 1000;

        let timeoutID = 0;
        let stationInfoURL = "";
        let stationCode = "";
        let streamURL = "";
        let allCodes = {};
        let addedStations = {};
        let allExports = "";
        let headers = null;
        let previousTrack = { "artist": "", "title": "", "duration": "" };
        let request = null;
        
        docUrl.addEventListener("keypress", checkKey);

        /* Key values for keyboard events - Web APIs | MDN */
        /* https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values */
        function checkKey(event) {
            //console.log(event.key);
            // αν το key του event είναι "Enter", τότε καλεί τη συνάρτηση openRemote
            if (event.key === "Enter") {
                checkUrl(source = docUrl.value);
            } else if (event.key === " ") {
                openStream(source = docUrl.value);
            }
        }
        
        async function openStream(source = docUrl.value) {
            if (isValidURL(source)) {
                source = source.trim();
                const validExtensions = ["audio/mp4", "audio/mpeg", "audio/aacp", "audio/ogg", "application/ogg"];
                headers = await fetchHeaders(source); // global headers
                let contentType = headers.get("Content-Type");
                console.log(`contentType: ${contentType}`);
                if (validExtensions.includes(contentType) || (isValidUrlStrict(source))) {
                    streamURL = source; // global streamURL
                    fileInfo.innerHTML = `<a href="${streamURL}" target="_blank">${streamURL}</a>`;
                    playStream(streamURL);
                } else {
                    setMsg(msgArea, "revert", "Please type URL of an audio stream");
                }
            } else {
                setMsg(msgArea, "revert", "Please enter a valid URL");
            }
            docUrl.value = "";
            toggleControlElements("revert");
            return;
        }

        function checkUrl(source = docUrl.value) {
            if (isValidURL(source)) {
                const validHosts = ["www.radiojar.com", "stream.radiojar.com", "ice.greekstream.net"];
                let url = new URL(source);
                if (validHosts.includes(url.host)) {
                    resetResponse();
                    stationCode = getStationCode(href = url.href, host = url.host); // global stationCode
                    addStation(host=url.host, href=url.href, origin=url.origin);
                    stationInfoURL = addedStations[stationCode]["now_playing"]; // global stationInfoURL
                    //fetchTrackInfo(stationInfoURL, type = getResponseType(stationInfoURL));
                    fetchTrackInfoXHR(stationInfoURL, type = getResponseType(stationInfoURL));
                    streamURL = addedStations[stationCode]["stream"]; // global streamURL
                    playStream(streamURL);
                } else {
                    setMsg(msgArea, "revert", "Please type URL of a radio station");
                    domain = ""; // global domain
                }
            } else {
                setMsg(msgArea, "revert", "Please enter a valid URL");
            }
            docUrl.value = "";
            toggleControlElements("revert");
            return;
        }
        
        function addStation(host, href, origin) {
            if (stationCode in addedStations === false) {
                addedStations[stationCode] = {}; // global addedStations
                if (host === "www.radiojar.com") {
                    addedStations[stationCode]["now_playing"] = href;
                    addedStations[stationCode]["stream"] = `https://stream.radiojar.com/${stationCode}`;
                    addedStations[stationCode]["name"] = `https://stream.radiojar.com/${stationCode}`;
                } else if (host === "stream.radiojar.com") {
                    addedStations[stationCode]["now_playing"] = `https://www.radiojar.com/api/stations/${stationCode}/now_playing/`;
                    addedStations[stationCode]["stream"] = href;
                    addedStations[stationCode]["name"] = href;
                } else if (host === "ice.greekstream.net") {
                    if (getFileExtension(href) === "xspf") {
                        addedStations[stationCode]["now_playing"] = href;
                        addedStations[stationCode]["stream"] = origin + "/" + stationCode;
                        addedStations[stationCode]["name"] = origin + "/" + stationCode;
                    } else {
                        addedStations[stationCode]["now_playing"] = href + ".xspf";
                        addedStations[stationCode]["stream"] = href;
                        addedStations[stationCode]["name"] = href;
                    }
                }
                localStorage.setItem(varToStr({ addedStations }), JSON.stringify(addedStations));
            }
            return;
        }

        function retrieveFromLocalStorage(localStorageName="allCodes") {
            return JSON.parse(localStorage.getItem(localStorageName));
        }

        function setToLocalStorage(obj) {
            return localStorage.setItem(key=varToStr({ obj }), value=JSON.stringify(obj));
        }

        function varToStr(varObj) {
            return Object.keys(varObj)[0];
        }

        function nameOf(expression) {
            return (expression).toString().replace(/[ |\(\)=>]/g,'');
        }

        function isDomain(url, domain="www.radiojar.com") {
            const urlRegex = new RegExp(`http[s]?://${domain}/`);
            return urlRegex.test(url);
        }

        function getStationCode(href, host = "www.radiojar.com") {
            let stationCode = "";
            if (host === "www.radiojar.com") {
                const codeRegex = /(?<=https:\/\/www.radiojar.com\/api\/stations\/)(.+?)(?=\/now_playing\/)/;
                if (href && codeRegex.test(href)) {
                    stationCode = codeRegex.exec(href)[0];
                }
            } else if (host === "stream.radiojar.com" || host === "ice.greekstream.net") {
                stationCode = href.split("/")[3].split(".")[0];
            }
            return stationCode;
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

        function isValidURL(url) {
            try {
                let validURL = new URL(url);
                return true;
            } catch (error) {
                return false;
            }
        }    

        function isValidUrlStrict(str) {
            // Match elements of a url - Regex Tester/Debugger
            // https://www.regextester.com/20
            // '^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)[\w\-\s]+\.{1}(doc[x]?|xls[x]?|ppt[x]?|htm[l]?|pdf|txt)$'
            const pattern = new RegExp(
                '^(https?:\\/\\/)?' + // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*' + // port and path
                '(mp4|m4a|m4v|ogg|aac|webm)$', // document file extension
                'i'
            );
            return pattern.test(str);
        }
        
        function playStream(source) {
            if (!document.getElementById("new-audio")) {
                setAudio(source);
            } else {
                let newAudio = document.getElementById("new-audio");
                newAudio.src = source;
            }    
            return;
        }

        clickToExport.addEventListener("click", exportToJson);

        function exportToJson() {
            //if (!isEmptyObject(addedStations)) { // global addedStations
            if (localStorage.getItem("addedStations")) { // global addedStations
                //let mainTemplate = JSON.stringify(addedStations);
                let mainTemplate = localStorage.getItem("addedStations");
                let fileContent = new Blob([mainTemplate], { type: "text/plain" });
                allExports = doubleDigits(getTotalExports()); // global allExports
                let fileName = `radio-stations-${allExports}.json.txt`;
                setDownloadAnchor(fileContent, fileName, msg = "Exporting stations...");
            //} else if (isEmptyObject(addedStations)) {
            } else if (!localStorage.getItem("addedStations")) {
                console.log("No recent stations!");
                setMsg(msgArea, "revert", "No recent stations!");
                toggleControlElements("revert");
            }
            return;
        }

        function getTotalExports() {
            let totalExports = Number(localStorage.getItem("totalExports"));
            totalExports += 1;
            localStorage.setItem("totalExports", totalExports);
            return Number(localStorage.getItem("totalExports"));
        }

        function setDownloadAnchor(resource, fileName="", msg="") {
            console.log(msg);
            let aTag = document.createElement("a");
            if (typeof(resource) === "object") {
                aTag.href = URL.createObjectURL(resource);
            } else if (typeof(resource) === "string") {
                aTag.href = resource;
            }
            aTag.target = "_blank";
            aTag.download = fileName;
            document.body.appendChild(aTag);
            aTag.click();
            document.body.removeChild(aTag);
            URL.revokeObjectURL(aTag.href);
            aTag.remove();
            return;
        }

        clearBtn.addEventListener("click", clearAll);

        function clearAll() {
            docUrl.value = "";
            toggleControlElements("none");
            setMsg(msgArea, "none", "");
            showFileInfo();
            resetParams();
            if (timeoutID) {
                resetResponse();
            }
            if (intervalID) {
                resetDuration();
            }
            if (request) {
                request.abort();
            }
        }

        function resetParams() {
            stationCode = "";
            stationInfoURL = "";
            streamURL = "";
            iframe.innerHTML = "";
        }

        function toggleControlElements(displayState) {
            sizeInfo.textContent = (displayState === "none") ? "" : sizeInfo.textContent;
            clearBtn.style.display = displayState;
        }

        clickToLoad.addEventListener("click", () => { loadData(source = "/radio-station-json/stations-clean.json", type = "json"); });
        
        async function loadData(source, type = "json") {
            let responseData = await subscribe(source, type = "json");
            allCodes = responseData; // global allCodes
            loadStationsFromJSON(allCodes);
            return;
        }

        function addOption(value = "", textContent = "Select a station") {
            let newOption = document.createElement("option");
            newOption.value = value;
            newOption.textContent = textContent;
            return newOption;
        }

        /* HTML DOM Element childElementCount Property */
        /* https://www.w3schools.com/jsref/prop_element_childelementcount.asp */
        function loadStationsFromJSON(source=allCodes) {
            if (selectStation.childElementCount > 1) {
            //if (selectStation.children.length > 1) {
                selectStation.innerHTML = `<option value="">Select a station</option>`;
            }
            //for (let code of Object.keys(source)) {
            for (let code in source) {
                let newStation = document.createElement("option");
                newStation.value = code;
                newStation.textContent = source[code]["name"];
                selectStation.appendChild(newStation);
            }
            console.log("Stations loaded");
            localStorage.setItem("allCodes", JSON.stringify(source));
            addedStations = source; // global addedStations
            localStorage.setItem(varToStr({ addedStations }), JSON.stringify(addedStations));
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
                resetResponse();
                stationInfoURL = allCodes[stationCode]["now_playing"]; // global stationInfoURL, allCodes, stationCode
                //fetchTrackInfo(stationInfoURL, type = getResponseType(stationInfoURL));
                fetchTrackInfoXHR(stationInfoURL, type = getResponseType(stationInfoURL));
                streamURL = allCodes[stationCode]["stream"]; // global streamURL, allCodes, stationCode
                playStream(streamURL);
            }
            return;
        }

        function resetResponse() {
            clearTimeout(timeoutID); // global timeoutID
            timeoutID = 0; // global timeoutID
            console.log("Timeout cleared");
            return;
        }

        function getResponseType(source) {
            if (isDomain(source, "www.radiojar.com") || isDomain(source, "stream.radiojar.com")) {
                return "json";
            } else if (isDomain(source, "ice.greekstream.net")) {
                return "xml";
            }
            return "";
        }

        async function subscribe(url, type="json") {
            try {
                request = new AbortController(); // global request
                let response = await fetch(url, {
                    signal: request.signal,
                });
                if (response.status === 200) {
                    let responseData = null;
                    if (type==="json") {
                        responseData = await response.json();
                    } else if (type === "xml") {
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
                    console.log("Retrying...");
                    subscribe(url, type);
                }
            }
        }

        /* Long polling */
        /* https://javascript.info/long-polling */
        async function fetchTrackInfo(url, type = "json") {
            let responseData = await subscribe(url, type);
            let currentTrack = { "artist": "", "title": "", "duration": "" };
            if (responseData && type === "json") {
                currentTrack["artist"] = capitalize(responseData.artist);
                currentTrack["title"] = capitalize(responseData.title);
                currentTrack["duration"] = toMins(responseData.duration);
            } else if (responseData && type === "xml") {
                currentTrack["title"] = capitalize(getTagContent(source = responseData, tagName = "title"));
            }
            if (!objectsAreEqual(previousTrack, currentTrack)) { // global previousTrack
                console.log(`previousTrack: ${JSON.stringify(previousTrack)}\ncurrentTrack: ${JSON.stringify(currentTrack)}`);
                previousTrack = currentTrack; // global previousTrack
                resetDuration();
                let trackInfo = "";
                if (type === "json") {
                    trackInfo = `${currentTrack["artist"]} - ${currentTrack["title"]}`;
                } else if (type === "xml") {
                    trackInfo = `${currentTrack["title"]}`;
                }
                let durationInfo = `${currentTrack["duration"]}`;
                sizeInfo.textContent = showDuration(durationInfo); // global sizeInfo
                fileInfo.textContent = trackInfo; // global fileInfo
                intervalID = setInterval(() => {
                    advanceDuration();
                    sizeInfo.textContent = showDuration(durationInfo); // global sizeInfo
                }, INTERVAL);
            }
            // Call subscribe() again to get the next message
            timeoutID = setTimeout(async () => {
                clearTimeout(timeoutID);
                timeoutID = 0;
                fetchTrackInfo(url, type);
            }, INTERVAL);
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
                }
                xhr.addEventListener("load", (event) => {
                    if (xhr.status === 200) {
                        let responseData = null;
                        if (type === "json") {
                            responseData = xhr.response; // get JSON data
                        } else if (type === "xml") {
                            responseData = xhr.responseXML; // get XML document
                        }
                        resolve(responseData);
                    }
                });
                xhr.addEventListener("error", (event) => {
                    console.log("Retrying...");
                    subscribeXHR(url, type);
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
            let tagContent = "";
            if (responseData && type === "json") {
                currentTrack["artist"] = capitalize(responseData.artist);
                currentTrack["title"] = capitalize(responseData.title);
                currentTrack["duration"] = toMins(responseData.duration);
            } else if (responseData && type === "xml") {
                if (responseData.getElementsByTagName("title")[1].childNodes[0] !== undefined) {
                    tagContent = responseData.getElementsByTagName("title")[1].childNodes[0].nodeValue;
                }
                currentTrack["title"] = capitalize(tagContent);
            }
            if (!objectsAreEqual(previousTrack, currentTrack)) { // global previousTrack
                console.log(`previousTrack: ${JSON.stringify(previousTrack)}\ncurrentTrack: ${JSON.stringify(currentTrack)}`);
                previousTrack = currentTrack; // global previousTrack
                resetDuration();
                let trackInfo = "";
                if (type === "json") {
                    trackInfo = `${currentTrack["artist"]} - ${currentTrack["title"]}`;
                } else if (type === "xml") {
                    trackInfo = `${currentTrack["title"]}`;
                }
                let durationInfo = `${currentTrack["duration"]}`;
                sizeInfo.textContent = showDuration(durationInfo); // global sizeInfo
                fileInfo.textContent = trackInfo; // global fileInfo
                intervalID = setInterval(() => {
                    advanceDuration();
                    sizeInfo.textContent = showDuration(durationInfo); // global sizeInfo
                }, INTERVAL);
            }
            // Call fetchTrackInfoXHR() again to get the next message
            timeoutID = setTimeout(() => {
                clearTimeout(timeoutID);
                timeoutID = 0;
                fetchTrackInfoXHR(url, type);
            }, INTERVAL);
            return;
        }

        let mins = 0;
        let secs = 0;
        let intervalID = 0;
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
        function showDuration(durationText=durationInfo) {
            return (durationText !== "") ? `(${setDuration()}/${durationText})` : `(${setDuration()})`;
        }

        function isObject(obj){
            return typeof(obj) === 'object' && !Array.isArray(obj) && obj !== null;
        }

        /* What is the correct way to check for string equality in JavaScript? */
        /* https://stackoverflow.com/questions/3586775/what-is-the-correct-way-to-check-for-string-equality-in-javascript */
        /* String.prototype.localeCompare() - JavaScript | MDN */
        /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare */
        function isEquivStr(aStr = "", bStr = ""){
            if (aStr.length !== bStr.length) {
                return false;
            }
            return aStr.localeCompare(bStr) === 0;
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
        function getTagContent(source, tagName="title") {
            //const tagRegex = /(?<=<title>)(.+?)(?=<\/title>)/;
            const tagRegex = new RegExp(`(?<=<${tagName}>)(.+?)(?=<\/${tagName}>)`);
            let tagContent = "";
            if (tagRegex.test(source)) {
                tagContent = tagRegex.exec(source)[0];
            }
            return tagContent;
        }

        function hasSubStr(str, subStr="radiojar") {
            const subStrRegex = new RegExp(`${subStr}`);
            return subStrRegex.test(str);
            //return str.includes(subStr);
        }
    
        /* How to Capitalize the First Letter of a String in JavaScript */
        /* https://www.freecodecamp.org/news/how-to-capitalize-the-first-letter-of-a-string-in-javascript/ */
        /* capitalize first letter of every word in a string */
        function capitalize(str='') {
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

        function capitalizeAlt(str='') {
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
            element.textContent = msgText;
        }

        function showFileInfo(element = fileInfo, span = sizeInfo, fileText = "", sizeText = "") {
            //element.textContent = fileText
            //span.textContent = sizeText;
            element.innerHTML = fileText;
            span.innerHTML = sizeText;
        }

        // code that handles the click event
        openStation.addEventListener("click", (event) => {
            if (uploadStation) {
                uploadStation.click();
            }
        });

        //uploadStation.addEventListener("change", () => { openLocal(selectedFile = uploadStation.files[0]); });
        uploadStation.addEventListener("change", () => { handleFiles(selectedFile = uploadStation.files[0]); });

        dropbox.addEventListener("dragenter", dragenter, false);
        dropbox.addEventListener("dragover", dragover, false);
        dropbox.addEventListener("dragleave", dragleave, false);
        dropbox.addEventListener("drop", drop, false);

        /* Selecting files using drag and drop */
        /* https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications#selecting_files_using_drag_and_drop */
        function dragenter(event) {
            //stop propagation of the event
            event.stopPropagation();
            //prevent the default action from occurring
            event.preventDefault();
            //dropbox.classList.add("active");
            //toggleDataState(this, "active");
            this.setAttribute("data-state", "active");
            //showFileInfo(fileInfo, sizeInfo, "Drag File in Drop Area", "");
            //showFileInfo();
        }

        /* Drag & Drop or Browse – File upload Feature in JavaScript */
        /* https://www.codingnepalweb.com/drag-drop-file-upload-feature-javascript/ */
        //If user Drags File Over DropArea
        function dragover(event) {
            //stop propagation of the event
            event.stopPropagation();
            //prevent the default action from occurring
            event.preventDefault();
            //toggleDataState(this, "active");
            this.setAttribute("data-state", "active");
            //fileInfo.textContent = "Release to Upload File";
            //showFileInfo(fileInfo, sizeInfo, "Release to Upload File", "");
        }

        //If user leaves dragged File from DropArea
        function dragleave(event) {
            //toggleDataState(this, "inactive");
            this.setAttribute("data-state", "inactive");
            //fileInfo.textContent = "Drag and Drop to Upload File";
            //showFileInfo();
        }

        //If user drops File on DropArea
        function drop(event) {
            //stop propagation of the event
            event.stopPropagation();
            //prevent the default action from occurring
            event.preventDefault();
            //retrieve the dataTransfer field from the event
            //const dt = event.dataTransfer;
            //pull the file list out of the dataTransfer field
            //const files = dt.files;
            //toggleDataState(this, "inactive");
            this.setAttribute("data-state", "inactive");
            //getting user select file and [0] this means if user select multiple files then we'll select only the first one
            let selectedFile = event.dataTransfer.files[0];
            //pass the file list to handleFiles()
            //From this point on, handling the files is the same whether the user used the input element or drag and drop
            //handleFiles(selectedFile);
            openLocal(selectedFile);
        }

        /* Blob: text() method - Web APIs | MDN */
        /* https://developer.mozilla.org/en-US/docs/Web/API/Blob/text */
        async function readJsonFileBlob(jsonFile) {
            try {
                let fileBlob = new Blob([jsonFile], { type: "text/plain" });
                let fileContent = await fileBlob.text();
                return JSON.parse(fileContent);
            } catch(error) {
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
        function readJsonFileReader(jsonFile) {
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

        /* Blob, blob.text() version */
        async function handleFiles(file) {
            const validExtensions = ["text/plain", "application/json"]; // adding some valid extensions in array
            fileExtension = getFileExtension(file.name); // getting selected file extension
            console.log(`file.type: ${file.type}`); // getting selected file type
            console.log(`file.name: ${file.name}`);
            console.log(`file.size: ${formatFileSize(file.size)}`);
            console.log(`fileExtension: ${fileExtension}`);
            if (validExtensions.includes(file.type)) { // if user selected file is a valid file
                //allCodes = await readJsonFileBlob(file);
                //allCodes = await readJsonFile(file);
                allCodes = await readJsonFileResponse(file); // global allCodes
                loadStationsFromJSON(source = allCodes);
                //showFileInfo(fileInfo, sizeInfo, `${file.name}`, `(${formatFileSize(file.size)})`);
                showStationFile(file, element = msgArea);
            } else {
                setMsg(msgArea, "revert", "Please select a Stations File");
                dropbox.setAttribute("data-state", "warning");
            }
            toggleControlElements("revert");
            return;
        }

        /* FileReader, readAsText version */
        function openLocal(file) {
            const validExtensions = "txt,json".split(','); // adding some valid extensions in array
            fileExtension = getFileExtension(file.name); // getting selected file extension
            console.log(`file.type: ${file.type}`); // getting selected file type
            console.log(`file.name: ${file.name}`);
            console.log(`file.size: ${formatFileSize(file.size)}`);
            console.log(`fileExtension: ${fileExtension}`);
            if (validExtensions.includes(fileExtension)) { // if user selected file is a valid file
                readJsonFileReader(file);
                //showFileInfo(fileInfo, sizeInfo, `${file.name}`, `(${formatFileSize(file.size)})`);
                showStationFile(file, element = msgArea);
            } else {
                if (!fileInfo.innerHTML) {
                    iframe.innerHTML = "";
                }
                setMsg(msgArea, "revert", "Please select a Stations File");
                dropbox.setAttribute("data-state", "warning");
            }
            toggleControlElements("revert");
            return;
        }

        function showStationFile(file, element = msgArea) {
            setMsg(element, "revert", ""); // global msgArea
            element.innerHTML = `<a href="${URL.createObjectURL(file)}" target="_blank">${file.name}</a>`;
            let span = document.createElement("span");
            span.textContent = ` (${formatFileSize(file.size)})`;
            element.appendChild(span);
            return;
        }

        function toggleDataState(element, dataState) {
            element.setAttribute("data-state", dataState);
            return;
        }

        function decodedURL(documentURL) {
            const percent = /%/;
            const space = /%20/;
            //documentURL = encodeURI(documentURL);
            let result = documentURL;
            // contains Unicode characters
            if (percent.test(documentURL)) {
                let decoded = decodeURIComponent(documentURL); // decode document URL
                result = decoded;
                // contains spaces
                if (space.test(documentURL)) {
                    let decodedWithSpaces = decoded.replaceAll(" ", "%20"); // replace all spaces with "%20" character
                    result = decodedWithSpaces;
                }
            }
            return result;
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

        function truncateQuotient(numerator, denominator) {
            return Math.trunc((numerator / denominator) * 100);
        }

        function addAudioTrack(id, src, controls = "controls", preload = "metadata", autoplay = "autoplay") {
            //let audio = new Audio();
            let audio = document.createElement("audio");
            audio.id = id;
            audio.src = src;
            audio.controls = controls;
            audio.preload = preload;
            audio.autoplay = autoplay;
            //audio.setAttribute("crossorigin", crossorigin);
            //audio.crossOrigin = crossorigin;
            return audio;
        }

        function setAudio(url) {
            iframe.innerHTML = "";
            //let newAudio = addAudioTrack(id="new-audio");
            let newAudio = addAudioTrack(id="new-audio", src=url);
            iframe.appendChild(newAudio);
            //let source = addSourceTrack(id="new-src", src=url);
            //newAudio.appendChild(source);
            return;
        }

        function addSourceTrack(id, src) {
            let source = document.createElement("source");
            source.id = id;
            source.src = src;
            //source.type = `audio/${fileExtension}`;
            source.type = `audio/m4a`;
            return source;
        }

        /* javascript - Regex replace a set of characters */
        /* https://stackoverflow.com/questions/31355327/regex-replace-a-set-of-characters */
        function replaceInvalid(str, char = '-') {
            const set = /[\/*?:"<>|]/g;
            return str.replace(set, char);
        }

        function addIframe(id = "new-audio") {
            //let iFrame = document.createElement("iframe");
            //iFrame.id = id;
            //iFrame.name = id;
            //iFrame.type = "audio/mp4";
            //iFrame.setAttribute("crossorigin", "anonymous");
            let iFrame = `<iframe id="${id}" name="${id}" type="audio/${fileExtension}" allowfullscreen></iframe>`;
            return iFrame;
        }

        })();
