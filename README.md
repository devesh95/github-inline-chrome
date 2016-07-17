# Github Inline Chrome Extension
This is a Chrome extension meant for members of the PennApps organizing team
working with/in association with the Outreach committee. It is meant to be used
solely for the purposes for application review and should not be distributed
without prior permission of PennApps Exec.

## Installation Instructions

1. Clone this repository or download a zip file locally.
2. Fire up Chrome and open the [Extensions](chrome://extensions/) page.
3. Set the _Developer Mode_ option on the top right of the page to true.
4. Select _Load Unpacked Extension_ and open the cloned/unzipped folder you downloaded in step 1.
5. Ensure the _Enabled_ checkbox is set to true.
5. Start grading on your secure portal. (specific to PennApps organizers)

## How do I know it's working?
If installed correctly, you should see a GitHub summary view below applications
that you're grading _if they have a GitHub name linked_.


## I have a 'bad credentials' error! :(

Yep, this isn't something wild and unexpected. This app fetches information using the GitHub API, which has rate limits of up to 60 requests an hour for unauthenticated requests (which might be good enough for you, you never know!) However, if you *do* see this error message it means you need to generate a _personal access token_ on GitHub (instructions [here](https://github.com/settings/tokens)) and drop it into line 9 of content_scripts/main.js as below.

```javascript
var PERSONAL_ACCESS_TOKEN = '24uerajshbadjhf765789fadvDDFfa9d';
```

This should raise your limit to 5000 requests per hour, which is good enough for even the craziest application grader.

To apply these changes to your extension, save the file and _refresh_ the
Extensions page on Chrome. It's that easy!

###### _Note:_ Please keep your personal access token safe and *never* push it to any public channels/repositories.
