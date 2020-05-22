/**
 * Stores and manages user input changes until updates are called.
 * Revealing Module Pattern to manage localStorage and DOM interactions.
*/
let RootData = (() => {
    // Identify if data has been changed and storage needs updated
    let _needsUpdate = false;

    // Shared function, attempt to parse integer value, throw error on failure.
    let tryParseInt = ((intToParse)=>{
        console.log(intToParse);
        if (intToParse === '' || intToParse === null || intToParse === NaN) {
            return NaN;
        }

        let parsed;
        parsed = parseInt(intToParse);

        if (isNaN(parsed)) {
            throw `The value '${intToParse}' could not be parsed into an integer.`;
        }

        return parsed;
    });

    /**
     * @link https://stackoverflow.com/questions/9907419/how-to-get-a-key-in-a-javascript-object-by-its-value
     * @param {Object} obj Object to search
     * @param {String} val Value to search
     * @return {String} Key of Value in Object
     */
    let getKeyByValue = ((obj, val) => {
        return Object.keys(obj).find(key => obj[key] === val);
    });

    let update = (() => {
        if (!_needsUpdate) {
            // Update not needed
            return false;
        }

        const prices = [_buyPrice.get(), _buyPrice.get(), ..._sellPrices.get()];
        try {
            if (prices.length !== 14) {
                throw "The data array needs exactly 14 elements to be valid."
            }
            localStorage.setItem("sell_prices", JSON.stringify(prices));
            localStorage.setItem("first_buy", JSON.stringify(_firstBuy.get()));
            localStorage.setItem("previous_pattern", JSON.stringify(_previousPattern.get()));
            // Update successful
            return false;
        } catch (e) {
            console.error(e);
            // Update failed
            return true;
        }
    });

    let reset = (() => {
        _sellPrices.reset();
        _buyPrice.reset();
        _previousPattern.reset();
        _firstBuy.reset();
        _needsUpdate = true;
    });

    let _sellPrices = (() => {
        /**
        * @type {Object} Store sell prices as object for easy updating from the jquery input event.
        */

        const defaultValue = (new Array(12)).fill(NaN,0,12);

        let sell_values = {
            sell_2: NaN,
            sell_3: NaN,
            sell_4: NaN,
            sell_5: NaN,
            sell_6: NaN,
            sell_7: NaN,
            sell_8: NaN,
            sell_9: NaN,
            sell_10: NaN,
            sell_11: NaN,
            sell_12: NaN,
            sell_13: NaN
        };

        /**
         * Update value of object by key, cast value to integer.
         * @param {string} key Object-entry key
         * @param {var} val Object-entry value which can be cast as an integer
         * @return {} Returns nothing
        */
        let updateValue = ((key, val) => {
            let parsed = tryParseInt(val);
            if (typeof(parsed) !== 'undefined') {
                sell_values[key] = parsed;
                _needsUpdate = true;
            }
        });

        /**
         * Return values of object as array.
         * @param {Object} obj Object to be mapped to an array
         * @return {Array} Array mapped from object
        */
        let toArray = ((obj) => {
            let arr = Object.values(obj).map(x => x ?  x : NaN);
            return arr;
        });

        /**
         * Map array to object. 
         * If input is not an array or array it too long, don't update.
         * @param {Array} arr Array to be mapped to object `sell_values`
         * @return {Object} `sell_values`
        */
        let toObj = ((arr) => {
            let keys = Object.keys(sell_values);
            if (arr.length > 0 && arr.length <= keys.length) {
                // Attempt to parse all values in array.
                let parsedArr = arr.map(x => x ? tryParseInt(x) : NaN);
                if (parsedArr) {
                    parsedArr.forEach((x,i) => sell_values[keys[i]] = x);
                    _needsUpdate = true;
                } else {
                    throw 'Could not parse all array values into integers.';
                }
            }
            return sell_values;
        });

        /**
         * Check input array for proper length.
         * @param {Array} arr Array to be mapped to object `sell_values`
         * @throws Will throw an error if array length is not 12
         * @return {} Returns nothing
        */
        let checkPrices = ((arr)=>{
            if (arr.length !== 12) {
                throw 'The data array needs exactly 12 elements to be valid.';
            }
        });
    
        /**
         * @return {Array} Return `sell_values` object as array
        */
        let get = (() =>{
            return toArray(sell_values);
        });
    
        /**
         * Set `sell_values` using an integer array
         * @param {Array} newSellPrices Integer array of length 12
        */
        let set = ((newSellPrices)=>{
            checkPrices(newSellPrices);
            toObj(newSellPrices);
        });
    
        return {
            get: get,
            set: set,
            updateValue: updateValue,
            reset: (()=>{set(defaultValue)})
        };
    })();
    
    let _buyPrice = (() => {
        const defaultValue = null;
        let value = defaultValue;

        let get = (() =>{
            return value;
        });
        let set = ((newBuyPrice)=>{
            let parsed = tryParseInt(newBuyPrice);
            if (parsed) {
                value = parsed;
                _needsUpdate = true;
            }
        });
    
        return {
            get: get,
            set: set,
            reset: (()=>{value = defaultValue})
        };
    })();
    
    let _previousPattern = (() => {
        let previousPatternEnum = {
            '-1': 'unknown',
            '0': 'fluctuating',
            '1': 'large-spike',
            '2': 'decreasing',
            '3': 'small-spike'
        };

        const defaultValue = null;
        let value = defaultValue;

        let get = (() =>{
            return value;
        });

        let set = ((newPreviousPattern)=>{
            if (previousPatternEnum[newPreviousPattern]) {
                value = tryParseInt(newPreviousPattern);
                _needsUpdate = true;
            }
        });
    
        return {
            get: get,
            set: set,
            reset: (()=>{value = defaultValue}),
            enum: previousPatternEnum
        };
    })();

    let _firstBuy = (() => {
        let firstTimeEnum = {
            'false': 'no',
            'true': 'yes'
        };

        let defaultValue = false;
        let value = defaultValue;

        let get = (() =>{
            return value;
        });

        let set = ((newFirstTimeBuy)=>{
            if (firstTimeEnum[newFirstTimeBuy]) {
                value = newFirstTimeBuy;
                _needsUpdate = true;
            }
        });
    
        return {
            get: get,
            set: set,
            reset: (()=>{value = defaultValue}),
            enum: firstTimeEnum
        };
    })();

    // Update value from a triggered jquery input event.
    let eventUpdateValue = ((id, val, name) => {
        if (typeof(id) === "string") {
            if (id.match(/^sell_\d+$/)) {
                _sellPrices.updateValue(id, val);
            } else if (id.match(/^buy$/)) {
                _buyPrice.set(val);
            } else if (name === 'first-time') {
                _firstBuy.set(val);
            } else if (name === 'pattern') {
                _previousPattern.set(val);
            }
        }
    });

    let interface = {};
    Object.defineProperties(interface, {
        sellPrices: {
            get() {return _sellPrices.get()},
            set(x) {_sellPrices.set(x);}
        },
        buyPrice: {
            get() {return _buyPrice.get()},
            set(x) {_buyPrice.set(x);},
        },
        prices: {
            get() {return [_buyPrice.get(), _buyPrice.get(), ..._sellPrices.get()]}
        },
        previousPattern: {
            get() {return _previousPattern.get()},
            set(x) {_previousPattern.set(x);},
        },
        previousPatternEnum: {
            value: _previousPattern.enum
        },
        firstBuy: {
            get() {return _firstBuy.get()},
            set(x) {_firstBuy.set(x);},
        },
        firstBuyEnum: {
            value: _firstBuy.enum
        },
        clearLocalStorage: {
            value: reset
        },
        eventUpdateValue: {
            value: (id, val, name) => eventUpdateValue(id, val, name)
        },
        // Locks away the _needsUpdate boolean so only the internal functions can change it
        update: {
            value: (()=>{_needsUpdate = update()})
        },
        needsUpdate: {
            value: _needsUpdate
         },
         getKeyByValue: {
             value: getKeyByValue
         }
    });
    return interface;
})();