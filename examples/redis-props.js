
// redis driver

var Redis = require('entangle-redis');

// configure with redis

var object = require('..')(new Redis);

// conf object

var conf = object('config');

// react to changes

conf.on('change title', function(e){
  console.log('updated title from "%s" to "%s"', e.old, e.value);
});

conf.on('delete title', function(e){
  console.log('title "%s" deleted', e.old);
});

conf.title = 'Tobi';

setTimeout(function(){
  conf.title = 'Tobi the great';
}, 2000);

setTimeout(function(){
  delete conf.title;
}, 3000);