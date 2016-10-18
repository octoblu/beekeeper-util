#!/usr/bin/env node

require('coffee-script/register');
var Command = require('./command-pingdom.coffee');
var command = new Command(process.argv);
command.run();
