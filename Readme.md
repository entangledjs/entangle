# Entangle

  Distributed objects for nodejs using `Object.observe()`. Possibly browser support
  and Object.observe() fallbacks in the future. For now this is a toy experimental library
  with several drivers to choose from:

  - [redis](https://github.com/entangledjs/redis)
  - [etcd](https://github.com/entangledjs/etcd)

## Installation

  Node 0.11.x must be used for `--harmony` support.

```
$ npm install entangled
```

## Example

  Any process may use `object(name)` to
  reference the "entangled" object:

```js
var Redis = require('do-redis');
var object = require('entangled')(new Redis);

var config = object('config');

config.on('change', function(){
  console.log(config);
});
```

 Any process may then manipulate the object. With configuration
 as an example you may then launch a REPL and manipulate it on
 the fly:

```js
app> config.cookieMaxAge = 600000;
```

  All `config` objects will then receive a "change" event, followed by a "change cookieMaxAge" event.

## API

### entangle(name)

  Entangle the given object `name`. The `name` is an arbitrary
  string that represents a given object, this may be anything you
  want. For example "users/tobi", "config", "users.tobi", "foo.com/users/123",
  and so on. This identfier is used so that all processes may access
  the same object.

## Guide

### Events

  The following events are currently supported:

  - `change` when a change has been made to the object
  - `change <prop>` when a property has been updated
  - `new <prop>` when a property has been added
  - `delete <prop>` when a property has been deleted
  - `reconfigure <prop>` when a property has been reconfigured

  All of these events have an event object passed. On initialization
  the "change" event will have `.init == true`, and otherwise will
  have a `.changes` array.

### Initialization

  When an object is referenced it must first be initialized, once the
  data is fetched and the object is popluated a "change" event is fired
  with `{ init: true }`. For example:

```js
var config = object('config');

config.on('change', function(e){
  if (e.init) {
    // initialized
  } else {
    // updated
  }
});
```

  This is a "change" event because often the initialization and changed
  state of an object is irrelevant for your views - when it does matter
  you can use `.init`.

### Reacting to Change

  When an object is manipulated the changes are broadcasted to peers
  via the driver, such as Redis, or ETCD. You may then listen to changes
  in a global or granular fashion.

  Here we listen for global changes:

```js
var config = object('config');

config.on('change', function(){
  console.log('updated config %j', config);
});
```

  Here we listen for changes on a specific property, an event object
  is passed and provides the property `.name`, the `.old` value, and the new `.value`.

```js
var config = object('config');

config.on('change title', function(e){
  console.log('changed title from "%s" to "%s"', e.old, e.value);
});
```

# License

  MIT
  
