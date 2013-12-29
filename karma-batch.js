var fs = require('fs')
  , dateFormat = require("date-format-lite")
  , sys = require('sys')
  , exec  = require('child_process').exec
  , execSync = require("exec-sync")
  , Shred = require("shred")
  , optimist = require('optimist')
;

var argv = optimist
	.usage('Apply Karma models to files and load them in a triple store\nUsage: $0 spec-file')
	.demand(1)
	.boolean('noTripleStoreLoad')
	.describe('noTripleStoreLoad', "Don't post the generated RDF to the SPARQL endpoint")
	.describe('h', 'Show usage/help')
	.argv;

var specFile = argv._[0];
var rawData = fs.readFileSync(specFile);
var spec = eval('(' + rawData + ')');

if (argv.h) {
	optimist.showHelp(fn=console.error)
	process.exit(code=0);
}

// http://davidwalsh.name/sync-exec

var rdfGen3 = {
	karmaHome : "/Users/szekely/Web-Karma/" ,
	modelsDir : "/Users/szekely/karma-artist/karma-models" ,
	filesDir : "/Users/szekely/karma-artist/datasets" ,
	rdfDir : "/Users/szekely/karma-artist/rdf" ,
	clearEndpoint : true ,
	endpoint : "http://localhost:8080/openrdf-sesame/repositories/artist" ,
	filesAndModels : [
		{
			file : "allArtistsData19557.json" , model : "artists-model.txt"
		}
		, 
		{
			file : "songkick.json" , model : "songkick-model.txt"
		}
		,
		{
			file : "allBandsList.json" , model : "bands-model.txt"
		}
		,
		{
			file : "albumsAwards.json" , model : "album-awards-model.txt"
		}
	]
}



function execSyncInKarmaHome(cmd) {
	execSync("cd "+spec.karmaHome+";"+cmd);
}


function puts(error, stdout, stderr) { sys.puts(stdout) }
function execInKarmaHome(cmd) {
	exec("cd "+rdfGen.karmaHome+";"+cmd, puts);
}

function getSourceType(record) {
	var result = record.type;
	if (result) return result;

	return record.file.split('.').pop().toUpperCase();
}

function basename(input) {
   return input.split(/\.[^.]+$/)[0];
}

function getRdfFile(record, spec) {
	return spec.rdfDir + '/' + basename(record.file) + '.n3'
}

function runOfflineRdfGeneratorOnce(record, spec) {
	var cmd =
		'mvn exec:java -Dexec.mainClass="edu.isi.karma.rdf.OfflineRdfGenerator" -Dexec.args="'
		+ ' --sourcetype ' + getSourceType(record)
		+ ' --filepath ' + spec.filesDir + '/' + record.file + ''
		+ ' --modelfilepath ' + spec.modelsDir + '/' + record.model + ''
		+ ' --sourcename ' + basename(record.file) + ''
		+ ' --outputfile ' + getRdfFile(record, spec) + '"'
		; 
	console.log("running: " + cmd);
	execSyncInKarmaHome(cmd);
}

function runOfflineRdfGenerator(spec) {
	spec.filesAndModels.map(function(record) {
		console.log("record:"+record);
		runOfflineRdfGeneratorOnce(record, spec);
	});
}

function postRdfToEndpointOnce(record, spec) {
	var shred = new Shred();

	fs.readFile(getRdfFile(record, spec), 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    console.log("posting: "+getRdfFile(record, spec));
    //console.log(data.toString());
		var req = shred.post({
	    url: spec.endpoint+'/statements',
	    headers: {
	      "Content-Type": 'text/turtle'
	    },
	    content: data,
	    on: {
	      // You can use response codes as events
	      204: function(response) {
	      	console.log("response for "+getRdfFile(record, spec));
	      	console.log("... success (204)");
	      },
	      // Any other response means something's wrong
	      response: function(response) {
	        console.log("Oh no!");
	        console.log(response);
	      }
	    }
	  });

  });
}

function postRdfToEndpoint(spec) {
	spec.filesAndModels.map(function(record) {
		postRdfToEndpointOnce(record, spec);
	});
}

function clearEndpoint(spec) {
	var shred = new Shred();
	console.log("clearing: "+spec.endpoint);
	var req = shred.delete({
    url: spec.endpoint+'/statements',
    on: {
      // You can use response codes as events
      204: function(response) {
      	console.log("response for clearing "+spec.endpoint);
      	console.log("... success (204)");
      	//console.log(response.content.body);
      },
      // Any other response means something's wrong
      response: function(response) {
        console.log("Oh no!");
      }
    }
  });
}

// Do it

runOfflineRdfGenerator(spec);

if (spec.endpoint && spec.clearEndpoint) {
	clearEndpoint(spec);
}

if (spec.endpoint && !argv.noTripleStoreLoad) {
	console.log('Loading data to ' + spec.endpoint);
	postRdfToEndpoint(spec);
}
//exec("ls -l "+ spec.rdfDir, puts);

//clearEndpoint(spec);
//postRdfToEndpoint(spec);



		// mvn exec:java -Dexec.mainClass="edu.isi.karma.rdf.OfflineRdfGenerator" -Dexec.args="
		// --sourcetype JSON 
		// --filepath \"/Users/shubhamgupta/Documents/wikipedia.json\" 
		// --modelfilepath \"/Users/shubhamgupta/Documents/model-wikipedia.n3\" 
		// --outputfile wikipedia-rdf.n3"


