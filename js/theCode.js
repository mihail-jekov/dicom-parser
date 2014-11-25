$(function ()
{
	var dropZone = document.getElementById('canvas');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);
	var canvas = document.getElementById('canvas').getContext('2d');
	canvas.fillStyle = "green";
	canvas.font = "bold 56px Arial";
	canvas.fillText("Drop Some Dicom File :)", 50, 250);
});

var dicomDocument = {};

var dicomStudy = {};
var dicomImage = {};
var dicomPatient = {};
var dicomOverlay = {};
var dicomIcon = {};
var parseIcon = false;

var currentImage = {};

var parseTime;

function publishData(image)
{
	var result = "Image:<br //><br //>";
	for (var property in image)
	{
		result += property + ": " + image[property] + "<br //>";
	}
	result += "<br //><br //>Study data:<br //><br //>";
	for (var property in dicomStudy)
	{
		result += property + ": " + dicomStudy[property] + "<br //>";
	}
	result += "<br //><br //>Patient data:<br //><br //>";
	for (var property in dicomPatient)
	{
		result += property + ": " + dicomPatient[property] + "<br //>";
	}
	result += "<br //><br //>Overlay data:<br //><br //>";
	for (var property in dicomOverlay)
	{
		result += property + ": " + dicomOverlay[property] + "<br //>";
	}
	$("#imageData").html(result);
}

//The real deal
function parseImageData(byte16Array, length, byte8Array)
{
	var i = 0, c = 0, result = "";
	parseTime = new Date().getTime();
	while (i < length)
	{
		switch ((byte16Array[i] << 16) + byte16Array[i + 1])
		{
			case 0x000051B0:	currentImage.overlays = byte16Array[i + 4]; i += 4; break;
			
			case 0x00280010: 	currentImage.width = byte16Array[i + 4]; i += 4; break;
			case 0x00280011: 	currentImage.height = byte16Array[i + 4]; i += 4; break;
			case 0x00280002: 	currentImage.spp = byte16Array[i + 4]; i += 4; break;
			case 0x00280004:	currentImage.photometricInterpretation = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); break;
			case 0x00280006:	currentImage.planarConfiguration = byte16Array[i + 4]; i += 4; break;
			case 0x00280008:	currentImage.numberOfFrames = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); break;
			case 0x00280100:	currentImage.bitsAllocated = byte16Array[i + 4]; i += 4; break;
			case 0x00280101:	currentImage.bitsStored = byte16Array[i + 4]; i += 4; break;
			case 0x00280102:	currentImage.highBit = byte16Array[i + 4]; i += 4; break;
			case 0x00282124:	currentImage.lossyImageCompressionMethod = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); break;
			case 0x00281100:	var a = 10; break;
			case 0x00282110:	currentImage.lossyImageCompression = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); break;
			
			//Тук не трябва да чете CS, а UI
			case 0x00020010:	currentImage.transferSyntaxUniqueIdentification = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); break;
			
			case 0x00100010:	dicomPatient.name = parsePN(byte16Array[i + 3], byte8Array, (i + 4) * 2); i += 4; break;
			//Същото важи и за тук, не е CS ами LO (long string)
			case 0x00100020:	dicomPatient.patientId = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); i += 4; break;
			case 0x00100040:	dicomPatient.sex = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); i += 4; break;
			case 0x00100030:	dicomPatient.birthDay = parseDA(byte8Array, (i + 4) * 2); i += 12; break;
			
			case 0x00080020: 	dicomStudy.date = parseDA(byte8Array, (i + 4) * 2); i += 12; break;
			case 0x00080060:	dicomStudy.modality = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); i += 4; break;
			
			
/*0x6000*/	case 0x60000000:	dicomOverlay.groupLength = byte16Array[i + 4]; i += 4; break;
			case 0x60000010:	dicomOverlay.rows = byte16Array[i + 4]; i += 4; break;
			case 0x60000011:	dicomOverlay.coulms = byte16Array[i + 4]; i += 4; break;
			case 0x60000015:	dicomOverlay.numberOfFrames = parseIS(byte16Array[i + 3], byte8Array, (i + 4) * 2); i += 4; break;
			case 0x60000040:	dicomOverlay.type = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); i += 4; break;
			case 0x60000100:	dicomOverlay.bitsAllocated = byte16Array[i + 4]; i += 4; break;
			case 0x60000110:	dicomOverlay.format = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); i += 4; break;
			case 0x60000050:	dicomOverlay.origin = byte16Array[i + 4]; i += 4; break;
			case 0x60000102:	dicomOverlay.bitPosition = byte16Array[i + 4]; i += 4; break;
			case 0x60001200:	dicomOverlay.overlayGray = byte16Array[i + 4]; i += 4; break;
			case 0x60001201:	dicomOverlay.overlayRed = byte16Array[i + 4]; i += 4; break;
			case 0x60001202:	dicomOverlay.overlayGreen = byte16Array[i + 4]; i += 4; break;
			case 0x60001203:	dicomOverlay.overlayBlue = byte16Array[i + 4]; i += 4; break;
			
			case 0x60020010: case 0x60040010: case 0x60060010: case 0x60080010: case 0x600A0010:
			case 0x600C0010: case 0x600E0010: case 0x60100010: case 0x60120010: case 0x60140010:
			case 0x60160010: case 0x60180010: case 0x601A0010: case 0x601C0010: case 0x601E0010: alert(1); break;
			
			
			
			case 0x00880200:	dicomImage = currentImage;
								currentImage = dicomIcon;
								parseIcon = true;
								break;
			case 0x7FE00000:	currentImage.pixelDataGroupLength = (byte16Array[i + 4] << 16) + byte16Array[i + 5]; i += 5; break;
			case 0x7FE00010:	if(currentImage.bitsAllocated == 8)
								{
									currentImage.pixelData = byte8Array.subarray((i + 6) * 2, (i + 6) * 2 + (currentImage.width * currentImage.height) * currentImage.spp);
									i += 6 + (currentImage.width * currentImage.height * currentImage.spp) / 2;
								}
								else if(currentImage.bitsAllocated == 16)
								{
									currentImage.pixelData = byte16Array.subarray((i + 6), (i + 6) + (currentImage.width * currentImage.height) * currentImage.spp);
									i += 6 + currentImage.width * currentImage.height * currentImage.spp;
								}
								else alert("Bits allocated: " + currentImage.bitsAllocated + "????");
								
								if(parseIcon)
								{
									dicomIcon = currentImage;
									currentImage = dicomImage;
									parseIcon = false;
								}
								break;
		}
		i++;
	}
}

