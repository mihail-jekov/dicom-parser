var dicomDictionary =
{
	0x0028:	{
				0x0010: ['US', 2, 1],
				0x0011: ['US', 2, 2]
			},
	0x7FE0:	{
				
			}
};

//CS - Code String, най-много 16 байта, първия аргумент е 2 байта за дължината на CS-а
function parseCS(length, byte8Array, position)
{
	var array = [];
	for (var i = position; i < position + length; i++)
	{
		array.push(byte8Array[i]);
	}
	return String.fromCharCode.apply(null, array);
}

function parsePN(length, byte8Array, position)
{
	return parseCS(length, byte8Array, position).replace("^", " ");
}

//Това е нещо като integer string, всяка цифра е байт, като CS я parse-вам но type-cast-вам до int
function parseIS(length, byte8Array, position)
{
	var array = [];
	for (var i = position; i < position + length; i++)
	{
		array.push(byte8Array[i]);
	}
	return parseInt(String.fromCharCode.apply(null, array));
}

//Parse-вам дата
function parseDA(byte8Array, position)
{
	return	String.fromCharCode(byte8Array[position + 6], byte8Array[position + 7]) + "." + 
			String.fromCharCode(byte8Array[position + 4], byte8Array[position + 5]) + "." + 
			String.fromCharCode(byte8Array[position], byte8Array[position + 1], byte8Array[position + 2], byte8Array[position + 3]);
}