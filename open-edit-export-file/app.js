        const uploadFile = document.getElementById("upload-file");
        const openFile = document.getElementById("open-file");
        
        const clickToExport = document.getElementById("export");
        const clear = document.getElementById("clear");
        const exportMsg = document.getElementById("export-msg");
        
        const fileContent = document.getElementById("file-content");
        const fileDetails = document.getElementById("file-details");

        const exportLabel = document.getElementById("export-label");
        const exportFileName = document.getElementById("export-file-name");
        
        let allExports = "";
        let fileExtension = "txt";

        uploadFile.addEventListener("change", openLocalFile);
        
        // code that handles the click event
        openFile.addEventListener("click", (event) => {
            if (uploadFile) {
                uploadFile.click();
            }
        });

        fileContent.addEventListener("input", () => {
            toggleControlElements("visible");
            if (!isEmpty(fileContent.value)) {
                toggleExportElements("revert");
            } else {
                fileExtension = "txt";
                fileDetails.textContent = "";
                toggleExportElements("none");
            }
        });
        
        clickToExport.addEventListener("click", exportFile);
        clear.addEventListener("click", clearAll);

        function openLocalFile() {
            let currentFiles = uploadFile.files;
            let selectedFile = currentFiles[0];
            const reader = new FileReader();
            // this will display a text file
            // useCapture: false - The handler is executed in the bubbling phase, inner first, to outer
            reader.addEventListener("load", printToTextArea, false);
            reader.readAsText(selectedFile);
            fileExtension = getFileExtension(selectedFile.name);
            fileDetails.textContent = `${selectedFile.name} (${returnFileSize(selectedFile.size)})`;
            toggleControlElements("visible");
            toggleExportElements("revert");
            // event listener printToTextArea
            function printToTextArea() {
                fileContent.value = reader.result;
            }
        }

        function isEmpty(str) {
            let spaces = /^\s*$/;
            return spaces.test(str);
        }

        function getFileExtension(fileName) {
            return fileName.substring(fileName.lastIndexOf('.') + 1);
        }

        function exportFile() {
            if (!isEmpty(fileContent.value )) {
                allExports = doubleDigits(setAllExports());
                let textFile = fileContent.value;
                let exportName = "";
                let a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([textFile], {type: `text/${fileExtension}`}));
                (exportFileName.value !== "")? exportName = `${replaceSpaces(exportFileName.value)}.${fileExtension}`: exportName = `export-content-${allExports}.${fileExtension}`;
                a.setAttribute("download", exportName);
                a.click();
                URL.revokeObjectURL(a.href);
                delete a;
                toggleExportElements("none");
            } else {
                exportMsg.textContent = "Textarea is empty";
            }
        }

        function replaceSpaces(str) {
            return str.replaceAll(" ", "-");
        }

        function setAllExports() {
            let totalExports = Number(localStorage.getItem("totalExports"));
            totalExports += 1;
            localStorage.setItem("totalExports", totalExports);
            return Number(localStorage.getItem("totalExports"));
        }

        function doubleDigits(numStr) {
            if (numStr > 0 && numStr < 10) {
                return "0"+numStr;
            } else if (numStr > 9) {
                return numStr;
            }
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
        
        function toggleControlElements(visibilityState) {
            clickToExport.style.visibility = visibilityState;
            exportMsg.textContent = "";
            clear.style.visibility = visibilityState;
        }

        function toggleExportElements(displayState) {
            exportLabel.style.display = displayState;
            exportFileName.value = "";
            exportFileName.style.display = displayState;
        }

        function clearAll() {
            fileContent.value = "";
            fileDetails.textContent = "";
            toggleExportElements("none");
            toggleControlElements("hidden");
        }
