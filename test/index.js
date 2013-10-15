
var Redis = require('entangle-redis');
var object = require('..')(new Redis);
var assert = require('assert');

describe('DO', function(){
  it('should be an emitter', function(){
    var user = object('users/jane');
    assert('function' == typeof user.emit);
    assert('function' == typeof user.on);
  })

  it('should emit "change" events', function(done){
    var user = object('users/tobi');
    
    user.name = 'Tobi';
    user.age = 2;

    user.on('change', function(e){
      assert(e.object === user);
      assert(e.init === true);
      assert(Array.isArray(e.changes));
      assert(e.changes.length == 0);
      done();
    });
  })

  it('should emit "change <key>" events', function(done){
    var user = object('users/loki');
    var name = Math.random();
    var old;

    user.on('change', function(e){
      if (e.init) {
        old = user.name;
        user.name = name;
      }
    });

    user.on('change name', function(e){
      assert('name' === e.name);
      assert(old == e.old);
      assert(name == e.value);
      done();
    });
  })
})

describe('DO#set(object)', function(){
  it('should merge without broadcasting', function(done){
    var user = object('users/ewald');
    
    user.on('change', function(e){
      if (e.init) {
        user.set({ name: 'Tobi', age: 2 });
        setTimeout(done, 50); // TODO: super lame... spy
      } else {
        assert(false, '"change" event still fired');
      }
    });
  })
})