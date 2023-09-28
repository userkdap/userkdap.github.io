        const DOMAIN_1 = "odysee.com";
        const DOMAIN_2 = "www.bitchute.com";
        const DOMAIN_3 = "rumble.com";

        const docUrl = document.querySelector("#doc-url");
        const generate = document.querySelector("#generate");
        const viewUrl = document.querySelector("#view-url");
                
        const clickToDownload = document.querySelector("#download-file");
        const clickToExport = document.querySelector("#export");
        const clearRecent = document.querySelector("#clear-recent");
                
        const clickToCopy = document.querySelector("#copy-url");
        const copyMsg = document.querySelector("#copy-msg");

        const clear = document.querySelector("#clear");

        const iframe = document.querySelector("#i-frame");
        const uploadSubs = document.querySelector("#upload-subs");
        const addSubs = document.querySelector("#add-subs");
        const fileInfo = document.querySelector("#file-info");
        
        let domain = "";
        let intervalID = 0;
        let html_text = "";
        let embed_html_text = "";
        let anchorItems = {};
        let allData = [];
        let allExports = "";
        
        docUrl.addEventListener("keypress", checkKey);
        generate.addEventListener("click", generateLink);

        clickToDownload.addEventListener("click", downloadFile);
                
        clickToExport.addEventListener("click", exportToHtml);
        clearRecent.addEventListener("click", () => {
            allData = [];
        });
        
        clickToCopy.addEventListener("click", copyURL);
        clear.addEventListener("click", clearAll);

        // code that handles the click event
        addSubs.addEventListener("click", (event) => {
            if (uploadSubs) {
                uploadSubs.click();
            }
            return;
        });

        uploadSubs.addEventListener("change", addSubsFile);

        function checkKey(event) {
            // αν το key του event είναι "Enter", τότε καλεί τη συνάρτηση generateLink
            if (event.key === "Enter") {
                generateLink();
            }
            return;
        }

        function generateLink() {
            const anyOrigin = "http://www.whateverorigin.org/get?url=";
            if (checkInput(docUrl.value, DOMAIN_1)) {
                domain = DOMAIN_1;
            } else if (checkInput(docUrl.value, DOMAIN_2)) {
                domain = DOMAIN_2;
            } else if (checkInput(docUrl.value, DOMAIN_3)) {
                domain = DOMAIN_3;
            }
            if (checkInput(docUrl.value, domain)) {
                let url = encodeURIComponent(docUrl.value);
                let link = anyOrigin + url;
                viewUrl.innerHTML = "Loading...";
                intervalID = setInterval(() => { fetchContent(link); }, 1000);
            } else {
                viewUrl.innerHTML = "Please enter a video containing URL";
            }
            docUrl.value = "";
            docUrl.focus();
            copyMsg.textContent = "";
            clear.style.visibility = "visible";
            return;
        }

        function checkInput(url, domain=DOMAIN_1) {
            let url_regex = new RegExp(`https://${domain}/`);
            return url_regex.test(url);
        }

        async function fetchContent(url) {
            let response = await fetch(url);
            if (response.status === 200) {
                let responseData = await response.json();
                html_text = responseData.contents;
                if (html_text !== "") {
                    console.log("HTML Content Loaded");
                    loadContent();
                }
                return;
            } else {
                throw new Error(response.status);
            }
        }

        function loadContent() {
            clearInterval(intervalID);
            console.log("Interval Cleared");
            if (domain === DOMAIN_1 || domain === DOMAIN_2) {
                getAnchor(embed=false);
            } else if (domain === DOMAIN_3) {
                getEmbedUrl(embed_regex=/(?<=\"embedUrl\":\")(.+?)(?=\",)/);
            }
            return;
        }

        async function fetchEmbedContent(url) {
            let response = await fetch(url);
            if (response.status === 200) {
                let responseData = await response.json();
                embed_html_text = responseData.contents;
                if (embed_html_text !== "") {
                    console.log("HTML Content Loaded");
                    loadEmbedContent();
                }
                return;
            } else {
                throw new Error(response.status);
            }
        }

        function loadEmbedContent() {
            clearInterval(intervalID);
            console.log("Interval Cleared");
            getAnchor(embed=true);
            return;
        }

        function getAnchor(embed=false) {
            let link = "";
            if (embed === false) {
                let href_regex = "";
                if (domain === DOMAIN_1) {
                    href_regex = new RegExp('(?<=\"contentUrl\": \")(.+?)(?=\",)');
                }
                if (domain === DOMAIN_2) {
                    href_regex = new RegExp('(?<=<source src=\")(.+?)(?=\")');
                }
                let href_url = getHref(href_regex);
                link = href_url;
            } else if (embed === true) {
                let href_embed_url = getHrefEmbed(/(?<=\"720\":{\"url\":\")(.+?)(?=\",)/);
                if (!href_embed_url) {
                    href_embed_url = getHrefEmbed(/(?<=\"480\":{\"url\":\")(.+?)(?=\",)/);
                }
                link = href_embed_url;
            }
            let tag_content = getTagContent(tag_regex=/(?<=<title>)(.+?)(?=<\/title>)/);
            anchorItems = { "link": link, "tag_content": tag_content, "domain": domain };
            allData.push(anchorItems);
            let anchor = `<a href="${anchorItems.link}" target="_blank">${anchorItems.tag_content}</a>`;
            viewUrl.innerHTML = anchor;
            showButtons();
            showVideo(link);
            return;
        }

        function getEmbedUrl(embed_regex=/(?<=\"embedUrl\":\")(.+?)(?=\",)/) {
            const anyOrigin = "http://www.whateverorigin.org/get?url=";
            if (html_text && embed_regex.test(html_text)) {
                let embed_url = embed_regex.exec(html_text)[0];
                embed_url = encodeURIComponent(embed_url);
                let embed_link = anyOrigin + embed_url;
                intervalID = setInterval(() => { fetchEmbedContent(embed_link); }, 1000);
            }
            return;
        }

        function getHref(href_regex=/https.*\.mp4/) {
            let href_url = "";
            if (html_text && href_regex.test(html_text)) {
                href_url = href_regex.exec(html_text)[0];
            }
            return href_url;
        }

        function getHrefEmbed(href_embed_regex=/https.+\.gaa\.mp4/) {
            let href_embed_url = "";
            if (embed_html_text && href_embed_regex.test(embed_html_text)) {
                href_embed_url = href_embed_regex.exec(embed_html_text)[0];
            }
            return href_embed_url;
        }

        function getTagContent(tag_regex=/(?<=<title>)(.+?)(?=<\/title>)/) {
            let tag_content = "";
            if (html_text && tag_regex.test(html_text)) {
                tag_content = tag_regex.exec(html_text)[0];
            }
            return tag_content;
        }

        function showButtons() {
            clickToDownload.style.visibility = "visible";
            clickToExport.style.visibility = "visible";
            clearRecent.style.visibility = "visible";
            clickToCopy.style.display = "revert";
            copyMsg.textContent = "";
            addSubs.style.visibility = "visible";
            return;
        }

        function showVideo(url) {
            iframe.innerHTML = `<video id="newVideo" width="1280" height="720" controls="controls" preload="metadata"></video>`;
            let newVideo = document.querySelector("#newVideo");
            let source = document.createElement("source");
            source.src = url;
            source.type = "video/mp4";
            newVideo.appendChild(source);
            return;
        }

        function copyURL() {
            if (anchorItems) {
                navigator.clipboard.writeText(`${anchorItems.link}`);
                clickToCopy.style.display = "none";
                copyMsg.textContent = "Copied!";
            }
            return;
        }

        function downloadFile() {
            if (anchorItems) {
                let a = document.createElement("a");
                a.href = anchorItems.link;
                a.target = "_blank";
                a.setAttribute("download", "");
                a.click();
                delete a;
            }
            return;
        }

        function addSubtitlesTrack() {
            let track = document.createElement("track");
            track.id = "custom-track";
            track.label = "Custom";
            track.kind = "subtitles";
            track.srclang = "gr";
            return track;
        }

        function returnFileSize(number) {
            if (number < 1024) {
                return `${number} bytes`;
            } else if (number >= 1024 && number < 1048576) {
                return `${(number / 1024).toFixed(1)} KB`;
            } else if (number >= 1048576) {
                return `${(number / 1048576).toFixed(1)} MB`;
            } else if (number >= 1073741824) {
                return `${(number / 1073741824).toFixed(1)} GB`;
            }
        }

        function addSubsFile() {
            let currentFiles = uploadSubs.files;
            if (currentFiles) {
                let selectedFile = currentFiles[0];
                if (!document.querySelector("#custom-track")) {
                    let newVideo = document.querySelector("#newVideo");
                    let track = addSubtitlesTrack();
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

        function getHtmlTemplate(allData) {
            let body = "body";
            let htmlData = "\n<ul>\n";
            for (let item of allData) {
                let listItem = `<li><a href="${item.link}" target="_blank">${item.tag_content} | ${item.domain}</a></li>`;
                htmlData = htmlData + listItem + "\n";
            }
            htmlData = htmlData + "</ul>\n";
            let styleTag = '\n<style>li{font-family:"Courier New",Courier,monospace;font-size:1.6rem;}</style>\n';
            let mainTemplate = '<!DOCTYPE html><html><head><title>Video Links</title>' +
                                styleTag + 
                                `</head><${body}>` + 
                                htmlData + 
                                `</${body}></html>`;
            return mainTemplate;
        }

        function exportToHtml() {
            if (allData !== []) {
                allExports = doubleDigits(setTotalExports());
                let mainTemplate = getHtmlTemplate(allData);
                let a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([mainTemplate], {type: "text/html"}));
                a.setAttribute("download", `video-links-${allExports}.html`);
                a.click();
                URL.revokeObjectURL(a.href);
                delete a;
            }
            return;
        }

        function setTotalExports() {
            if (localStorage.getItem("totalExports") !== null) {
                let totalExports = Number(localStorage.getItem("totalExports"));
                totalExports += 1;
                localStorage.setItem("totalExports", totalExports);
                return Number(localStorage.getItem("totalExports"));
            }
        }

        function doubleDigits(numStr) {
            if (numStr > 0 && numStr < 10) {
                return "0"+numStr;
            } else if (numStr > 9) {
                return numStr;
            }
        }

        function clearAll() {
            viewUrl.innerHTML = "";
            iframe.innerHTML = "";
            docUrl.value = "";
            docUrl.focus();
            clickToDownload.style.visibility = "hidden";
            clickToExport.style.visibility = "hidden";
            clearRecent.style.visibility = "hidden";
            clickToCopy.style.display = "none";            
            copyMsg.textContent = "";
            addSubs.style.visibility = "hidden";
            fileInfo.textContent = "";
            clear.style.visibility = "hidden";
            return;
        }