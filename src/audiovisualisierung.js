var rafID = null;
var analyser = null;
var c = null;
var cDraw = null;
var ctx = null;
var microphone = null;
var ctxDraw = null;

var loader;
var filename;
var fileChosen = false;
var hasSetupUserMedia = false;

//handle different prefix of the audio context
var AudioContext = AudioContext || webkitAudioContext;
//create the context.
var context = new AudioContext();

//change the colours used in the gradient
let colorStart = '#ffbf46';
let colorEnd = '#ffdab9';

let userChoice = null;

//using requestAnimationFrame instead of timeout...
if (!window.requestAnimationFrame)
	window.requestAnimationFrame = window.webkitRequestAnimationFrame;


$(document).ready(function () {
	if (window.location.href.endsWith('mp3')) {
		document.getElementById('stop').style.display = 'flex';
		document.getElementById('pause').style.display = 'flex';
		document.getElementById('upload').style.display = 'flex';
		document.getElementById('stop2').style.display = 'flex';
		document.getElementById('pause2').style.display = 'flex';
	}

	if (window.location.href.endsWith('mic')) {
		document.getElementById('mic').style.display = 'flex';
		document.getElementById('mic2').style.display = 'flex';
	}

	if (window.location.href.endsWith('spotify')) {
		document.getElementById('spotifypause').style.display = 'flex';
		document.getElementById('spotifyskip').style.display = 'flex';
		document.getElementById('spotifyback').style.display = 'flex';
		document.getElementById('spotifyshuffle').style.display = 'flex';
		document.getElementById('eye').classList.remove('is-warning');
		document.getElementById('show').classList.remove('is-warning');
		document.getElementById('eye').classList.add('is-info');
		document.getElementById('show').classList.add('is-info')

		document.getElementById('spotifypause2').style.display = 'flex';
		document.getElementById('spotifyskip2').style.display = 'flex';
		document.getElementById('spotifyback2').style.display = 'flex';
		document.getElementById('spotifyshuffle2').style.display = 'flex';
		document.getElementById('eye2').classList.remove('is-warning');
		document.getElementById('show2').classList.remove('is-warning');
		document.getElementById('eye2').classList.add('is-info');
		document.getElementById('show2').classList.add('is-info')
	}

});



$(function () {
	"use strict";
	loader = new BufferLoader();
	initBinCanvas();
});

function handleFiles(files) {
	if (files.length === 0) {
		return;
	}
	fileChosen = true;
	setupAudioNodes();
	var fileReader = new FileReader();
	fileReader.onload = function () {
		var arrayBuffer = this.result;

		filename = files[0].name.toString();
		filename = filename.slice(0, -4);

		var url = files[0].urn || files[0].name;
		ID3.loadTags(url, function () {
			var tags = ID3.getAllTags(url);

			if (tags.title.length > 14 && tags.title.length <= 17) {

				$("#title").css("font-size", "7vh");

			}
			if (tags.title.length > 17 && tags.title.length <= 20) {

				$("#title").css("font-size", "6.5vh");
			}

			if (tags.title.length > 20) {

				$("#title").css("font-size", "5vh");

			}

			$("#title").html(tags.title);

			onWindowResize();

			$("#title").css("visibility", "visible");

			$("#artist").html(tags.artist);
			$("#artist").css("visibility", "visible");
			$("#album").html(tags.album);
			$("#album").css("visibility", "visible");
		}, {
			tags: ["title", "artist", "album", "picture"],
			dataReader: ID3.FileAPIReader(files[0])
		});

	};
	fileReader.readAsArrayBuffer(files[0]);
	var url = URL.createObjectURL(files[0]);

	var request = new XMLHttpRequest();

	request.addEventListener("progress", updateProgress);
	request.addEventListener("load", transferComplete);
	request.addEventListener("error", transferFailed);
	request.addEventListener("abort", transferCanceled);

	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

	// When loaded decode the data
	request.onload = function () {
		// decode the data
		context.decodeAudioData(request.response, function (buffer) {
			// when the audio is decoded play the sound
			sourceNode.buffer = buffer;
			sourceNode.start(0);
			//on error
		}, function (e) {
			console.log(e);
		});
	};
	request.send();

	$("button, input").prop("disabled", true);
}

function pause() {
	context.suspend();
	document.getElementById('pause').style.display = 'none';
	document.getElementById('resume').style.display = 'flex';

	document.getElementById('pause2').style.display = 'none';
	document.getElementById('resume2').style.display = 'flex';
}

function resume() {
	context.resume();
	document.getElementById('pause').style.display = 'flex';
	document.getElementById('resume').style.display = 'none';

	document.getElementById('pause2').style.display = 'flex';
	document.getElementById('resume2').style.display = 'none';
}

