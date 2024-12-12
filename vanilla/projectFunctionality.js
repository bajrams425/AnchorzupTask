document.addEventListener('DOMContentLoaded', function() {
    const selectedOption = document.getElementById('selectedOption');
    const dropdownOptions = document.getElementById('dropdownOptions');
    const options = dropdownOptions.querySelectorAll('li');
    const urlList = document.getElementById('urlList');
    const output = document.getElementById('output');

    const dbName = "urlShortenerDB";
    const dbVersion = 1;
    let db;

    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains("urls")) {
            db.createObjectStore("urls", { keyPath: "id" });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        removeExpiredUrls();
        loadUrlsFromDB();
    };

    request.onerror = function(event) {
        console.error("IndexedDB error:", event.target.errorCode);
    };

    selectedOption.addEventListener('click', () => {
        dropdownOptions.classList.toggle('visible');
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            selectedOption.textContent = option.textContent;
            selectedOption.dataset.value = option.dataset.value;
            dropdownOptions.classList.remove('visible');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            dropdownOptions.classList.remove('visible');
        }
    });

    document.getElementById('shortenBtn').addEventListener('click', function() {
        const urlInput = document.getElementById('urlInput').value;
        const expirationMinutes = parseInt(selectedOption.dataset.value, 10);

        if (!urlInput) {
            updateOutputMessage('Please enter a URL.', 'error');
            return;
        }

        if (!expirationMinutes) {
            updateOutputMessage('Please select an expiration time.', 'error');
            return;
        }

        if (!isValidURL(urlInput)) {
            updateOutputMessage('Please enter a valid URL.', 'error');
            return;
        }

        const id = generateRandomId();
        const shortUrl = `https://shorturl.co/${id}`;
        const expirationTime = Date.now() + expirationMinutes * 60000;

        const newUrl = {
            id,
            url: shortUrl,
            originalUrl: urlInput,
            expirationTime
        };

        saveUrlToDB(newUrl);
        displayUrl(newUrl);
        updateOutputMessage(`URL shortened and added to the list!`, 'success');

        document.getElementById('urlInput').value = '';
    });

    function isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function generateRandomId() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        let id = "";
        for (let i = 0; i < 5; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    function saveUrlToDB(url) {
        const transaction = db.transaction(["urls"], "readwrite");
        const store = transaction.objectStore("urls");
        store.add(url);
        transaction.oncomplete = function() {
            scheduleUrlExpiration(url);
        };

        transaction.onerror = function(event) {
            console.error("Error saving URL to IndexedDB:", event.target.errorCode);
        };
    }

    function loadUrlsFromDB() {
        const transaction = db.transaction(["urls"], "readonly");
        const store = transaction.objectStore("urls");
        const request = store.openCursor();

        request.onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                displayUrl(cursor.value);
                scheduleUrlExpiration(cursor.value);
                cursor.continue();
            }
        };
    }

    function removeExpiredUrls() {
        const transaction = db.transaction(["urls"], "readwrite");
        const store = transaction.objectStore("urls");
        const request = store.openCursor();

        request.onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.expirationTime <= Date.now()) {
                    store.delete(cursor.value.id);
                    removeUrlFromDisplay(cursor.value.id);
                    updateOutputMessage(`This URL expired: ${cursor.value.url}`, 'warning');
                }
                cursor.continue();
            }
        };
    }

    function scheduleUrlExpiration(url) {
        const timeUntilExpiration = url.expirationTime - Date.now();
        if (timeUntilExpiration > 0) {
            setTimeout(() => {
                const transaction = db.transaction(["urls"], "readwrite");
                const store = transaction.objectStore("urls");
                store.delete(url.id);
                transaction.oncomplete = function() {
                    removeUrlFromDisplay(url.id);
                    updateOutputMessage(`This URL expired: ${url.url}`, 'warning');
                };
            }, timeUntilExpiration);
        }
    }

    function displayUrl({ id, url, originalUrl }) {
        const listItem = document.createElement('li');
        listItem.className = 'url-item';
        listItem.setAttribute('data-id', id);

        const link = document.createElement('span');
        link.className = 'short-url';
        link.innerHTML = `<a href="${originalUrl}" target="_blank">${url}</a>`;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
        deleteBtn.addEventListener('click', () => {
            const transaction = db.transaction(["urls"], "readwrite");
            const store = transaction.objectStore("urls");
            store.delete(id);
            transaction.oncomplete = function() {
                removeUrlFromDisplay(id);
                updateOutputMessage(`URL deleted.`, 'success');
            };
        });

        listItem.appendChild(link);
        listItem.appendChild(deleteBtn);
        urlList.appendChild(listItem);
    }

    function removeUrlFromDisplay(id) {
        const listItem = document.querySelector(`.url-item[data-id='${id}']`);
        if (listItem) {
            urlList.removeChild(listItem);
        }
    }

    function updateOutputMessage(message, type) {
        output.textContent = message;
        output.className = `message ${type}`;
    }
});