let RootData = (() => {
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
        // Store sell prices as object for easy updating from the jquery input event.
        let value = {
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

        // Lookup value by name, cast to integer.
        let updateValue = ((name, val) => {
            value[name] = tryParseInt(val);
        });

        // Return values of object as array.
        let toArray = ((obj) => {
            let arr = Object.values(obj).map(x => x);
            return arr;
        });

        // Map array to object.
        let toObj = ((arr) => {
            let keys = Object.keys(value);
            if (arr.length > 0 && arr.length <= keys.length) {
                arr.forEach((x,i) => value[keys[i]] = x);
            }
            return value;
        });

        // Check input array for proper length.
        let checkPrices = ((arr)=>{
            if (arr.length !== 12) {
                throw 'The data array needs exactly 12 elements to be valid.';
            }
        });
    
        // Return value object as array.
        let get = (() =>{
            return toArray(value);
        });
    
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
            value = tryParseInt(newBuyPrice);
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
            value = tryParseInt(newPreviousPattern);
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

    let _dataInterface = {};
    Object.defineProperties(_dataInterface, {
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
        }
    });

    return _dataInterface;
})();