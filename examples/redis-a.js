
// redis driver

var Redis = require('entangle-redis');

// configure with redis

var object = require('..')(new Redis);

// conf object

var conf = object('config');

// react to changes

conf.on('change', function(){
  console.log(conf);
});

// periodically update title

setInterval(function(){
  var titles = [];
  
  titles.push('Tobi');
  titles.push('Loki');
  titles.push('Jane');
  titles.push('Luna');
  titles.push('Abby');

  conf.title = titles[Math.random() * titles.length | 0];
}, 1000);