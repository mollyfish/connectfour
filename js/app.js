'use strict';
$(function() {
  var svgIds = [11, 12, 13, 14, 15, 16, 17, 21, 22, 23, 24, 25, 26, 27, 31, 32, 33, 34, 35, 36, 37, 41, 42, 43, 44, 45, 46, 47, 51, 52, 53, 54, 55, 56, 57, 61, 62, 63, 64, 65, 66, 67, 71, 72, 73, 74, 75, 76, 77];

  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  // DISPLAY AND TURN LOGIC

  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  // these are the increments by which circle ids increase across the gameboard
  var horizontalChainIncrement = 10;
  var verticalChainIncrement = 1;
  var diagonalDownChainIncrement = 9;
  var diagonalUpChainIncrement = 11;

  // is the user playing against the computer?
  var roboPlayer = true;
  // jQuery element for the robo player checkbox
  var checkbox = $('#robo-player');

  // track if a game has begun
  var firstClick = 0;

  // collections to track which circles belong to which player
  var playerOneCircles = {};
  var playerTwoCircles = {};

  // circles with neighbors of the same color will be stored in these arrays
  var playerOneChain = [];
  var playerTwoChain = [];
  
  // total number of filled circles on the board
  var filledCircleCount = 0;
  
  // boolean to track if the game is over or not
  var gameOver = false;
  
  // player object to track whose turn it is
  var player = {
    active    : 1,
    inactive  : 2
  }
  
  // jQuery element to use later to display whose turn it is to the user
  var playerDisplay = $('#active-player');
  playerDisplay.text("One");
  
  // jQuery element to set default color for Player One
  var colorOne = $('#color-picker-player-one').val();
  // jQuery element to set color for Player Two
  var colorTwo = $('#color-picker-player-two').val();

  // jQuery element for play again button
  var playAgain = $('#play-again');
 
  
  // object to track filled circles so that player moves go the lowest open circle in the column that was clicked
  var availableCircles = {
    colOne     : 1,
    colTwo     : 1,
    colThree   : 1,
    colFour    : 1,
    colFive    : 1,
    colSix     : 1,
    colSeven   : 1
  }

  // removes duplicates from an array
  function removeDuplicates(value, index, self) { 
    return self.indexOf(value) === index;
  }

  var hideSetupControls = function() {
    $('#robo-player').addClass("hidden");
  }

  // recolor previously filled circles if user changes color
  var reColor = function(player) {
    var collection;
    var color;
    if (player === 1) {
      collection = playerOneCircles;
      color = colorOne;
    } else {
      collection = playerTwoCircles;
      color = colorTwo;
    }
    for (var circle in collection) {
      var circleBeingChecked = collection[circle];
      var id = circleBeingChecked.id;
      $('#' + id).attr("fill", color);
    }
  }

  // blank out the gameboard colors
  var blankTheBoard = function() {   
    for (var circle in playerOneCircles) {
      var circleBeingChecked = playerOneCircles[circle];
      var id = circleBeingChecked.id;
      $('#' + id).attr("fill", "#FFF");
    }
    for (var circle in playerTwoCircles) {
      var circleBeingChecked = playerTwoCircles[circle];
      var id = circleBeingChecked.id;
      $('#' + id).attr("fill", "#FFF");
    }
  }

  // constructor for building FilledCircle objects to assist in move tracking
  var FilledCircle = function(owner, id) {
    this.owner = owner;
    this.id = id;
    this.column = id.slice(0,1);
    this.row = id.slice(-1);
    // tracks ALL neighbors
    this.neighbors = calculateNeighborCircleIds(id);
    // tracks neighbors with SAME OWNER (color)
    this.matchingNeighbors = [];
  }
  
  // calculate the ids of a circle's 8 immediate neighbors
  var calculateNeighborCircleIds = function(filledCircleId) {
    // initialize array that will be returned
    var actualNeighborIds = [];
    // calculate neighbor ids
    var topId = parseInt(filledCircleId) + 1;
    var topRightId = parseInt(filledCircleId) + 11;
    var rightId = parseInt(filledCircleId) + 10;
    var bottomRightId = parseInt(filledCircleId) + 9;
    var bottomId = parseInt(filledCircleId) - 1;
    var bottomLeftId = parseInt(filledCircleId) - 11;
    var leftId = parseInt(filledCircleId) - 10;
    var topLeftId = parseInt(filledCircleId) - 9;
    // create array of caluculated ids
    var possibleIds = [topId, topRightId, rightId, bottomRightId, bottomId, bottomLeftId, leftId, topLeftId];
    // loop through calculated ids to eliminate impossible values (ex: a corner circle will only have 3 neighbors, so the 5 impossible ones will be eliminated in this check)
    for (var i = 0; i < possibleIds.length; i++) {
      if (svgIds.includes(possibleIds[i])) {
        actualNeighborIds.push(possibleIds[i]);
      }
    }
    // return filtered array of neighbor ids
    return actualNeighborIds;
  }

  // render the player's move by filling in the appropriate circle
  var renderMove = function(columnNumber, columnKey, fillColor) {
    var filledCircleId = "";
    $('.col' + columnNumber + '.row' + availableCircles[columnKey]).attr("fill", fillColor);
    filledCircleId = columnNumber.toString() + availableCircles[columnKey].toString();
    // return the id of the filled circle to enable neighbor checking
    return filledCircleId;
  }

  // use the id of the newly filled circle to assign it to the active player
  var trackMove = function(filledCircleId) {
    console.log("move by player " + player.active);
    // create the newly filled circle object
    var filledCircle = new FilledCircle(player.active, filledCircleId.toString());
    // increment the total number of filled circles
    filledCircleCount = filledCircleCount + 1;
    // create a string to use as a key
    var newKey = "circle" + filledCircleCount;
    // check for active player
    // assign newly filled circle to appropriate player
    if (player.active === 1) {
      playerOneCircles[newKey] = filledCircle;
    } else {
      playerTwoCircles[newKey] = filledCircle;
    }
    // return the newly filled circle object
    return filledCircle;    
  }

  var checkForNeighborsWithSameOwner = function(newlyFilledCircle, player) {
    var setToCheck;
    // check who is playing
    if (player === 1) {
      setToCheck = playerOneCircles;
    } else {
      setToCheck = playerTwoCircles;
    }
    for (var circle in setToCheck) {
      var circleBeingChecked = setToCheck[circle];
      // if owners match, and circle is not being compared to itself, and circle being checked is a neighbor, 
      // add circle being checked to array of matching neighbors
      if (circleBeingChecked.owner === newlyFilledCircle.owner 
        && circleBeingChecked.id != newlyFilledCircle.id 
        && newlyFilledCircle.neighbors.includes(parseInt(circleBeingChecked.id))) {
          newlyFilledCircle.matchingNeighbors.push(circleBeingChecked.id);
          // add matching neighbor back to other circle so it updates
          if (!circleBeingChecked.matchingNeighbors.includes(parseInt(newlyFilledCircle.id))) {
            circleBeingChecked.matchingNeighbors.push(newlyFilledCircle.id);
          }
        }
      }
      // return the setToCheck for var arr = buildConnectionChains to use(setToCheck, player);
      return setToCheck;
  }

  var buildConnectionChains = function(setToCheck, player) {(setToCheck, player);
    for (var circle in setToCheck) {
      var circleBeingChecked = setToCheck[circle];
      if (circleBeingChecked.matchingNeighbors.length < 1) {
        // the circle has no neighbors of hte same color
        console.log("no matching neighbors for circle " + circleBeingChecked.id);
      } else {
        // for every neighbor
        for (var i = 0; i < circleBeingChecked.matchingNeighbors.length; i++) {
          // determine who is playing
          if (player === 1) {
            // save the id of the neighbor into the player's neighbor chain
            playerOneChain.push(circleBeingChecked.matchingNeighbors[i]);
            // create an array with no duplicate values based on the player's neighbor chain
            var noDupes = playerOneChain.filter(removeDuplicates);
            // set the array with no dupes to be the player's neighbor chain
            playerOneChain = noDupes;
            // sort the player's neighbor chain to be in order from smallest to largest
            playerOneChain.sort();
          } else {
            playerTwoChain.push(circleBeingChecked.matchingNeighbors[i]);
            var noDupes = playerTwoChain.filter(removeDuplicates);
            playerTwoChain = noDupes;
            playerTwoChain.sort();
          }          
        }
      }
    }
    // return the two neighbor chains
    return [playerOneChain, playerTwoChain];
  }

  // examine the player's neighbor chain for winning sequences in any direction
  var examineConnectionChains = function(chain) {    
    // given a direction and a chain, check for a winning sequence
    var horizontal = checkForChain(horizontalChainIncrement, chain);
    var vertical = checkForChain(verticalChainIncrement, chain);
    var diagonalDown = checkForChain(diagonalDownChainIncrement, chain);
    var diagonalUp = checkForChain(diagonalUpChainIncrement, chain);
    // if any of the checks reveal a winning sequence, return TRUE
    if (horizontal === true || vertical === true || diagonalDown === true || diagonalUp === true) {
      console.log("Player " + player.active + " WON!");
      return true;
    } else {
      return false;
    }
  }

  // calculate and look for winning sequences
  var checkForChain = function(increment, chain) {
    // assume no winner
    var winner = false;
    // for every circle
    for (var i = 0; i < chain.length; i++) {
      // start with the value of the circle's id; this works because of the way the circles are assigned ids in the HTML 
      // the smallest value is in the lower left corner and they get larger first as you go up, then as you go right
      var startValue = parseInt(chain[i]);
      // empty the array of winning values
      var winningValues = [];
      // calculate the winning values for the given start value (the current neighbor id)
      winningValues = [startValue + increment, startValue + (2 * increment), startValue + (3 * increment)];
      // if all the winning values are present in the neighbor chain, the player has won
      if (chain.includes(winningValues[0].toString()) && chain.includes(winningValues[1].toString()) && chain.includes(winningValues[2].toString())) {
        // player has won, set winner to TRUE, break for loop
        winner = true;
        playAgain.removeClass("hidden");
        break;
      }
    }
    // return boolean of whether there was a win or not
    return winner;
  }

  // swap the active player
  var swapPlayer = function(){
    var swapped = false;
    if (player.inactive === 1) {
      player.inactive = 2;
      player.active = 1;
      playerDisplay.text("One");
      swapped = true;
    }
    if (player.inactive === 2 && swapped === false) {
      player.inactive = 1;
      player.active = 2;
      playerDisplay.text("Two");
      swapped = true;
    }
    return player;
  }

  var playConnectFour = function(columnNumber, columnKey, fillColor, circleId, circleObj, setOfCirclesToCheck, chains) {
    // switch statement to set key values in availableCircles object:
      // check which column was clicked
      // assign string as key value
      // render the move by changing the fill color of the bottom-most open circle in the column
      // track the move by created a new FilledCircle obj and assigning it to the appropriate player
      // check to see if the newly chosen circle has immediate neighbors of the same color
      // if it does, update the circle's neighbor array and also the neighbor array of the circle
      // build or update chains of neighbors for the active player
      // examine the chains of neighbors for winning sequences (based on circle ids)
      // if winner, gameOver will be set to TRUE
      // if no winner, gameOver will remain false
      // change to other player and break switch statement
    // update available circles to show that a new circle has been filled in
    switch(columnNumber) {
      case 1:
        columnKey = "colOne";
        circleId = renderMove(columnNumber, columnKey, fillColor);
        circleObj = trackMove(circleId);
        setOfCirclesToCheck = checkForNeighborsWithSameOwner(circleObj, player.active);
        chains = buildConnectionChains(setOfCirclesToCheck, player.active);
        playerOneChain = chains[0];
        playerTwoChain = chains[1];
        if (player.active === 1) {
          if (playerOneChain.length > 3) {
            gameOver = examineConnectionChains(playerOneChain);
          }
        } else {
          if (playerTwoChain.length > 3) {
            gameOver = examineConnectionChains(playerTwoChain);
          }
        }
        swapPlayer();
        break;
      case 2:
        columnKey = "colTwo";
        circleId = renderMove(columnNumber, columnKey, fillColor);
        circleObj = trackMove(circleId);
        setOfCirclesToCheck = checkForNeighborsWithSameOwner(circleObj, player.active);
        chains = buildConnectionChains(setOfCirclesToCheck, player.active);
        playerOneChain = chains[0];
        playerTwoChain = chains[1];
        if (player.active === 1) {
          if (playerOneChain.length > 3) {
            gameOver = examineConnectionChains(playerOneChain);
          }
        } else {
          if (playerTwoChain.length > 3) {
            gameOver = examineConnectionChains(playerTwoChain);
          }
        }
        swapPlayer();
        break;
      case 3:
        columnKey = "colThree";
        circleId = renderMove(columnNumber, columnKey, fillColor);
        circleObj = trackMove(circleId);
        setOfCirclesToCheck = checkForNeighborsWithSameOwner(circleObj, player.active);
        chains = buildConnectionChains(setOfCirclesToCheck, player.active);
        playerOneChain = chains[0];
        playerTwoChain = chains[1];
        if (player.active === 1) {
          if (playerOneChain.length > 3) {
            gameOver = examineConnectionChains(playerOneChain);
          }
        } else {
          if (playerTwoChain.length > 3) {
            gameOver = examineConnectionChains(playerTwoChain);
          }
        }
        swapPlayer();
        break;
      case 4:
        columnKey = "colFour";
        circleId = renderMove(columnNumber, columnKey, fillColor);
        circleObj = trackMove(circleId);
        setOfCirclesToCheck = checkForNeighborsWithSameOwner(circleObj, player.active);
        chains = buildConnectionChains(setOfCirclesToCheck, player.active);
        playerOneChain = chains[0];
        playerTwoChain = chains[1];
        if (player.active === 1) {
          if (playerOneChain.length > 3) {
            gameOver = examineConnectionChains(playerOneChain);
          }
        } else {
          if (playerTwoChain.length > 3) {
            gameOver = examineConnectionChains(playerTwoChain);
          }
        }
        swapPlayer();
        break;
      case 5:
        columnKey = "colFive";
        circleId = renderMove(columnNumber, columnKey, fillColor);
        circleObj = trackMove(circleId);
        setOfCirclesToCheck = checkForNeighborsWithSameOwner(circleObj, player.active);
        chains = buildConnectionChains(setOfCirclesToCheck, player.active);
        playerOneChain = chains[0];
        playerTwoChain = chains[1];
        if (player.active === 1) {
          if (playerOneChain.length > 3) {
            gameOver = examineConnectionChains(playerOneChain);
          }
        } else {
          if (playerTwoChain.length > 3) {
            gameOver = examineConnectionChains(playerTwoChain);
          }
        }
        swapPlayer();
        break;
      case 6:
        columnKey = "colSix";
        circleId = renderMove(columnNumber, columnKey, fillColor);
        circleObj = trackMove(circleId);
        setOfCirclesToCheck = checkForNeighborsWithSameOwner(circleObj, player.active);
        chains = buildConnectionChains(setOfCirclesToCheck, player.active);
        playerOneChain = chains[0];
        playerTwoChain = chains[1];
        if (player.active === 1) {
          if (playerOneChain.length > 3) {
            gameOver = examineConnectionChains(playerOneChain);
          }
        } else {
          if (playerTwoChain.length > 3) {
            gameOver = examineConnectionChains(playerTwoChain);
          }
        }
        swapPlayer();
        break;
      case 7:
        columnKey = "colSeven";
        circleId = renderMove(columnNumber, columnKey, fillColor);
        circleObj = trackMove(circleId);
        setOfCirclesToCheck = checkForNeighborsWithSameOwner(circleObj, player.active);
        chains = buildConnectionChains(setOfCirclesToCheck, player.active);
        playerOneChain = chains[0];
        playerTwoChain = chains[1];
        if (player.active === 1) {
          if (playerOneChain.length > 3) {
            gameOver = examineConnectionChains(playerOneChain);
          }
        } else {
          if (playerTwoChain.length > 3) {
            gameOver = examineConnectionChains(playerTwoChain);
          }
        }
        swapPlayer();
        break;
      default:
        console.log("something went wrong!");
    }
    availableCircles[columnKey] = availableCircles[columnKey] + 1;
    return columnNumber;
  }

  // ##################################################################################
  // ##################################################################################
  // ##################################################################################

  // guts of gameplay!

  // ##################################################################################
  // ##################################################################################
  // ##################################################################################

  // this listener is attached to the circle SVGs and tracks which column they are in
  var columnClickListener = function(element) {
    element.on('click', function() {
      // determine if this is the opening click
      if (firstClick === 0) {
        // increment the click
        firstClick = firstClick + 1;
        // hide computer player option so user cannot change it during game play
        hideSetupControls();
      }
      // determine which column was clicked on
      var columnNumber = parseInt($(this).attr("class").slice(-1));
      // these need to initialized so that playConnectFour can be called
      var columnKey = '';
      var fillColor = '';
      var circleId;
      var circleObj;
      var setOfCirclesToCheck;
      var chains;

      // if a game is underway, execute this code
      if (!gameOver) {
        // set fill color based on which player is active
        if (player.active === 1) {
          fillColor = colorOne;
        } else {
          fillColor = colorTwo;
        }
        var columnPlayed = playConnectFour(columnNumber, columnKey, fillColor, circleId, circleObj, setOfCirclesToCheck, chains);
        if (!gameOver && roboPlayer) {
          setTimeout(makeRandomMove(columnPlayed), 500);
        }
      }
    })
  }

  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  // ROBO PLAYER

  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  var makeRandomMove = function(target) {
    var col = chooseRoboMove(target);
    // var columnNumber = Math.floor(Math.random() * (8 - 1)) + 1;
    // var columnNumber = generateWeightedRandomColumnNumber(target);
    var columnNumber = col;
    var columnKey = '';
    var fillColor = '';
    var circleId;
    var circleObj;
    var setOfCirclesToCheck;
    var chains;
    playConnectFour(columnNumber, columnKey, fillColor, circleId, circleObj, setOfCirclesToCheck, chains);
  }

  var getAvailableCircles = function() {
    var arr = [];
    for (var item in availableCircles) {
      var itemValue = availableCircles[item];
      arr.push(itemValue);
    }
    return arr;
  }

  var getPlayerOneCircles = function() {
    var arr = [];
    for (var circle in playerOneCircles) {
      var circleName = playerOneCircles[circle];
      arr.push(circleName.id);
    }
    return arr;
  }

  var getTargetAreas = function(arrayOfCircleIds) {
    var arr = [];
    for (var i = 0; i < arrayOfCircleIds.length; i++) {
      var neighbors = calculateNeighborCircleIds(parseInt(arrayOfCircleIds[i]));
      for (var j = 0; j < neighbors.length; j++) {
        arr.push(neighbors[j]);
      }
    }
    return arr;
  }

  // get the chain of adjacent neighbors for a player
  var getRoboPlayerChains = function(setToCheck, player, index) {
    // arr is a pair of arrays: index 0 is player one's chains, index 1 is robo player's chains
    var arr = buildConnectionChains(setToCheck, player);
    return arr[index];
  }

  // calculate and look for triplet sequences
  var checkForTripletChain = function(increment, chain) {
    var potentialWinner = 0;
    // for every circle, if there are any values in chain
    if (chain.length > 2) {
      for (var i = 0; i < chain.length; i++) {
        // start with the value of the circle's id; this works because of the way 
        // the circles are assigned ids in the HTML: the smallest value is in the lower 
        // left corner and they get larger first as you go up, then as you go right
        var startValue = parseInt(chain[i]);
        // empty the array of triplet values
        var tripletValues = [];
        // calculate the triplet values for the given start value (the current neighbor id),
        // and check to make sure they are not out-of-bounds for the gameboard
        if (svgIds.includes((startValue + increment))) {
          tripletValues.push((startValue + increment));
        }
        if (svgIds.includes((startValue + (2 * increment)))) {
          tripletValues.push((startValue + (2 * increment)));
        }
        // if the potential triplet would be valid, set the id of the potential winning circle
        if (tripletValues.length === 2 && svgIds.includes((startValue + (3 * increment)))) {
          potentialWinner = startValue + (3 * increment);
          // if all the winning values are present in the neighbor chain, and the potential winner is a valid circle // id, the player has a dangerous triplet
          if (chain.includes(tripletValues[0].toString()) && chain.includes(tripletValues[1].toString())) {
            // player has a triplet, return potentialWinner (id of circle that will complete the chain)
            return potentialWinner;
          }
        }
      }
    }
    return 0;
  }

  var parseCircleIdForColumnNumber = function(circleId) {
    var columnNumber = 0;
    columnNumber = circleId.toString().slice(0,1);
    return parseInt(columnNumber);
  }
  

  var chooseRoboMove = function(target) {
    var columnNumber = 0;
    // pseudo code here

    // get ids of available circles
    var openSpots = [];
    openSpots = getAvailableCircles();
    var openSpotIds = [];
    for (var i = 0; i < openSpots.length; i++) {
      var tempId = (i + 1).toString() + openSpots[i].toString();
      openSpotIds.push(tempId);
    }
    
    // does robo have a chain of 3?
    var roboChains = getRoboPlayerChains(playerTwoCircles, 2, 1);
    if (roboChains.length > 0) {
      // given a direction and a chain, check for a triplet sequence
      var horizontalWinnerId = checkForTripletChain(horizontalChainIncrement, roboChains);
      var verticalWinnerId = checkForTripletChain(verticalChainIncrement, roboChains);
      var diagonalDownWinnerId = checkForTripletChain(diagonalDownChainIncrement, roboChains);
      var diagonalUpWinnerId = checkForTripletChain(diagonalUpChainIncrement, roboChains);

      // is the potential winning circle one of the available spots?
      if (openSpotIds.includes(horizontalWinnerId.toString())) {
        // if yes, choose that circle
        columnNumber = parseCircleIdForColumnNumber(horizontalWinnerId);
        return columnNumber;
      }
      if (openSpotIds.includes(verticalWinnerId.toString())) {
        columnNumber = parseCircleIdForColumnNumber(verticalWinnerId);
        return columnNumber;
      }
      if (openSpotIds.includes(diagonalDownWinnerId.toString())) {
        columnNumber = parseCircleIdForColumnNumber(diagonalDownWinnerId);
        return columnNumber;
      } 
      if (openSpotIds.includes(diagonalUpWinnerId.toString())) {
        columnNumber = parseCircleIdForColumnNumber(diagonalUpWinnerId);
        return columnNumber;
      }
    } else {
      // else
      // get ids of available circles
      var openSpots = getAvailableCircles();
      // get ids of player one's circles
      var opponentCircles = getPlayerOneCircles();
      // get neighbors of those circles
      var targetAreas = getTargetAreas(opponentCircles);
      // remove duplicates
      var reducedTargets = targetAreas.filter(removeDuplicates);
      reducedTargets.sort();
      // remove circles that are not available
      // check to see if player one has any chains
      // how long are those chains?
      // if a chain of 3 exists, get the id of the potential fourth circle
      // is that circle available?
      // if yes, choose that circle
      // else, look for chains of 2 to block
      // else, be random: 
      columnNumber = generateWeightedRandomColumnNumber(target);
      return columnNumber;
    }
    columnNumber = generateWeightedRandomColumnNumber(target);
    return columnNumber;
  }

  // target is the column number of the last move by player one
  var generateWeightedRandomColumnNumber = function(target) {
    // the higher the ceiling, the more likely the robo player is to play in a left or right neighboring column
    var ceiling = 15;
    // "left" is the column to the left of the last move by player one
    // if the player chose the leftmost column, left will be undefined
    var left;
    if (target > 1) {
      left = target - 1;
    }
    // "right" is the column to the left of the last move by player one
    // if the player chose the rightmost column, right will be undefined
    var right;
    if (target < 7) {
      right = target + 1;
    }
    // array to hold the possible target columns
    var possibleTargets = [1,2,3,4,5,6,7];
    // if left is defined, we will remove that column from the array
    var removeLeft = possibleTargets.filter(function(e) { 
      if (left) {
        return e !== left;
      } else {
        return e;
      }
    })
    // if right is defined, we will remove that column from the array
    var removeRight = removeLeft.filter(function(e) { 
      if (right) {
        return e !== right;
      } else {
        return e;
      }
    })
    // get a random number between zero and the ceiling
    var rand = Math.floor(Math.random() * (ceiling - 1)) + 1;
    // initialize a column number to pass around
    var columnNumber = 0;
    // left edge
    // right edge
    // central column
    if (target === 1) {
      columnNumber = assignWeightedValuesEdgeCase(rand, removeRight, right);
    } else if (target === 7) {
      columnNumber = assignWeightedValuesEdgeCase(rand, removeRight, left);
    } else {
      columnNumber = assignWeightedValues(rand, ceiling, removeRight, left, right);
    }
    // this column number should now be random, but with a higher chance of being the column to either side of player one's last move
    return columnNumber;
  }

  var assignWeightedValuesEdgeCase = function(rand, array, nextDoor) {
    var temp;
    if (rand === 1) {
      temp = array[0];
    } else if (rand === 2) {
      temp = array[1];
    } else if (rand === 3) {
      temp = array[2];
    } else if (rand === 4) {
      temp = array[3];
    } else if (rand === 5) {
      temp = array[4];
    } else if (rand === 6) {
      temp = array[5];
    } else {
      temp = nextDoor;
    }
    return temp;
  }

  var assignWeightedValues = function(rand, ceiling, array, leftNeighbor, rightNeighbor) {
    var temp;
    var lowBound = array.length;
    var midBound = ceiling - (ceiling - array.length) / 2;
    if (rand === 1) {
      temp = array[0];
    } else if (rand === 2) {
      temp = array[1];
    } else if (rand === 3) {
      temp = array[2];
    } else if (rand === 4) {
      temp = array[3];
    } else if (rand === 5) {
      temp = array[4];
    } else if (lowBound < rand < midBound) {
      temp = leftNeighbor;
    } else {
      temp = rightNeighbor;
    }
    return temp;
  }
  
  
  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  // EVENT LISTENERS

  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  // listen for computer player checkbox
  checkbox.on('change', function() {
    roboPlayer = true;  
  })

  // add event listener to all the circle SVGs
  $('circle').each(function() {
    columnClickListener($(this));
  });

  // listen for user changing color for Player One
  $('#color-picker-player-one').on('change', function() {
    colorOne = $(this).val();
    reColor(1);
  })

  // listen for user changing color for Player Two
  $('#color-picker-player-two').on('change', function() {
    colorTwo = $(this).val();
    reColor(2);
  })

  // listen for play again button and reset all game data
  playAgain.on('click', function() {
    blankTheBoard();
    roboPlayer = false;
    checkbox.prop("checked", false);
    $('#robo-player').removeClass("hidden");
    player = {
      active    : 1,
      inactive  : 2
    }
    playerDisplay.text("One");
    playerOneCircles = {};
    playerTwoCircles = {};
    playerOneChain = [];
    playerTwoChain = [];
    filledCircleCount = 0;
    gameOver = false;
    availableCircles = {
      colOne     : 1,
      colTwo     : 1,
      colThree   : 1,
      colFour    : 1,
      colFive    : 1,
      colSix     : 1,
      colSeven   : 1
    }
    $(this).addClass("hidden");
    firstClick = 0;
  })

}());