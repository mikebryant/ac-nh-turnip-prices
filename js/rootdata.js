/**
 * Stores and manages user input changes until updates are called.
 * Revealing Module Pattern to manage localStorage and DOM interactions.
*/
let RootData = (() => {
    // Identify if data has been changed and storage needs updated
    let _needsUpdate = false;

    let update = (() => {
        if (!_needsUpdate) {
            // Update not needed
            return false;
        }

        const prices = [_buyPrice, _buyPrice, ..._sellPrices];
        try {
            if (prices.length !== 14) {
                throw "The data array needs exactly 14 elements to be valid"
            }
            localStorage.setItem("sell_prices", JSON.stringify(prices));
            localStorage.setItem("first_buy", JSON.stringify(first_buy));
            localStorage.setItem("previous_pattern", JSON.stringify(previous_pattern));
            // Update successful
            return false;
        } catch (e) {
            console.error(e);
            // Update failed
            return true;
        }
    });    

    // Shared function, attempt to parse integer value, throw error on failure.
    let tryParseInt = ((intToParse)=>{
        let parsed;
        if (intToParse !== null) {
            parsed = parseInt(intToParse);
        }

        if (isNaN(parsed)) {
            throw `The value '${intToParse}' could not be parsed into an integer.`;
        }

        return parsed;
    });

    let _sellPrices = (() => {
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
         * @param {string} key Object-entry key
         * @param {var} val Object-entry value which can be cast as an integer
         * @return {} Returns nothing
        */
        let updateValue = ((key, val) => {
            let parsed = tryParseInt(val);
            if (parsed) {
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
            let arr = Object.values(obj).map(x => x);
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
                let parsedArr = arr.map(x => tryParseInt(x));
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
            updateValue: updateValue
        };
    })();
    
    let _buyPrice = (() => {
        let value = NaN;

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
            set: set
        };
    })();
    
    let _previousPattern = (() => {
        let value = NaN;

        let get = (() =>{
            return value;
        });
        let set = ((newPreviousPattern)=>{
            let parsed = tryParseInt(newPreviousPattern);
            if (parsed) {
                value = parsed;
                _needsUpdate = true;
            }
        });
    
        return {
            get: get,
            set: set
        };
    })();

    // Update value from a triggered jquery input event.
    let eventUpdateValue = ((name, val) => {
        if (typeof(name) === "string") {
            if (name.match(/^sell_\d+$/g)) {
                _sellPrices.updateValue(name, val);
            } else if (name.match(/^buy$/g)) {
                _buyPrice.set(val);
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
            set(x) {_buyPrice.set(x);}
        },
        previousPattern: {
            get() {return _previousPattern.get()},
            set(x) {_previousPattern.set(x);}
        },
        clearLocalStorage: {
            value: () => {
                console.log("ok");
            }
        },
        eventUpdateValue: {
            value: (name, val) => eventUpdateValue(name, val)
        },
        update: {
            value: (()=>{_needsUpdate = update()})
        },
        // Locks away the _needsUpdate boolean so only the internal functions can change it
        needsUpdate: {
            get() {return _needsUpdate},
            set(x) {}
         }
    });
    return interface;
})();