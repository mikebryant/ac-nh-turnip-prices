/**
 * Stores and manages user input changes until updates are called.
 * Revealing Module Pattern to manage localStorage and DOM interactions.
 * @property {Array} sellPrices Array of integer or NaN values of length 12: [M-AM, M-PM, T-AM, T-PM, W-AM, W-PM, Th-AM, Th-PM, F-AM, F-PM, S-AM, S-PM]
 * @property {Integer} buyPrice Integer or NaN
 * @property {Array} prices Combines buyPrice and sellPrices: [buyPrice, buyPrice, M-AM, M-PM, T-AM, T-PM, W-AM, W-PM, Th-AM, Th-PM, F-AM, F-PM, S-AM, S-PM]
 * @property {Integer} previousPattern Integer or NaN: ∈ {-1,0,1,2,3}
 * @property {Object} previousPatternEnum Enumerates expected previousPattern values and their meaning
 * @property {Boolean} firstBuy
 * @property {Object} firstBuyEnum Enumerates expected firstBuy values and their meaning
 * @property {function} clearLocalStorage Sets `sellPrices`, `buyPrice`, `previousPattern`, and `firstBuy` to their default values
 * @property {function} eventUpdateValue Update function for use in jquery input event function
 * @property {function} updateLocalStorage Saves `sellPrices`, `buyPrice`, `previousPattern`, and `firstBuy` values to localStorage 
 * @property {function} needsUpdate Indicates if the localStorage needs to be updated. Locks away the `_needsUpdate` boolean so only the internal functions can change it.
 * @property {function} getKeyByValue Helper function, search object by value, returns object key if it exists
*/
let RootData = (() => {
    /**
     * Notify if data has been changed and UI needs updated.
     * @type {Boolean}
    */
    let _needsUpdate = false;

    /**
     * Attempt to parse integer value, throw error on failure. Default for nulls and empty strings is NaN.
     * @param {var} intToParse
     * @returns {Integer|NaN|undefined} Returns integer on successful parse, undefined on unsuccessful parse, and NaN when passed null, empty string, or NaN.
     */
    let tryParseInt = ((intToParse)=>{
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
     * @returns {String} Key of Value in Object
    */
    let getKeyByValue = ((obj, val) => {
        return Object.keys(obj).find(key => obj[key] === val);
    });

    /**
     * Update local storage with expected values. 
     * @property {Array} `sell_prices` length 14 array: [buy_price, buy_price, M-AM, M-PM, T-AM, T-PM, W-AM, W-PM, Th-AM, Th-PM, F-AM, F-PM, S-AM, S-PM]
     * @property {Boolean} `first_buy`
     * @property {Integer} `previous_pattern`: ∈ {-1,0,1,2,3}
     * @returns {Boolean} Returns status for `_needsUpdate`. If successful, returns false.
     */
    let updateLocalStorage = (() => {
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


    /**
     * Reset all structures to default values.
     * @returns {} Returns nothing
     */
    let reset = (() => {
        _sellPrices.reset();
        _buyPrice.reset();
        _previousPattern.reset();
        _firstBuy.reset();
        _needsUpdate = true;
    });

    /**
     * Container for sell prices. Validates data, handles updates, and resets.
     * @returns {Object} Returns the interface for this container: get, set (consumes an array), reset,
     * and update function for jquery (consumes single value)
     */
    let _sellPrices = (() => {
        /**
         * @type {Array} Default array containing NaN of length 12. Used for data reset.
         */
        const defaultValue = (new Array(12)).fill(NaN,0,12);

        /**
        * @type {Object} Store sell prices as object for easy updating from the jquery input event.
        */
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
         * Intended to be used by jquery event functions.
         * @param {string} key Object-entry key
         * @param {var} val Object-entry value which can be cast as an integer
         * @returns {} Returns nothing
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
         * @returns {Array} Array mapped from object
         */
        let toArray = ((obj) => {
            let arr = Object.values(obj).map(x => x ?  x : NaN);
            return arr;
        });

        /**
         * Map array to object. 
         * If input is not an array or array it too long, don't update.
         * Sets `_needsUpdate` to true if successful.
         * @param {Array} arr Array to be mapped to object `sell_values`
         * @returns {Object} `sell_values`
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
         * @returns {} Returns nothing
         */
        let checkPrices = ((arr)=>{
            if (arr.length !== 12) {
                throw 'The data array needs exactly 12 elements to be valid.';
            }
        });
    
        /**
         * @returns {Array} Return `sell_values` object as array
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
    
    /**
     * Container for buy price. Validates data, handles updates, and resets.
     * @returns {Object} Returns the interface for this container: get, set, and reset.
     */
    let _buyPrice = (() => {
        /**
         * @type {Number} Default value of NaN. Used for initialization and data reset.
         */
        const defaultValue = NaN;

        /**
         * @type {Integer}
         */
        let value = defaultValue;

        /**
         * @returns {Integer} Returns value of buyPrice.
         */
        let get = (() =>{
            return value;
        });

        /**
         * Attempts to parse integer before setting the value.
         * Sets `_needsUpdate` to true if successful.
         * @param {var} newBuyPrice 
         * @returns {} Returns nothing
         */
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
    
    /**
     * Container for previous pattern. Validates data, handles updates, and resets.
     * @returns {Object} Returns the interface for this container: get, set, reset,
     * and previous pattern enumerator for external data validation.
     */
    let _previousPattern = (() => {
        /**
         * Enumerates expected values of previous pattern.
         * Most common use will be to validate using integer values
         * which is why the keys are said integers.
         * @type {Object}
         * @example 
         * if (previousPatternEnum[x]) {
         *      //value was not undefined then x is a valid integer.
         * } else {
         *      //value was undefined, x is an invalid integer.
         * }
         */
        let previousPatternEnum = {
            '-1': 'unknown',
            '0': 'fluctuating',
            '1': 'large-spike',
            '2': 'decreasing',
            '3': 'small-spike'
        };

        /**
         * @type {Number} Default value of NaN. Used for initialization and data reset.
         */
        const defaultValue = NaN;

        /**
         * @type {Integer}
         */
        let value = defaultValue;

        /**
         * @returns {Integer} Returns value of previousPattern.
         */
        let get = (() =>{
            return value;
        });

        /**
         * Attempts to parse integer before setting the value.
         * Sets `_needsUpdate` to true if successful.
         * @param {var} newPreviousPattern 
         * @returns {} Returns nothing
        */
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

    /**
     * Container for first buy. Validates data, handles updates, and resets.
     * @returns {Object} Returns the interface for this container: get, set, reset,
     * and first buy enumerator for external data validation.
     */
    let _firstBuy = (() => {
        /**
         * Enumerates expected values of first buy.
         * Most common use will be to validate using 'true' 'false' strings.
         * @type {Object}
         * @example 
         * if (firstTimeEnum[x]) {
         *      //value was not undefined then x is a valid boolean.
         * } else {
         *      //value was undefined, x is an invalid boolean.
         * }
         */
        let firstTimeEnum = {
            'false': 'no',
            'true': 'yes'
        };

        /**
         * @type {Boolean} Default value of false. Used for initialization and data reset.
         */
        let defaultValue = false;
        let value = defaultValue;

        /**
         * @returns {Boolean} Returns value of firstBuy.
         */
        let get = (() =>{
            return value;
        });

        /**
         * Verifies input is a boolean before update.
         * Sets `_needsUpdate` to true if successful.
         * @param {var} newPreviousPattern 
         * @returns {} Returns nothing
        */
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

    /**
     * Update value from a triggered jquery input event.
     * @param {String} id Jquery event target id
     * @param {String} val Jquery event target value
     * @param {String} name Jquery event target name
     */
    let eventUpdateValue = ((id, val, name) => {
        // Ensure id is a string before trying to do regex match.
        if (typeof(id) === "string") {
            // Check if id is of the form 'sell_#'
            if (id.match(/^sell_\d+$/)) {
                _sellPrices.updateValue(id, val);
            }else if (id === 'buy') {
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
        updateLocalStorage: {
            value: (()=>{_needsUpdate = updateLocalStorage()})
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