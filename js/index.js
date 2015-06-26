var app = angular.module('app', []);

app.controller("MainCtrl", ['$scope', '$interval', '$timeout', function(scope, $interval, $timeout) {
  angular.extend(scope, {
  	heuristics: {},
    curDollar: 1000,
    roi: 0.8,
    variance: 0.7,
    log: [],
    games: {},
    allTiers: [
  		{
  			name: "Indie Game",
  			cost: 1000,
  			time: 20,
  			initialAwareness: 0.2,
  			unlockRequirement: null
  		},
  		{
  			name: "Small Game",
  			cost: 5000,
  			time: 30,
  			initialAwareness: 0.3,
  			unlockRequirement: null
  		},
  		{
  			name: "Medium Game",
  			cost: 20000,
  			time: 100,
  			initialAwareness: 0.4,
  			unlockRequirement: null
  		},
  		{
  			name: "Large Game",
  			cost: 130000,
  			time: 500,
  			initialAwareness: 0.6,
  			unlockRequirement: "cost"
  		},
  		{
  			name: "Epic Game",
  			cost: 2000000,
  			time: 800,
  			initialAwareness: 0.8,
  			unlockRequirement: "cost"
  		},
  		{
  			name: "Legendary Game",
  			cost: 40000000,
  			time: 1200,
  			initialAwareness: 1,
  			unlockRequirement: "success"
  		}
  	],
    tiers: [],
    timer: {
      gameDay: 1,
  	  gameSpeed: 1,
  	  gameSpeedCounter: 0,
  	  awarenessMax: 10,
  	  awarenessCounter: 0,
  	  gameDayMax: 30,
  	  gameDayCounter: 0,
  	  progressMax: 1,
  	  progressCounter: 0
  	},
  	recurringSalesOn: true,
  	projects: [],
  	games: [],
  	name: ""
  });
  
  angular.extend(scope, {
  	start: function() {
  	  scope.curDollar = 4200;
  	  scope.roi = 0.8;
  	  scope.variance = 0.4;
  		scope.started = true;
  	},
  
  	makeGame: function(tier) {
  		if(scope.curDollar < tier.cost) {
  			return false;
  		}
  		scope.curDollar -= tier.cost;
  
  		scope.requestName = true;
  		scope.name = generateRandomName();
  		scope.curTier = tier;
  	},
  	
  	giveMoney: function(amount){
  		scope.curDollar += amount;
  		
  		scope.log.push("dSolver thanks you for thinking about him, and rewarded you with $" + amount);
  	},
  	
  	startProject: function() {
  		scope.requestName = false;
  		scope.curProject = {
  			name: scope.name != "" ? scope.name : generateRandomName(),
  			tier: scope.curTier,
  			investment: scope.curTier.cost,
  			investmentReturn: scope.curTier.cost,
  			progress: 0,
  			max: scope.curTier.time,
  			quality: 0.67,
  			releaseAwareness: scope.curTier.initialAwareness,
  			advertisingCost: scope.curTier.cost * 0.17,
  			qualityCost: scope.curTier.cost * 0.20,
  			speedCost: scope.curTier.cost * 0.10
  		}
  	},
  
  	changeGameSpeed: function(val) {
  	  scope.timer.gameSpeed = val;
  	},
  
  	boostDevelopmentSpeed: function() {
  		var cost = scope.curProject.speedCost;
  	  if(scope.curDollar < cost) { return false; }
  		
      var msg = "You spent $" + cost + " to speed up development time, it ";
  		var max = Math.floor(scope.curProject.max / 10);
  		var result = randDec(-max/4, max);
  		if(result >= max/2) {
  		  msg += "went fantastic!";
  		} else if(result >= 0 && result < max/2) {
  		  msg += "went alright.";
  		} else {
  		  msg += "went disastrously.";
  		}
  
  		scope.curProject.progress += result;
  		result = Math.round(result / scope.curProject.max * 100);
  		msg += " (" + result + "%)";
  		scope.curDollar -= cost
  		scope.curProject.speedCost += Math.round(cost * 0.05);
  		scope.curProject.investment += cost;
  		scope.curProject.investmentReturn += cost/4; // managers trying to speed up development isn't as worthwhile
  		scope.log.unshift(msg);
  	},
  	
  	boostReleaseAwareness: function() {
  	  var cost = scope.curProject.advertisingCost;
  	  if(scope.curDollar < cost) { return false; }
  	  scope.curDollar -= cost;
  		scope.curProject.advertisingCost += Math.round(cost * 0.40);
  		scope.curProject.investment += cost;
  		scope.curProject.investmentReturn += 0;
  		var min = 0.0;
  		var max = 0.5;
  	  var value = randDec(min, max);
  	  scope.curProject.releaseAwareness += value;
  	  scope.curProject.releaseAwareness = Math.min(scope.curProject.releaseAwareness, 1);
  	  console.log("Awareness improved by " + value + " to " + scope.curProject.releaseAwareness);
  	  var message = "You spent $" + cost + " on pre-release advertising. " + scope.getBoostEffectiveness(value, min, max, "hype").message;
  	  if(scope.curProject.releaseAwareness >= 1) {
  	    message += " Audiences are clamoring for " + scope.curProject.name + "!";
  	  }
  	  scope.log.unshift(message);
  	},
  	
  	boostReleaseQuality: function() {
  	  var cost = scope.curProject.qualityCost;
  	  if(scope.curDollar < cost) { return false; }
  	  scope.curDollar -= cost;
  		scope.curProject.qualityCost += Math.round(cost * 0.40);
  		scope.curProject.investment += cost;
  		scope.curProject.investmentReturn += cost*3/4;
  		var min = 0.02;
  		var max = 0.12;
  	  var value = randDec(min, max);
  	  scope.curProject.quality += value;
  	  console.log("Quality improved by " + value + " to " + scope.curProject.quality);
  	  scope.log.unshift("You spent $" + cost + " on improving quality. " + scope.getBoostEffectiveness(value, min, max, "quality").message);
  	},
  	
  	boostAwareness: function(game){
  	  var cost = Math.round(game.releaseInvestment/5 + (game.investment - game.releaseInvestment)/10);
  	  if(scope.curDollar < cost) { return false; }
  		scope.curDollar -= cost;
  		game.investment += cost;
  		game.awareness += randInt(10, 40)/100 + game.awareness/10;
  		if(game.awareness > 1){
  			game.awareness = 1;
  		}
  	},
  	
  	initializeTiers: function() {
  		scope.tiers = [];
  		for(var i = 0; i < scope.allTiers.length; i++) {
  		  var tier = scope.allTiers[i];
  
  		  if(tier.unlockRequirement === null){
  		    scope.tiers.push(tier);
  		  }
  		  else if(tier.unlockRequirement === "cost") {
  		    if(scope.curDollar > tier.cost*0.1) {
  		      scope.tiers.push(tier);
  		    }
  		  }
  		  else if(tier.unlockRequirement === "success") {
  		    // add success criteria
  		  }
  
  		}
  	},
  	
  	getBoostEffectiveness: function(value, min, max, type) {
  		var ratio = (value - min) / max;
  		
  		var performance = [];
  		
  		if(type == "quality") {
    		performances = [
    				"The effort went quite poorly. (+    )",
    				"It was not very effective. (++   )",
    				"It yielded an average increase. (+++  )",
    				"The effect was positive. (++++ )",
    				"It's super effective! (+++++)"
    		];
  		}
  		if(type == "hype") {
    		performances = [
    				"It put people to sleep. (+    )",
    				"It was pretty boring. (++   )",
    				"It went okay. (+++  )",
    				"It excited audiences! (++++ )",
    				"It created rabid fanboys! (+++++)"
    		];
  		}
  		
  		var performance;
  		if (ratio < 0.2) {
  			performance = performances[0];
  		} else if (ratio < 0.4) {
  			performance = performances[1];
  		} else if (ratio < 0.6) {
  			performance = performances[2];
  		} else if (ratio < 0.8) {
  			performance = performances[3];
  		} else {
  			performance = performances[4];
  		}
  		
  		//console.log("Ratio on (" + value + "," + min +"," + max + ") was " + ratio);
  		
  		return {ratio: ratio, message: performance};
  	},
  	
  	getReleaseProjectPerformance: function(initialSales, investment, quality) {
  		var ratio = initialSales / investment * quality;
  		
  		var performances = [
  				"dismally",
  				"pretty bad",
  				"alright",
  				"better than expected",
  				"pretty well",
  				"amazingly"
  		];
  		
  		var performance;
  		if (ratio < 0.5) {
  			performance = performances[0];
  		} else if (ratio < 0.75) {
  			performance = performances[1];
  		} else if (ratio < 1.12) {
  			performance = performances[2];
  		} else if (ratio < 1.4) {
  			performance = performances[3];
  		} else if (ratio < 1.8) {
  			performance = performances[4];
  		} else {
  			performance = performances[5];
  		}
  		return performance;
  	},
  	
  	/*logHeuristics: function(parent, nested) {
  	  if(!nested) nested = 1;
  	  if(nested > 3) return;
		  for(var prop in parent) {
		    if(scope.hasOwnProperty(prop)) {
		      var value = parent[prop];
		      if(typeof value === 'number') {
		        console.log(prop + ": " + value);
		      }
		      else if(typeof value === 'object') {
		        scope.logHeuristics(value, nested+1);
		      }
		    }
		  }
  	  
  	},*/
  	
  	storeVariableHeuristics: function(object, name, value, length) {
  		if(object.heuristics === undefined) {
  			object.heuristics = {};
  		}
  		if(object.heuristics[name] === undefined) {
  			object.heuristics[name] = [];
  		}
  		
  		object.heuristics[name].push(value);
  		if(object.heuristics[name].length > length) {
  			object.heuristics[name].shift();
  		}
  	},

  	gameTick: function() {
  	  scope.timer.gameSpeedCounter += scope.timer.gameSpeed;
  	  while(scope.timer.gameSpeedCounter >= 1) {
  	    scope.timer.gameSpeedCounter--;
  	    
    		scope.timer.progressCounter++;
    		while(scope.timer.progressCounter >= scope.timer.progressMax) {
    		  scope.timer.progressCounter -= scope.timer.progressMax;
    		  scope.tickProjectProgress();
    		}
    
    		scope.timer.awarenessCounter++;
    		while(scope.timer.awarenessCounter >= scope.timer.awarenessMax) {
    		  scope.timer.awarenessCounter -= scope.timer.awarenessMax;
    		  scope.tickGameAwareness();
    		}
    
    		scope.timer.gameDayCounter++;
    		while(scope.timer.gameDayCounter >= scope.timer.gameDayMax) {
    		  scope.timer.gameDayCounter -= scope.timer.gameDayMax;
    		  scope.tickGameDay();
    		}
    
    		var oldDollar = scope.curDollar;
    		if (!scope.curProject && scope.curDollar === oldDollar && scope.games.length > 0 && scope.curDollar < scope.tiers[0].cost * 0.1) {
    			$timeout(function() {
    				scope.gameOver = true;
    				scope.timer.gameSpeed = 0;
    			}, 2500);
    		}
  	  }
  	},
  
  	tickProjectProgress: function() {
  		if (scope.curProject) {
  			scope.curProject.progress += 0.1;
  			if (scope.curProject.progress >= scope.curProject.max) {
  				var investmentReturn = scope.curProject.investmentReturn;
  				var quality = randDec(scope.curProject.quality * (1 - scope.variance), scope.curProject.quality);
  				//var quality = scope.curProject.quality * (1 - scope.variance) + Math.random() * scope.curProject.quality * ((scope.variance) * 2);
  				console.log("Game quality is " + quality + " from between " + (scope.curProject.quality * (1 - scope.variance)) + " and " + scope.curProject.quality);
  				var initialSales = investmentReturn * quality * scope.roi;
  				var performance = scope.getReleaseProjectPerformance(initialSales, investmentReturn, quality);
  				var initialAwareness = Math.min(1, scope.curProject.releaseAwareness * quality);
          initialSales = Math.round(initialSales);

  				var game = {
  					name: scope.curProject.name,
  					investment: scope.curProject.investment,
  					investmentReturn: investmentReturn,
  					sales: initialSales,
  					quality: Math.round(quality*314.159),
  					qualityPercent: quality,
  					recurringSales: 0,
  					awareness: initialAwareness,
  					releaseInvestment: scope.curProject.investment,
  					releaseSales: initialSales,
  					releaseAwareness: initialAwareness,
  					releasePerformance: performance,
  					releaseDate: scope.timer.gameDay,
  					idleDayCounter: 0
  				};
  				
  				scope.curDollar += initialSales;
  				
  				scope.games.push(game);
  				scope.log.unshift("Your " + scope.curProject.tier.name + ", " + scope.curProject.name + "  performed " + performance + ", it made $" + initialSales + " and had a quality of " + game.quality + ".");
  				scope.curProject = null;
  
  			}
  		}
  	},
  	
  	tickGameAwareness: function() {
  		if (scope.games.length > 0 && scope.recurringSalesOn) {
  			angular.forEach(scope.games, function(game, index) {
  				if (game.awareness > 0) {
  					var recurringsale = game.releaseSales / 20 * game.awareness;
  
  					scope.curDollar += recurringsale;
  					game.recurringSales += recurringsale;
  					game.sales += recurringsale;
  					game.revenue = game.sales - game.investment;
  
            var value = randDec(0.005,0.015) * (1.7-game.awareness); // lose more awareness once your popularity starts to fall off
  					game.awareness -= value;
  
  					if (game.awareness < 0) {
  						game.awareness = 0;
  					}
  				}
  				else {
  				  // trickle funds in for games still sold
  				  if(randInt(1, 5) == 1) {
  				    game.awareness += randDec(0.005,0.015);
  				  }
  				}
  				
  				if(game.awareness <= 0.05) {
  				  game.idleDayCounter += 1;
  				  if(game.idleDayCounter >= 400) {
  				    scope.log.unshift(game.name + " has gone off the market after $" + curr(game.recurringSales) + " in sales and a profit of $" + curr(game.investment-game.recurringSales) + " over " + (scope.timer.gameDay-game.releaseDate) + " days.");
  				    removeElement(scope.games, game);
  				  }

  				}
  			});
  		}
  	},
  	
    tickGameDay: function() {
		  scope.timer.gameDay += 1;
		  
		  scope.initializeTiers();
		  
		  _.each(scope.games, function(game) {
		  	scope.storeVariableHeuristics(game, 'recurringSales', game.recurringSales, 100);
		  	scope.storeVariableHeuristics(game, 'awareness', game.awareness, 100);
		  	scope.storeVariableHeuristics(game, 'revenue', game.revenue, 100);
		  	scope.storeVariableHeuristics(game, 'profitPercent', game.recurringSales/game.investment, 100);
		  });
    }

  });
  

	scope.initializeTiers();
	scope.start();
	$interval(scope.gameTick, 100);
	
	function curr(value) {
	  return Number(value.toFixed(2));
	}
	
	function round(value) {
	  return Math.round(value);
	}
	
	function removeElement(arr, elem) {
	  var index = arr.indexOf(elem);
	  arr.splice(index, 1);
	  return arr;
	}
	
	function randInt(min, max) {
	  if(!min) min = 0;
	  if(!max) max = 100;
	  return Math.floor(Math.random() * (max - min) + min);
	}

	function randDec(min, max) {
	  if(!min) min = 0;
	  if(!max) max = 1;
	  return Math.random() * (max - min) + min;
	}
	
	function generateRandomName() {
	  var startWords = [];
	  var middleWords = [];
	  var endWords = [];
	}
	
	function generateRandomName() {
	  var startWords = ["Legend", "Ace", "Action", "Adventure", "After", "Air", "Airbourne", "Alien",
  	  "Alone", "Amazing", "Archon", "Armor", "Age", "Aqua",
  	  "Balance", "Bad", "Battle", "Bandit",
  	  "Barbarian", "Below", "Big", "Bio", "Black", "Blind", "Blood", "Blue", "Bomb", "Bomber", "Border",
  	  "Brain", "Bubble", "Burn",
  	  "Campaign", "Captain", "Car", "Castle", "Catacomb", "Chaos", "Chrono",
  	  "Civil", "Cloud", "Cold", "Command", "Cool", "Creature", "Cyber",
  	  "Demon", "Daemon", "Dangerous", "Dark", "Defender", "Despair", "Die", "Death", "Dinosaur", "Donkey",
  	  "Doom", "Down", "Dracula", "Dragon", "Dream", "Drug", "Duke", "Dungeon", 
  	  "Echo", "Earth", "Eagle", "Elder", "Emergency", "Empire", "Encounter", "Executive", "Eye", 
  	  "Falcon", "Fade", "Face", "Fantasy", "Final", "Fast", "Field", "Fire", "Fleet", "Flying", "Forgotten"
  	  ];
	  var middleWords = [];
	  var endWords = ["Thunder", "Ball", "Puzzles", "Legions", "Viper", "Tentacle", "Death", "Descent", "Dungeon", "Dark", "Sun", "Moon", "Star", "Alien",
	  	"Predator", "Tomorrow", "Today", "Vengeance", "Wake", "Rain", "Speed", "Blood", "Guts",
	  	"Quest", "League", "Dragon", "Blade", "Sword", "Nodachi", "Simulator", "Fantasy", "Finale",
	  	"Duck", "Hobbit", "Dwarf", "Emu"];

	  var name = pick(startWords) + " " + pick(endWords);
	  return name;
	}

	function pick(items) {
		return items[Math.floor(Math.random()*items.length)];
	}

}]);

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});


