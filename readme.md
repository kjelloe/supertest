### INTRODUCTION

This folder contains the scripts and test necessary to run a proof of concept testing of API-level functional testing 

Currently the following tests are available
* testpackages/demo - scripts for show casing basic usage

###### Do note that the files within the directories are run in alphanumerical order by the test runner, thus the files are currently prefixed with a number to indicate order of execution 1...99

### INSTALLATION
Pre-requisites: 
* Node > v8.2
* NPM > 5.3

To install the API test setup
```bash
npm install .
```
### CONFIGURATION
Create a profile json file with the required settings for the test your are going to run, i.e: a file named profile-sample.json might contain the following
```json
{
  "serverUrl": "http://someserver",
  "username" : "someuser",
  "password" : "magicpassword"  
}
```

### USAGE

```bash
---------------------------------------------------------------------------------------------------------------
Usage: ./run_tests.sh <path-to-folder-containing-tests> (<settings-file>||<settings-json-string>)
---------------------------------------------------------------------------------------------------------------
Examples:
  #1:  ./run_tests.sh <path-to-folder-containing-tests> profile-sample.json
  #2:  ./run_tests.sh <path-to-folder-containing-tests> "{ 'serverUrl': 'http://server.org', 'username' : 'tester1', 'password': 'somepass' }"
  #3:  ./run_tests.sh <path-to-folder-containing-tests> profile-sample.json -f=mycontextfile1.json
  #4:  ./run_tests.sh <path-to-folder-containing-tests> "{ 'serverUrl': 'http://server.org', 'username' : 'tester1', 'password': 'somepass' }" --use-context-from-file=mycontextfile1.json
---------------------------------------------------------------------------------------------------------------
Optional postfix named arguments:
     -f --use-context-from-file | usage: -f=contextfile1.json | file will be created if it does not exist
     -i --reuse-context-from-id | usage: -i=testcontext-6053  | if a run has been made locally with that id
     -l --loglevel              | usage: -l=ALL               | Levels available: (NONE|INFO|WARN|DEBUG|ERROR|ALL)
     --debug                    | usage: --debug              | Used for debugging while developing
---------------------------------------------------------------------------------------------------------------
```

### RUNNING
To run all the API tests in a folder 
```bash
./run_tests.sh testpackages/demo profile-sample.json
```
To run the API tests individually pr file: 
```bash
./run_tests.sh testpackages/demo/1-scenario.js profile-sample.json
```
To run multiple API tests using the same testcontext which  testcontext-json-file so multiple separate test runs can reuse the same test data:
```bash
./run_tests.sh testpackages/demo/1-scenario.js profile-sample.json --use-context-from-file=testrun_123.json # File will be created it does not exist yet
./run_tests.sh testpackages/demo&2-scenario.js profile-sample.json --use-context-from-file=testrun_123.json # These teste are then reusing the testcontext with data from first run 
```