function spotifyPause() {
	Constr.pause();
}

function spotifyResume() {
	Constr.play();
}

function spotifySkip() {
	Constr.skipToNext();
}

function spotifyBack() {
	Constr.skipToPrevious();
}

function stop() {
	reset();
	$("#title, #artist, #album").css("visibility", "hidden");
	$("button, input").prop("disabled", false);
}

function spotifyPause() {
	context.suspend();
	document.getElementById('spotifypause').style.display = 'none';
	document.getElementById('spotifyresume').style.display = 'flex';

	document.getElementById('spotifypause2').style.display = 'none';
	document.getElementById('spotifyresume2').style.display = 'flex';
}

function spotifyResume() {
	context.resume();
	document.getElementById('spotifypause').style.display = 'flex';
	document.getElementById('spotifyresume').style.display = 'none';

	document.getElementById('spotifypause2').style.display = 'flex';
	document.getElementById('spotifyresume2').style.display = 'none';
}

function useMic() {
	"use strict";
	if (!navigator.mediaDevices.getUserMedia) {
		alert("Your browser does not support microphone input!");
		console.log('Your browser does not support microphone input!');
		return;
	}

	navigator.mediaDevices.getUserMedia({
			audio: true,
			video: false
		})
		.then(function (stream) {
			hasSetupUserMedia = true;
			//convert audio stream to mediaStreamSource (node)
			microphone = context.createMediaStreamSource(stream);
			//create analyser
			if (analyser === null) analyser = context.createAnalyser();
			//connect microphone to analyser
			microphone.connect(analyser);
			//start updating
			rafID = window.requestAnimationFrame(updateVisualization);

			$("#title").html("");
			$("#album").html("");
			$("#artist").html("");
			onWindowResize();
			$("#title, #artist, #album").css("visibility", "visible");
		})
		.catch(function (err) {
			/* handle the error */
			alert("capturing microphone data failed!");
			console.log('capturing microphone data failed!');
			console.log(err);
		});
}

// progress on transfers from the server to the client (downloads)
function updateProgress(oEvent) {
	if (oEvent.lengthComputable) {
		$("button, input").prop("disabled", true);
		var percentComplete = oEvent.loaded / oEvent.total;
		console.log("Loading music file... " + Math.floor(percentComplete * 100) + "%");
		$("#loading").html("Loading... " + Math.floor(percentComplete * 100) + "%");
	} else {
		// Unable to compute progress information since the total size is unknown
		console.log("Unable to compute progress info.");
	}
}

function transferComplete(evt) {
	console.log("The transfer is complete.");
	$("#loading").html("");
	//$("button, input").prop("disabled",false);
}

function transferFailed(evt) {
	console.log("An error occurred while transferring the file.");
	$("#loading").html("Loading failed.");
	$("button, input").prop("disabled", false);
}

function transferCanceled(evt) {
	console.log("The transfer has been canceled by the user.");
	$("#loading").html("Loading canceled.");
}

function initBinCanvas() {

	//add new canvas
	"use strict";
	c = document.getElementById("freq");
	c.width = window.innerWidth;
	c.height = window.innerHeight;
	//get context from canvas for drawing
	ctx = c.getContext("2d");

	ctx.canvas.width = window.innerWidth;
	ctx.canvas.height = window.innerHeight;

	window.addEventListener('resize', onWindowResize, false);

	//initialises the fill
	ctx.fillStyle = 'black';
}

function onWindowResize() {
	ctx.canvas.width = window.innerWidth;
	ctx.canvas.height = window.innerHeight;

	var containerHeight = $("#song_info_wrapper").height();
	var topVal = $(window).height() / 2 - containerHeight / 2;
	$("#song_info_wrapper").css("top", topVal);
}

var audioBuffer;
var sourceNode;

function setupAudioNodes() {
	// setup a analyser
	analyser = context.createAnalyser();
	// create a buffer source node
	sourceNode = context.createBufferSource();
	//connect source to analyser as link
	sourceNode.connect(analyser);
	// and connect source to destination
	sourceNode.connect(context.destination);
	//start updating
	rafID = window.requestAnimationFrame(updateVisualization);
}


function reset() {
	if (typeof sourceNode !== "undefined") {
		sourceNode.stop(0);
	}
	if (typeof microphone !== "undefined") {
		microphone = null;
	}
}


function updateVisualization() {

	// get the average, bincount is fftsize / 2
	if (fileChosen || hasSetupUserMedia) {
		var array = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(array);

		drawBars(array);
	}
	// setTextAnimation(array);


	rafID = window.requestAnimationFrame(updateVisualization);
}

