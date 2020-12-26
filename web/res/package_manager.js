tabs(document.querySelector('.tabs'));


function getList(){

	var saved = localStorage.getItem("pkgs");

	if(!saved){
		saved = "";
	}

	var list = saved.split(",").filter( m => {
		return m != ""
	});

	return list;
}

function addPackage(){
	
	var list = getList();

	list.push(
		document.getElementById("packageName").value
	);

	localStorage.setItem("pkgs", list.join(","));

	window.location = "";

}

function removePackage(name){
	var list = getList();

	var index = list.indexOf(name);

	list.splice(index, 1);

	localStorage.setItem("pkgs", list.join(","));

	alert("Refresh the page to apply changes");
}

function setBlock(f, path, color){
	var ref = `${f.namespace}_${f.name}`;

	console.log(ref)
	var params = f.params.split(",")

	Blockly.Blocks[ref] = {
		  init: function() {  	

		  	 this.appendDummyInput()
        	.appendField(`${f.name}`);

        	for(var b = 0; b < params.length; b++){
        		var p = params[b];
        		var parts = p.split(" ")

    			this.appendValueInput(parts[0])
			    .setCheck(p.includes(" string") ? "String" : null)
			    .appendField(`${parts[0]} (${parts[parts.length - 1]})`);
        	}
		  	
		  	this.setPreviousStatement(true, null);
   			this.setNextStatement(true, null);

		    this.setColour(color);
		    this.setTooltip(f.comment.split("/").join(""));
		    this.setHelpUrl(path);
		  }
	};


	Blockly.JavaScript[ref] = function(block) {

	  //var value_name = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);

	  //var text_hostname = block.getFieldValue('hostname');

	  var initialString = `${f.namespace}.${f.name}`;
	  var args = [];
	  

	  for(var b = 0; b < params.length; b++){
        	var p = params[b];
        	var parts = p.split(" ")

        	var val = Blockly.JavaScript.valueToCode(block, parts[0], Blockly.JavaScript.ORDER_ATOMIC);
        	if(val == "")
        		continue;
        	args.push(val.split("'").join('"'));
      }


      if(args.length > 0 ){
	  	initialString += "(";
	  	initialString += args.join(",");
      	initialString += ")\n";
	  } else {
      	initialString += "\n";
	  }

	  return initialString;
	};
}

function setBlockStruct(f, path, color){

	var ref = `${f.namespace}_${f.name}`;

	console.log(ref)
	var params = f.fields

	Blockly.Blocks[ref] = {
		  init: function() {  	

		  	 this.appendDummyInput()
        	.appendField(`${f.name}`);

        	for(var b = 0; b < params.length; b++){
        		var p = params[b];

        		if(!p.name)
        			continue;

    			this.appendValueInput(p.name)
			    .setCheck(p.type == "string" ? "String" : null)
			    .appendField(`${p.name} (${p.type})`);
        	}
		  	
			this.setInputsInline(false);
   			this.setOutput(true, null);

   			this.appendDummyInput()
   			.appendField("Pointer")
        	.appendField(new Blockly.FieldCheckbox("TRUE"), "pointer");

		    this.setColour(color);
		    this.setTooltip(f.comment.split("/").join(""));
		    this.setHelpUrl(path);
		  }
	};


	Blockly.JavaScript[ref] = function(block) {

	  //var value_name = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);

	  //var text_hostname = block.getFieldValue('hostname');
	  var checkbox_pointer = block.getFieldValue('pointer') == 'TRUE';

	  var initialString = `${checkbox_pointer ? "&" : ""}${f.namespace}.${f.name}{`;
	  var args = [];
	  

	  for(var b = 0; b < params.length; b++){
        	var p = params[b];       	
        	var val = Blockly.JavaScript.valueToCode(block, p.name, Blockly.JavaScript.ORDER_ATOMIC);
        	
        	if(val == "")
        		continue;

        	args.push(`${p.name} : ${val.split("'").join('"')}`);
      }
      initialString += args.join(",");
      initialString += "}";

	  return [initialString, Blockly.JavaScript.ORDER_NONE];
	};
}

