// ==UserScript==
// @name         Cookie Clicker Full Automation (Maximize CPS/CPC)
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Automates Cookie Clicker by buying the most efficient option between buildings and upgrades based on cookies per second (CPS) or cookies per click (CPC).
// @author       blazs-storm
// @match        https://orteil.dashnet.org/cookieclicker/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Inject the script into the page to access the global Game object
    function injectScript(fn) {
        const script = document.createElement('script');
        script.textContent = '(' + fn.toString() + ')();';
        document.body.appendChild(script);
    }

    function mainGameFunction() {
        Game.buyBulk = 10; // Adjust this for bulk purchasing (1, 10, 100, or -1 for max)

        // Function to click the big cookie automatically
        function autoClickCookie() {
            Game.ClickCookie();
        }

        // Evaluate the most efficient building based on CPS gained per price
        function getMostEfficientBuilding() {
            let bestBuilding = null;
            let bestEfficiency = 0;

            for (let i in Game.ObjectsById) {
                let building = Game.ObjectsById[i];
                let price = building.price;
                let cpsGain = building.storedCps * Game.globalCpsMult; // Estimated CPS gain

                let efficiency = cpsGain / price; // CPS per cookie spent

                if (efficiency > bestEfficiency && price <= Game.cookies) {
                    bestEfficiency = efficiency;
                    bestBuilding = building;
                }
            }

            return { bestBuilding, bestEfficiency };
        }

        // Evaluate the most efficient upgrade based on CPS or CPC gained per price
        function getMostEfficientUpgrade() {
            let bestUpgrade = null;
            let bestEfficiency = 0;

            for (let i in Game.UpgradesInStore) {
                let upgrade = Game.UpgradesInStore[i];
                let price = upgrade.getPrice();

                // Estimate the potential CPS gain from the upgrade.
                let cpsGain = Game.cookiesPs; // As a placeholder (more complex upgrades may vary)
                let efficiency = cpsGain / price; // CPS per cookie spent

                if (efficiency > bestEfficiency && price <= Game.cookies) {
                    bestEfficiency = efficiency;
                    bestUpgrade = upgrade;
                }
            }

            return { bestUpgrade, bestEfficiency };
        }

        // Compare the most efficient building and upgrade, and buy the better option
        function buyMostEfficientOption() {
            let { bestBuilding, bestEfficiency: buildingEfficiency } = getMostEfficientBuilding();
            let { bestUpgrade, bestEfficiency: upgradeEfficiency } = getMostEfficientUpgrade();

            // Compare efficiencies and buy the better option
            if (buildingEfficiency > upgradeEfficiency && bestBuilding) {
                bestBuilding.buy();
                console.log("Bought building: " + bestBuilding.name + " with efficiency: " + buildingEfficiency);
            } else if (bestUpgrade) {
                bestUpgrade.buy();
                console.log("Bought upgrade: " + bestUpgrade.name + " with efficiency: " + upgradeEfficiency);
            }

            // Refresh prices after buying
            Game.storeBulkButton(2);
        }

        // Function to click golden cookies and wrinklers
        function autoClickGoldenCookies() {
            if (Game.shimmers.length > 0) {
                for (let i in Game.shimmers) {
                    Game.shimmers[i].pop();
                    console.log("Clicked golden cookie/shimmer.");
                }
            }

            // Auto-pop wrinklers
            if (Game.elderWrath > 0) {
                for (let i in Game.wrinklers) {
                    let wrinkler = Game.wrinklers[i];
                    if (wrinkler.sucked > 0.1) {
                        wrinkler.hp = 0;
                        console.log("Popped a wrinkler.");
                    }
                }
            }
        }

        // Manage seasonal events (e.g., Christmas, Halloween)
        function manageSeasonalEvents() {
            if (Game.seasonPopup && Game.seasonPopup.life > 0) {
                Game.seasonPopup.click();
                console.log("Clicked a seasonal event.");
            }
        }

        // Automatically harvest and plant in the garden (if unlocked)
        function autoGarden() {
            if (Game.Objects['Farm'].minigameLoaded) {
                let garden = Game.Objects['Farm'].minigame;

                // Harvest mature plants
                for (let y = 0; y < garden.plot.length; y++) {
                    for (let x = 0; x < garden.plot[y].length; x++) {
                        let tile = garden.plot[y][x];
                        if (tile[0] != 0) { // If there's a plant
                            let plant = garden.plantsById[tile[0] - 1];
                            if (plant && tile[1] >= plant.mature) {
                                garden.harvest(x, y);
                                console.log("Harvested a mature plant.");
                            }
                        }
                    }
                }

                // Replant seeds in empty spots
                for (let y = 0; y < garden.plot.length; y++) {
                    for (let x = 0; x < garden.plot[y].length; x++) {
                        let tile = garden.plot[y][x];
                        if (tile[0] == 0) { // If there's an empty spot
                            garden.useTool(x, y, 'seed');
                            console.log("Planted seed in empty spot.");
                        }
                    }
                }
            }
        }

        // Automatically ascend when optimal
        function autoAscend() {
            if (Game.Has('Heavenly chips') && Game.UpgradesInStore.length === 0) {
                Game.Ascend(true);
                console.log("Ascended automatically.");
            }
        }

        // Automatically spend heavenly chips after ascension
        function autoSpendHeavenlyChips() {
            if (Game.ascensionMode === 1 && Game.heavenlyChips > 0) {
                for (let i in Game.UpgradesById) {
                    let upgrade = Game.UpgradesById[i];
                    if (!upgrade.bought && upgrade.pool === 'prestige' && upgrade.getPrice() <= Game.heavenlyChips) {
                        upgrade.buy();
                        console.log("Bought heavenly upgrade: " + upgrade.name);
                    }
                }
            }
        }

        // Automatically use sugar lumps
        function autoSpendSugarLumps() {
            if (Game.lumps > 0) {
                for (let i in Game.Objects) {
                    let object = Game.Objects[i];
                    if (object.level < 10 && Game.lumps >= object.level + 1) {
                        Game.Objects[i].upgrade();
                        console.log("Upgraded building with sugar lump: " + object.name);
                    }
                }
            }
        }

        // Train the dragon automatically if available
        function autoTrainDragon() {
            if (Game.hasAura('Ancestral Metamorphosis') && Game.Upgrades['A crumbly egg'].unlocked && !Game.dragonLevel) {
                Game.specialTabs['dragon'].unlock();
                Game.UpgradeDragon();
                console.log("Trained the dragon.");
            }
        }

        // Schedule the above functions to run periodically
        setInterval(autoClickCookie, 100); // Click cookie every 100 ms
        setInterval(buyMostEfficientOption, 2000); // Buy the most efficient option every 2 seconds
        setInterval(autoClickGoldenCookies, 5000); // Click golden cookies every 5 seconds
        setInterval(manageSeasonalEvents, 5000); // Handle seasonal events every 5 seconds
        setInterval(autoGarden, 60000); // Manage garden every minute
        setInterval(autoAscend, 300000); // Ascend every 5 minutes (optional)
        setInterval(autoSpendHeavenlyChips, 10000); // Spend heavenly chips every 10 seconds
        setInterval(autoSpendSugarLumps, 60000); // Spend sugar lumps every minute
        setInterval(autoTrainDragon, 60000); // Train dragon every minute
    }

    // Inject the script into the page's context
    injectScript(mainGameFunction);

})();
