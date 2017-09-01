#!/bin/bash
# NOTE: If not able to run on ubuntu, remember to convert line endings: sed -i 's/\r$//' run_tests.sh

# First test for arguments at all and document inline
if [[ $# -eq 0 ]] ; then
  echo "---------------------------------------------------------------------------------------------------------------"
  echo "Usage: ./run-tests.sh <folder-containing-tests> (<settings-file>||<settings-json-string>) "
  echo "---------------------------------------------------------------------------------------------------------------"
  echo "Examples:"
  echo "  #1:  ./run-tests.sh <folder-containing-tests> profile-sample.json "
  echo "  #2:  ./run-tests.sh <folder-containing-tests> \"{ 'serverUrl': 'http://server.org', 'username' : 'tester1', 'password': 'somepass' }\" "
  echo "  #3:  ./run-tests.sh <folder-containing-tests> profile-sample.json -f=mycontextfile1.json"
  echo "  #4:  ./run-tests.sh <folder-containing-tests> \"{ 'serverUrl': 'http://server.org', 'username' : 'tester1', 'password': 'somepass' }\" --use-context-from-file=mycontextfile1.json"
  echo "---------------------------------------------------------------------------------------------------------------"
  echo "Optional postfix named arguments:"
  echo "     -f --use-context-from-file | usage: -f=contextfile1.json | file will be created if it does not exist"
  echo "     -i --reuse-context-from-id | usage: -i=testcontext-6053  | if a run has been made locally with that id"
  echo "     -l --loglevel              | usage: -l=ALL               | Levels available: (NONE|INFO|WARN|DEBUG|ERROR|ALL)"
  echo "     --debug                    | usage: --debug              | Used for debugging while developing"
  echo "---------------------------------------------------------------------------------------------------------------"
  exit 1;
fi

# Then handle basic position arguments
if [ ! -f "$2" ]; then

	if [[ "$2" =~ ^\{.* ]]; then
		export SETTINGSITEM="\"${*:2}\"";
    echo "Using settings from json string provided as argument(s)"
	else
		echo "ERROR: No json string was provided and settings file does not exist: $2";
		exit 1;
	fi
else
	echo "Using settings from file: $2"
	export SETTINGSITEM="FILE:$2"  # Prefix for file
fi

# Check if mocha exists, and advice npm install if not
mochapath="./node_modules/mocha/bin/mocha"
if [ ! -f $mochapath ]; then
    echo "Mocha cannot be found in expected path: $mochapath"
    echo "Install packages using:"
    echo "npm install ."
    exit 1;
fi

# Store positions arguments
TESTPACKAGELOCATION=$1

# Then handle named arguments
for i in "$@"
do
case $i in
    -f=*|--use-context-from-file=*)
    export CONTEXTFILE="${i#*=}"
    shift # past argument=value
    ;;
    -i=*|--reuse-context-from-id=*)
    export CONTEXTFROMID="${i#*=}"
    shift # past argument=value
    ;;
    -l=*|--loglevel=*)
    export LOGLEVEL="${i#*=}"
    shift # past argument=value
    ;;
    --debug)
    export TESTDEBUG=debugging
    shift # past argument with no value
    ;;
    *)
           # unknown option
    ;;
esac
done

# Notify of environment varibles set
echo "Postfix arguments provided: ${CONTEXTFILE} ${CONTEXTFROMID} ${LOGLEVEL} ${TESTDEBUG}"
# Start actual test runner
echo "Using mocha as testrunner for tests in folder: '$TESTPACKAGELOCATION'"
./mocha_starter.js $TESTPACKAGELOCATION # NOTE: Runs mocha via nodejs runner with file filter
