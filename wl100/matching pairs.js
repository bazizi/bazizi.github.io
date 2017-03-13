// mods by Patrick OReilly
// twitter: @pato_reilly

var game = new Phaser.Game(600, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.tilemap('matching', 'maps/phaser_tiles.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles', 'images/phaser_tiles.png');//, 100, 100, -1, 1, 1);
    game.load.image('trsi', 'images/trsipic1_lazur.jpg');

    game.load.audio('match', 'sounds/p-ping.mp3');
    game.load.audio('hover', 'sounds/tick.mp3');
    game.load.audio('select', 'sounds/sword.mp3');
    text = game.add.text(32, 32, 'Loading, please wait ...', { fill: '#ffffff' });

    game.load.start();

}

var timeCheck = 0;
var flipFlag = false;

var startList = new Array();
var squareList = new Array();

var masterCounter = 0;
var squareCounter = 0;
var square1Num;
var square2Num;
var savedSquareX1;
var savedSquareY1;
var savedSquareX2;
var savedSquareY2;

var map;
var tileset;
var layer;

var marker;
var prevMarker = {};

var currentTile;
var currentTilePosition;

var tileBack = 25;
var timesUp = '+';
var youWin = '+';

var myCountdownSeconds;

var pic;


// sounds
var selectSound, matchSound, hoverSound;

var text;

function create() {
        //	You can listen for each of these events from Phaser.Loader
        game.load.onLoadStart.add(loadStart, this);
        game.load.onFileComplete.add(fileComplete, this);
        game.load.onLoadComplete.add(loadComplete, this);



        map = game.add.tilemap('matching');

        map.addTilesetImage('Desert', 'tiles');

        //tileset = game.add.tileset('tiles');

        layer = map.createLayer('Ground');//.tilemapLayer(0, 0, 600, 600, tileset, map, 0);

        //layer.resizeWorld();

        marker = game.add.graphics();
        marker.lineStyle(2, 0x00FF00, 1);
        marker.drawRect(0, 0, 100, 100);
        prevMarker.x = marker.x;
        prevMarker.y = marker.y;

        selectSound = game.add.audio('select');
        matchSound = game.add.audio('match');
        hoverSound = game.add.audio('hover');


    randomizeTiles();


}

function loadStart() {

	text.setText("Loading ...");

}

//	This callback is sent the following parameters:
function fileComplete(progress, cacheKey, success, totalLoaded, totalFiles) {

	text.setText("File Complete: " + progress + "% - " + totalLoaded + " out of " + totalFiles);

	var newImage = game.add.image(x, y, cacheKey);

	newImage.scale.set(0.3);

	x += newImage.width + 20;

	if (x > 700)
	{
		x = 32;
		y += 332;
	}

}

function loadComplete() {

	text.setText("Load Complete");

}

function revealImage(tileX, tileY){
    pic = game.add.sprite(0, 0, 'trsi');
    w = pic.width;
    h = pic.height;
    pic.crop(new Phaser.Rectangle(tileX*100, tileY*100, 100, 100));
    pic.x = tileX*100;
    pic.y = tileY*100;
}

function update() {
    countDownTimer();


    if (layer.getTileX(game.input.activePointer.worldX) <= 5) // to prevent the marker from going out of bounds
    {
        marker.x = layer.getTileX(game.input.activePointer.worldX) * 100;
        marker.y = layer.getTileY(game.input.activePointer.worldY) * 100;
        if(prevMarker.x != marker.x || prevMarker.y != marker.y){
            hoverSound.play();
        }

        prevMarker.x = marker.x;
        prevMarker.y = marker.y;
    }




    if (flipFlag == true)
    {
        if (game.time.totalElapsedSeconds() - timeCheck > 0.5)
        {
            flipBack();
        }
    }
    else
    {
        processClick();
    }
}


function countDownTimer() {

    var timeLimit = 120;

    mySeconds = game.time.totalElapsedSeconds();
    // myCountdownSeconds = timeLimit - mySeconds;

    if (myCountdownSeconds <= 0)
        {
        // time is up
        timesUp = 'Time is up!';
        myCountdownSeconds = 0;

    }
}

