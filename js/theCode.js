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

var dicomStudy = {};
var dicomImage = {};
var dicomPatient = {};
var dicomOverlay = {};

var parseTime;

function publishData()
{
	var result = "Image:<br //><br //>";
	for (var property in dicomImage)
	{
		result += property + ": " + dicomImage[property] + "<br //>";
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
	while (i < length)
	{
		switch ((byte16Array[i] << 16) + byte16Array[i + 1])
		{
			case 0x00280010: 	dicomImage.width = byte16Array[i + 4]; c++; i += 4; break;
			case 0x00280011: 	dicomImage.height = byte16Array[i + 4]; i += 4; break;
			case 0x00280002: 	dicomImage.spp = byte16Array[i + 4]; i += 4; break;
			case 0x00280004:	dicomImage.photometricInterpretation = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); break;
			case 0x00280008:	dicomImage.numberOfFrames = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); break;
			case 0x00280100:	dicomImage.bitsAllocated = byte16Array[i + 4]; i += 4; break;
			case 0x00280101:	dicomImage.bitsStored = byte16Array[i + 4]; i += 4; break;
			case 0x00280102:	dicomImage.highBit = byte16Array[i + 4]; i += 4; break;
			case 0x00282124:	dicomImage.lossyImageCompressionMethod = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); break;
			case 0x00281100:	var a = 10; break;
			case 0x00282110:	dicomImage.lossyImageCompression = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); break;
			
			//Тук не трябва да чете CS, а UI
			case 0x00020010:	dicomImage.transferSyntaxUniqueIdentification = parseCS(byte16Array[i + 3], byte8Array, (i + 4) * 2); break;
			
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
			
			
			
			case 0x7FE00000:	dicomImage.pixelDataGroupLength = (byte16Array[i + 4] << 16) + byte16Array[i + 5]; i += 5;
			case 0x7FE00010:	publishData();
								parseTime = new Date().getTime() - parseTime;
					//			i = (i + 6) * 2; 	//for 8 bits array mode
								i += 6;				//for 16 bits array mode
								var canvas = document.getElementById("canvas").getContext("2d");
								var canvasData = canvas.createImageData(dicomImage.width, dicomImage.height);
								var d = canvasData.data;
								var startTime = new Date().getTime();
								
								if (dicomImage.bitsStored > 14)
								{
									for (var pos = 0; pos < dicomImage.width * dicomImage.height; pos++, i += 1) // += 1 for 16 bits, += 2 for 8
									{
										d[pos * 4] = byte16Array[i] / 2; d[pos * 4 + 1] = byte16Array[i] / 2; d[pos * 4 + 2] = byte16Array[i] / 2; d[pos * 4 + 3] = 255;
									}
								}
								else
								{
									for (var pos = 0; pos < dicomImage.width * dicomImage.height; pos++, i += 1) // += 1 for 16 bits, += 2 for 8
									{
										d[pos * 4] = byte16Array[i] >> 6; d[pos * 4 + 1] = byte16Array[i] >> 6; d[pos * 4 + 2] = byte16Array[i] >> 6; d[pos * 4 + 3] = 255;
									}
								}
								
								canvas.clearRect(0, 0, 800, 500);
								canvas.putImageData(canvasData, 0, 0);
								
								$("#status").text("Parse time: " + parseTime + "ms, Image draw time: " + (new Date().getTime() - startTime) + "ms");
		}
		i++;
	}
}

function readFile(file)
{
	var reader = new FileReader();
	reader.onload = function(file)
	{
		var arrayBuffer = reader.result;
        var byte16Array = new Uint16Array(arrayBuffer);
		var byte8Array = new Uint8Array(arrayBuffer);
		parseImageData(byte16Array, byte16Array.length, byte8Array);
		
        var kb = byte16Array.length / 1024;
        var mb = kb / 1024;
        var byteStr = mb > 1 ? mb.toFixed(3) + " MB" : kb.toFixed(0) + " KB";
	}
	parseTime = new Date().getTime();
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