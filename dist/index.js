(function(t){if(t=function(e,r){return function(n){if(!r[n])throw new Error(n+" is not a module");return e[n]?e[n].exports:(e[n]={exports:{}},e[n].exports=r[n](t,e[n],e[n].exports))}}({},{4:function(t,e,r){var n,o,i;return n=t(5),i=t(2),e.exports=o=function(){function t(t,e,r){this.path=t,this.segments=e,this.router=r,this._context=new n(this),this._enterAction=this._leaveAction=i.noop,this._actions=[]}return t.prototype.entering=function(t){return this._enterAction=t,this},t.prototype.leaving=function(t){return this._leaveAction=t,this},t.prototype.to=function(t){return this._actions.push(t),this},t.prototype.filters=function(t){return this._dynamicFilters=t,this},t.prototype.passive=function(){return this._passive=this.router._hasPassives=!0,this},t.prototype.remove=function(){return this.router._removeRoute(this)},t.prototype._invokeAction=function(t,e,r){var n;return n=t.call(this._context,e,r),n===this.router._pendingRoute?null:n},t.prototype._run=function(t,e,r){return this._resolveParams(t),Promise.resolve(this._invokeAction(this._enterAction,r,e)).then(function(t){return function(){return Promise.all(t._actions.map(function(n){return t._invokeAction(n,r,e)}))}}(this))},t.prototype._leave=function(t,e){return this._invokeAction(this._leaveAction,e,t)},t.prototype._resolveParams=function(t){var e,r,n,o;if(this.segments.dynamic){o=(t=i.removeBase(t,this.router._basePath)).split("/"),r=this.segments.dynamic;for(e in r)n=r[e],"length"!==e&&(this._context.params[n]=o[e]||"")}},Object.defineProperties(t.prototype,{map:{get:function(){return this.router.map.bind(this.router)}},mapOnce:{get:function(){return this.router.mapOnce.bind(this.router)}},listen:{get:function(){return this.router.listen.bind(this.router)}}}),t}(),e.exports},5:function(t,e,r){var n;return e.exports=n=function(){function t(t){this.route=t,this.segments=this.route.segments,this.path=this.route.path.string,this.params={}}return t.prototype.remove=function(){return this.route.remove()},t.prototype.redirect=function(t){return this.route.router.go(t,"redirect"),Promise.resolve()},t}(),e.exports},1:function(t,e,r){var n,o,i;return n=t(4),i=t(2),o=function(){function e(t,e){this.timeout=t,this.ID=e,isNaN(this.timeout)&&(this.timeout=2500),this.listening=!1,this.routes=[],this._priority=1,this._routesMap={},this._cache={},this._history=[],this._future=[],this._globalBefore=this._globalAfter=i.noop,this._pendingRoute=Promise.resolve(),this.current=this.prev={route:null,path:null}}return e.prototype._addRoute=function(t){return this.routes.push(t),this.routes.sort(function(t,e){var r,n,o,i,s;return(s=e.segments.length-t.segments.length)||(r=(null!=(o=t.segments.dynamic)?o.length:void 0)||0,s=(n=(null!=(i=e.segments.dynamic)?i.length:void 0)||0)-r),s}),t},e.prototype._removeRoute=function(t){var e,r,n,o;return e=Object.keys(this._cache),r=Object.keys(this._routesMap),n=e.filter(function(e){return function(r){return e._cache[r]===t}}(this))[0],o=e.filter(function(e){return function(r){return e._routesMap[r]===t}}(this))[0],i.removeItem(this.routes,t),delete this._cache[n],delete this._routesMap[o]},e.prototype._matchPath=function(t){var e,r,n,o,i,s,u,h,a,c,l,p,f;if(!(u=this._cache[t]))for(r=0,i=(c=this.routes).length;r<i;r++)if((l=c[r]).path.test(t)){if(l.segments.dynamic&&l._dynamicFilters){for(h=!0,f||(f=t.split("/")),n=o=0,s=f.length;o<s&&((p=f[n])!==l.segments[n]&&(h=null!=(e=l.segments.dynamic[n]))&&l._dynamicFilters[e]&&(h=l._dynamicFilters[e](p)),h);n=++o);if(!h)continue}if(!this._hasPassives){u=l;break}l._passive?(a||(a=[]),a.push(l)):u||(u=l)}if(a&&(u&&a.push(u),u=a),u)return this._cache[t]=u},e.prototype._go=function(t,e,r,n){return t.constructor===Array?Promise.all(t.map(function(t){return function(o){return t._go(o,e,r,n)}}(this))):(e=i.applyBase(e,this._basePath),r&&!t._passive&&(e!==i.currentPath()&&(window.location.hash=e),"redirect"===n&&(this.current=this.prev,this._history.pop()),this.current.route&&"back"!==n&&this._history.push(this.current),n||(this._future.length=0),this.prev=i.copyObject(this.current),this.current={route:t,path:e}),this._pendingRoute=this._pendingRoute.then(function(r){return function(){return new Promise(function(n,o){return setTimeout(function(){return o(new Error("TimeoutError: '"+e+"' failed to load within "+r.timeout+"ms (Router #"+r.ID+")"))},r.timeout),Promise.resolve().then(r._globalBefore).then(function(){var t;return null!=(t=r.prev.route)?t._leave(r.current.route,r.current.path):void 0}).then(function(){return t._run(e,r.prev.route,r.prev.path)}).then(r._globalAfter).then(n).catch(o)})}}(this)),this._pendingRoute.catch(function(t){return function(e){return i.logError(e),t._pendingRoute=Promise.resolve(),t._fallbackRoute?t._go(t._fallbackRoute,t.current.path):t._go(t.prev.route,t.prev.path,!0,"back")}}(this)))},e.prototype.go=function(t,e){var r,n;return"string"==typeof t&&(n=i.cleanPath(t),n=i.removeBase(n,this._basePath),(r=this._matchPath(n))||(r=this._fallbackRoute),r&&n!==this.current.path&&this._go(r,n,!0,e)),this._pendingRoute},e.prototype.map=function(t){var e,r,o;return t=i.cleanPath(t),o=i.parsePath(t),(e=this._routesMap[t])||(r=i.segmentsToRegex(o),e=this._routesMap[t]=new n(r,o,this),this._addRoute(e)),e},e.prototype.mapOnce=function(t){return this.map(t).to(function(){return this.remove()})},e.prototype.listen=function(e){return null==e&&(e=!0),this.listening=!0,t(0)._registerRouter(this,e),this},e.prototype.beforeAll=function(t){return this._globalBefore=t,this},e.prototype.afterAll=function(t){return this._globalAfter=t,this},e.prototype.base=function(t){return this._basePath=i.pathToRegex(i.cleanPath(t),!0),this},e.prototype.priority=function(t){return t&&"number"==typeof t&&(this._priority=t),this},e.prototype.fallback=function(t){return this._fallbackRoute=new n("*FALLBACK*",[],this),this._fallbackRoute.to(t),this},e.prototype.back=function(){var t;return this.current.route&&this._future.unshift(this.current),t=this._history.pop(),t?this._go(t.route,t.path,!0,"back"):Promise.resolve()},e.prototype.forward=function(){var t;return t=this._future.shift(),t?this._go(t.route,t.path,!0,"forward"):Promise.resolve()},e.prototype.refresh=function(){return this.current.route&&(this.prev.path=this.current.path,this.prev.route=this.current.route,this._go(this.current.route,this.current.path)),this._pendingRoute},e.prototype.kill=function(){this._routesMap={},this._cache={},this.routes.length=this._history.length=this._future.length=0,this._globalBefore=this._globalAfter=i.noop,this._fallbackRoute=null,this.current.route=this.current.path=this.prev.route=this.prev.path=null},e}(),e.exports=o,e.exports},0:function(t,e,r){var n,o,i;return n=t(1),i=t(2),o=new function(){var t,e,r,o,s;return s=[],o=[],r=!1,t=0,e=function(t){var e,r,n,s,u,h,a,c,l,p,f,_,g;for(p=i.currentPath(),l=[],r=0,u=o.length;r<u;r++)(_=o[r])._basePath&&!_._basePath.test(p)||(g=i.removeBase(p,_._basePath),(c=_._matchPath(g))&&(c.constructor===Array?l.push.apply(l,c):l.push(c)));if(!l.length)for(n=0,h=o.length;n<h;n++)(_=o[n])._fallbackRoute&&(_._basePath&&!_._basePath.test(p)||l.push(_._fallbackRoute));for(e=Math.max.apply(Math,l.map(function(t){return t.router._priority})),s=0,a=(l=l.filter(function(t){return t.router._priority===e})).length;s<a;s++)(f=l[s]).router.current.path!==p&&f.router._go(f,p,!0)},this._registerRouter=function(t,n){var s,u,h;if(o.push(t),r||(r=!0,void 0!==window.onhashchange&&(!document.documentMode||document.documentMode>=8)?window.addEventListener("hashchange",e):setInterval(e,100)),n){if(h=i.currentPath(),"string"==typeof n&&(s=i.cleanPath(n)),t._basePath&&!t._basePath.test(h)&&!s)return;if(!(u=t._matchPath(i.removeBase(h,t._basePath)))&&s&&(u=t._matchPath(s),h=s),null==u&&(u=t._fallbackRoute),u)return t._go(u,h,!0)}},this.killAll=function(){var t,e,r,n;for(t=0,e=(n=s.slice()).length;t<e;t++)(r=n[t]).kill();s.length=0,o.length=0},this.Router=function(e){var r;return s.push(r=new n(e,++t)),r},this.version="1.1.0-alpha",this},e.exports=o,e.exports},2:function(t,e,r){var n;return e.exports=n={},n.noop=function(){return Promise.resolve()},n.currentPath=function(){return n.cleanPath(window.location.hash)},n.copyObject=function(t){var e,r,n;r={};for(e in t)n=t[e],r[e]=n;return r},n.removeItem=function(t,e){var r;return r=t.indexOf(e),t.splice(r,1),t},n.logError=function(t){t instanceof Error||(t=new Error(t)),null!=("undefined"!=typeof console&&null!==console?console.error:void 0)?console.error(t):null!=("undefined"!=typeof console&&null!==console?console.log:void 0)&&console.log(t)},n.applyBase=function(t,e){return e&&!e.test(t)?e.string+"/"+t:t},n.removeBase=function(t,e){return e&&e.test(t)&&((t=t.slice(e.length+1)).length||(t="/")),t},n.cleanPath=function(t){return"#"===t[0]&&(t=t.slice(1)),0===t.length?t="/":t.length>1&&("/"===t[0]&&(t=t.slice(1)),"/"===t[t.length-1]&&(t=t.slice(0,-1))),t},n.parsePath=function(t){var e,r,n,o,i,s,u,h;if("/"===t)return["/"];for(o=u=!1,n="",h=[],s=t.length,i=-1,e=function(){var t;return h.push(n),t=h.length-1,o&&(null==h.optional&&(h.optional={}),null==h.dynamic&&(h.dynamic={length:0}),h.dynamic[t]=n),u&&(h.optional[t]=n),n="",o=u=!1};++i!==s;)switch(r=t[i]){case"/":e();break;case":":o=!0;break;case"?":u=!0;break;default:n+=r}return e(),h},n.pathToRegex=function(t,e){var r,n;return r=t.replace(/\//g,"\\/"),n="^"+t,e||(n+="$"),n=new RegExp(n),n.string=t,n.length=t.length,n},n.segmentsToRegex=function(t){var e,r,o,i,s,u;for(i="",e=r=0,o=t.length;r<o;e=++r)u=t[e],(null!=(s=t.dynamic)?s[e]:void 0)?(u="[^/]+",1===t.length&&(u+="$"),i&&(u="/"+u),t.optional[e]&&(u="(?:"+u+")?")):i&&(i+="/"),i+=u;return n.pathToRegex(i)},e.exports}}),"function"==typeof define&&define.umd)define(function(){return t(0)});else{if("object"!=typeof module||!module.exports)return this.Routing=t(0);module.exports=t(0)}}).call(this,null);