function processClick() {

    currentTile = map.getTile(layer.getTileX(marker.x), layer.getTileY(marker.y));
    currentTilePosition = ((layer.getTileY(game.input.activePointer.worldY)+1)*6)-(6-(layer.getTileX(game.input.activePointer.worldX)+1));

    if (game.input.mousePointer.isDown)
        {


        // check to make sure the tile is not already flipped
        if (currentTile.index == tileBack)
        {
            // get the corresponding item out of squareList
            currentNum = squareList[currentTilePosition-1];
            flipOver();
            squareCounter++;
            // is the second tile of pair flipped?
            if  (squareCounter == 2)
            {


                // reset squareCounter
                squareCounter = 0;
                square2Num = currentNum;
                // check for match
                if (square1Num == square2Num)
                {
                    matchSound.play();
                    document.getElementById('remaining').innerHTML = parseInt(document.getElementById('remaining').innerHTML)-2;

                    document.getElementById('matched').innerHTML = parseInt(document.getElementById('matched').innerHTML)+2;


                    masterCounter++;

                    revealImage(savedSquareX1, savedSquareY1);
                    revealImage(currentTile.x, currentTile.y);

                    if (masterCounter == 18)
                    {
                        // go "win"
                        youWin = 'Got them all!';
                    }
                }
                else
                {
                    selectSound.play();
                    savedSquareX2 = layer.getTileX(marker.x);
                    savedSquareY2 = layer.getTileY(marker.y);
                    flipFlag = true;
                    timeCheck = game.time.totalElapsedSeconds();
                }
            }
            else
            {
                selectSound.play();
                savedSquareX1 = layer.getTileX(marker.x);
                savedSquareY1 = layer.getTileY(marker.y);
                    square1Num = currentNum;
            }
        }
    }
}

function flipOver() {

    map.putTile(currentNum, layer.getTileX(marker.x), layer.getTileY(marker.y));
}

function flipBack() {

    flipFlag = false;

    map.putTile(tileBack, savedSquareX1, savedSquareY1);
    map.putTile(tileBack, savedSquareX2, savedSquareY2);

}

function randomizeTiles() {

    for (num = 1; num <= 18; num++)
    {
        startList.push(num);
    }
    for (num = 1; num <= 18; num++)
    {
        startList.push(num);
    }

    // for debugging
    myString1 = startList.toString();

    // randomize squareList
    for (i = 1; i <=36; i++)
    {
        var randomPosition = game.rnd.integerInRange(0,startList.length - 1);

        var thisNumber = startList[ randomPosition ];

        squareList.push(thisNumber);
        var a = startList.indexOf(thisNumber);

        startList.splice( a, 1);
    }

    // for debugging
    myString2 = squareList.toString();

    for (col = 0; col < 6; col++)
    {
        for (row = 0; row < 6; row++)
        {
            map.putTile(tileBack, col, row);
        }
    }
}

function getHiddenTile() {

    thisTile = squareList[currentTilePosition-1];
    return thisTile;
}

function render() {

    // game.debug.text(timesUp, 620, 208, 'rgb(0,255,0)');
    // game.debug.text(youWin, 620, 240, 'rgb(0,255,0)');
    //
    // game.debug.text('Time: ' + myCountdownSeconds, 620, 15, 'rgb(0,255,0)');
    //
    // //game.debug.text('squareCounter: ' + squareCounter, 620, 272, 'rgb(0,0,255)');
    // game.debug.text('Matched Pairs: ' + masterCounter, 620, 304, 'rgb(0,0,255)');
    //
    // //game.debug.text('startList: ' + myString1, 620, 208, 'rgb(255,0,0)');
    // //game.debug.text('squareList: ' + myString2, 620, 240, 'rgb(255,0,0)');
    //
    //
    // game.debug.text('Tile: ' + map.getTile(layer.getTileX(marker.x), layer.getTileY(marker.y)).index, 620, 48, 'rgb(255,0,0)');
    //
    // game.debug.text('LayerX: ' + layer.getTileX(marker.x), 620, 80, 'rgb(255,0,0)');
    // game.debug.text('LayerY: ' + layer.getTileY(marker.y), 620, 112, 'rgb(255,0,0)');
    //
    // game.debug.text('Tile Position: ' + currentTilePosition, 620, 144, 'rgb(255,0,0)');
    // game.debug.text('Hidden Tile: ' + getHiddenTile(), 620, 176, 'rgb(255,0,0)');
}
