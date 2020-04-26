class MultiIsland {
   constructor(data, index = 0) {
      let islandsData,
      islandIndex = index;
      if (!data) {
         islandsData = JSON.parse(localStorage.getItem('islands_Data'));
         islandIndex = JSON.parse(localStorage.getItem('islands_Index'));
      } else {
         switch (typeof data) {
         case 'object':
            if (Array.isArray(data)) {
               // [{prices: Array, isfirst: Boolean, pattern: Int, name: String}, {...}]
               islandsData = data;
            } else {
               // {prices: Array, isfirst: Boolean, pattern: Int, name: String}
               islandsData = [data];
            }
            break;
         case 'string':
            islandsData = JSON.parse(data);
            break;
         default:
            console.error('Data Type Error!');
         }
      }
      if (!islandsData || !islandsData.length) {
         islandsData = [];
         //Compatible with older versions
         let prices = localStorage.getItem('sell_prices'),
         first = localStorage.getItem('first_buy'),
         pattern = localStorage.getItem('previous_pattern');
         islandsData[0] = new Island(prices, first, pattern);
      }
      this.islandIndex = islandIndex != null ? islandIndex : 0;
      islandsData = islandsData.filter((e) => e != null);
      this.islandsData = islandsData.map((island) => new Island(island.prices, island.isfirst, island.pattern, island.name));
      this.saveData();
   }

   getIslandData(index) {
      let islandIndex = index != null ? index : this.islandIndex;
      if (this.islandsData.length < islandIndex + 1)
         islandIndex = 0;
      return this.islandsData[islandIndex];
   }

   getIslandCount() {
      return this.islandsData.length;
   }

   setIslandData(prices, isfirst, pattern, name, index) {
      let islandIndex = index != null ? index : this.islandIndex;
      if (this.islandsData.length < islandIndex + 1) {
         addIslandData(prices, isfirst, pattern, name);
      } else {
         this.islandsData[islandIndex].setIslandData(prices, isfirst, pattern, name)
         this.saveData(1);
      }
   }

   addIsland(island) {
      this.islandsData[this.islandsData.length] = island;
      this.saveData(1);
   }

   addIslandData(prices, isfirst, pattern, name) {
      this.islandsData[this.islandsData.length] = new Island(prices, isfirst, pattern, name);
      this.saveData(1);
   }

   removeIslandData(index) {
      if (index == null || this.islandsData.length < index + 1) {
         console.warn('Missing island index!');
         return;
      }
      this.islandsData.splice(index, 1);
      this.islandIndex >= index && this.islandIndex !== 0 && this.islandIndex--;
      if (!this.islandsData.length) {
         this.islandsData = [new Island()];
         this.islandIndex = 0;
      }
      this.saveData();
   }

   removeIslandDataAll() {
      this.islandsData = [new Island()];
      this.islandIndex = 0;
      this.saveData();
   }

   setCurrentIsland(index) {
      let islandIndex = 1 * (index != null ? index : 0);
      if (this.islandsData.length < islandIndex + 1)
         islandIndex = 0;
      this.islandIndex = islandIndex;
      this.saveData(2);
   }

   /**
    * @param {Int} saveFlag - 1: islands_Data; 2: islands_Index; Others: Full save
    */
   saveData(saveFlag) {
      if (saveFlag !== 1)
         localStorage.setItem('islands_Index', JSON.stringify(this.islandIndex));
      if (saveFlag !== 2)
         localStorage.setItem('islands_Data', JSON.stringify(this.islandsData));
   }

   resetData() {
      this.islandsData = [];
      this.islandIndex = 0;
      clearLocalStorage();
   }

   clearLocalStorage() {
      localStorage.removeItem('islands_Index');
      localStorage.removeItem('islands_Data');
   }
}

class Island {
   constructor(prices = [], isfirst = false, pattern = -1, name = '') {
      this.prices = typeof prices == 'string' ? JSON.parse(prices) : prices;
      this.isfirst = typeof isfirst == 'string' ? JSON.parse(isfirst) : isfirst;
      this.pattern = 1 * pattern;
      this.name = name;
   }

   setIslandData(prices, isfirst, pattern, name) {
      this.prices = prices != null ? prices : this.prices;
      this.isfirst = isfirst != null ? isfirst : this.isfirst;
      this.pattern = pattern != null ? pattern : this.pattern;
      this.name = name != null ? name : this.name;
   }
}
