# pennapps application grading
Augments the application grading process

## Installation Instructions

- Clone this repository.
- Go to Settings -> More Tools -> Extensions on Chrome.
- Load Unpacked Extension -> Open the cloned folder.

## I have a 'bad credentials' error! :(

Yep, this isn't something wild and unexpected. This app fetches information using the GitHub API, which has rate limits of up to 60 requests an hour for unauthenticated requests (which might be good enough for you, you never know!) However, if you *do* see this error message it means you need to generate a _personal access token_ on GitHub and drop it into line 9 of content_scripts/main.js as below.

```javascript
var PERSONAL_ACCESS_TOKEN = '24ajshbadjhf765789fadfa9d';
```

This should raise your limit to 5000 requests per hour, which is good enough for even the craziest application grader.

Create a personal access token on GitHub [here](https://github.com/settings/tokens).


