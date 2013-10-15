

// redis driver

var Redis = require('entangle-redis');

// configure with redis

var object = require('..')(new Redis);

// conf object reference

var conf = object('config');

// distribute it and give it

conf.on('change', function(){
  console.log(conf);
});

setInterval(function(){
  conf.title = 'New title from another process';
}, 3000);