// Requires jQuery from http://jquery.com/
// and jQuerySparklines from http://omnipotent.net/jquery.sparkline
 
// AngularJS directives for jquery sparkline
app.directive('jqSparkline', [function () {
    'use strict';
    return {
        restrict: 'AE',
        require: 'ngModel',
        link: function (scope, elem, attrs, ngModel) {

            var opts={};
             //TODO: Use $eval to get the object
            opts.type = attrs.type || 'line';

            scope.$watchCollection(attrs.ngModel, function () {
              render();
            }, true);
            
            scope.$watch(attrs.opts, function(){
              render();
            });
            
            var render = function () {
                var model;
                if(attrs.opts) 
                	angular.extend(opts, angular.fromJson(attrs.opts));

                // Trim trailing comma if we are a string
                angular.isString(ngModel.$viewValue) ? model = ngModel.$viewValue.replace(/(^,)|(,$)/g, "") : model = ngModel.$viewValue;
                
                var data;
                if(model === undefined) {
                	return;
                }
                // Make sure we have an array of numbers
                angular.isArray(model) ? data = model : data = model.split(',');
                $(elem).sparkline(data, opts);
            };
        }
    }
}]);

app.directive('selectOnClick', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function () {
                if (!window.getSelection().toString()) {
                    // Required for mobile Safari
                    this.setSelectionRange(0, this.value.length)
                }
            });
        }
    };
});