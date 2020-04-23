# Animal Crossing New Horizons: Turnip Prophet
[![discord](https://img.shields.io/badge/discord-join-7289DA.svg?logo=discord&longCache=true&style=for-the-badge)](https://discord.gg/bRh74X8)
[![issues](https://img.shields.io/github/issues/mikebryant/ac-nh-turnip-prices?style=for-the-badge)](https://github.com/mikebryant/ac-nh-turnip-prices/issues)
[![pull requests](https://img.shields.io/github/issues-pr/mikebryant/ac-nh-turnip-prices?style=for-the-badge)](https://github.com/mikebryant/ac-nh-turnip-prices/pulls)
[![contributors](https://img.shields.io/github/contributors/mikebryant/ac-nh-turnip-prices?style=for-the-badge)](https://github.com/mikebryant/ac-nh-turnip-prices/graphs/contributors)
	
Turnip Prophet is a price calculator/price predictor for Animal Crossing New Horizons turnip prices.

## Support

If you have any questions feel free to join our [Discord server](https://discord.gg/bRh74X8) to ask or [open a new issue](https://github.com/mikebryant/ac-nh-turnip-prices/issues).

If you have a prediction issue, please open an issue describing your problem and give the permalink to your prediction. Otherwise, please search the issues before opening a new one to make sure you are not opening a duplicate issue.

Please create issues in English language only.

## What about feature X?

At first please have a look at our current project scope:

| Turnip Prophet is | Turnip Prophet is not |
|----|----|
| A predictor for future prices that week | A calculator for how much money you'll make |
| Able to calculate probabilities for different futures | A way to count your turnips |
| Able to show data from a query string | A way to store multiple people's islands |
| A single page web-based app | Something with a backend |

If your idea, suggestment or improvement is anything out of the above named, feel free to [open a new issue](https://github.com/mikebryant/ac-nh-turnip-prices/issues) or contribute by a [new pull request](https://github.com/mikebryant/ac-nh-turnip-prices/pulls).

## How to run the project locally?

To run the project locally you will have to clone it and then, from the folder your just cloned, you will have to execute a command. There are multiple options, listed below:

### Using python

For python 2.7: 

```python -m SimpleHTTPServer```

For python 3:

```python3 -m http.server```

### Using Nodejs

```npx serve```

### Using Chrome

```google-chrome --allow-file-access-from-files```


## Adding a new language

Turnip Prophet is already available in some languages. If your local language is not listed you may go on to create a JSON file corresponding to your language in the folder [locales](https://github.com/mikebryant/ac-nh-turnip-prices/tree/master/locales). You may copy the [English localisation](https://github.com/mikebryant/ac-nh-turnip-prices/blob/master/locales/en.json) and translate it. 

Please make sure **not to translate** "Turnip Prophet" and include the new language in the selector inside [js/translations.js](https://github.com/mikebryant/ac-nh-turnip-prices/blob/master/js/scripts.js).

If you have any remaining questions, feel free to stop by the Discord server and ask. 


## Final statement

A special thanks to all who [contribute](https://github.com/mikebryant/ac-nh-turnip-prices/graphs/contributors) to this project, helping improve it and spend their time.

Stay awesome guys.
