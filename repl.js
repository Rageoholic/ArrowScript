#!/usr/bin/env node
var state = {version: "0.1"};
var readline = require("readline");
var fs = require("fs");
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
rl.write("ArrowScript REPL, version 0.1\n");
rl.write("This software is licensed under the ISC license.\n");
rl.write("PLEASE NOTE: This language is in early alpha and is not meant for real use.\n");
function writeFile(fn, contents) {
	var err = false;
	try {
	fs.appendFileSync(fn, contents);
	} catch (e) {
		err = true;
	}
	return err;
}
function readFile(fn) {
	try {
		var contents = fs.readFileSync(fn, 'utf8');
	} catch (e) {
		return {
			contents: null,
			error: true
		};
	}
	return {
		contents: contents,
		error: false
	};
}
function doThis(callback) {
	rl.question("-> ", function(answer) {
		callback(answer);
	});
}
var flag = false;
var some = (expr) => {
    if (flag) {
        flag = false;
    }
	if (expr == "quit") {
		process.exit();
	}
	if (expr == "state") {
		for (k in state) {
			console.log(k.concat(": ").concat(state[k]));
		}
		flag = true;
	}
	// Standard input capabilities will be present in the interpreter.
	if (expr.match(/f!.* => stdout/)) {
		var stageOne = expr.split("f!")[1];
		var filename = stageOne.substring(0, stageOne.length - 10);
		var results = readFile(filename);
		if (results.error) {
			console.log("[!] Error while reading file.");
		} else {
			console.log(results.contents);
		}
	} else if (expr.match(/f!.* => f!.*/)) {
		var splitArrow = expr.split(" => ");
		var filenameOne = splitArrow[0].split("f!")[1];
		var filenameTwo = splitArrow[1].split("f!")[1];
		var oneResults = readFile(filenameOne);
		if (oneResults.error) {
			console.log("[!] Error while reading file.");
		} else {
			var err = writeFile(filenameTwo, oneResults.contents);
			if (err) {
				console.log("[!] Error while writing to file.");
			}
		}
	} else if (expr.match(/f!.* => .*/)) {
		var splitByArrow = expr.split(" => ");
		var fileReference = splitByArrow[0];
		var fileName = fileReference.substring(2, fileReference.length);
		var results = readFile(fileName);
		if (results.error) {
			console.log("[!] Error while reading file.");
		} else {
			var writeReference = splitByArrow[1];
			if (writeReference.startsWith("\"")) {
				console.log("[!] Attempting to overwrite immutable object.");
			} else {
				state[writeReference] = results.contents;
			}
		}
	} else if (expr.match(/.* => f!.*/)) {
		var thingToWrite = expr.split(" => ")[0];
		var fileName = expr.split(" => ")[1].substring(2, expr.split(" => ")[1].length);
		if (thingToWrite.startsWith("\"")) {
			var unquoted = thingToWrite.substring(1, thingToWrite.length);
			var really = unquoted.substring(0, unquoted.length - 1);
			var failure = writeFile(fileName, really);
			if (failure) {
				console.log("[!] Error writing to file.");
			}
		} else {
			var failure = writeFile(fileName, state[thingToWrite]);
			if (failure) {
				console.log("[!] Error writing to file.");
			}
		}
	} else if (expr.match(/.* => stdout/)) {
		var expressionWithoutEnding = expr.substring(0, expr.length - 10);
		if (expressionWithoutEnding.startsWith("\"")) {
			var trueExpr = expressionWithoutEnding.substring(1, expressionWithoutEnding.length - 1);
			console.log(trueExpr);
		} else {
			console.log(state[expressionWithoutEnding]);
		}
	} else if (expr.match(/.* => .*/)) {
		var thingsToMatch = expr.split(" => ");
		if (thingsToMatch[1].startsWith("\"")) {
			console.log("[!] Setting value of non-mutable object.");
		} else if (thingsToMatch[0].startsWith("\"")) {
			var withoutQuotes = thingsToMatch[0].substring(1, thingsToMatch[0].length - 1);
			state[thingsToMatch[1]] = withoutQuotes;
		} else {
			state[thingsToMatch[1]] = state[thingsToMatch[0]];
		}
	} else {
		if (!flag) {
			console.log("[!] Invalid syntax.");
		}
	}
	doThis(some);
};
doThis(some);
