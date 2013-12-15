// requires
var _               = require('lodash'),
    Q               = require('q'),
    FS              = require('q-io/fs'),
    getArgv         = require('./helpers/parse-arg'),
    getLocalFiles   = require('./helpers/get-local-files'),
    brewFileTpl     = require('./helpers/brew-file-template'),
    caskFileTpl     = require('./helpers/cask-file-template'),

    // paths
    brewPath        = '/usr/local/Cellar/',
    optPath         = '/opt/homebrew-cask/Caskroom/',
    appPath         = '/Applications',
    caskPath        = '/usr/local/Library/Taps/phinze-cask/Casks/'
    installAppDir   = getArgv(process.argv),

    // instantiate arrays
    optFiles        = [],
    appFiles        = [],
    allLocalCasks   = [],
    caskFiles       = [],
    commonCasks     = [];


// promises
var getLocalBrew    = getLocalFiles(brewPath),
    getOptFiles     = getLocalFiles(optPath),
    getAppFiles     = getLocalFiles(appPath),
    getCaskList     = getLocalFiles(caskPath),
    gatherLocalApps = Q.all([getOptFiles, getAppFiles]),
    getCommonCasks  = Q.all([getCaskList, gatherLocalApps]);
    allComplete     = Q.all([getLocalBrew, getCommonCasks]);


// get local brew formulae
getLocalBrew.then(function(files) {
    var text = brewFileTpl(files);
    return text;
  })
  .then(function(text) {
    FS.write(".Brewfile", text).then(function() {
      console.log('Your file "Brewfile" has been written to the current directory!');
    });
  }).fin();


// get all local applications from Applications and /opt/
getOptFiles.then(function(files) {
  optFiles = files;
}).fin();

getAppFiles.then(function(files) {
  appFiles = files;
}).fin();


// merge File list from /Application and /opt/... before comparing
gatherLocalApps.done(function() {
  allLocalCasks = _.merge(optFiles, appFiles);
});


// get list of all casks
getCaskList.then(function(files) {
  caskFiles = files;
}).fin();


// find common files and feed them to file-template
getCommonCasks
  .then(function() {
    commonCasks = _.intersection(allLocalCasks, caskFiles).sort();
    return commonCasks;
  })
  .then(function(files) {
    var text = caskFileTpl(files, installAppDir);
    return text;
  })
  .then(function(text) {
    FS.write(".Caskfile", text).then(function() {
      console.log('Your file ".cask" has been written to the current directory!');
    });
  }).fin();

allComplete.then(function() {
  console.log('Move to your home directory and simply type "brew bundle" to get started! ');
}).fin();
