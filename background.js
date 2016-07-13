// when the extension is installed... 
chrome.runtime.onInstalled.addListener(function() {

    // replace all existing rules...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {

        // with these new rules:
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { hostSuffix: '.pennapps.com' }
                    })
                ],

                actions: [ new chrome.declarativeContent.ShowPageAction() ]
            }
        ]);
    });
});
        
