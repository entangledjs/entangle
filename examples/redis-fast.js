
// redis driver

var Redis = require('entangle-redis');

// configure with redis

var object = require('..')(new Redis);

// stats object reference
// note that the string id
// is completely arbitrary

var a = object('foo.com/stats');
var b = object('bar.com/stats');

// output objects on change

a.on('change', function(){
  console.log('  \033[32m%s : %j\033[0m', 'a', [a.signups, a.logins, a.views]);
});

b.on('change', function(){
  console.log('  \033[31m%s : %j\033[0m', 'b', [b.signups, b.logins, b.views]);
});

// setup

a.logins = 0;
a.signups = 0;
a.views = 0;

b.logins = 0;
b.signups = 0;
b.views = 0;

// do stuff.. launch several processes
// and watch the changes ramp up

// $ node --harmony examples/redis-fast.js &
// $ node --harmony examples/redis-fast.js &
// $ node --harmony examples/redis-fast.js &
// $ jobs -p | xargs kill

setInterval(function(){
  if (Math.random() > .9) a.signups++;
  if (Math.random() > .7) a.logins++;
  if (Math.random() > .3) a.views++;

  if (Math.random() > .9) b.signups++;
  if (Math.random() > .7) b.logins++;
  if (Math.random() > .3) b.views++;
}, 150);