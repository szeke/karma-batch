# karma-batch

A Node.js cript to easily invoke Karma in batch mode.

### Installation

You need to have [Node.js](http://nodejs.org/) installed. Then download `karma-batch` and execute the following command in the directory where you cloned this repository. You need to do this to download additional packages.

`npm install date-format-lite sys exec-sync shred optimist`

### Usage

Typical invocation: `node karma-batch.js <spec-file>`

Type `node karma-batch.js -h` to see the available options.

### Sample Specification File
You specify all the parameters to your batch processing in a JSON file.
You should put all your input files in one directory and all your model files also in one directory.

You can optionally post the generated RDF files to a SPARQL endpoint.

```
{
	karmaHome : "/Users/szekely/Web-Karma/" ,
	modelsDir : "/Users/szekely/github/karma-tutorial/models" ,
	filesDir : "/Users/szekely/github/karma-tutorial/datasets" ,
	rdfDir : "/Users/szekely/github/karma-tutorial/rdf" ,
	endpoint : "http://localhost:8080/openrdf-sesame/repositories/karma_data" ,
	clearEndpoint : false ,
	filesAndModels : [
		{
			file : "events.json" , model : "events-model.txt"
		}
		, 
		{
			file : "people.json" , model : "people-model.txt"
		}
		,
		{
			file : "schedule.csv" , model : "schedule-model.txt"
		}
	]
}
```