function hide() {
	buttons = document.getElementById('buttons');
	footer = document.getElementById('buttonsfoot');
	buttons.classList.add('hidden');
	footer.classList.add('hidden');
	document.getElementById('eye').style.display = 'none';
	document.getElementById('show').style.display = 'flex';

	document.getElementById('eye2').style.display = 'none';
	document.getElementById('show2').style.display = 'flex';
}

function show() {
	buttons = document.getElementById('buttons');
	footer = document.getElementById('buttonsfoot');
	buttons.classList.remove('hidden');
	footer.classList.remove('hidden');
	document.getElementById('show').style.display = 'none';
	document.getElementById('eye').style.display = 'flex';

	document.getElementById('show2').style.display = 'none';
	document.getElementById('eye2').style.display = 'flex';
}

function shuffle() {
	document.getElementById('spotifyshuffle').style.display = 'none';
	document.getElementById('spotifyshuffleoff').style.display = 'flex';

	document.getElementById('spotifyshuffle2').style.display = 'none';
	document.getElementById('spotifyshuffleoff2').style.display = 'flex';
}

function shuffleOff() {
	document.getElementById('spotifyshuffleoff').style.display = 'none';
	document.getElementById('spotifyshuffle').style.display = 'flex';

	document.getElementById('spotifyshuffleoff2').style.display = 'none';
	document.getElementById('spotifyshuffle2').style.display = 'flex';
}

let liteMode = "false";

function lite() {
	liteMode = "true";
	document.getElementById('lite').style.display = 'none';
	document.getElementById('liteOff').style.display = 'flex';
}

function liteOff() {
	liteMode = "false";
	document.getElementById('liteOff').style.display = 'none';
	document.getElementById('lite').style.display = 'flex';
}

function drawBars(array) {

	//just show bins with a value over the treshold
	var threshold = 0;
	// clear the current state
	ctx.clearRect(0, 0, c.width, c.height);
	//the max count of bins for the visualization
	var maxBinCount = array.length;
	//space between bins
	var space = 12;
	let liteModeStatus = liteMode;

	// simply replace 'spectrumGradient' with the desired colour to get a single-coloured visualiser
	let spectrumGradient = ctx.createLinearGradient(0, 0, 0, 170);
	spectrumGradient.addColorStop(0, colorStart);
	spectrumGradient.addColorStop(1, colorEnd);

	ctx.fillStyle = spectrumGradient;

	ctx.save();

	ctx.globalCompositeOperation = 'source-over';

	//console.log(maxBinCount); //--> 1024
	ctx.scale(0.5, 0.5);
	ctx.translate(window.innerWidth, window.innerHeight);

	var bass = Math.floor(array[1]); //1Hz Frequenz 
	var radius = 0.45 * $(window).width() <= 450 ? -(bass * 0.25 + 0.45 * $(window).width()) : -(bass * 0.25 + 450);

	var bar_length_factor = 1;
	if ($(window).width() >= 785) {
		bar_length_factor = 1.0;
	} else if ($(window).width() < 785) {
		bar_length_factor = 1.5;
	} else if ($(window).width() < 500) {
		bar_length_factor = 20.0;
	}

	//go over each bin
	for (var i = 0; i < maxBinCount; i++) {

		var value = array[i];
		if (value >= threshold) {

			//draw curved bin
			ctx.fillRect(0, radius, $(window).width() <= 450 ? 2 : 3, -value / bar_length_factor);

			if (liteMode == "false") {
				//draw outer shapes left-bottom-focused
				ctx.fillRect(0 + i * space, c.height - value, 1, c.height);
				ctx.fillRect(0 - i * space, c.height - value, -1, c.height);

				//draw outer shapes left-top-focused
				ctx.fillRect(0 + i * space, -(c.height - value), 1, -c.height);
				ctx.fillRect(0 - i * space, -(c.height - value), -1, -c.height);
			}

			ctx.rotate((180 / 128) * Math.PI / 180);
		}
	}

	for (var i = 0; i < maxBinCount; i++) {

		var value = array[i];
		if (value >= threshold) {

			//draw curved bin
			ctx.fillRect(0, radius, $(window).width() <= 450 ? 2 : 3, -value / bar_length_factor);

			if (liteMode == "false") {
				//draw outer shapes right-bottom-focused
				ctx.fillRect(0 + i * space, c.height - value, 1, c.height);
				ctx.fillRect(0 - i * space, c.height - value, -1, c.height);

				//draw outer shapes right-top-focused
				ctx.fillRect(0 + i * space, -(c.height - value), 1, -c.height);
				ctx.fillRect(0 - i * space, -(c.height - value), -1, -c.height);
			} 

			ctx.rotate(-(180 / 128) * Math.PI / 180);
		}
	}

	ctx.restore();
}