function drawImage(image, left)
{
	publishData(image);
	//			i = (i + 6) * 2; 	//for 8 bits array mode
	var canvas = document.getElementById("canvas").getContext("2d");
	var canvasData = canvas.createImageData(image.height, image.width);
	var d = canvasData.data;
	var startTime = new Date().getTime();
	if (image.photometricInterpretation.toLowerCase() === 'RGB '.toLowerCase())
	{
		if (image.planarConfiguration == 0)
		{
			for (var pos = 0; pos < image.width * image.height; pos++) // += 1 for 16 bits, += 2 for 8
			{
				d[pos * 4] = image.pixelData[pos * 3]; d[pos * 4 + 1] = image.pixelData[pos * 3 + 1]; d[pos * 4 + 2] = image.pixelData[pos * 3 + 2]; d[pos * 4 + 3] = 255;
			}
		}
		else if (image.planarConfiguration == 1)
		{
			var size = image.width * image.height;
			for (var pos = 0; pos < size; pos++) // += 1 for 16 bits, += 2 for 8
			{
				d[pos * 4] = image.pixelData[pos]; d[pos * 4 + 1] = image.pixelData[pos + size]; d[pos * 4 + 2] = image.pixelData[pos + size * 2]; d[pos * 4 + 3] = 255;
			}
		}
	}
	else if (currentImage.bitsStored > 14)
	{
		for (var pos = 0; pos < image.width * image.height; pos++) // += 1 for 16 bits, += 2 for 8
		{
			d[pos * 4] = image.pixelData[pos] / 2; d[pos * 4 + 1] = image.pixelData[pos] / 2; d[pos * 4 + 2] = image.pixelData[pos] / 2; d[pos * 4 + 3] = 255;
		}
	}
	else
	{
		for (var pos = 0; pos < image.width * image.height; pos++) // += 1 for 16 bits, += 2 for 8
		{
			d[pos * 4] = image.pixelData[pos] / 2; d[pos * 4 + 1] = image.pixelData[pos] / 2; d[pos * 4 + 2] = image.pixelData[pos] / 2; d[pos * 4 + 3] = 255;
		}
	}
								
	canvas.clearRect(left, 0, 950, 700 );
	canvas.putImageData(canvasData, left, 0);
								
	$("#status").text("Parse time: " + parseTime + "ms, Image draw time: " + (new Date().getTime() - startTime) + "ms");
	return;
}

function reset()
{
	dicomDocument = {};

	dicomStudy = {};
	dicomImage = {};
	dicomPatient = {};
	dicomOverlay = {};
	dicomIcon = {};
	parseIcon = false;
}

function readFile(file)
{
	var reader = new FileReader();
	reader.onload = function(file)
	{
		reset();
		var arrayBuffer = reader.result;
        var byte16Array = new Uint16Array(arrayBuffer);
		var byte8Array = new Uint8Array(arrayBuffer);
		parseImageData(byte16Array, byte16Array.length, byte8Array);
		parseTime = new Date().getTime() - parseTime;
		dicomImage = currentImage;
		if(dicomIcon.width !== undefined)
		{
			drawImage(dicomIcon, 0);
		}
		drawImage(dicomImage, dicomIcon.width !== undefined ? dicomIcon.width + 50 : 0);
		
        var kb = byte16Array.length / 1024;
        var mb = kb / 1024;
        var byteStr = mb > 1 ? mb.toFixed(3) + " MB" : kb.toFixed(0) + " KB";
	}
	reader.readAsArrayBuffer(file);
}

function handleFileSelect(evt)
{
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files;
	for (var i = 0, f; f = files[i]; i++)
	{
		readFile(f);
	}
}

function handleDragOver(evt)
{
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
}