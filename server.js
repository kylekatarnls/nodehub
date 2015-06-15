var http = require('http');
var fs = require('fs');
var extend = require('extend');
var express = require('express');
var vhost = require('vhost');
var uncache = require(__dirname + '/lib/uncache');
require('coffee-script/register');

var port = process.env.PORT || 80;
var configFile = __dirname + '/config.json';
var config = require(configFile);

var _server = extend({}, http.Server);

var hosts = [];

var app = module.exports = express();

app.use(function (request, response) {
  hosts.forEach(function (vhost) {
    vhost[0](request, response, function () {});
  });
});

if(! module.parent) {
  app.listen(port);
}

function getServer(file, env) {

  if(env && typeof(env) === 'object') {
    extend(process.env, env);
  }

  uncache(file);
  return require(file);
}

function getNewConfig() {
  uncache(configFile);
  var newConfig = require(configFile);
  if(typeof(newConfig) === 'object' && newConfig !== null) {
    config = newConfig;
    if(config.hosts && config.hosts.forEach) {
      hosts.forEach(function (vhost) {
        if(vhost[1].emit) {
          vhost[1].emit('close');
          console.log('close');
        }
      });
      hosts = [];
      config.hosts.forEach(function (data) {
        if(data.server) {
          if(data.hostnames && data.hostnames.forEach) {
            data.hostnames.forEach(function (hostname) {
              try {
                var server = getServer(data.server, data.env || {});
                hosts.push([vhost(hostname, server), server]);
                console.log(hostname + ' will lead to ' + data.server);
              } catch (e) {
                console.warn(hostname + " : " + data.server + " is not a function.", e)
              }
            });
          } else {
            console.warn("No valid hostnames list found in " +
            JSON.stringify(data));
          }
        } else {
          console.warn("No server found in " + JSON.stringify(data));
        }
      });
    } else {
      console.warn("The config file does not contain valid hosts list.");
    }
  } else {
    console.warn("The config is not a JSON valid object.");
  }
}

fs.watch(configFile, getNewConfig);
getNewConfig();
