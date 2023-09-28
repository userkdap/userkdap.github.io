        const docUrl = document.querySelector("#doc-url");
        const uploadVideo = document.querySelector("#upload-video");
        const addVideo = document.querySelector("#add-video");
        const viewUrl = document.querySelector("#view-url");
        
        const clear = document.querySelector("#clear");

        const iframe = document.querySelector("#i-frame");
        const uploadSubs = document.querySelector("#upload-subs");
        const addSubs = document.querySelector("#add-subs");
        const fileInfo = document.querySelector("#file-info");
        
        let intervalID = 0;
        let domain = "";
        let html_text = "";
        let embed_html_text = "";

        docUrl.addEventListener("keypress", addRemote);
        
        clear.addEventListener("click", clearAll);

        // code that handles the click event
        addVideo.addEventListener("click", (event) => {
            if (uploadVideo) {
                uploadVideo.click();
            }
            return;
        });

        uploadVideo.addEventListener("change", addLocal);
        
        // code that handles the click event
        addSubs.addEventListener("click", (event) => {
            if (uploadSubs) {
                uploadSubs.click();
            }
            return;
        });

        uploadSubs.addEventListener("change", addSubsFile);

        function addRemote() {
            if (isValidUrlStrict(docUrl.value)) {
                let url = docUrl.value;
                let anchor = `<a href="${url}" target="_blank">${url}</a>`;
                viewUrl.innerHTML = anchor;
                showVideo(url);
                addSubs.style.visibility = "visible";
            } else {
                viewUrl.textContent = "Please enter a video URL";
            }
            docUrl.value = "";
            docUrl.focus();
            fileInfo.textContent = "";
            clear.style.visibility = "visible";
            return;
        }

        function addLocal() {
            let currentFiles = uploadVideo.files;
            if (currentFiles) {
                let selectedFile = currentFiles[0];
                let url = URL.createObjectURL(selectedFile);
                let anchorTextContent = `${selectedFile.name} (${returnFileSize(selectedFile.size)})`;
                let anchor = `<a href="${url}" target="_blank">${anchorTextContent}</a>`;
                viewUrl.innerHTML = anchor;
                showVideo(url);
                addSubs.style.visibility = "visible";
            } else {
                viewUrl.textContent = "No file selected!"
            }
            fileInfo.textContent = "";
            clear.style.visibility = "visible";
            return;
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
                '(mp4|m4a)$', // document file extension
                'i'
            );
            return pattern.test(str);
        }

        function addVideoTrack(id, width="1280", height="720", controls="controls", preload="metadata") {
            let video = document.createElement("video");
            video.id = id;
            video.width = width;
            video.height = height;
            video.controls = controls;
            video.preload = preload;
            return video;
        }

        function addSourceTrack(id, src, type="video/mp4") {
            let source = document.createElement("source");
            source.id = id;
            source.src = src;
            source.type = type;
            return source;
        }

        function showVideo(url) {
            iframe.innerHTML = "";
            let newVideo = addVideoTrack(id="new-video");
            iframe.appendChild(newVideo);
            let source = addSourceTrack(id="new-src", src=url);
            newVideo.appendChild(source);
            return;
        }

        function addSubtitlesTrack(id, label="Custom", kind="subtitles", srclang="gr") {
            let track = document.createElement("track");
            track.id = id;
            track.label = label;
            track.kind = kind;
            track.srclang = srclang;
            return track;
        }
        
        function addSubsFile() {
            let currentFiles = uploadSubs.files;
            if (currentFiles) {
                let selectedFile = currentFiles[0];
                if (!document.querySelector("#custom-track")) {
                    let newVideo = document.querySelector("#new-video");
                    let track = addSubtitlesTrack(id="custom-track");
                    track.src = URL.createObjectURL(selectedFile);
                    newVideo.appendChild(track);
                } else {
                    let track = document.querySelector("#custom-track");
                    URL.revokeObjectURL(track.src);
                    track.src = URL.createObjectURL(selectedFile);
                }
                fileInfo.textContent = `File selected: ${selectedFile.name} (${returnFileSize(selectedFile.size)})`;
            } else {
                fileInfo.textContent = "No file selected!"
            }
            return;
        }

        function returnFileSize(number) {
            if (number < 1024) {
                return `${number} bytes`;
            } else if (number >= 1024 && number < 1048576) {
                return `${(number / 1024).toFixed(1)} KB`;
            } else if (number >= 1048576 && number < 1073741824) {
                return `${(number / 1048576).toFixed(1)} MB`;
            } else if (number >= 1073741824) {
                return `${(number / 1073741824).toFixed(1)} GB`;
            }
        }

        function clearAll() {
            viewUrl.innerHTML = "";
            iframe.innerHTML = "";
            docUrl.value = "";
            docUrl.focus();
            fileInfo.textContent = "";
            addSubs.style.visibility = "hidden";
            clear.style.visibility = "hidden";
            return;
        }