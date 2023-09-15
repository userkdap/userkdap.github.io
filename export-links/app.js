        const href = document.getElementById("href");
        const title = document.getElementById("title");
        
        const generate = document.getElementById("generate");
        const clearRecent = document.getElementById("clear-recent");
        
        const viewUrl = document.getElementById("view-url");
        const urlList = document.getElementById("url-list");

        const clear = document.getElementById("clear");
        
        const clickToExport = document.getElementById("export");
        const exportLabel = document.getElementById("export-label");
        const exportFileName = document.getElementById("export-file-name");

        let anchorItems = {};
        let allData = [];
        let allLinkExports = 0;
        
        href.addEventListener("keypress", checkKey);
        generate.addEventListener("click", generateLink);
                
        clickToExport.addEventListener("click", exportToHtml);
        clearRecent.addEventListener("click", () => {
            allData = [];
            toggleExportElements("hidden");
        });

        clear.addEventListener("click", clearAll);

        function isValidUrlStrict(str) {
            // Match elements of a url - Regex Tester/Debugger
            // https://www.regextester.com/20
            // '^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)[\w\-\s]+\.{1}$'
            const pattern = new RegExp(
                '^(https?:\\/\\/)?' + // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*', // port and path
                'i'
            );
            return pattern.test(str);
        }

        function checkKey(event) {
            if (event.key === "Enter") {
                generateLink();
            }
        }

        function generateLink() {
            let url = "";
            let tagContent = "";
            if (!isValidUrlStrict(href.value)) {
                viewUrl.innerHTML = "Please enter a valid URL";
            } else {
                url = href.value;
                if (title.value !== "") {
                    // replace '<' and '>', if present
                    tagContent = replaceHTMLentities(title.value);
                } else {
                    tagContent = href.value;
                }
                anchorItems = {"url": url, "tagContent": tagContent};
                allData.push(anchorItems);
                let anchor = `<a href="${anchorItems.url}" target="_blank">${anchorItems.tagContent}</a>`;
                viewUrl.innerHTML = anchor;
                let listItem = createListItem(anchor);
                urlList.appendChild(listItem);
                toggleExportElements("visible");
            }
            href.value = "";
            title.value = "";
            href.focus();
            clear.style.visibility="visible";
        }

        function replaceHTMLentities(str) {
            let htmlEntities = {'<': "&lt;", '>': "&gt;"};
            return str.replace(/[<>]/g, (ch) => { return htmlEntities[ch]; });
        }

        function createListItem(element) {
            let listItem = document.createElement("li");
            listItem.innerHTML = element;
            return listItem;
        }

        function setStyleTag(backGroundColor="lightyellow", fontFamily=`"Courier New",Courier,monospace`, fontSize="1.5rem") {
            let styleTag = '\n<style>' +
                            `\nbody{background-color:${backGroundColor};}` +
                            `\nli{font-family:${fontFamily};font-size:${fontSize};}` +
                            '\n</style>\n';
            return styleTag;
        }

        function getHtmlTemplate(allData) {
            let body = "body";
            let htmlData = "\n<ul>\n";
            for (let item of allData) {
                let listItem = `<li><a href="${item.url}" target="_blank">${item.tagContent}</a></li>`;
                htmlData = htmlData + listItem + "\n";
            }
            htmlData = htmlData + "</ul>\n";
            let styleTag = setStyleTag();
            let mainTemplate = '<!DOCTYPE html><html><head><title>Export Links</title>' +
                                styleTag + 
                                `</head><${body}>` + 
                                htmlData + 
                                `</${body}></html>`;
            return mainTemplate;
        }

        function exportToHtml() {
            if (allData !== []) {
                allLinkExports = doubleDigits(setTotalExports());
                let mainTemplate = getHtmlTemplate(allData);
                let exportName = "";
                let a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([mainTemplate], {type: "text/html"}));
                (exportFileName.value !== "")? exportName = `${replaceSpaces(exportFileName.value)}.html`: exportName = `export-links-${allLinkExports}.html`;
                a.setAttribute("download", exportName);
                a.click();
                URL.revokeObjectURL(a.href);
                delete a;
                toggleExportElements("hidden");
            }
        }

        function replaceSpaces(str) {
            return str.replaceAll(" ", "-");
        }

        function setTotalExports() {
            let totalLinkExports = Number(localStorage.getItem("totalLinkExports"));
            totalLinkExports += 1;
            localStorage.setItem("totalLinkExports", totalLinkExports);
            return Number(localStorage.getItem("totalLinkExports"));
        }

        function doubleDigits(numStr) {
            if (numStr > 0 && numStr < 10) {
                return "0"+numStr;
            } else if (numStr > 9) {
                return numStr;
            }
        }

        function toggleExportElements(visibilityState) {
            clickToExport.style.visibility = visibilityState;
            exportLabel.style.visibility = visibilityState;
            exportFileName.value = "";
            exportFileName.style.visibility = visibilityState;
            clearRecent.style.visibility = visibilityState;
        }

        function clearAll() {
            allData = [];
            href.value = "";
            title.value = "";
            exportFileName.value = "";
            href.focus();
            viewUrl.innerHTML = "";
            urlList.innerHTML = "";
            toggleExportElements("hidden");
            clear.style.visibility = "hidden";
        }
