# AnchorzupTask
Task requested by Anchorzup

# Project info
This project has 1 use case:
1. User enters an url, url is saved as a short url and the user has a list of clickable personal short urls to go to

The project was made using only HTML, JS and CSS, as requested ot make a simpler solution.

No need for extra installments or external DB, Chromium got us covered ;)

# How to run
Simply go/get the vanilla folder and click on the html file

# How does the logic work
1. When the user enters a url, the url is shortened and saved on the indexedDB (chromes personal local DB) under the urlShortened Table.
   The format is saved as ID (the short url link after the /): Object (containing the URL, original URL, ID and expiration time).
   The data saved is persistent even if we refresh or open the page on another tab.
2. Upon loading the page / saving the url, the list of short urls on the right is populated, and each URL is given a timed interval. Once this interval expires, the URL is deleted from the list and the DB.
3. The JS checks if the URL and Expiry are set before allowing the URL to be shortened and saved.
4. Each progress message is shown below the `Shorten URL` Button.

# Project components
Project has the HTML (main) page, a CSS containing all the styles and a JS file for the logic.

# Notes
Originally, I thought of trying more tech stacks to finish the challenge but the time and circumstances were not on my side, hence only the vanilla folder. :(
<ins>Big thanks to AnchorzUp for the challenge!</ins>