function mapBlocks(data, path, index){

	var path_parts = path.split("/");
	var p_name = path_parts[path_parts.length - 1];
	

	var color = 50 + (30 * index);
	var functions = JSON.parse(data);

	var xmlStr = `<category name="${p_name}" colour="${color}">`

	for (var i = functions.length - 1; i >= 0; i--) {
		var f = functions[i];
		
		if(!f.name)
			continue;

		var ref = `${f.namespace}_${f.name}`;

		setBlock(f, path, color)

		xmlStr += `<block type="${ref}"></block>`;

	}

	xmlStr += "</category>"
	
	document.getElementById('toolbox').innerHTML += xmlStr
}

function mapBlocksStruct(data, path, index){

	var path_parts = path.split("/");
	var p_name = path_parts[path_parts.length - 1];
	
	var color = 250 + (30 * index);
	var functions = JSON.parse(data);

	var xmlStr = `<category name="${p_name} types" colour="${color}">`

	for (var i = functions.length - 1; i >= 0; i--) {
		var f = functions[i];
		
		if(!f.name)
			continue;

		var ref = `${f.namespace}_${f.name}`;

		setBlockStruct(f, path, color)

		xmlStr += `<block type="${ref}"></block>`;

	}

	xmlStr += "</category>"
	
	document.getElementById('toolbox').innerHTML += xmlStr
}

var init = false;
var struct_mapped = false;
var workspace = null;



function initBlockly(){

	if(init || !struct_mapped){
		if(!struct_mapped)
			importStructPackages()
		return
	}

	init = true;

	workspace = Blockly.inject('blocklyDiv',{
	    toolbox: document.getElementById('toolbox'),
	    theme : theme,
	    trashcan : true,
	    maxTrashcanContents : 0,
	    zoom
	});
	workspace.addChangeListener(showPreview);

	BlocklyStorage.backupOnUnload();

	setTimeout(BlocklyStorage.restoreBlocks, 300);
}

function importPackage(path, index){

	var path_parts = path.split("/");
	var p_name = path_parts[path_parts.length - 1];
	var entry = `"${path}"`;

	omit.push(entry);

	function reqListener () {

	  mapBlocks(this.responseText,path, index);

	  if(index == 0){
		initBlockly();		
	  }
	}

	var oReq = new XMLHttpRequest();
	oReq.addEventListener("load", reqListener);
	oReq.open("GET", "/map?name=" + path);
	oReq.send();
}

function importStruct(path, index){

	var path_parts = path.split("/");
	var p_name = path_parts[path_parts.length - 1];
	

	function reqListener () {

	  mapBlocksStruct(this.responseText,path, index);

	  if(index == 0){
	  	struct_mapped = true;
		initBlockly();		
	  }
	}

	var oReq = new XMLHttpRequest();
	oReq.addEventListener("load", reqListener);
	oReq.open("GET", "/map_struct?name=" + path);
	oReq.send();
}

function importStructPackages(){

	var list = getList();

	for (var i = list.length - 1; i >= 0; i--) {
		var p = list[i];
		let index = i + 0;

		if(p.length == 0)
			continue;

		importStruct(p, index);

	}

	if(list.length == 0)
		initBlockly()
}

(function(){

	var list = getList();

	var htmlList = "<ul>";

	for (var i = list.length - 1; i >= 0; i--) {
		var p = list[i];
		let index = i + 0;

		if(p.length == 0)
			continue;

		importPackage(p, index);

		htmlList += `<li style="width: 100%;
							    padding: 10px;
							    border-bottom: 2px dashed #333;">
			<button style="float:right" onclick="removePackage('${p}')">Remove</button>
			<p style="margin-top:0px;">${p}</p>
		</li>`;
	}

	if(list.length == 0)
		initBlockly()

	htmlList += "</ul>";

	document.getElementById("packageList").innerHTML = htmlList;

})();

