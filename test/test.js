(function (require) {
require = (function (cache, modules) {
return function (r) {
if (!modules[r]) throw new Error(r + ' is not a module');
return cache[r] ? cache[r].exports : ((cache[r] = {
exports: {}
}, cache[r].exports = modules[r](require, cache[r], cache[r].exports)));
};
})({}, {
0: function (require, module, exports) {
var expect, getHash, setHash;

mocha.setup('tdd');

mocha.slow(700);

if (!window.location.hostname) {
  mocha.bail();
}

chai.use(require(1));

expect = chai.expect;

setHash = function(targetHash, delay) {
  if (delay == null) {
    delay = 1;
  }
  return new Promise(function(resolve) {
    var handler;
    targetHash = getHash(targetHash);
    handler = function() {
      window.removeEventListener('hashchange', handler);
      if (delay) {
        return Promise.delay(delay).then(resolve);
      } else {
        return resolve();
      }
    };
    window.addEventListener('hashchange', handler);
    return window.location.hash = targetHash;
  });
};

getHash = function(hash) {
  if (hash == null) {
    hash = window.location.hash;
  }
  return hash.replace(/^#?\/?/, '');
};

suite("Routing.JS", function() {
  teardown(function() {
    window.location.hash = '';
    return Routing.killAll();
  });
  test("routing.Router() will return a new router instance", function() {
    var routerA, routerB;
    routerA = Routing.Router();
    routerB = Routing.Router();
    expect(routerA).not.to.equal(routerB);
    expect(routerA.ID).to.equal(1);
    return expect(routerB.ID).to.equal(2);
  });
  test("router.map() should accept a path and return a cachable Route instance", function() {
    var Router, routeA, routeB;
    Router = Routing.Router();
    routeA = Router.map('/abc');
    routeB = Router.map('/abc');
    return expect(routeA).to.equal(routeB);
  });
  test("a route can be specified with or without forward/backward slashes", function() {
    var Router, routeA, routeB, routeC, routeD;
    Router = Routing.Router();
    routeA = Router.map('/abc/');
    routeB = Router.map('/abc');
    routeC = Router.map('abc');
    routeD = Router.map('abc/');
    expect(routeA).to.equal(routeB);
    expect(routeB).to.equal(routeC);
    return expect(routeC).to.equal(routeD);
  });
  test("a route can be mapped to invoke a specific function on hash change", function() {
    var Router, invokeCount;
    Router = Routing.Router();
    invokeCount = {
      '/': 0,
      '/test': 0,
      '/another': 0
    };
    return Promise.resolve().then(function() {
      return Router.map('/').to(function() {
        return invokeCount['/']++;
      }).map('/test').to(function() {
        return invokeCount['/test']++;
      }).map('/another').to(function() {
        return invokeCount['/another']++;
      }).listen();
    }).delay().then(function() {
      expect(invokeCount['/']).to.equal(1);
      expect(invokeCount['/test']).to.equal(0);
      expect(invokeCount['/another']).to.equal(0);
      return setHash('/test');
    }).then(function() {
      expect(invokeCount['/']).to.equal(1);
      expect(invokeCount['/test']).to.equal(1);
      expect(invokeCount['/another']).to.equal(0);
      return setHash('/another');
    }).then(function() {
      expect(invokeCount['/']).to.equal(1);
      expect(invokeCount['/test']).to.equal(1);
      expect(invokeCount['/another']).to.equal(1);
      return setHash('test');
    }).then(function() {
      expect(invokeCount['/']).to.equal(1);
      expect(invokeCount['/test']).to.equal(2);
      return expect(invokeCount['/another']).to.equal(1);
    });
  });
  test("route functions will be invoked within a dedicated context", function() {
    var Router, invokeCount, prevContext;
    Router = Routing.Router();
    invokeCount = 0;
    prevContext = null;
    return Promise.resolve().then(function() {
      Router.map('/another');
      Router.map('/test/path').to(function() {
        invokeCount++;
        expect(this.constructor).not.to.equal(Object);
        expect(this.params).to.eql({});
        expect(this.path).to.equal('test/path');
        expect(this.segments.length).to.equal(2);
        if (prevContext) {
          expect(this).to.equal(prevContext);
          expect(this.persistent).to.equal('yes');
        }
        this.persistent = 'yes';
        return prevContext = this;
      });
      return Router.listen();
    }).delay().then(function() {
      expect(invokeCount).to.equal(0);
      return setHash('/test/path');
    }).then(function() {
      expect(invokeCount).to.equal(1);
      return setHash('/another');
    }).then(function() {
      expect(invokeCount).to.equal(1);
      return setHash('/test/path');
    }).then(function() {
      return expect(invokeCount).to.equal(2);
    });
  });
  test("a route can have dynamic segments which will be available with resolved values in this.params", function() {
    var Router, context, invokeCount;
    Router = Routing.Router();
    invokeCount = 0;
    context = null;
    return Promise.resolve().then(function() {
      Router.map('/user/:ID/:page').to(function() {
        invokeCount++;
        return context = this;
      });
      Router.map('/admin/:ID/:name?/:page?').to(function() {
        invokeCount++;
        return context = this;
      });
      return Router.listen();
    }).delay().then(function() {
      return setHash('/user/12/profile');
    }).then(function() {
      expect(context).not.to.equal(null);
      expect(context.params.ID).to.equal('12');
      expect(context.params.page).to.equal('profile');
      expect(invokeCount).to.equal(1);
      return setHash('/user/12/settings');
    }).then(function() {
      expect(context.params.ID).to.equal('12');
      expect(context.params.page).to.equal('settings');
      expect(invokeCount).to.equal(2);
      return setHash('/user/25/settings');
    }).then(function() {
      expect(context.params.ID).to.equal('25');
      expect(context.params.page).to.equal('settings');
      expect(invokeCount).to.equal(3);
      return setHash('/user/29');
    }).then(function() {
      expect(context.params.ID).to.equal('25');
      expect(context.params.page).to.equal('settings');
      expect(invokeCount).to.equal(3);
      return setHash('/admin/29/kevin/profile');
    }).then(function() {
      expect(context.params.ID).to.equal('29');
      expect(context.params.name).to.equal('kevin');
      expect(context.params.page).to.equal('profile');
      expect(invokeCount).to.equal(4);
      return setHash('/admin/16/arnold');
    }).then(function() {
      expect(context.params.ID).to.equal('16');
      expect(context.params.name).to.equal('arnold');
      expect(context.params.page).to.equal('');
      expect(invokeCount).to.equal(5);
      return setHash('/admin/54');
    }).then(function() {
      expect(context.params.ID).to.equal('54');
      expect(context.params.name).to.equal('');
      expect(context.params.page).to.equal('');
      return expect(invokeCount).to.equal(6);
    });
  });
  test("a route can start with a dynamic segment", function() {
    var Router, context, invokeCount;
    Router = Routing.Router();
    invokeCount = 0;
    context = null;
    return Promise.resolve().then(function() {
      Router.map('/:page').to(function() {
        invokeCount++;
        return context = this;
      });
      return Router.listen();
    }).delay().then(function() {
      expect(invokeCount).to.equal(0);
      expect(context).to.equal(null);
      return setHash('/user/12/profile');
    }).then(function() {
      expect(invokeCount).to.equal(0);
      expect(context).to.equal(null);
      return setHash('/user');
    }).then(function() {
      expect(invokeCount).to.equal(1);
      expect(context.params.page).to.equal('user');
      return setHash('/settings');
    }).then(function() {
      expect(invokeCount).to.equal(2);
      return expect(context.params.page).to.equal('settings');
    });
  });
  test("a route can be mapped to an entering function which will be invoked when entering the route (before regular action)", function() {
    var Router, invokeCount;
    Router = Routing.Router();
    invokeCount = {
      before: 0,
      reg: 0
    };
    return Promise.resolve().then(function() {
      Router.map('/def456');
      Router.map('/abc123').entering(function() {
        invokeCount.before++;
        return expect(invokeCount.before - invokeCount.reg).to.equal(1);
      }).to(function() {
        return invokeCount.reg++;
      });
      return Router.listen();
    }).delay().then(function() {
      expect(invokeCount.before).to.equal(0);
      expect(invokeCount.reg).to.equal(0);
      return setHash('/abc123');
    }).then(function() {
      expect(invokeCount.before).to.equal(1);
      expect(invokeCount.reg).to.equal(1);
      return setHash('/def456');
    }).then(function() {
      expect(invokeCount.before).to.equal(1);
      expect(invokeCount.reg).to.equal(1);
      return setHash('/abc123');
    }).then(function() {
      return expect(invokeCount.before).to.equal(2);
    });
  });
  test("a route can be mapped to a leaving function which will be invoked when leaving the route", function() {
    var Router, invokeCount;
    Router = Routing.Router();
    invokeCount = {
      after: 0,
      reg: 0
    };
    return Promise.resolve().then(function() {
      Router.map('/def456');
      Router.map('/abc123').to(function() {
        return invokeCount.reg++;
      }).leaving(function() {
        return invokeCount.after++;
      });
      return Router.listen();
    }).delay().then(function() {
      expect(invokeCount.reg).to.equal(0);
      expect(invokeCount.after).to.equal(0);
      return setHash('/abc123');
    }).then(function() {
      expect(invokeCount.reg).to.equal(1);
      expect(invokeCount.after).to.equal(0);
      return setHash('/def456');
    }).then(function() {
      expect(invokeCount.reg).to.equal(1);
      expect(invokeCount.after).to.equal(1);
      return setHash('/abc123');
    }).then(function() {
      expect(invokeCount.reg).to.equal(2);
      return expect(invokeCount.after).to.equal(1);
    });
  });
  test("route actions can return a promise which will be waited to be resolved before continuing", function() {
    var Router, delays, initDelays, invokeCount;
    Router = Routing.Router();
    invokeCount = {
      before: 0,
      after: 0,
      abc123: 0,
      def456: 0
    };
    delays = {
      before: null,
      abc123: null,
      after: null
    };
    initDelays = function() {
      delays.before = new Promise(function() {});
      delays.abc123 = new Promise(function() {});
      delays.after = new Promise(function() {});
      return null;
    };
    return Promise.resolve().then(function() {
      Router.map('/abc123').entering(function() {
        invokeCount.before++;
        return delays.before;
      }).to(function() {
        invokeCount.abc123++;
        return delays.abc123;
      });
      Router.map('/def456').to(function() {
        return invokeCount.def456++;
      }).leaving(function() {
        invokeCount.after++;
        return delays.after;
      });
      Router.listen();
      return initDelays();
    }).delay().then(function() {
      return setHash('/abc123');
    }).then(function() {
      expect(invokeCount.before).to.equal(1);
      expect(invokeCount.abc123).to.equal(0);
      expect(invokeCount.def456).to.equal(0);
      expect(invokeCount.after).to.equal(0);
      delays.before._fulfill();
      return delays.before.delay();
    }).then(function() {
      expect(invokeCount.before).to.equal(1);
      expect(invokeCount.abc123).to.equal(1);
      expect(invokeCount.def456).to.equal(0);
      expect(invokeCount.after).to.equal(0);
      return setHash('/def456');
    }).then(function() {
      expect(invokeCount.before).to.equal(1);
      expect(invokeCount.abc123).to.equal(1);
      expect(invokeCount.def456).to.equal(0);
      expect(invokeCount.after).to.equal(0);
      delays.abc123._fulfill();
      return delays.abc123.delay();
    }).then(function() {
      expect(invokeCount.before).to.equal(1);
      expect(invokeCount.abc123).to.equal(1);
      expect(invokeCount.def456).to.equal(1);
      expect(invokeCount.after).to.equal(0);
      return setHash('/abc123');
    }).then(function() {
      expect(invokeCount.before).to.equal(1);
      expect(invokeCount.abc123).to.equal(1);
      expect(invokeCount.def456).to.equal(1);
      expect(invokeCount.after).to.equal(1);
      delays.after._fulfill();
      return delays.after.delay();
    }).then(function() {
      expect(invokeCount.before).to.equal(2);
      expect(invokeCount.abc123).to.equal(2);
      expect(invokeCount.def456).to.equal(1);
      return expect(invokeCount.after).to.equal(1);
    });
  });
  test("a default route can be specified in Router.listen() which will be defaulted to if there isn't a matching route for the current hash", function() {
    var Router, createRouter, invokeCount;
    invokeCount = {
      abc: 0,
      def: 0
    };
    Router = null;
    createRouter = function(targetHash) {
      if (targetHash == null) {
        targetHash = '';
      }
      setHash(targetHash);
      invokeCount.abc = invokeCount.def = 0;
      if (Router != null) {
        Router.kill();
      }
      Router = Routing.Router();
      Router.map('/abc').to(function() {
        return invokeCount.abc++;
      });
      Router.map('/def').to(function() {
        return invokeCount.def++;
      });
      return Router;
    };
    return Promise.resolve().then(function() {
      return createRouter().listen();
    }).delay().then(function() {
      expect(getHash()).to.equal('');
      expect(invokeCount.abc).to.equal(0);
      return expect(invokeCount.def).to.equal(0);
    }).then(function() {
      return createRouter('def').listen('abc');
    }).delay().then(function() {
      expect(getHash()).to.equal('def');
      expect(invokeCount.abc).to.equal(0);
      return expect(invokeCount.def).to.equal(1);
    }).then(function() {
      return createRouter().listen('/abc');
    }).delay().then(function() {
      expect(getHash()).to.equal('abc');
      expect(invokeCount.abc).to.equal(1);
      return expect(invokeCount.def).to.equal(0);
    }).then(function() {
      return createRouter().listen('def');
    }).delay().then(function() {
      expect(getHash()).to.equal('def');
      expect(invokeCount.abc).to.equal(0);
      return expect(invokeCount.def).to.equal(1);
    }).then(function() {
      return createRouter().listen('/akjsdf');
    }).delay().then(function() {
      expect(getHash()).to.equal('');
      expect(invokeCount.abc).to.equal(0);
      return expect(invokeCount.def).to.equal(0);
    });
  });
  test("if a falsey value is passed to Router.listen() the initial route match will be skipped", function() {
    var Router, createRouter;
    window.invokeCount = 0;
    Router = null;
    createRouter = function(initialHash) {
      if (Router != null) {
        Router.kill();
      }
      setHash(initialHash);
      Router = Routing.Router();
      Router.map('/abc').to(function() {
        return invokeCount++;
      });
      Router.fallback(function() {
        return invokeCount++;
      });
      return Router;
    };
    return Promise.resolve().then(function() {
      return createRouter('c');
    }).delay().then(function() {
      return Router.listen();
    }).delay().then(function() {
      return expect(invokeCount).to.equal(1);
    }).then(function() {
      return createRouter('abc');
    }).delay().then(function() {
      return Router.listen();
    }).delay().then(function() {
      return expect(invokeCount).to.equal(2);
    }).then(function() {
      return createRouter('def');
    }).delay().then(function() {
      return Router.listen();
    }).delay().then(function() {
      return expect(invokeCount).to.equal(3);
    }).then(function() {
      return createRouter('');
    }).delay().then(function() {
      return Router.listen(false);
    }).delay().then(function() {
      return expect(invokeCount).to.equal(3);
    }).then(function() {
      return createRouter('abc');
    }).delay().then(function() {
      return Router.listen('');
    }).delay().then(function() {
      return expect(invokeCount).to.equal(3);
    });
  });
  test("a fallback route (e.g. 404) can be specified to be defaulted to when the specified hash has no matching routes", function() {
    var Router, invokeCount;
    invokeCount = {
      abc: 0,
      fallback: 0
    };
    Router = Routing.Router();
    return Promise.resolve().then(function() {
      Router.map('abc').to(function() {
        return invokeCount.abc++;
      });
      Router.fallback(function() {
        return invokeCount.fallback++;
      });
      return Router.listen();
    }).delay().then(function() {
      expect(invokeCount.abc).to.equal(0);
      expect(invokeCount.fallback).to.equal(1);
      expect(getHash()).to.equal('');
      return setHash('abc');
    }).then(function() {
      expect(getHash()).to.equal('abc');
      expect(invokeCount.abc).to.equal(1);
      expect(invokeCount.fallback).to.equal(1);
      return setHash('def');
    }).then(function() {
      expect(getHash()).to.equal('def');
      expect(invokeCount.abc).to.equal(1);
      expect(invokeCount.fallback).to.equal(2);
      return setHash('');
    }).then(function() {
      expect(getHash()).to.equal('');
      expect(invokeCount.abc).to.equal(1);
      expect(invokeCount.fallback).to.equal(3);
      Router.fallback(function() {
        return setHash('abc');
      });
      return setHash('aksjdfh');
    }).then(function() {
      return expect(getHash()).to.equal('abc');
    });
  });
  test("a failed route transition will cause the router to go to the fallback route if exists", function() {
    var consoleError, invokeCount;
    invokeCount = 0;
    consoleError = console.error;
    console.error = chai.spy();
    return Promise.delay().then(function() {
      var Router;
      Router = Routing.Router();
      Router.map('abc').to(function() {
        return Promise.delay().then(function() {
          throw new Error('rejected');
        });
      });
      Router.fallback(function() {
        return invokeCount++;
      });
      return Router.listen();
    }).delay().then(function() {
      expect(invokeCount).to.equal(1);
      expect(getHash()).to.equal('');
      return setHash('abc');
    }).then(function() {
      expect(getHash()).to.equal('abc');
      return expect(invokeCount).to.equal(2);
    })["finally"](function() {
      return console.error = consoleError;
    });
  });
  test("a failed route transition will cause the router to go to the previous route if no fallback exists", function() {
    var Router, consoleError, invokeCount;
    invokeCount = 0;
    consoleError = console.error;
    console.error = chai.spy();
    Router = Routing.Router();
    return Promise.delay().then(function() {
      Router.map('abc').to(function() {
        return invokeCount++;
      });
      Router.map('def').to(function() {
        return Promise.delay().then(function() {
          throw new Error('rejected');
        });
      });
      return Router.listen();
    }).delay().then(function() {
      expect(invokeCount).to.equal(0);
      expect(getHash()).to.equal('');
      return setHash('abc');
    }).then(function() {
      expect(getHash()).to.equal('abc');
      expect(invokeCount).to.equal(1);
      return setHash('def');
    }).then(function() {
      expect(getHash()).to.equal('abc');
      return expect(invokeCount).to.equal(2);
    })["finally"](function() {
      return console.error = consoleError;
    });
  });
  test("router.beforeAll/afterAll() can take a function which will be executed before/after all route changes", function() {
    var Router, delays, invokeCount;
    invokeCount = {
      before: 0,
      after: 0,
      beforeB: 0
    };
    delays = {
      before: null,
      after: null,
      afterC: null
    };
    Router = Routing.Router();
    return Promise.resolve().then(function() {
      return Router.beforeAll(function() {
        return invokeCount.before++;
      }).afterAll(function() {
        return invokeCount.after++;
      }).map('a').map('b').entering(function() {
        return invokeCount.beforeB++;
      }).map('c').leaving(function() {
        return delays.afterC = Promise.delay(20);
      }).listen();
    }).delay().then(function() {
      expect(invokeCount.before).to.equal(0);
      expect(invokeCount.after).to.equal(0);
      return setHash('a');
    }).then(function() {
      expect(invokeCount.before).to.equal(1);
      expect(invokeCount.after).to.equal(1);
      expect(invokeCount.beforeB).to.equal(0);
      return setHash('b');
    }).then(function() {
      expect(invokeCount.before).to.equal(2);
      expect(invokeCount.beforeB).to.equal(1);
      expect(invokeCount.after).to.equal(2);
      Router.beforeAll(function() {
        invokeCount.before++;
        return delays.before = Promise.delay(7);
      }).afterAll(function() {
        invokeCount.after++;
        return delays.after = Promise.delay(5);
      });
      return setHash('c');
    }).then(function() {
      expect(invokeCount.before).to.equal(3);
      expect(invokeCount.after).to.equal(2);
      return Promise.delay(10);
    }).then(function() {
      expect(invokeCount.before).to.equal(3);
      expect(invokeCount.after).to.equal(3);
      return setHash('a', 5);
    }).then(function() {
      expect(invokeCount.before).to.equal(4);
      expect(invokeCount.after).to.equal(3);
      return Promise.delay(10);
    }).then(function() {
      expect(invokeCount.before).to.equal(4);
      expect(invokeCount.after).to.equal(3);
      return Promise.delay(20);
    }).then(function() {
      expect(invokeCount.before).to.equal(4);
      return expect(invokeCount.after).to.equal(4);
    });
  });
  test("route actions & enter actions will be passed with 2 arguments - 1st is the previous path and 2nd is the previous route object", function() {
    var Router, adminRoute, args, userRoute;
    Router = Routing.Router();
    args = {
      path: false,
      route: false
    };
    userRoute = Router.map('/user/:ID').to(function(path, route) {
      return args = {
        path: path,
        route: route
      };
    });
    adminRoute = Router.map('/admin/:ID').to(function(path, route) {
      return args = {
        path: path,
        route: route
      };
    });
    return Promise.resolve().then(function() {
      return Router.listen();
    }).delay().then(function() {
      expect(args.path).to.equal(false);
      expect(args.route).to.equal(false);
      return setHash('/user/1/');
    }).then(function() {
      expect(args.path).to.equal(null);
      expect(args.route).to.equal(null);
      return setHash('admin/2');
    }).then(function() {
      expect(args.path).to.equal('user/1');
      expect(args.route).to.equal(userRoute);
      return setHash('user/3');
    }).then(function() {
      expect(args.path).to.equal('admin/2');
      expect(args.route).to.equal(adminRoute);
      return setHash('user/4');
    }).then(function() {
      expect(args.path).to.equal('user/3');
      return expect(args.route).to.equal(userRoute);
    });
  });
  test("route leave actions will be passed with 2 arguments - 1st is the future path and 2nd is the future route object", function() {
    var Router, adminArgs, adminRoute, userArgs, userRoute;
    Router = Routing.Router();
    userArgs = {
      path: false,
      route: false
    };
    adminArgs = {
      path: false,
      route: false
    };
    userRoute = Router.map('/user/:ID').leaving(function(path, route) {
      return userArgs = {
        path: path,
        route: route
      };
    });
    adminRoute = Router.map('/admin/:ID').leaving(function(path, route) {
      return adminArgs = {
        path: path,
        route: route
      };
    });
    return Promise.resolve().then(function() {
      return Router.listen();
    }).delay().then(function() {
      expect(userArgs.path).to.equal(false);
      expect(userArgs.route).to.equal(false);
      expect(adminArgs.path).to.equal(false);
      expect(adminArgs.route).to.equal(false);
      return setHash('/user/1/');
    }).then(function() {
      expect(userArgs.path).to.equal(false);
      expect(userArgs.route).to.equal(false);
      expect(adminArgs.path).to.equal(false);
      expect(adminArgs.route).to.equal(false);
      return setHash('admin/2');
    }).then(function() {
      expect(userArgs.path).to.equal('admin/2');
      expect(userArgs.route).to.equal(adminRoute);
      expect(adminArgs.path).to.equal(false);
      expect(adminArgs.route).to.equal(false);
      return setHash('user/3');
    }).then(function() {
      expect(userArgs.path).to.equal('admin/2');
      expect(userArgs.route).to.equal(adminRoute);
      expect(adminArgs.path).to.equal('user/3');
      expect(adminArgs.route).to.equal(userRoute);
      return setHash('user/4');
    }).then(function() {
      expect(userArgs.path).to.equal('user/4');
      expect(userArgs.route).to.equal(userRoute);
      expect(adminArgs.path).to.equal('user/3');
      return expect(adminArgs.route).to.equal(userRoute);
    });
  });
  test("router.back/forward() can be used to navigate through history", function() {
    var Router, incCount, invokeCount;
    invokeCount = {};
    incCount = function(prop) {
      if (invokeCount[prop] == null) {
        invokeCount[prop] = 0;
      }
      return invokeCount[prop]++;
    };
    Router = Routing.Router();
    return Promise.resolve().then(function() {
      Router.map('AAA').to(function() {
        return incCount('AAA');
      });
      Router.map('BBB').to(function() {
        return incCount('BBB');
      });
      Router.map('CCC').to(function() {
        return incCount('CCC');
      });
      Router.map('DDD').to(function() {
        return incCount('DDD');
      });
      return Router.listen();
    }).delay().then(function() {
      Router.fallback(function() {
        return incCount('fallback');
      });
      expect(invokeCount.AAA).to.equal(void 0);
      expect(invokeCount.BBB).to.equal(void 0);
      expect(invokeCount.CCC).to.equal(void 0);
      expect(invokeCount.DDD).to.equal(void 0);
      expect(invokeCount.fallback).to.equal(void 0);
      return Router.forward();
    }).then(function() {
      expect(invokeCount.fallback).to.equal(void 0);
      return Router.back();
    }).then(function() {
      return expect(invokeCount.fallback).to.equal(void 0);
    }).then(function() {
      return setHash('AAA');
    }).then(function() {
      return setHash('BBB');
    }).then(function() {
      return setHash('CCC');
    }).then(function() {
      return setHash('DDD');
    }).then(function() {
      expect(invokeCount.AAA).to.equal(1);
      expect(invokeCount.BBB).to.equal(1);
      expect(invokeCount.CCC).to.equal(1);
      expect(invokeCount.DDD).to.equal(1);
      expect(invokeCount.fallback).to.equal(void 0);
      return Router.back();
    }).then(function() {
      expect(invokeCount.CCC).to.equal(2);
      return Router.back();
    }).then(function() {
      expect(invokeCount.BBB).to.equal(2);
      return Router.forward().then(function() {
        return Router.forward();
      });
    }).then(function() {
      expect(invokeCount.AAA).to.equal(1);
      expect(invokeCount.BBB).to.equal(2);
      expect(invokeCount.CCC).to.equal(3);
      expect(invokeCount.DDD).to.equal(2);
      return Router.back().then(function() {
        return Router.back();
      });
    }).then(function() {
      expect(invokeCount.AAA).to.equal(1);
      expect(invokeCount.BBB).to.equal(3);
      expect(invokeCount.CCC).to.equal(4);
      expect(invokeCount.DDD).to.equal(2);
      return Router.back();
    }).then(function() {
      expect(invokeCount.AAA).to.equal(2);
      expect(invokeCount.BBB).to.equal(3);
      expect(invokeCount.CCC).to.equal(4);
      expect(invokeCount.DDD).to.equal(2);
      expect(getHash()).to.equal('AAA');
      return Router.back();
    }).then(function() {
      expect(invokeCount.AAA).to.equal(2);
      expect(invokeCount.BBB).to.equal(3);
      expect(invokeCount.CCC).to.equal(4);
      expect(invokeCount.DDD).to.equal(2);
      return expect(getHash()).to.equal('AAA');
    });
  });
  test("router.refresh() can be used to create refresh the current route", function() {
    var Router, invokeCount;
    invokeCount = {
      abc: {
        before: 0,
        reg: 0,
        after: 0
      },
      def: {
        before: 0,
        reg: 0,
        after: 0
      }
    };
    Router = Routing.Router();
    return Promise.resolve().then(function() {
      return Router.map('abc').entering(function() {
        return invokeCount.abc.before++;
      }).to(function() {
        return invokeCount.abc.reg++;
      }).leaving(function() {
        return invokeCount.abc.after++;
      }).map('def').entering(function() {
        return invokeCount.def.before++;
      }).to(function() {
        return invokeCount.def.reg++;
      }).leaving(function() {
        return invokeCount.def.after++;
      }).listen();
    }).delay().then(function() {
      return setHash('abc');
    }).then(function() {
      expect(invokeCount.abc.before).to.equal(1);
      expect(invokeCount.abc.reg).to.equal(1);
      expect(invokeCount.abc.after).to.equal(0);
      expect(invokeCount.def.before).to.equal(0);
      expect(invokeCount.def.reg).to.equal(0);
      expect(invokeCount.def.after).to.equal(0);
      return setHash('def');
    }).then(function() {
      expect(invokeCount.abc.before).to.equal(1);
      expect(invokeCount.abc.reg).to.equal(1);
      expect(invokeCount.abc.after).to.equal(1);
      expect(invokeCount.def.before).to.equal(1);
      expect(invokeCount.def.reg).to.equal(1);
      expect(invokeCount.def.after).to.equal(0);
      return Router.refresh();
    }).then(function() {
      expect(invokeCount.abc.before).to.equal(1);
      expect(invokeCount.abc.reg).to.equal(1);
      expect(invokeCount.abc.after).to.equal(1);
      expect(invokeCount.def.before).to.equal(2);
      expect(invokeCount.def.reg).to.equal(2);
      expect(invokeCount.def.after).to.equal(1);
      return Router.refresh();
    }).then(function() {
      expect(invokeCount.abc.before).to.equal(1);
      expect(invokeCount.abc.reg).to.equal(1);
      expect(invokeCount.abc.after).to.equal(1);
      expect(invokeCount.def.before).to.equal(3);
      expect(invokeCount.def.reg).to.equal(3);
      return expect(invokeCount.def.after).to.equal(2);
    });
  });
  test("route.filters() can accept a param:filterFn object map which will be invoked for each param on route matching and will use the return value to decide the match result", function() {
    var Router, invokeCount, params;
    invokeCount = {
      route: 0,
      fallback: 0
    };
    params = {};
    Router = Routing.Router();
    Router.fallback(function() {
      return invokeCount.fallback++;
    });
    Router.map('/api/:version/:function?/:username?').to(function() {
      invokeCount.route++;
      return params = this.params;
    }).filters({
      version: function(version) {
        return version.length === 1 && /\d/.test(version);
      },
      username: function(username) {
        return username && /^[^\d]+$/.test(username);
      }
    }).map('/api/:version/').to(function() {
      invokeCount.route++;
      return params = this.params;
    }).filters({
      version: function(version) {
        return version.length === 1 && /\d/.test(version);
      },
      username: function(username) {
        return username && /^[^\d]+$/.test(username);
      }
    });
    return Promise.resolve(Router.listen()).delay().then(function() {
      expect(invokeCount.route).to.equal(0);
      expect(invokeCount.fallback).to.equal(1);
      return setHash('/api/3/anything/daniel');
    }).then(function() {
      expect(invokeCount.route).to.equal(1);
      expect(invokeCount.fallback).to.equal(1);
      expect(params).to.eql({
        version: '3',
        "function": 'anything',
        username: 'daniel'
      });
      return setHash('/api/3/9/daniel');
    }).then(function() {
      expect(invokeCount.route).to.equal(2);
      expect(invokeCount.fallback).to.equal(1);
      expect(params).to.eql({
        version: '3',
        "function": '9',
        username: 'daniel'
      });
      return setHash('/api/13/anything/daniel');
    }).then(function() {
      expect(invokeCount.route).to.equal(2);
      expect(invokeCount.fallback).to.equal(2);
      return setHash('/api/5/anything/dani3el');
    }).then(function() {
      expect(invokeCount.route).to.equal(2);
      expect(invokeCount.fallback).to.equal(3);
      return setHash('/api/5/ /kevin');
    }).then(function() {
      expect(invokeCount.route).to.equal(3);
      expect(invokeCount.fallback).to.equal(3);
      return expect(params).to.eql({
        version: '5',
        "function": ' ',
        username: 'kevin'
      });
    });
  });
  test("routing.Router() accpets a number-type argument which will be used as the route loading timeout (ms)", function() {
    var Router, consoleError, delay, invokeCount;
    consoleError = console.error;
    console.error = chai.spy();
    invokeCount = {
      abc: 0,
      def: 0,
      ghi: 0
    };
    delay = {
      abc: 0,
      def: 0
    };
    Router = Routing.Router(20);
    return Promise.resolve().then(function() {
      Router.map('abc').to(function() {
        invokeCount.abc++;
        return Promise.delay(delay.abc);
      });
      Router.map('def').to(function() {
        invokeCount.def++;
        return Promise.delay(delay.def);
      });
      Router.map('ghi').to(function() {
        return invokeCount.ghi++;
      });
      return Router.listen();
    }).delay().then(function() {
      return setHash('abc', 5);
    }).then(function() {
      expect(invokeCount.abc).to.equal(1);
      expect(invokeCount.def).to.equal(0);
      expect(invokeCount.ghi).to.equal(0);
      expect(console.error).to.have.been.called.exactly(0);
      expect(Router.current.path).to.equal('abc');
      expect(getHash()).to.equal('abc');
      delay.abc = delay.def = 10;
      return setHash('def', 15);
    }).then(function() {
      expect(invokeCount.abc).to.equal(1);
      expect(invokeCount.def).to.equal(1);
      expect(invokeCount.ghi).to.equal(0);
      expect(console.error).to.have.been.called.exactly(0);
      expect(Router.current.path).to.equal('def');
      expect(getHash()).to.equal('def');
      delay.abc = 20;
      return setHash('abc', 25);
    }).then(function() {
      expect(invokeCount.abc).to.equal(2);
      expect(invokeCount.def).to.equal(2);
      expect(invokeCount.ghi).to.equal(0);
      expect(console.error).to.have.been.called.exactly(1);
      expect(Router.current.path).to.equal('def');
      expect(getHash()).to.equal('def');
      delay.def = 20;
      return setHash('ghi', 10);
    }).then(function() {
      expect(invokeCount.abc).to.equal(2);
      expect(invokeCount.def).to.equal(2);
      expect(invokeCount.ghi).to.equal(1);
      expect(console.error).to.have.been.called.exactly(1);
      expect(Router.current.path).to.equal('ghi');
      expect(getHash()).to.equal('ghi');
      return setHash('def', 30);
    }).then(function() {
      expect(invokeCount.abc).to.equal(2);
      expect(invokeCount.def).to.equal(3);
      expect(invokeCount.ghi).to.equal(2);
      expect(console.error).to.have.been.called.exactly(2);
      expect(Router.current.path).to.equal('ghi');
      return expect(getHash()).to.equal('ghi');
    });
  });
  test("a base path can be specified via Routing.base() and will only match routes that begin with the base", function() {
    var Router, base, invokeCount;
    base = 'theBase/goes/here';
    Router = Routing.Router();
    invokeCount = {
      abc: 0,
      def: 0,
      fallback: 0,
      root: 0
    };
    return Promise.resolve(setHash(base)).then(function() {
      return Router.base(base).fallback(function() {
        return invokeCount.fallback++;
      }).map('/').to(function() {
        return invokeCount.root++;
      }).map('abc').to(function() {
        return invokeCount.abc++;
      }).map('def').to(function() {
        return invokeCount.def++;
      }).listen();
    }).delay().then(function() {
      expect(invokeCount).to.eql({
        abc: 0,
        def: 0,
        fallback: 0,
        root: 1
      });
      return setHash('abc');
    }).then(function() {
      expect(invokeCount).to.eql({
        abc: 0,
        def: 0,
        fallback: 0,
        root: 1
      });
      expect(Router.current.path).to.equal(base);
      expect(getHash()).to.equal('abc');
      return setHash(base + "/abc");
    }).then(function() {
      expect(invokeCount).to.eql({
        abc: 1,
        def: 0,
        fallback: 0,
        root: 1
      });
      expect(Router.current.path).to.equal(base + "/abc");
      expect(getHash()).to.equal(base + "/abc");
      return setHash('def');
    }).then(function() {
      expect(invokeCount).to.eql({
        abc: 1,
        def: 0,
        fallback: 0,
        root: 1
      });
      expect(Router.current.path).to.equal(base + "/abc");
      expect(getHash()).to.equal("def");
      return setHash(base + "/def");
    }).then(function() {
      expect(invokeCount).to.eql({
        abc: 1,
        def: 1,
        fallback: 0,
        root: 1
      });
      expect(Router.current.path).to.equal(base + "/def");
      return expect(getHash()).to.equal(base + "/def");
    });
  });
  test("routers with base paths should have their .go() method auto-prefix paths with the base path if they do not have it", function() {
    var Router, base, invokeCount;
    base = 'theBase/goes/here';
    invokeCount = {
      abc: 0,
      def: 0
    };
    Router = Routing.Router();
    return Promise.resolve().then(function() {
      return Router.base(base).map('abc').to(function() {
        return invokeCount.abc++;
      }).map('def').to(function() {
        return invokeCount.def++;
      }).listen();
    }).delay().then(function() {
      expect(invokeCount.abc).to.equal(0);
      expect(invokeCount.def).to.equal(0);
      return Router.go('abc');
    }).then(function() {
      expect(invokeCount.abc).to.equal(1);
      expect(invokeCount.def).to.equal(0);
      expect(Router.current.path).to.equal(base + "/abc");
      expect(getHash()).to.equal(base + "/abc");
      return Router.go('/def');
    }).then(function() {
      expect(invokeCount.abc).to.equal(1);
      expect(invokeCount.def).to.equal(1);
      expect(Router.current.path).to.equal(base + "/def");
      expect(getHash()).to.equal(base + "/def");
      return Router.go(base + "/abc");
    }).then(function() {
      expect(invokeCount.abc).to.equal(2);
      expect(invokeCount.def).to.equal(1);
      expect(Router.current.path).to.equal(base + "/abc");
      expect(getHash()).to.equal(base + "/abc");
      return Router.go(base + "/def");
    }).then(function() {
      expect(invokeCount.abc).to.equal(2);
      expect(invokeCount.def).to.equal(2);
      expect(Router.current.path).to.equal(base + "/def");
      return expect(getHash()).to.equal(base + "/def");
    });
  });
  test("default paths will work with routers that have a base path specified", function() {
    var Router, base, invokeCount;
    base = 'theBase/goes/here';
    Router = Routing.Router();
    invokeCount = {
      abc: 0,
      def: 0,
      fallback: 0
    };
    return Promise.resolve().then(function() {
      return Router.base(base).fallback(function() {
        return invokeCount.fallback++;
      }).map('abc').to(function() {
        return invokeCount.abc++;
      }).map('def').to(function() {
        return invokeCount.def++;
      }).listen('def');
    }).delay().then(function() {
      expect(invokeCount.abc).to.equal(0);
      expect(invokeCount.def).to.equal(1);
      expect(invokeCount.fallback).to.equal(0);
      return setHash('abc');
    }).then(function() {
      Router.kill();
      setHash('');
      return Router.base(base).fallback(function() {
        return invokeCount.fallback++;
      }).map('abc').to(function() {
        return invokeCount.abc++;
      }).map('def').to(function() {
        return invokeCount.def++;
      }).listen('kabugaguba');
    }).delay().then(function() {
      expect(invokeCount.abc).to.equal(0);
      expect(invokeCount.def).to.equal(1);
      expect(invokeCount.fallback).to.equal(1);
      return setHash('abc');
    });
  });
  test("a route can be removed by calling its .remove() method or by invoking this.remove() from inside the route", function() {
    var Router, abcRoute, defRoute, invokeCount;
    invokeCount = {
      abc: 0,
      def: 0
    };
    Router = Routing.Router();
    abcRoute = Router.map('abc').to(function() {
      return invokeCount.abc++;
    });
    defRoute = Router.map('def').to(function() {
      return invokeCount.def++;
    });
    Router.map('ghi');
    return Promise.resolve().then(function() {
      return Router.listen();
    }).delay().then(function() {
      expect(invokeCount.abc).to.equal(0);
      expect(invokeCount.def).to.equal(0);
      expect(getHash()).to.equal('');
      return setHash('abc');
    }).then(function() {
      expect(invokeCount.abc).to.equal(1);
      expect(invokeCount.def).to.equal(0);
      expect(getHash()).to.equal('abc');
      return setHash('def').then(function() {
        return setHash('abc');
      });
    }).then(function() {
      expect(invokeCount.abc).to.equal(2);
      expect(invokeCount.def).to.equal(1);
      expect(getHash()).to.equal('abc');
      abcRoute.remove();
      return setHash('def').then(function() {
        return setHash('abc');
      });
    }).then(function() {
      expect(invokeCount.abc).to.equal(2);
      expect(invokeCount.def).to.equal(2);
      expect(getHash()).to.equal('abc');
      defRoute.to(function() {
        return this.remove();
      });
      return setHash('ghi').then(function() {
        return setHash('def');
      });
    }).then(function() {
      expect(invokeCount.abc).to.equal(2);
      expect(invokeCount.def).to.equal(3);
      expect(getHash()).to.equal('def');
      return setHash('abc').then(function() {
        return setHash('def');
      });
    }).then(function() {
      expect(invokeCount.abc).to.equal(2);
      expect(invokeCount.def).to.equal(3);
      return expect(getHash()).to.equal('def');
    });
  });
  test("invoking this.redirect(target) from inside a route function will cause the router to redirect to the specified path", function() {
    var Router, invokeCount;
    invokeCount = {
      abc: 0,
      def: 0,
      ghi: 0
    };
    Router = Routing.Router();
    return Promise.resolve().then(function() {
      Router.map('abc').to(function() {
        invokeCount.abc++;
        return this.redirect('def');
      });
      Router.map('def').to(function() {
        return invokeCount.def++;
      });
      Router.map('ghi').to(function() {
        invokeCount.ghi++;
        return this.redirect('abc');
      });
      return Router.listen();
    }).delay().then(function() {
      expect(invokeCount).to.eql({
        abc: 0,
        def: 0,
        ghi: 0
      });
      expect(Router.current.path).to.equal(null);
      expect(getHash()).to.equal('');
      return setHash('abc');
    }).then(function() {
      expect(invokeCount).to.eql({
        abc: 1,
        def: 1,
        ghi: 0
      });
      expect(Router.current.path).to.equal('def');
      expect(getHash()).to.equal('def');
      return setHash('ghi');
    }).then(function() {
      expect(invokeCount).to.eql({
        abc: 2,
        def: 2,
        ghi: 1
      });
      expect(Router.current.path).to.equal('def');
      expect(getHash()).to.equal('def');
      return setHash('ghi');
    });
  });
  test("redirects should replace the last entry in the router's history", function() {
    var Router, invokeCount;
    invokeCount = {
      abc: 0,
      def: 0,
      ghi: 0
    };
    Router = Routing.Router();
    return Promise.resolve().then(function() {
      Router.map('abc').to(function() {
        invokeCount.abc++;
        return this.redirect('def');
      });
      Router.map('def').to(function() {
        return invokeCount.def++;
      });
      Router.map('ghi').to(function() {
        invokeCount.ghi++;
        return this.redirect('abc');
      });
      Router.map('jkl');
      return Router.listen();
    }).delay().then(function() {
      expect(invokeCount).to.eql({
        abc: 0,
        def: 0,
        ghi: 0
      });
      expect(getHash()).to.equal('');
      expect(Router.current.path).to.equal(null);
      expect(Router._history.length).to.equal(0);
      return setHash('abc');
    }).then(function() {
      expect(invokeCount).to.eql({
        abc: 1,
        def: 1,
        ghi: 0
      });
      expect(getHash()).to.equal('def');
      expect(Router.current.path).to.equal('def');
      expect(Router._history.length).to.equal(0);
      return setHash('jkl');
    }).then(function() {
      expect(invokeCount).to.eql({
        abc: 1,
        def: 1,
        ghi: 0
      });
      expect(getHash()).to.equal('jkl');
      expect(Router.current.path).to.equal('jkl');
      expect(Router._history.length).to.equal(1);
      return setHash('ghi');
    }).then(function() {
      expect(invokeCount).to.eql({
        abc: 2,
        def: 2,
        ghi: 1
      });
      expect(getHash()).to.equal('def');
      expect(Router.current.path).to.equal('def');
      expect(Router._history.length).to.equal(2);
      return expect(Router._history[1].path).to.equal('jkl');
    });
  });
  test("a router's .go() method can only accept strings", function() {
    var invokeCount, router;
    invokeCount = 0;
    router = Routing.Router();
    return Promise.resolve().then(function() {
      router.map('abc').to(function() {
        return invokeCount++;
      });
      router.fallback(function() {
        return invokeCount++;
      });
      return router.listen();
    }).delay().then(function() {
      expect(invokeCount).to.equal(1);
      return router.go('d');
    }).then(function() {
      expect(invokeCount).to.equal(2);
      return router.go('');
    }).then(function() {
      expect(invokeCount).to.equal(3);
      return router.go(null);
    }).then(function() {
      expect(invokeCount).to.equal(3);
      return router.go();
    }).then(function() {
      expect(invokeCount).to.equal(3);
      return router.go(true);
    }).then(function() {
      return expect(invokeCount).to.equal(3);
    });
  });
  test("invoking router.go() with the same path as the current route will trigger no changes", function() {
    var invokeCount, router;
    invokeCount = 0;
    router = Routing.Router();
    return Promise.resolve().then(function() {
      router.map('abc').to(function() {
        return invokeCount++;
      });
      router.fallback(function() {
        return invokeCount++;
      });
      return router.listen();
    }).delay().then(function() {
      expect(invokeCount).to.equal(1);
      return router.go('abc');
    }).then(function() {
      expect(invokeCount).to.equal(2);
      return router.go('abc');
    }).then(function() {
      return expect(invokeCount).to.equal(2);
    });
  });
  test("the .go/.refresh/.back/forward methods should always return promises", function() {
    var invokeCount, router;
    invokeCount = 0;
    router = Routing.Router();
    expect(typeof router.go().then).to.equal('function');
    expect(typeof router.refresh().then).to.equal('function');
    expect(typeof router.back().then).to.equal('function');
    return expect(typeof router.forward().then).to.equal('function');
  });
  test("a route can invoke its router's .go() command from its function body", function() {
    var invokeCount, router;
    invokeCount = {
      abc: 0,
      def: 0
    };
    router = Routing.Router();
    return Promise.resolve().then(function() {
      router.map('abc').to(function() {
        invokeCount.abc++;
        return router.go('def');
      });
      router.map('def').to(function() {
        return invokeCount.def++;
      });
      return router.listen();
    }).delay().then(function() {
      expect(invokeCount.abc).to.equal(0);
      expect(invokeCount.def).to.equal(0);
      return router.go('abc');
    }).delay().then(function() {
      expect(invokeCount.abc).to.equal(1);
      expect(invokeCount.def).to.equal(1);
      return router.go('def');
    }).delay().then(function() {
      expect(invokeCount.abc).to.equal(1);
      expect(invokeCount.def).to.equal(1);
      return router.go('abc');
    }).delay().then(function() {
      expect(invokeCount.abc).to.equal(2);
      expect(invokeCount.def).to.equal(2);
      return router.go('def');
    });
  });
  test("router.priority(number) can be used to define a priority which will be used to decide which router to invoke when multiple routers match a path", function() {
    var invokeCount, routerA, routerB;
    invokeCount = {
      a: 0,
      b: 0
    };
    routerA = Routing.Router();
    routerB = Routing.Router();
    return Promise.resolve().then(function() {
      routerA.map('abc').to(function() {
        return invokeCount.a++;
      });
      routerA.map('def').to(function() {});
      routerB.map('abc').to(function() {
        return invokeCount.b++;
      });
      routerB.map('def').to(function() {});
      routerA.listen();
      return routerB.listen();
    }).delay().then(function() {
      expect(invokeCount.a).to.equal(0);
      expect(invokeCount.b).to.equal(0);
      return setHash('abc');
    }).then(function() {
      expect(invokeCount.a).to.equal(1);
      expect(invokeCount.b).to.equal(1);
      return setHash('def').then(function() {
        return setHash('abc');
      });
    }).then(function() {
      expect(invokeCount.a).to.equal(2);
      expect(invokeCount.b).to.equal(2);
      routerA.priority(3);
      routerB.priority(2);
      return setHash('def').then(function() {
        return setHash('abc');
      });
    }).then(function() {
      expect(invokeCount.a).to.equal(3);
      expect(invokeCount.b).to.equal(2);
      routerB.priority(5);
      return setHash('def').then(function() {
        return setHash('abc');
      });
    }).then(function() {
      expect(invokeCount.a).to.equal(3);
      expect(invokeCount.b).to.equal(3);
      routerA.priority(10);
      routerB.priority(10);
      return setHash('def').then(function() {
        return setHash('abc');
      });
    }).then(function() {
      expect(invokeCount.a).to.equal(4);
      expect(invokeCount.b).to.equal(4);
      routerA.priority(10);
      routerB.priority(10);
      return setHash('def').then(function() {
        return setHash('abc');
      });
    });
  });
  test("router.priority() can only accept number types that are >= 1", function() {
    var invokeCount, routerA, routerB;
    invokeCount = {
      a: 0,
      b: 0
    };
    routerA = Routing.Router();
    routerB = Routing.Router();
    return Promise.resolve().then(function() {
      routerA.map('abc').to(function() {
        return invokeCount.a++;
      });
      routerA.map('def').to(function() {});
      routerB.map('abc').to(function() {
        return invokeCount.b++;
      });
      routerB.map('def').to(function() {});
      routerA.priority(0).listen();
      return routerB.listen();
    }).delay().then(function() {
      expect(invokeCount.a).to.equal(0);
      expect(invokeCount.b).to.equal(0);
      return setHash('abc');
    }).then(function() {
      expect(invokeCount.a).to.equal(1);
      expect(invokeCount.b).to.equal(1);
      routerB.priority(0/0);
      return setHash('def').then(function() {
        return setHash('abc');
      });
    }).then(function() {
      expect(invokeCount.a).to.equal(2);
      expect(invokeCount.b).to.equal(2);
      routerA.priority('5');
      return setHash('def').then(function() {
        return setHash('abc');
      });
    }).then(function() {
      expect(invokeCount.a).to.equal(3);
      return expect(invokeCount.b).to.equal(3);
    });
  });
  test("routes can be marked as passive via route.passive() which will cause it not to update the window.location.hash or router history on transition", function() {
    var Router;
    Router = Routing.Router();
    window.invokeCount = {
      activeA: 0,
      activeB: 0,
      passiveA: 0,
      passiveB: 0,
      passiveC: 0
    };
    return Promise.resolve().then(function() {
      return Router.map('def').map('abc/first').to(function() {
        return invokeCount.activeA++;
      }).map('abc/second').to(function() {
        return invokeCount.activeB++;
      }).map('abc/:paramA').passive().to(function() {
        return invokeCount.passiveA++;
      }).map('abc/:paramA/:paramC?').passive().to(function() {
        return invokeCount.passiveB++;
      }).map('abc/:paramA/:paramC').passive().to(function() {
        return invokeCount.passiveC++;
      }).listen('def');
    }).delay().then(function() {
      expect(invokeCount, 'def').to.eql({
        activeA: 0,
        activeB: 0,
        passiveA: 0,
        passiveB: 0,
        passiveC: 0
      });
      expect(Router._history.length).to.equal(0);
      expect(getHash()).to.equal('def');
      return setHash('abc/first');
    }).then(function() {
      expect(invokeCount, 'abc/first').to.eql({
        activeA: 1,
        activeB: 0,
        passiveA: 1,
        passiveB: 1,
        passiveC: 0
      });
      expect(Router._history.length).to.equal(1);
      expect(getHash()).to.equal('abc/first');
      return setHash('abc/second');
    }).then(function() {
      expect(invokeCount, 'abc/second').to.eql({
        activeA: 1,
        activeB: 1,
        passiveA: 2,
        passiveB: 2,
        passiveC: 0
      });
      expect(Router._history.length).to.equal(2);
      expect(getHash()).to.equal('abc/second');
      return Router.go('abc/second/third');
    }).then(function() {
      expect(invokeCount, 'abc/second/third').to.eql({
        activeA: 1,
        activeB: 1,
        passiveA: 2,
        passiveB: 3,
        passiveC: 1
      });
      expect(Router._history.length).to.equal(2);
      return expect(getHash()).to.equal('abc/second');
    });
  });
  test("router.kill() will destroy the router instance and will remove all handlers", function() {
    var RouterA, RouterB, defineRoutes, invokeChanges, invokeCountA, invokeCountB;
    RouterA = Routing.Router();
    RouterB = Routing.Router();
    invokeCountA = {};
    invokeCountB = {};
    defineRoutes = function(router, invokeCount) {
      router.map('AAA').to(function() {
        if (invokeCount.AAA == null) {
          invokeCount.AAA = 0;
        }
        return invokeCount.AAA++;
      });
      router.map('BBB').to(function() {
        if (invokeCount.BBB == null) {
          invokeCount.BBB = 0;
        }
        return invokeCount.BBB++;
      });
      router.map('CCC').to(function() {
        if (invokeCount.CCC == null) {
          invokeCount.CCC = 0;
        }
        return invokeCount.CCC++;
      });
      return router.listen();
    };
    invokeChanges = function() {
      return Promise.resolve().then(function() {
        return setHash('AAA');
      }).then(function() {
        return setHash('BBB');
      }).then(function() {
        return setHash('CCC');
      });
    };
    return Promise.resolve().then(function() {
      defineRoutes(RouterA, invokeCountA);
      defineRoutes(RouterB, invokeCountB);
      return invokeChanges();
    }).delay().then(function() {
      expect(invokeCountA.AAA).to.equal(1);
      expect(invokeCountA.BBB).to.equal(1);
      expect(invokeCountA.CCC).to.equal(1);
      expect(invokeCountB.AAA).to.equal(1);
      expect(invokeCountB.BBB).to.equal(1);
      expect(invokeCountB.CCC).to.equal(1);
      return invokeChanges();
    }).then(function() {
      expect(invokeCountA.AAA).to.equal(2);
      expect(invokeCountA.BBB).to.equal(2);
      expect(invokeCountA.CCC).to.equal(2);
      expect(invokeCountB.AAA).to.equal(2);
      expect(invokeCountB.BBB).to.equal(2);
      expect(invokeCountB.CCC).to.equal(2);
      RouterA.kill();
      return invokeChanges();
    }).then(function() {
      expect(invokeCountA.AAA).to.equal(2);
      expect(invokeCountA.BBB).to.equal(2);
      expect(invokeCountA.CCC).to.equal(2);
      expect(invokeCountB.AAA).to.equal(3);
      expect(invokeCountB.BBB).to.equal(3);
      return expect(invokeCountB.CCC).to.equal(3);
    });
  });
  return test("routing.killAll() will destroy all existing router instances and will remove all handlers", function() {
    var RouterA, RouterB, defineRoutes, invokeChanges, invokeCountA, invokeCountB;
    RouterA = Routing.Router();
    RouterB = Routing.Router();
    invokeCountA = {};
    invokeCountB = {};
    defineRoutes = function(router, invokeCount) {
      router.map('AAA').to(function() {
        if (invokeCount.AAA == null) {
          invokeCount.AAA = 0;
        }
        return invokeCount.AAA++;
      });
      router.map('BBB').to(function() {
        if (invokeCount.BBB == null) {
          invokeCount.BBB = 0;
        }
        return invokeCount.BBB++;
      });
      router.map('CCC').to(function() {
        if (invokeCount.CCC == null) {
          invokeCount.CCC = 0;
        }
        return invokeCount.CCC++;
      });
      return router.listen();
    };
    invokeChanges = function() {
      return Promise.resolve().then(function() {
        return setHash('AAA');
      }).then(function() {
        return setHash('BBB');
      }).then(function() {
        return setHash('CCC');
      });
    };
    return Promise.resolve().then(function() {
      defineRoutes(RouterA, invokeCountA);
      defineRoutes(RouterB, invokeCountB);
      return invokeChanges();
    }).delay().then(function() {
      expect(invokeCountA.AAA).to.equal(1);
      expect(invokeCountA.BBB).to.equal(1);
      expect(invokeCountA.CCC).to.equal(1);
      expect(invokeCountB.AAA).to.equal(1);
      expect(invokeCountB.BBB).to.equal(1);
      expect(invokeCountB.CCC).to.equal(1);
      return invokeChanges();
    }).then(function() {
      expect(invokeCountA.AAA).to.equal(2);
      expect(invokeCountA.BBB).to.equal(2);
      expect(invokeCountA.CCC).to.equal(2);
      expect(invokeCountB.AAA).to.equal(2);
      expect(invokeCountB.BBB).to.equal(2);
      expect(invokeCountB.CCC).to.equal(2);
      Routing.killAll();
      return invokeChanges();
    }).then(function() {
      expect(invokeCountA.AAA).to.equal(2);
      expect(invokeCountA.BBB).to.equal(2);
      expect(invokeCountA.CCC).to.equal(2);
      expect(invokeCountB.AAA).to.equal(2);
      expect(invokeCountB.BBB).to.equal(2);
      return expect(invokeCountB.CCC).to.equal(2);
    });
  });
});

;
return module.exports;
},
2: function (require, module, exports) {
/*!
 * chai-spies :: a chai plugin
 * Copyright (c) 2012 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * We are going to export a function that can be used through chai
 */

module.exports = function (chai, _) {
  // Easy access
  var Assertion = chai.Assertion
    , flag = _.flag
    , i = _.inspect

  /**
   * # chai.spy (function)
   *
   * Wraps a function in a proxy function. All calls will
   * pass through to the original function.
   *
   *      function original() {}
   *      var spy = chai.spy(original)
   *        , e_spy = chai.spy();
   *
   * @param {Function} function to spy on
   * @returns function to actually call
   * @api public
   */

  chai.spy = function (name, fn) {
    if (typeof name === 'function') {
      fn = name;
      name = undefined;
    }

    fn = fn || function () {};

    function makeProxy (length, fn) {
      switch (length) {
        case 0 : return function () { return fn.apply(this, arguments); };
        case 1 : return function (a) { return fn.apply(this, arguments); };
        case 2 : return function (a,b) { return fn.apply(this, arguments); };
        case 3 : return function (a,b,c) { return fn.apply(this, arguments); };
        case 4 : return function (a,b,c,d) { return fn.apply(this, arguments); };
        case 5 : return function (a,b,c,d,e) { return fn.apply(this, arguments); };
        case 6 : return function (a,b,c,d,e,f) { return fn.apply(this, arguments); };
        case 7 : return function (a,b,c,d,e,f,g) { return fn.apply(this, arguments); };
        case 8 : return function (a,b,c,d,e,f,g,h) { return fn.apply(this, arguments); };
        case 9 : return function (a,b,c,d,e,f,g,h,i) { return fn.apply(this, arguments); };
        default : return function (a,b,c,d,e,f,g,h,i,j) { return fn.apply(this, arguments); };
      }
    };

    var proxy = makeProxy(fn.length, function () {
      var args = Array.prototype.slice.call(arguments);
      proxy.__spy.calls.push(args);
      proxy.__spy.called = true;
      return fn.apply(this, args);
    });

    proxy.prototype = fn.prototype;
    proxy.toString = function toString() {
      var l = this.__spy.calls.length;
      var s = "{ Spy";
      if (this.__spy.name)
        s += " '" + this.__spy.name + "'";
      if (l > 0)
        s += ", " + l + " call" + (l > 1 ? 's' : '');
      s += " }";
      return s;
    };

  /**
   * # proxy.reset (function)
   *
   * Resets __spy object parameters for instantiation and reuse
   * @returns proxy spy object
   */
    proxy.reset = function() {
      this.__spy = {
        calls: []
        , called: false
        , name: name
      };
      return this;
    }

    return proxy.reset();
  }

  /**
   * # chai.spy.on (function)
   *
   * Wraps an object method into spy. All calls will
   * pass through to the original function.
   *
   *      var spy = chai.spy.on(Array, 'isArray');
   *
   * @param {Object} object
   * @param {String} method name to spy on
   * @returns function to actually call
   * @api public
   */

  chai.spy.on = function (object, methodName) {
    object[methodName] = chai.spy(object[methodName]);

    return object[methodName];
  };

  /**
   * # chai.spy.object (function)
   *
   * Creates an object with spied methods.
   *
   *      var object = chai.spy.object('Array', [ 'push', 'pop' ]);
   *
   * @param {String} [name] object name
   * @param {String[]|Object} method names or method definitions
   * @returns object with spied methods
   * @api public
   */

  chai.spy.object = function (name, methods) {
    var defs = {};

    if (name && typeof name === 'object') {
      methods = name;
      name = 'object';
    }

    if (methods && !Array.isArray(methods)) {
      defs = methods;
      methods = Object.keys(methods);
    }

    return methods.reduce(function (object, methodName) {
      object[methodName] = chai.spy(name + '.' + methodName, defs[methodName]);
      return object;
    }, {});
  };

  /**
   * # spy
   *
   * Assert the the object in question is an chai.spy
   * wrapped function by looking for internals.
   *
   *      expect(spy).to.be.spy;
   *      spy.should.be.spy;
   *
   * @api public
   */

  Assertion.addProperty('spy', function () {
    this.assert(
        'undefined' !== typeof this._obj.__spy
      , 'expected ' + this._obj + ' to be a spy'
      , 'expected ' + this._obj + ' to not be a spy');
    return this;
  });

  /**
   * # .called
   *
   * Assert that a spy has been called. Does not negate to allow for
   * pass through language.
   *
   * @api public
   */

  function assertCalled (n) {
    new Assertion(this._obj).to.be.spy;
    var spy = this._obj.__spy;

    if (n) {
      this.assert(
          spy.calls.length === n
        , 'expected ' + this._obj + ' to have been called #{exp} but got #{act}'
        , 'expected ' + this._obj + ' to have not been called #{exp}'
        , n
        , spy.calls.length
      );
    } else {
      this.assert(
          spy.called === true
        , 'expected ' + this._obj + ' to have been called'
        , 'expected ' + this._obj + ' to not have been called'
      );
    }
  }

  function assertCalledChain () {
    new Assertion(this._obj).to.be.spy;
  }

  Assertion.addChainableMethod('called', assertCalled, assertCalledChain);

  /**
   * # once
   *
   * Assert that a spy has been called exactly once
   *
   * @api public
   */

  Assertion.addProperty('once', function () {
    new Assertion(this._obj).to.be.spy;
    this.assert(
        this._obj.__spy.calls.length === 1
      , 'expected ' + this._obj + ' to have been called once but got #{act}'
      , 'expected ' + this._obj + ' to not have been called once'
      , 1
      , this._obj.__spy.calls.length );
  });

  /**
   * # twice
   *
   * Assert that a spy has been called exactly twice.
   *
   * @api public
   */

  Assertion.addProperty('twice', function () {
    new Assertion(this._obj).to.be.spy;
    this.assert(
        this._obj.__spy.calls.length === 2
      , 'expected ' + this._obj + ' to have been called twice but got #{act}'
      , 'expected ' + this._obj + ' to not have been called twice'
      , 2
      , this._obj.__spy.calls.length
    );
  });

  /**
   * ### .with
   *
   */

  function assertWith () {
    new Assertion(this._obj).to.be.spy;
    var args = [].slice.call(arguments, 0)
      , calls = this._obj.__spy.calls
      , always = _.flag(this, 'spy always')
      , passed;

    if (always) {
      passed = 0
      calls.forEach(function (call) {
        var found = 0;
        args.forEach(function (arg) {
          for (var i = 0; i < call.length; i++) {
            if (_.eql(call[i], arg)) found++;
          }
        });
        if (found === args.length) passed++;
      });

      this.assert(
          passed === calls.length
        , 'expected ' + this._obj + ' to have been always called with #{exp} but got ' + passed + ' out of ' + calls.length
        , 'expected ' + this._his + ' to have not always been called with #{exp}'
        , args
      );
    } else {
      passed = 0;
      calls.forEach(function (call) {
        var found = 0;
        args.forEach(function (arg) {
          for (var i = 0; i < call.length; i++) {
            if (_.eql(call[i], arg)) found++;
          }
        });
        if (found === args.length) passed++;
      });

      this.assert(
          passed > 0
        , 'expected ' + this._obj + ' to have been called with #{exp}'
        , 'expected ' + this._his + ' to have not been called with #{exp} but got ' + passed + ' times'
        , args
      );
    }
  }

  function assertWithChain () {
    if ('undefined' !== this._obj.__spy) {
      _.flag(this, 'spy with', true);
    }
  }

  Assertion.addChainableMethod('with', assertWith, assertWithChain);

  Assertion.addProperty('always', function () {
    if ('undefined' !== this._obj.__spy) {
      _.flag(this, 'spy always', true);
    }
  });

  /**
   * # exactly (n)
   *
   * Assert that a spy has been called exactly `n` times.
   *
   * @param {Number} n times
   * @api public
   */

  Assertion.addMethod('exactly', function () {
    new Assertion(this._obj).to.be.spy;
    var always = _.flag(this, 'spy always')
      , _with = _.flag(this, 'spy with')
      , args = [].slice.call(arguments, 0)
      , calls = this._obj.__spy.calls
      , passed;

    if (always && _with) {
      passed = 0
      calls.forEach(function (call) {
        if (call.length !== args.length) return;
        if (_.eql(call, args)) passed++;
      });

      this.assert(
          passed === calls.length
        , 'expected ' + this._obj + ' to have been always called with exactly #{exp} but got ' + passed + ' out of ' + calls.length
        , 'expected ' + this._obj + ' to have not always been called with exactly #{exp}'
        , args
      );
    } else if (_with) {
      passed = 0;
      calls.forEach(function (call) {
        if (call.length !== args.length) return;
        if (_.eql(call, args)) passed++;
      });

      this.assert(
          passed > 0
        , 'expected ' + this._obj + ' to have been called with exactly #{exp}'
        , 'expected ' + this._obj + ' to not have been called with exactly #{exp} but got ' + passed + ' times'
        , args
      );
    } else {
      this.assert(
          this._obj.__spy.calls.length === args[0]
        , 'expected ' + this._obj + ' to have been called #{exp} times but got #{act}'
        , 'expected ' + this._obj + ' to not have been called #{exp} times'
        , args[0]
        , this._obj.__spy.calls.length
      );
    }
  });

  /**
   * # gt (n)
   *
   * Assert that a spy has been called more than `n` times.
   *
   * @param {Number} n times
   * @api public
   */

  function above (_super) {
    return function (n) {
      if ('undefined' !== typeof this._obj.__spy) {
        new Assertion(this._obj).to.be.spy;

        this.assert(
            this._obj.__spy.calls.length > n
          , 'expected ' + this._obj + ' to have been called more than #{exp} times but got #{act}'
          , 'expected ' + this._obj + ' to have been called at most #{exp} times but got #{act}'
          , n
          , this._obj.__spy.calls.length
        );
      } else {
        _super.apply(this, arguments);
      }
    }
  }

  Assertion.overwriteMethod('above', above);
  Assertion.overwriteMethod('gt', above);

  /**
   * # lt (n)
   *
   * Assert that a spy has been called less than `n` times.
   *
   * @param {Number} n times
   * @api public
   */

  function below (_super) {
    return function (n) {
      if ('undefined' !== typeof this._obj.__spy) {
        new Assertion(this._obj).to.be.spy;

        this.assert(
            this._obj.__spy.calls.length <  n
          , 'expected ' + this._obj + ' to have been called fewer than #{exp} times but got #{act}'
          , 'expected ' + this._obj + ' to have been called at least #{exp} times but got #{act}'
          , n
          , this._obj.__spy.calls.length
        );
      } else {
        _super.apply(this, arguments);
      }
    }
  }

  Assertion.overwriteMethod('below', below);
  Assertion.overwriteMethod('lt', below);

  /**
   * # min (n)
   *
   * Assert that a spy has been called `n` or more times.
   *
   * @param {Number} n times
   * @api public
   */

  function min (_super) {
    return function (n) {
      if ('undefined' !== typeof this._obj.__spy) {
        new Assertion(this._obj).to.be.spy;

        this.assert(
            this._obj.__spy.calls.length >= n
          , 'expected ' + this._obj + ' to have been called at least #{exp} times but got #{act}'
          , 'expected ' + this._obj + ' to have been called fewer than #{exp} times but got #{act}'
          , n
          , this._obj.__spy.calls.length
        );
      } else {
        _super.apply(this, arguments);
      }
    }
  }

  Assertion.overwriteMethod('min', min);
  Assertion.overwriteMethod('least', min);

  /**
   * # max (n)
   *
   * Assert that a spy has been called `n` or fewer times.
   *
   * @param {Number} n times
   * @api public
   */

  function max (_super) {
    return function (n) {
      if ('undefined' !== typeof this._obj.__spy) {
        new Assertion(this._obj).to.be.spy;

        this.assert(
            this._obj.__spy.calls.length <=  n
          , 'expected ' + this._obj + ' to have been called at most #{exp} times but got #{act}'
          , 'expected ' + this._obj + ' to have been called more than #{exp} times but got #{act}'
          , n
          , this._obj.__spy.calls.length
        );
      } else {
        _super.apply(this, arguments);
      }
    }
  }

  Assertion.overwriteMethod('max', max);
  Assertion.overwriteMethod('most', max);
};
;
return module.exports;
},
1: function (require, module, exports) {
module.exports = require(2);
;
return module.exports;
}
});
return require(0);
}).call(this, null);
