/**
 * Copyright 2013 OpenSocial Foundation
 * Copyright 2013 International Business Machines Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Utility library for working with Activity Streams Actions
 * Requires underscorejs.
 *
 * @author James M Snell (jasnell@us.ibm.com)
 */
 /** @typedef {asms.Models.SimpleLinkValue|asms.Models.Object|Array<asms.Models.SimpleLinkValue|asms.Models.Object>} LinkValue **/
 /** @typedef {asms.Models.NaturalLanguageValue|string} NaturalLanguageValue **/
 /** @typedef {asms.Models.SimpleTypeValue|asms.Models.Object} TypeValue **/


/** 
 * @namespace asms 
 **/
(function( global, factory ) {
  // loader logic following jquery's lead... ensures that we load properly into 
  // node as well as normal browser environments...
  if ( typeof module === 'object' && typeof module.exports === 'object' ) {
    module.exports = global.document ?
      factory(global) :
      factory();
  } else {
    factory(global);
  }
}(typeof window !== 'undefined' ? window : this, function(_$) {

  var props          = Object.getOwnPropertyNames,
      defineProperty = Object.defineProperty,
      freeze         = Object.freeze,
      is_array       = Array.isArray,
      nativeForEach  = Array.prototype.forEach,
      nativeIndexOf  = Array.prototype.indexOf,
      objproto       = Object.prototype,
      aryproto       = Array.prototype;

  function bounded(m,h,l) {
    return Math.min(Math.max(m,l),h);
  }

  function contains(a,b) {
    if (a === undefined || a === null) return false;
    if (nativeIndexOf && a.indexOf === nativeIndexOf)
      return a.indexOf(b) > -1;
    else if (typeof a === 'object')
      return (b in a);
    else return false;
  }

  // Get the default language for our language context. In modern
  // browsers, this is fairly simple...we just call navigator.language,
  // but navigator and navigator.language don't exist in every environment
  // (like node) so we have to hard code a default.
  var defaultLanguage = function(fallback) {
    return typeof navigator !== 'undefined' && navigator.language ?
      navigator.language : fallback;
  }('en');

  // Throw an error
  function invalidType() {
    return new Error('Invalid Type');
  }
  
  /**
   * If the native Array.isArray is not defined, provide an alternative
   * implementation. Pretty straightforward.. attempt to toString and 
   * see if it comes out as [object Array].
   */
  if (typeof is_array === 'undefined') {
    is_array = function(obj) {
      return Object.prototype.toString.call(obj) == '[object Array]';
    };
  }

  /**
   * If the native Object.freeze is not defined, we'll create a dummy
   * non-op stub so we don't break, but it's not the end of the world
   **/
  if (typeof freeze === 'undefined')
    freeze = function(obj) {};

  /** 
   * The same as underscore's approach. Polyfill forEach
   * if we absolutely need to
   **/
   function each(obj, i, ctx) {
     if (obj === undefined || obj === null)
       return obj;
     if (nativeForEach && obj.forEach === nativeForEach)
       obj.forEach(i,ctx);
     else
       for (var n in obj)
         i.call(ctx,obj[n],n,obj);
   }

  /**
   * Call Object.freeze on obj and all of it's Own properties (recursively). 
   * The excludes argument specifies a list of Own property names to skip
   **/
  function deep_freeze(obj,excludes) {
    if (obj === undefined || typeof obj !== 'object') return;
    freeze(obj);
    each(
      props(obj), 
      function(n) {
        if (!contains(excludes,n))
          deep_freeze(obj[n]);
      }
    );
  }
  
  /**
   * Basic type checking
   **/
  function checkType(obj, type) {
    if (obj === undefined || obj === null)
      return obj;
    switch(typeof type) {
    case 'string':
      if (typeof obj === type)
        return obj;
      break;
    case 'object':
      if (is_array(type)) {
        for (var n in type) {
          if (typeof obj === type[n])
            return obj;
        }
      }
      break;
    case 'function':
      if (obj instanceof type)
        return obj;
      break;
    }
    throw invalidType();
  }
  
  function checkTypeIsNumber() {
    if (arguments.length == 1) {
      var arg = arguments[0];
      if (arg === undefined || arg === null) 
        return;
      if (isNaN(+arg))
        throw invalidType();
    } else each(
      arguments, 
      function(i) { checkTypeIsNumber(i); });
  }

  /**
   * Fairly typical extend impl
   **/
  function ext(to,from) {
    var defs = props(from);
    for (var n in defs) {
      // don't copy if the property is defined by (and has the 
      // same value as) Object.prototype or Array.prototype
      if ((n in objproto && props[n] === objproto[n]) ||
          (n in aryproto && props[n] === aryproto[n]))
        continue;
      to[defs[n]] = from[defs[n]];
    }
    return to;
  }


  /**
   * For backwards compatible downstreamDuplicates and upstreamDuplicates
   * handling... merges LinkValue's from the source into the target and
   * returns an Array LinkValue.
   **/
  function mergeLinkValues(target,source,rel) {
    if (source === undefined || source === undefined)
      return target;
    var ret = [].concat(target);
    source = is_array(source) ? source : [source];
    each(source, function() {
      var type = +source.__type__;
      if (type < 3)
        ret.push(source);
      else if (type == 3)
        ret = ret.concat(source);
      }
    );
    defineProperty(ret,'__type__',hidden(3));
    defineProperty(ret,'__rel__',hidden(rel));
    freeze(ret);

    return ret;
  }
  
  /**
   * Defines Own Properties on "to" based on Own Property Descriptors
   * provided by "from". An internal __model__ property on "to" is 
   * used to track the full current set of properties defined on "to"
   **/
  function defineAllProperties(to, from) {
    to.__model__ = to.__model__ || from;
    each(from, function(m,n) {
      try {
        if (to.__model__ !== from)
          to.__model__[n] = m;
        defineProperty(to,n,m);
      } catch (t) {}
    });
  }
  
  /**
   * <p>A Model is an object with zero or more OwnPropertyDescriptors. They are
   * used to dynamically define the properties of the various Activity Stream 
   * objects. This allows us to easily mutate the properties of things like
   * ActivityObject, Activity, Collection, etc based on properties such as 
   * objectType, extensions, etc. </p>
   *
   * <p>Model objects cannot be created directly. Rather, they are generated
   * by extending existing models provided by the asms.Models namespace</p>
   *
   * @example
   *   var mymodel = asms.Models.Base.extend().property('foo')
   *
   * @memberOf asms
   * @constructor
   * @param {Dictionary} [a] - The model definition )
   * @abstract
   **/
  function Model(a) {
    if (this instanceof Model) {
      // if a is an object, assume it's another model (or set of property descriptors)
      // and initialize this new model by copying those property descriptors to here
      if (typeof a === 'object' && !is_array(a))
        ext(this,a);
    } else return new Model(a);
  }

  Model.prototype = {
    /** 
     * Extend this model with a, return the new Model 
     * @public
     * @instance
     * @param {Object} [a] The extended model definition 
     * @returns {asms.Model} A new asms.Model object based on this one
     * @memberOf asms.Model
     **/
    extend: function(a) {
      return ext(Object.create(this),a||{});
    },
    /** 
     * Add a new hidden (non-enumerable) property to the model 
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {Any} [value] The value of the property
     * @param {boolean} [fisget] True if the value specified is a getter function
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    hidden: function(name,value,fisget) {
      this[name] = hidden(value,fisget);
      return this;
    },
    /** 
     * Add a new property descriptor to this model
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {function} [accessor]
     * @param {string} [key] The alternative accessor key name
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    property: function(name,accessor,key) {
      this[key||name] = M.property(accessor||name);
      return this;
    },
    /** 
     * Add a new link property descriptor to this model 
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {string} [key] The alternative accessor key name
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    link : function(name,key) {
      this[key||name] = M.link(name);
      return this;
    },
    /** 
     * Add a new bound number property descriptor to this model 
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {number} low The lower-end bound (inclusive)
     * @param {number} high The higher-end bound (inclusive)
     * @param {number} [defaultValue] A default value
     * @param {number} [fixed] The number of fixed decimal places to include (if any)
     * @param {string} [key] The alternative accessor key name
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    boundNumber : function(name,low,high,defaultValue,fixed,key) {
      this[key||name] = M.boundNumber(name,low,high,defaultValue,fixed);
      return this;
    },
    /** 
     * Add a new number property descriptor to this model 
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {number} [fixed] The number of fixed decimal places to include (if any)
     * @param {string} [key] The alternative accessor key name
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    number : function(name,fixed,key) {
      this[key||name] = M.number(name,fixed);
      return this;
    },
    /** 
     * Add a new non-negative number property descriptor to this model 
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {string} [key] The alternative accessor key name
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    nonNegativeNumber: function(name,key) {
      this[key||name] = M.nonNegativeNumber(name);
      return this;
    },
    /** 
     * Add a new natural language value property descriptor to this model 
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {string} [key] The alternative accessor key name
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    nlv : function(name,key) {
      this[key||name] = M.nlv(name);
      return this;
    },
    /** 
     * Add a new typevalue property descriptor to this model 
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {boolean} [ignoreUndefined] True if the property should return an anonymous TypeValue if the underlying property is undefined
     * @param {string} [key] The alternative accessor key name
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    type : function(name,ignoreUndefined,key) {
      this[key||name] = M.type(name,ignoreUndefined);
      return this;
    },
    /** 
     * Add a new collection property descriptor to this model 
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {string} [key] The alternative accessor key name
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    collection : function(name,key) {
      this[key||name] = M.collection(name);
      return this;
    },
    /** 
     * Add a new date-time property descriptor to this model 
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {string} [key] The alternative accessor key name
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    dateTime : function(name,key) {
      this[key||name] = M.dateTime(name);
      return this;
    },
    /** 
     * Add a new boolean property descriptor to this model 
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {string} [key] The alternative accessor key name
     * @param {boolean} [defaultValue]
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    bool : function(name,key,defaultValue) {
      this[key||name] = M.boolean(name,defaultValue);
      return this;
    },
    /** 
     * Add a new parameters value property descriptor to this model 
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {string} [key] The alternative accessor key name
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    parameters : function(name,key) {
      this[key||name] = M.parameters(name);
      return this;
    },
    /** 
     * Add a new generic object property descriptor to this model (the model argument defines the model for the object) 
     * @public
     * @instance
     * @param {string} name The name of the property
     * @param {asms.Model} [model] The model to use for the object
     * @param {string} [key] The alternative accessor key name
     * @returns {asms.Model} This Model instance so that calls can be chained
     * @memberOf asms.Model
     **/
    genericObject : function(name,model,key) {
      this[key||name] = M.genericObject(name,model);
      return this;
    },
    toString : function() {
      var desc = [];
      for (var p in this) {
        if (this[p] !== Model.prototype[p] &&
            typeof[p] !== 'function' &&
            this[p].enumerable) {
          desc.push(p);
        }
      }
      return 'Model: ' + desc.join(', ');
    }
  };
  freeze(Model.prototype);
  
  function _def_linkval(ret,n,item,_t,name) {
    defineProperty(ret,n,{
      get: function() {
        return linkValue(item,_t,name);
      }
    });
  }

  /**
   * Our collection of Models... think of these like Object.prototypes
   * that can be applied after an object is created, allows us to 
   * have dynamic, pseudo multiple inheritance
   **/
  var M = {
    property : function(accessor) {
      if (typeof accessor !== 'function') {
        var name = accessor;
        accessor = function() {
          return this.__wrapped__[name];
        };
      }
      return {
        enumerable: true,
        configurable: false,
        get: accessor
      };
    },
    boolean : function(name,defaultValue) {
      return M.property(
        function() {
          if (typeof this.__wrapped__ === 'object') {
            if (name in this.__wrapped__)
              return Boolean(this.__wrapped__[name]);
          }
          return typeof defaultValue == 'boolean' ?
            defaultValue : false;
        }
      );
    },
    link : function(name) {
      return M.property(
        function() {
          return AS.Transforms.toLink(
            this.__wrapped__[name],
            this,
            name);
      });
    },
    boundNumber : function(name,low,high,defaultValue,fixed) {
      checkTypeIsNumber(defaultValue,low,high);
      return M.property(
        function() {
          var ret = this.__wrapped__[name] || defaultValue;
          checkTypeIsNumber(ret);
          if (ret !== undefined && ret !== null) {
            ret = bounded(ret,high,low);
            if (fixed !== undefined && ret.toFixed)
              ret = ret.toFixed(fixed);
          }
          return ret;
        });
    },
    nonNegativeNumber : function(name) {
      return M.property(
        function() {
          var ret = this.__wrapped__[name];
          if (ret !== undefined && ret !== null) {
            checkTypeIsNumber(ret);
            ret = Math.max(0,ret);
          }
          return ret;
        });
    },
    number: function(name,fixed) {
      return M.property(
        function() {
          var ret = this.__wrapped__[name];
          if (ret !== undefined && ret !== null) {
            checkTypeIsNumber(ret);
            ret = fixed !== undefined && ret.toFixed ?
              ret.toFixed(fixed) : ret;
          }
          return ret;
        }
      );
    },
    nlv : function(name) {
      return M.property(
        function() {
          return naturalLanguageValue(
            this.__wrapped__[name],
            this);
        }
      );
    },
    type : function(name,ignoreUndefined) {
      return M.property(
        function() {
          return typeValue(
            this.__wrapped__[name],
            this,
            undefined,
            ignoreUndefined
          );
        }
      );
    },
    collection : function(name) {
      return M.property(
        function() {
          return activityObject(
            this.__wrapped__[name],
            this,
            M.Collection);
        }
      );
    },
    dateTime : function(name) {
      return M.property(
        function() {
          var ret = this.__wrapped__[name];
          if (name !== undefined && name !== null)
            ret = AS.Transforms.toDateTime(
              this.__wrapped__[name]);
          return ret;
        }
      );
    },
    parameters : function(name) {
      return M.property(
        function() {
          function defprop(ret,n,val,context) {
            defineProperty(ret,n,{
              enumerable: true,
              configurable: false,
              get: function() {
                return typeValue(val,context);
              }
            });
          }
          var ret = this.__wrapped__[name];
          if (ret === undefined || ret === null)
            return undefined;
          checkType(ret, ['object']);
          checkNotArray(ret);
          if (!ret.__wrapped__) {
            for (var n in ret)
              defprop(ret,n,ret[n],this);
            defineProperty(ret,'__wrapped__',hidden(true));
          }
          return ret;
        }
      );
    },
    genericObject : function(name,model) {
      return M.property(
        function() {
          return activityObject(
            this.__wrapped__[name],
            this,
            model);
        }
      );
    }
  };
  
  /**
   * Create an OwnPropertyDescriptor describing a hidden (non-enumerable, non-configurable)
   * property. If the value argument is undefined, the property is marked non-writable 
   * (assumes that the value for the property has already been set). If fisget is true,
   * value is assumed to be a getter function.
   **/
  function hidden(value,fisget) {
    var ret = {
      enumerable: true,
      configurable: false
    };
    if (value === undefined)
      ret.writable = false;
    else if (!fisget)
      ret.value = value;
    else if (fisget)
      ret.get = value;
    return ret;
  }

  /**
   * The Base Model for all Activity Stream objects
   * @kind class
   * @name asms.Models.Base
   * @memberOf asms.Models
   * @abstract
   */
  M.Base = new Model({
    /** 
     * the hidden() properties are non-enumerable, immutable properties
     * used internally. The __wrapped__ property is the vanilla js object
     * being wrapped by the Activity Stream object. While the __wrapped__
     * property itself cannot be changed, the properties of the __wrapped__
     * object can be mutated. 
     * @instance
     * @memberOf asms.Models.Base
     * @type {object}
     * @public
     **/
    __wrapped__: hidden(),
    /** 
     * the __context__ property is the parent Activity Stream object for
     * this object... it is used, primarily, for inheritance of the language
     * context 
     * @private
     * @memberOf asms.Models.Base
     * @instance
     **/
    __context__ : hidden(),
    /** 
     * @instance
     * @memberOf asms.Models.Base
     * @private 
     **/
    __model__ : hidden(),
    /** 
     * return this object re-projected as an Activity object 
     * @instance
     * @memberOf asms.Models.Base
     * @type {asms.Activity}
     * @public
     **/
    __asActivity : hidden(function() {
      return activityObject(
        this.__wrapped__,
        this.__context__,
        M.Activity,
        this.__model__);
    },true),
    /** 
     * return this object re-projected as an ActivityCollection object 
     * @instance
     * @memberOf asms.Models.Base
     * @type {asms.Collection}
     * @public
     **/
    __asCollection : hidden(function() {
      return activityObject(
        this.__wrapped__,
        this.__context__,
        M.Collection,
        this.__model__
      );
    },true),
    /** 
     * return this object re-projected as an ActivityObject object 
     * @instance
     * @memberOf asms.Models.Base
     * @type {asms.Object}
     * @public
     **/
    __asObject : hidden(function() {
      return activityObject(
          this.__wrapped__,
          this.__context__,
          this.__model__
        );
    },true),
    /** 
     * Return a new instance of this object extended using the specified model 
     * @instance
     * @memberOf asms.Models.Base
     * @param {object} [model] The extended model definition
     * @returns {asms.Object|asms.Collection|asms.Activity}
     * @kind function
     * @public
     **/
    extended : hidden(function() {
      var _this = this;
      return function(model) {
          if (_this.__rel__ !== undefined)
            return linkValue(
              _this.__wrapped__,
              _this.__context__,
              _this.__rel__,
              model);
          else {
            return new (Object.getPrototypeOf(_this)).constructor(
              _this.__wrapped__,
              _this.__context__,
              model);
          }
        };
    },true),
    /** 
     * Get properties on __wrapped__ that are not defined on the Model.
     * If transform is provided and is a function, it is used to transform
     * the result before returning. If transform is provided and is not 
     * a function, it is used as the default if the property is undefined. 
     * @instance
     * @memberOf asms.Models.Base
     * @param {object} key The property to return
     * @param {function} [transform] A transform function
     * @returns {any}
     * @kind function
     * @public
     **/
    get: hidden(function() {
      var __wrapped__ = this.__wrapped__;
      return function(key,transform) {
        // transform can either be a default value or a transform function
        var ret = __wrapped__[key];
        if (transform !== undefined) {
          if (typeof transform == 'function') {
            if (ret !== undefined)
              ret = transform(ret,this,key);
          } else if (ret === undefined || ret === null)
            ret = transform;
        }
        return ret;
      };
    },true),
    /** 
     * Returns true if the named property exists on __wrapped__ 
     * @instance
     * @memberOf asms.Models.Base
     * @param {string} key The property to check
     * @returns {boolean} if the property exists
     * @kind function
     * @public
     **/
    has : hidden(function() {
      var __wrapped__ = this.__wrapped__;
      return function(key) {
        return key in __wrapped__;
      };
    },true),
    /** 
     * Turns this into a JSON string 
     * @instance
     * @memberOf asms.Models.Base
     * @returns {string}
     * @kind function
     * @private
     **/
    toJson: hidden(function() {
      return function() {
        return JSON.stringify(this.__wrapped__);
      };
    },true)
  });

  /**
   * @kind class
   * @name asms.Models.TypeValue
   * @memberOf asms.Models
   * @augments asms.Models.Base
   * @abstract
   */
  M.TypeValue = M.Base.extend().
    /** 
     * The TypeValue instance type. One of "string" or "object"
     * @name __type__
     * @memberOf asms.Models.TypeValue
     * @instance
     * @type {string}
     * @public
     **/
    hidden('__type__').
    /**
     * True if this is an __anonymous__ type
     * @name __anonymous__
     * @memberOf asms.Models.TypeValue
     * @instance
     * @type {boolean}
     * @public
     **/
    hidden('__anonymous__', function() {return !this.id;}, true);

  /**
   * @kind class
   * @name asms.Models.SimpleTypeValue
   * @memberOf asms.Models
   * @augments asms.Models.TypeValue
   * @abstract
   */
  M.SimpleTypeValue =
    M.TypeValue.extend()
      /**
       * Returns the id of this TypeValue
       * @name id
       * @memberOf asms.Models.SimpleTypeValue
       * @instance
       * @type {string}
       * @public
       **/
      .property('id', function() { return this.__wrapped__; });

  /**
   * @kind class
   * @name asms.Models.Object
   * @memberOf asms.Models
   * @augments asms.Models.Base 
   * @abstract
   **/
  M.Object = M.Base.extend().
    /**
     * Returns the ID of this object
     * @name id
     * @memberOf asms.Models.Object
     * @instance
     * @type {string}
     * @public
     **/
    property('id', function() {
      return this.__wrapped__.id || this.__wrapped__['@id'];
    }).
    /**
     * Returns the objectType of this object
     * @name objectType
     * @memberOf asms.Models.Object
     * @instance
     * @type {TypeValue}
     * @public
     **/
    property('objectType', function() {
      var type = this.__wrapped__.objectType || this.__wrapped__['@type'];
      return typeValue(type,this,undefined,true);
    }).
    /**
     * Returns the @type of this object
     * @name @type
     * @memberOf asms.Models.Object
     * @instance
     * @type {asms.Models.TypeValue}
     * @public
     **/
    property('@type', function() {
      return this.__wrapped__['@type'] || this.objectType;
    }).
    /**
     * Returns the ID of this object
     * @name @id
     * @memberOf asms.Models.Object
     * @instance
     * @type {string}
     * @public
     **/
    property('@id', function() {
      return this.__wrapped__['@id'] || this.id;
    }).
    /**
     * Returns the language of this object
     * @name @language
     * @memberOf asms.Models.Object
     * @instance
     * @type {string}
     * @public
     **/
    property('@language', function() {
      return this.__wrapped__['@language'] || this.language;
    }).
    /**
     * Returns the @value of this object
     * @name @value
     * @memberOf asms.Models.Object
     * @instance
     * @type {any}
     * @public
     **/
    property('@value').
    /**
     * Returns the @context of this object
     * @name @context
     * @memberOf asms.Models.Object
     * @instance
     * @type {any}
     * @public
     **/
    property('@context').
    /**
     * Returns the language of this object
     * @name language
     * @memberOf asms.Models.Object
     * @instance
     * @type {string}
     * @public
     **/
    property('language', function() {
      var lang = this.__wrapped__.language || this.__wrapped__['@language'];
      return lang ||
        (this.__context__  ?
          this.__context__.language :
            defaultLanguage) || 'en';
    }).
    /**
     * Returns the link relation of this object
     * @name rel
     * @memberOf asms.Models.Object
     * @instance
     * @type {string}
     * @public
     **/
    property('rel', function() {
      return this.__wrapped__.rel || this.__rel__;
    }).
    /**
     * Returns the MIME media type of this object
     * @name mediaType
     * @memberOf asms.Models.Object
     * @instance
     * @type {string}
     * @public
     **/
    property('mediaType').
    /**
     * Returns the alias of this object
     * @name alias
     * @memberOf asms.Models.Object
     * @instance
     * @type {string}
     * @public
     **/
    property('alias').
    /**
     * Returns the collection of duplicates for this object
     * @name duplicates
     * @memberOf asms.Models.Object
     * @instance
     * @type {object}
     * @public
     **/
    property('duplicates', function() {
      var ret;
      if ('duplicates' in this.__wrapped__)
        ret = linkValue(this.__wrapped__.duplicates,this);
      else ret = AS.Transforms.toLink([]);
      ret = mergeLinkValues(
        ret,
        [this.downstreamDuplicates,
         this.upstreamDuplicates],
        'duplicates');
      return ret;
    }).
    /**
     * Returns the displayName for this object
     * @name displayName
     * @memberOf asms.Models.Object
     * @instance
     * @type {NaturalLanguageValue}
     * @public
     **/
    nlv('displayName').
    /**
     * Returns the summary for this object
     * @name summary
     * @memberOf asms.Models.Object
     * @instance
     * @type {NaturalLanguageValue}
     * @public
     **/
    nlv('summary').
    /**
     * Returns the title for this object
     * @name title
     * @memberOf asms.Models.Object
     * @instance
     * @type {NaturalLanguageValue}
     * @public
     **/
    nlv('title').
    /**
     * Returns the content for this object
     * @name content
     * @memberOf asms.Models.Object
     * @instance
     * @type {NaturalLanguageValue}
     * @public
     **/
    nlv('content').
    /**
     * Return the url for this object
     * @name url
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('url').
    /**
     * Return the attachments for this object
     * @name attachments
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('attachments').
    /**
     * Return the author for this object
     * @name author
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('author').
    /**
     * Return the downstreamDuplicates for this object
     * @deprecated
     * @name downstreamDuplicates
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('downstreamDuplicates').
    /**
     * Return the upstreamDuplicates for this object
     * @deprecated
     * @name upstreamDuplicates
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('upstreamDuplicates').
    /**
     * Return the icon for this object
     * @name icon
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('icon').
    /**
     * Return the image for this object
     * @name image
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('image').
    /**
     * Return the location for this object
     * @name location
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('location').
    /**
     * Return the generator for this object
     * @name generator
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('generator').
    /**
     * Return the provider for this object
     * @name provider
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('provider').
    /**
     * Return the tags for this object
     * @name tags
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('tags').
    /**
     * Return the inReplyTo for this object
     * @name inReplyTo
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('inReplyTo').
    /**
     * Return the scope for this object
     * @name scope
     * @memberOf asms.Models.Object
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('scope').
    /**
     * Return the published timestamp for this object
     * @name published
     * @memberOf asms.Models.Object
     * @instance
     * @type {Date}
     * @public
     **/
    dateTime('published').
    /**
     * Return the updated timestamp for this object
     * @name updated
     * @memberOf asms.Models.Object
     * @instance
     * @type {Date}
     * @public
     **/
    dateTime('updated').
    /**
     * Return the startTime timestamp for this object
     * @name startTime
     * @memberOf asms.Models.Object
     * @instance
     * @type {Date}
     * @public
     **/
    dateTime('startTime').
    /**
     * Return the endTime timestamp for this object
     * @name endTime
     * @memberOf asms.Models.Object
     * @instance
     * @type {Date}
     * @public
     **/
    dateTime('endTime').
    /**
     * Return the rating for this object ( 0 >= rating <= 5 )
     * @name rating
     * @memberOf asms.Models.Object
     * @instance
     * @type {number}
     * @public
     **/
    boundNumber('rating',0.0,5.0,0.0).
    /**
     * Return the duration for this object 
     * @name duration
     * @memberOf asms.Models.Object
     * @instance
     * @type {number|string}
     * @public
     **/
    property('duration').
    /**
     * Return the display height of this object
     * @name height
     * @memberOf asms.Models.Object
     * @instance
     * @type {number}
     * @public
     **/
    nonNegativeNumber('height').
    /**
     * Return the display width of this object
     * @name width
     * @memberOf asms.Models.Object
     * @instance
     * @type {number}
     * @public
     **/
    nonNegativeNumber('width').
    /**
     * Return the replies collection for this object
     * @name replies
     * @memberOf asms.Models.Object
     * @instance
     * @type {asms.Collection}
     * @public
     **/
    collection('replies').
    /**
     * Return the actions for this object
     * @name actions
     * @memberOf asms.Models.Object
     * @instance
     * @type {asms.Actions}
     * @public
     **/
    property('actions', function() {
      return actionsValue(
        this.__wrapped__.actions,this);
    }).
    hidden('isA', function(ot) {
      // This 'isA' method will return true if the objectType (or verb)
      // matches the given objectType id. If ot is an object, the code
      // checks to see if it has it's own objectType property. If 
      // ot.objectType is 'verb', then only the verb is checked, if
      // ot.objectType is 'objectType', then only the objectType is 
      // checked. ot can be a string, a regular javascript object, or
      // a wrapped Activity Stream object.
      function check(a,b) {
        for (var n in b)
          if (b[n] !== undefined && b[n].id == a)
            return true;
        return false;
      }
      function allanon(a) {
        for (var n in a)
          if (a[n] !== undefined && !a[n].__anonymous__)
            return false;
        return true;
      }
      switch(typeof ot) {
        case 'string':
          return check(ot, [this.objectType, this.verb]);
        case 'object':
          if (ot.objectType !== undefined) {
            switch(ot.objectType.id || ot.objectType) {
              case 'verb':
                return check(ot.id,[this.verb]);
              case 'objectType':
                return check(ot.id,[this.objectType]);
            }
          } else if (ot.id !== undefined) {
            return check(ot.id, [this.objectType,this.verb]);
          }
          break;
        case 'undefined':
          return allanon([this.objectType,this.verb]);
      }
      return false;
    });

  /**
   * @kind class
   * @name asms.Models.Activity
   * @memberOf asms.Models
   * @augments asms.Models.Object
   * @abstract
   **/
  M.Activity = M.Object.extend().
    /**
     * Returns the verb of this activity
     * @name verb
     * @memberOf asms.Models.Activity
     * @instance
     * @type {TypeValue}
     * @public
     **/
    type('verb',false).
    /**
     * Return the actor for this activity
     * @name actor
     * @memberOf asms.Models.Activity
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('actor').
    /**
     * Return the object for this activity
     * @name object
     * @memberOf asms.Models.Activity
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('object').
    /**
     * Return the target for this activity
     * @name target
     * @memberOf asms.Models.Activity
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('target').
    /**
     * Return the result for this activity
     * @name result
     * @memberOf asms.Models.Activity
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('result').
    /**
     * Return the instrument for this activity
     * @name instrument
     * @memberOf asms.Models.Activity
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('instrument').
    /**
     * Return the participant for this activity
     * @name participant
     * @memberOf asms.Models.Activity
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('participant').
    /**
     * Return the primary audience for this activity
     * @name to
     * @memberOf asms.Models.Activity
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('to').
    /**
     * Return the private primary audience for this activity
     * @name bto
     * @memberOf asms.Models.Activity
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('bto').
    /**
     * Return the secondary audience for this activity
     * @name cc
     * @memberOf asms.Models.Activity
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('cc').
    /**
     * Return the private secondary audience for this activity
     * @name bcc
     * @memberOf asms.Models.Activity
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('bcc').
    /**
     * @name from
     * @memberOf asms.Models.Activity
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('from').
    /**
     * @name bfrom
     * @memberOf asms.Models.Activity
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('bfrom').
    /**
     * The status of this activity. 
     * @name status
     * @memberOf asms.Models.Activity
     * @instance
     * @type {string}
     * @public
     **/
    property('status', function() {
      var status = this.__wrapped__.status;
      return status !== undefined &&
        AS.Constants.status.indexOf(status) > -1 ?
          status : 'other';
    }).
    /**
     * The priority of this activity
     * @name priority
     * @memberOf asms.Models.Activity
     * @instance
     * @type {number}
     * @public
     **/
    boundNumber('priority',0.0,1.0,0.0);

  /**
   * @kind class
   * @name asms.Models.LinkValue
   * @memberOf asms.Models
   * @augments asms.Models.Base
   * @abstract
   **/
  M.LinkValue = M.Base.extend().
    /**
     * The type of link value (one of "string", "object", "array")
     * @name __type__
     * @memberOf asms.Models.LinkValue
     * @instance
     * @type {string}
     * @public
     **/
    hidden('__type__').
    hidden('__rel__');
  /**
   * @kind class
   * @name asms.Models.SimpleLinkValue
   * @memberOf asms.Models
   * @augments asms.Models.Base
   * @abstract
   */
  M.SimpleLinkValue = M.Base.extend().
    /**
     * The href of this link
     * @name href
     * @memberOf asms.Models.SimpleLinkValue
     * @instance
     * @type {string}
     * @public
     **/
    property('href', function() {return this.__wrapped__;}).
    /**
     * The link relation of this link
     * @name rel
     * @memberOf asms.Models.SimpleLinkValue
     * @instance
     * @type {string}
     * @public
     **/
    property('rel', function() {return this.__rel__;});

  /**
   * @kind class
   * @name asms.Models.Collection
   * @memberOf asms.Models
   * @augments asms.Models.Object
   * @abstract
   */
  M.Collection = M.Object.extend().
    /**
     * The total number of items in the logical collection
     * @name totalItems
     * @memberOf asms.Models.Collection
     * @instance
     * @type {number}
     * @public
     **/
    nonNegativeNumber('totalItems').
    /**
     * The items in this collection
     * @name items
     * @memberOf asms.Models.Collection
     * @instance
     * @type {Array<AS.Object|AS.Activity|AS.Collection>}
     * @public
     */
    property('items', function() {
      var ret = this.__wrapped__.items;
        if (ret !== undefined && ret !== null) {
          if (is_array(ret)) {
            var _this = this;
            ret = ret.map(
              function(i) {
                return activityObject(i,_this);
              }
            );
          } else throw invalidType();
        }
        return ret;
      }).
    /**
     * A date-time indicating that this collection only contains
     * items published or updated after the instant given
     * @name itemsAfter
     * @memberOf asms.Models.Collection
     * @instance
     * @type {date}
     * @public
     **/
    dateTime('itemsAfter').
    /**
     * A date-time indicating that this collection only contains
     * items published or updated before the instant given
     * @name itemsBefore
     * @memberOf asms.Models.Collection
     * @instance
     * @type {date}
     * @public
     **/
    dateTime('itemsBefore').
    /**
     * The total number of items in this collection page
     * @name itemsPerPage
     * @memberOf asms.Models.Collection
     * @instance
     * @type {number}
     * @public
     **/
    nonNegativeNumber('itemsPerPage').
    /**
     * @name startIndex
     * @memberOf asms.Models.Collection
     * @instance
     * @type {number}
     * @public
     **/
    nonNegativeNumber('startIndex').
    /**
     * @name first
     * @memberOf asms.Models.Collection
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('first').
    /**
     * @name last
     * @memberOf asms.Models.Collection
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('last').
    /**
     * @name prev
     * @memberOf asms.Models.Collection
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('prev').
    /**
     * @name next
     * @memberOf asms.Models.Collection
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('next').
    /**
     * @name current
     * @memberOf asms.Models.Collection
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('current').
    /**
     * @name self
     * @memberOf asms.Models.Collection
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('self');

  /**
   * @kind class
   * @name asms.Models.ActionHandler
   * @memberOf asms.Models
   * @augments asms.Models.Object
   * @abstract
   */
  M.ActionHandler = M.Object.extend().
    /**
     * @name context
     * @memberOf asms.Models.ActionHandler
     * @instance
     * @type {any}
     * @public
     **/
    property('context','context').
    /**
     * @name auth
     * @memberOf asms.Models.ActionHandler
     * @instance
     * @type {asms.Models.Authentication}
     * @public
     **/
    property('auth','auth').
    /**
     * @name confirm
     * @memberOf asms.Models.ActionHandler
     * @instance
     * @type {boolean}
     * @public
     **/
    bool('confirm').
    /**
     * @name expects
     * @memberOf asms.Models.ActionHandler
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('expects').
    /**
     * @name returns
     * @memberOf asms.Models.ActionHandler
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('returns').
    /**
     * @name requires
     * @memberOf asms.Models.ActionHandler
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('requires').
    /**
     * @name prefers
     * @memberOf asms.Models.ActionHandler
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('prefers');

  /**
   * @kind class
   * @name asms.Models.HttpActionHandler
   * @memberOf asms.Models
   * @augments asms.Models.ActionHandler
   * @abstract
   */
  M.HttpActionHandler = M.ActionHandler.extend().
    /**
     * @name method
     * @memberOf asms.Models.HttpActionHandler
     * @instance
     * @type {string}
     * @public
     **/
    property('method').
    /**
     * @name target
     * @memberOf asms.Models.HttpActionHandler
     * @instance
     * @type {string}
     * @public
     **/
    property('target');

  /**
   * @kind class
   * @name asms.Models.EmbedActionHandler
   * @memberOf asms.Models
   * @augments asms.Models.ActionHandler
   * @abstract
   */
  M.EmbedActionHandler = M.ActionHandler.extend().
    /**
     * @name style
     * @memberOf asms.Models.EmbedActionHandler
     * @instance
     * @type {asms.Models.Style}
     * @public
     **/
    property('style').
    /**
     * @name target
     * @memberOf asms.Models.EmbedActionHandler
     * @instance
     * @type {string}
     * @public
     **/
    property('target').
    /**
     * @name preview
     * @memberOf asms.Models.EmbedActionHandler
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('preview');

  /**
   * @kind class
   * @name asms.Models.IntentActionHandler
   * @memberOf asms.Models
   * @augments asms.Models.ActionHandler
   * @abstract
   */
  M.IntentActionHandler = M.ActionHandler.extend();
  
  /**
   * @kind class
   * @name asms.Models.Parameter
   * @memberOf asms.Models
   * @augments asms.Models.Object
   * @abstract
   */
  M.Parameter = M.Object.extend().
    /**
     * @name required
     * @memberOf asms.Models.Parameter
     * @instance
     * @type {boolean}
     * @public
     **/
    bool('required',true).
    /**
     * @name repeated
     * @memberOf asms.Models.Parameter
     * @instance
     * @type {boolean}
     * @public
     **/
    bool('repeated',false).
    /**
     * @name value
     * @memberOf asms.Models.Parameter
     * @instance
     * @type {any}
     * @public
     **/
    property('value').
    /**
     * @name default
     * @memberOf asms.Models.Parameter
     * @instance
     * @type {any}
     * @public
     **/
    property('default').
    /**
     * @name enum
     * @memberOf asms.Models.Parameter
     * @instance
     * @type {array}
     * @public
     **/
    property('enum').
    /**
     * @name maximum
     * @memberOf asms.Models.Parameter
     * @instance
     * @type {any}
     * @public
     **/
    property('maximum').
    /**
     * @name minimum
     * @memberOf asms.Models.Parameter
     * @instance
     * @type {any}
     * @public
     **/
    property('minumum').
    /**
     * @name format
     * @memberOf asms.Models.Parameter
     * @instance
     * @type {string}
     * @public
     **/
    property('format').
    /**
     * @name pattern
     * @memberOf asms.Models.Parameter
     * @instance
     * @type {any}
     * @public
     **/
    property('pattern').
    /**
     * @name step
     * @memberOf asms.Models.Parameter
     * @instance
     * @type {number}
     * @public
     **/
    nonNegativeNumber('step').
    /**
     * @name placeholder
     * @memberOf asms.Models.Parameter
     * @instance
     * @type {NaturalLanguageValue}
     * @public
     **/
    nlv('placeholder');

  /**
   * @kind class
   * @name asms.Models.UrlTemplate
   * @memberOf asms.Models
   * @augments asms.Models.Object
   * @abstract
   */
  M.UrlTemplate = M.Object.extend().
    /**
     * @name template
     * @memberOf asms.Models.UrlTemplate
     * @instance
     * @type {string}
     * @public
     **/
    property('template').
    /**
     * @name parameters
     * @memberOf asms.Models.UrlTemplate
     * @instance
     * @type {asms.Models.Parameters}
     * @public
     **/
    parameters('parameters','params');

  /**
   * @kind class
   * @name asms.Models.TypedPayload
   * @memberOf asms.Models
   * @augments asms.Models.Object
   * @abstract
   */
  M.TypedPayload = M.Object.extend().
    /**
     * @name semanticType
     * @memberOf asms.Models.TypedPayload
     * @instance
     * @type {string}
     * @public
     */
    type('type',false,'semanticType').
    /**
     * @name schema
     * @memberOf asms.Models.TypedPayload
     * @instance
     * @type {LinkValue}
     * @public
     **/
    link('schema');

  /**
   * @kind class
   * @name asms.Models.HtmlForm
   * @memberOf asms.Models
   * @augments asms.Models.Object
   * @abstract
   */
  M.HtmlForm = M.Object.extend().
    parameters('parameters','params');

  /**
   * @namespace Models.Ext
   * @memberOf asme.Models
   **/
  M.Ext = {};

  /**
   * @kind class
   * @name asms.Models.Ext.Replies
   * @memberOf asms.Models.Ext
   * @abstract
   * @mixin
   */
  M.Ext.Replies = new Model({}).
    /**
     * @name attending
     * @memberOf asms.Models.Ext.Replies
     * @instance
     * @public
     * @type {asms.Collection}
     **/
    collection('attending').
    /**
     * @name followers
     * @memberOf asms.Models.Ext.Replies
     * @instance
     * @public
     * @type {asms.Collection}
     **/
    collection('followers').
    /**
     * @name following
     * @memberOf asms.Models.Ext.Replies
     * @instance
     * @public
     * @type {asms.Collection}
     **/
    collection('following').
    /**
     * @name friends
     * @memberOf asms.Models.Ext.Replies
     * @instance
     * @public
     * @type {asms.Collection}
     **/
    collection('friends').
    /**
     * @name friendRequests
     * @memberOf asms.Models.Ext.Replies
     * @instance
     * @public
     * @type {asms.Collection}
     **/
    collection('friend-requests', 'friendRequests').
    /**
     * @name likes
     * @memberOf asms.Models.Ext.Replies
     * @instance
     * @public
     * @type {asms.Collection}
     **/
    collection('likes').
    /**
     * @name notAttending
     * @memberOf asms.Models.Ext.Replies
     * @instance
     * @public
     * @type {asms.Collection}
     **/
    collection('notAttending').
    /**
     * @name maybeAttending
     * @memberOf asms.Models.Ext.Replies
     * @instance
     * @public
     * @type {asms.Collection}
     **/
    collection('maybeAttending').
    /**
     * @name members
     * @memberOf asms.Models.Ext.Replies
     * @instance
     * @public
     * @type {asms.Collection}
     **/
    collection('reviews').
    /**
     * @name attending
     * @memberOf asms.Models.Ext.Replies
     * @instance
     * @public
     * @type {asms.Collection}
     **/
    collection('saves').
    /**
     * @name attending
     * @memberOf asms.Models.Ext.Replies
     * @instance
     * @public
     * @type {asms.Collection}
     **/
    collection('saves').
    /**
     * @name shares
     * @memberOf asms.Models.Ext.Replies
     * @instance
     * @public
     * @type {asms.Collection}
     **/
    collection('shares');
  /**
   * @kind class
   * @name asms.Models.Ext.Position
   * @memberOf asms.Models.Ext
   * @augments asms.Models.Base
   * @abstract
   */
  M.Ext.Position = M.Base.extend().
    /**
     * @name altitude
     * @memberOf asms.Models.Ext.Position
     * @instance
     * @public
     * @type {number}
     **/
    number('altitude',2).
    /**
     * @name latitude
     * @memberOf asms.Models.Ext.Position
     * @instance
     * @public
     * @type {number}
     **/
    boundNumber('latitude',-90.00,90.00,undefined,2).
    /**
     * @name longitude
     * @memberOf asms.Models.Ext.Position
     * @instance
     * @public
     * @type {number}
     **/
    boundNumber('longitude',-180.00,180.00,undefined,2);
  /**
   * @kind class
   * @name asms.Models.Ext.Address
   * @memberOf asms.Models.Ext
   * @augments asms.Models.Base
   * @abstract
   */
  M.Ext.Address = M.Base.extend().
    /**
     * @name formated
     * @memberOf asms.Models.Ext.Address
     * @instance
     * @public
     * @type {string}
     **/
    property('formated').
    /**
     * @name streetAddress
     * @memberOf asms.Models.Ext.Address
     * @instance
     * @public
     * @type {string}
     **/
    property('streetAddress').
    /**
     * @name locality
     * @memberOf asms.Models.Ext.Address
     * @instance
     * @public
     * @type {string}
     **/
    property('locality').
    /**
     * @name region
     * @memberOf asms.Models.Ext.Address
     * @instance
     * @public
     * @type {string}
     **/
    property('region').
    /**
     * @name postalCode
     * @memberOf asms.Models.Ext.Address
     * @instance
     * @public
     * @type {string}
     **/
    property('postalCode').
    /**
     * @name country
     * @memberOf asms.Models.Ext.Address
     * @instance
     * @public
     * @type {string}
     **/
    property('country');
  /**
   * @kind class
   * @name asms.Models.Ext.Place
   * @memberOf asms.Models.Ext
   * @augments asms.Models.Base
   * @abstract
   */
  M.Ext.Place = M.Base.extend().
    /**
     * @name position
     * @memberOf asms.Models.Ext.Place
     * @instance
     * @public
     * @type {asms.Models.Ext.Position}
     **/
    genericObject('position',M.Ext.Position).
    /**
     * @name address
     * @memberOf asms.Models.Ext.Place
     * @instance
     * @public
     * @type {asms.Models.Ext.Address}
     **/
    genericObject('address',M.Ext.Address);
  /**
   * @kind class
   * @name asms.Models.Ext.Mood
   * @memberOf asms.Models.Ext
   * @augments asms.Models.Base
   * @abstract
   */
  M.Ext.Mood = M.Base.extend().
    /**
     * @name mood
     * @memberOf asms.Models.Ext.Mood
     * @instance
     * @public
     * @type {TypeValue}
     **/
    type('mood',false);
  
  // the objects...
  
  function checkNotArray(obj) {
    if (is_array(obj))
      throw invalidType();
    return obj;
  }
  
  function defmodel(_t,model,extmodel,ignoreObjectType) {
    defineAllProperties(_t,model);
    if(!ignoreObjectType && _t.objectType !== undefined) {
      if (_t.objectType.id in M.forObjectType) {
        var otmodel = M.forObjectType[_t.objectType.id];
        if (otmodel !== model &&
            otmodel !== extmodel)
          defineAllProperties(_t,otmodel);
      }
    }
    if(extmodel !== undefined)
      defineAllProperties(_t,extmodel);
  }
  
  function def_actions(actions,n,val,context) {
    defineProperty(actions,n,{
      enumerable: true,
      configurable: false,
      get: function() {
        return AS.Transforms.toLink(val,context,n, M.ActionHandler);
      }
    });
  }

  /**
   * @kind class
   * @name asms.Models.Actions
   * @memberOf asms.Models
   */
  /**
   * @name [any]
   * @memberOf asms.Models.Actions
   * @instance
   * @type {LinkValue}
   **/
  function actionsValue(actions, context) {
    if (actions === undefined || actions === null) return undefined;
    checkNotArray(actions);
    if (actions.__wrapped__ === undefined) {
      for (var n in actions) {
        var val = actions[n];
        def_actions(actions,n,val,context);
      }
      defineProperty(actions,'__wrapped__',
        hidden(true));
    }
    return actions;
  }

  /**
   * @kind class
   * @name asms.Models.NaturalLanguageValue
   * @memberOf asms.Models
   */
  /**
   * @name [language tag]
   * @memberOf asms.Models.NaturalLanguageValue
   * @instance
   * @type {string}
   **/
  function naturalLanguageValue(nlv, context) {
    if (nlv === undefined || nlv === null) return undefined;
    if (!nlv.__wrapped__) {
      var ret;
      var deflang = context.language || defaultLanguage  || 'en';
      if (deflang.indexOf('*') != -1)
        throw new Error('Default language context cannot be a wildcard');
      switch(typeof nlv) {
        case 'string':
          ret = {};
          ret[deflang] = nlv;
          break;
        case 'object':
          ret = nlv;
          break;
        default:
          throw invalidType();
      }
      defineProperty(ret, '__wrapped__', hidden(true));
      defineProperty(ret, '*', hidden(
        function() { 
          return ret[deflang]; 
        }, true));
      defineProperty(ret, 'toJson', hidden(
        function() {
          return ret[deflang];
        }, false
      ));
      return ret;
    } else return nlv;
  }
   
  function linkValue(lv, context, rel, extmodel) {
    checkType(lv,['string','object']);
    if (lv.__wrapped__)
      return lv;
    var ret = {
      __wrapped__: lv,
      __context__: context,
      __rel__: rel
    };
    var model = M.SimpleLinkValue;
    switch(typeof lv) {
    case 'string':
      model = M.SimpleLinkValue;
      ret.__type__ = AS.Constants.__simple__;
      break;
    case 'object':
      checkNotArray(lv);
      model = M.Object;
      ret.__type__ = AS.Constants.__object__;
      break;
    default:
      throw invalidType();
    }
    defmodel(ret,model,extmodel);
    freeze(ret);
    return ret;
  }
  
  function typeValue(tv, context, extmodel, ignoreUndefined) {
    if (!ignoreUndefined && (tv === undefined || tv === null))
      return undefined;
    if (tv && tv.__wrapped__)
      return tv;
    checkType(tv,['string','object']);
    checkNotArray(tv);
    if (typeof tv === 'string')
      tv = AS.typeValueResolver(tv);
    var ret = {
      __wrapped__ : tv,
      __context__ : context
    };
    var model = M.SimpleTypeValue;
    switch(typeof tv) {
    case 'object':
      ret.__type__ = AS.Constants.__object__;
      model = M.Object;
      break;
    case 'string':
      ret.__type__ = AS.Constants.__simple__;
      break;
    case 'undefined':
      ret.__type__ = AS.Constants.__anonymous__;
      break;
    default:
      throw invalidType();
    }
    defmodel(ret,model,extmodel);
    freeze(ret);
    return ret;
  }

  function activityObject(inner,context,model,extmodel) {
    if (inner === undefined || inner === null)
      return undefined;
    if (inner.__wrapped__)
      return inner;
    checkType(inner,'object');
    checkNotArray(inner);
    model = model || M.Object;
    var ret = {
      __wrapped__: inner,
      __context__: context
    };
    defmodel(ret,model,extmodel);
    freeze(ret);
    return ret;
  }
  
  /**
   * Maps objectType identifiers to asms.Model instances
   * @name forObjectType
   * @memberOf asms.Models
   * @member
   * @type {object}
   **/
  M.forObjectType = {
    activity: M.Activity,
    collection: M.Collection,
    verb: M.Object,
    objectType: M.Object,
    HttpActionHandler: M.HttpActionHandler,
    EmbedActionHandler: M.EmbedActionHandler,
    IntentActionHandler: M.IntentActionHandler,
    HtmlForm: M.HtmlForm,
    UrlTemplate: M.UrlTemplate,
    typedPayload: M.TypedPayload,
    parameter: M.Parameter,
    place: M.Ext.Place,
    address: M.Ext.Address,
    position: M.Ext.Position,
    mood: M.Ext.Mood
  };
  
  /**
   * The typevalue resolver allows a developer to swap in their own
   * TypeValue's when a simple (string) type value is encountered. 
   * This is useful when dealing with extension objecttypes and verbs.
   * For instance, a developer may want to provide a library of
   * extension verb or objectType definitions and make it so that
   * those can be handled transparently
   **/
  function defaultTypeValueResolver(ot) {
    return ot;
  }

  var __tvResolver =
    defaultTypeValueResolver;

  var AS = {
    /** 
     * Returns the currently configured TypeValue Resolver function.
     * @example
     *   var func = asms.typeValueResolver;
     *   var tv = func('http://simple/type/value/identifier');
     * @memberOf asms 
     * @type {Function}
     **/
    get typeValueResolver() {
      return function(id) {
        try {
          // if the resolver returns undefined, return the original id
          var ret = __tvResolver(id) || id;
          checkType(ret,['object','string']);
          return ret;
        } catch (t) {
          return id;
        }
      };
    },
    /** 
     * Sets the configured TypeValue Resolver function.
     * @example
     *   asms.typeValueResolver = function(id) {
     *     return id in library ? library[id] : id;
     *   }
     * @memberOf asms 
     * @type {Function}
     **/
    set typeValueResolver(ot) {
      if (typeof ot !== 'function')
        return;
      __tvResolver = ot;
    },
    /** 
     * Utility method that generates a JSON dictionary mapping 
     * simple TypeValue identifiers to object TypeValue 
     * equivalents based on the contents of the passed in Activity
     * Streams Collection object. This is most useful when 
     * initializing reusable libraries of verb and objectType
     * definitions and using those in conjunction with 
     * the typeValueResolver.
     *
     * @example
     *   var col = asms.Collection({...});
     *   var library = asms.indexTypeValuesFromCollection(col);
     *   asms.typeValueResolver = function(id) {
     *     return id in library ? library[id] : id;
     *   }
     * @memberOf asms 
     * @param {asms.Collection} collection 
     * @returns {Dictionary}
     **/
    indexTypeValuesFromCollection: function(collection) {
      var ret = {};
      var ids = ['verb','objectType'];
      var items = collection.items;
      if (is_array(items))
        each(items, function(item) {
          if (contains(ids,item.objectType.id) && item.id)
            ret[item.id] = item.__wrapped__;
        });
      return ret;
    },
    /** 
     * Parses in the input String and returns an Activity Streams 
     * object. If the input contains a 'verb' property, an 
     * Activity object is returned. If the input contains an
     * 'items' property, a Collection is returned.
     * 
     * @example
     *   var as = asms.parse('{"verb":"post","actor":"acct:joe@example.org"}');
     *   console.log(as.verb.id);
     * @param {string} input
     * @returns {asms.Object|asms.Activity|asms.Collection}
     * @memberOf asms 
     **/
    parse: function(input) {
      var inner = JSON.parse(input);
      if ('verb' in inner)
        return activityObject(inner,undefined,M.Activity);
      else if ('items' in inner)
        return activityObject(inner,undefined,M.Collection);
      else
        return activityObject(inner);
    },
    /** 
     * Generates an asms.Object from a raw input JavaScript object.
     * @example
     *   var obj = asms.Object({
     *     id: 'urn:example:object:id',
     *     displayName: 'my object',
     *     objectType: 'note',
     *     content: 'this is the content'
     *   });
     * 
     * @method
     * @param {Object} inner
     * @returns {asms.Object}
     * @memberOf asms 
     **/
    Object : activityObject,
    /**
     * Generates an asms.Collection from a raw input JavaScript object.
     * @example
     *   var obj = asms.Collection({
     *     totalItems: 2,
     *     items: [
     *       {
     *         id: 'urn:example:item:1',
     *         objectType: 'note'
     *       },
     *       {
     *         id: 'urn:example:item:2',
     *         objectType: 'note'
     *       }
     *     ]
     *   });
     *
     * @param {Object} inner
     * @returns {asms.Collection}
     * @memberOf asms
     */
    Collection : function(inner) {
      return activityObject(inner,undefined,M.Collection);
    },
    /**
     * Generates an asms.Activity from a raw input JavaScript object.
     * @example
     *   var obj = asms.Activity({
     *     verb: 'post',
     *     actor: 'acct:sally@example.org',
     *     object: 'http://example.org'
     *   });
     *
     * @param {Object} inner
     * @returns {asms.Activity}
     * @memberOf asms
     */
    Activity : function(inner) {
      return activityObject(inner,undefined,M.Activity);
    },
    /** 
     * Provides various useful transform functions
     * @memberOf asms 
     * @namespace asms.Transforms
     **/
    Transforms : {
      /**
       * @memberOf asms.Transforms
       */
      toLink : function(i,context,rel,extmodel) {
        if (i === undefined)
          return undefined;
        if (is_array(i)) {
          var rr = [];
          for (var n in i)
            _def_linkval(rr,n,i[n],this,rel);
          rr.__type__ = AS.Constants.__array__;
          rr.__rel__ = rel;
          defineProperty(i,'__type__',hidden());
          defineProperty(i,'__rel__',hidden());
          freeze(rr);
          return rr;
        } else
          return linkValue(i,context,rel,extmodel);
      },
      /**
       * @memberOf asms.Transforms
       */
      toType : function(i,context,ignoreUndefined) {
        return typeValue(i,context,undefined,ignoreUndefined);
      },
      /**
       * @memberOf asms.Transforms
       */
      toNaturalLanguageValue : function(i,context) {
        return naturalLanguageValue(i,context);
      },
      /**
       * @memberOf asms.Transforms
       */
      toCollection : function(i, context) {
        return activityObject(i, context, M.Collection);
      },
      /**
       * @memberOf asms.Transforms
       */
      toObject : function(i, context) {
        return activityObject(i, context);
      },
      /**
       * @memberOf asms.Transforms
       */
      toActivity : function(i, context) {
        return activityObject(i, context, M.Activity);
      },
      /**
       * @memberOf asms.Transforms
       */
      toDateTime : function(val) {
        var ret;
        if (typeof val === 'undefined')
          return val;
        else if (val instanceof Date)
          ret = val;
        else if (typeof val == 'string')
          ret = new Date(val);
        else
          throw invalidType();
        return ret;
      }
    },
    /**
     * @memberOf asms 
     * @namespace asms.Constants
     **/
    Constants: {
      /** 
       * @constant
       * @default
       * @memberOf asms.Constants 
       **/
      __anonymous__ : '__anonymous__',
      /** 
         * @constant
         * @default
         * @memberOf asms.Constants **/
      __object__ : 2,
      /** 
         * @constant
         * @default
         * @memberOf asms.Constants **/
      __simple__ : 1,
      /** 
         * @constant
         * @default
         * @memberOf asms.Constants **/
      __type__ : '__type__',
      /** 
         * @constant
         * @default
         * @memberOf asms.Constants **/
      __array__ : 3,
      /** 
         * @constant
         * @default
         * @memberOf asms.Constants **/
      post : 'post',
      /** 
         * @constant
         * @default
         * @memberOf asms.Constants **/
      activity : 'activity',
      /** 
         * @constant
         * @default
         * @memberOf asms.Constants **/
      verb : 'verb',
      /** 
         * @constant
         * @default
         * @memberOf asms.Constants **/
      objectType : 'objectType',
      /** 
         * @constant
         * @default
         * @memberOf asms.Constants **/
      collection : 'collection',
      /** 
         * @constant
         * @default
         * @memberOf asms.Constants **/
      status : ['active','canceled','completed','pending','tentative','voided'],
      /** 
       * @namespace asms.Constants.formats
       * @memberOf asms.Constants 
       **/
      formats : {
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        boolean: 'boolean',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        byte: 'byte',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        hex: 'hex',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        date: 'date',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        double: 'double',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        duration: 'duration',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        float: 'float',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        int32: 'int32',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        int64: 'int64',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        uint32: 'uint32',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        uint64: 'uint64',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        lang: 'lang',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        uri: 'uri',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.formats **/
        iri: 'iri'
      },
      /**
       * @memberOf asms.Constants 
       * @namespace asms.Constants.verbs
       **/
      verbs : {
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        accept: 'accept',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        access: 'access',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        acknowledge: 'acknowledge',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        add: 'add',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        agree: 'agree',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        append: 'append',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        approve: 'approve',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        archive: 'archive',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        assign: 'assign',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        at: 'at',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        attach: 'attach',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        attend: 'attend',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        author: 'author',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        authorize: 'authorize',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        borrow: 'borrow',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        build: 'build',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        cancel: 'cancel',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        close: 'close',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        complete: 'complete',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        confirm: 'confirm',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        consume: 'consume',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        checkin: 'checkin',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        create: 'create',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        'delete': 'delete',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        deliver: 'deliver',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        deny: 'deny',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        disagree: 'disagree',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        dislike: 'dislike',
        /**
         * @constant
         * @default
         *  @memberOf asms.Constants.verbs **/
        experience: 'experience',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        favorite: 'favorite',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        find: 'find',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        flagAsInappropriate: 'flag-as-inappropriate',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        follow: 'follow',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        give: 'give',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        host: 'host',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        ignore: 'ignore',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        insert: 'insert',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        install: 'install',
        /**
         * @constant
         * @default
         *  @memberOf asms.Constants.verbs **/
        interact: 'interact',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        invite: 'invite',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        join: 'join',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        leave: 'leave',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        like: 'like',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        listen: 'listen',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        lose: 'lose',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs 
         **/
        makeFriend: 'make-friend',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        open: 'open',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        play: 'play',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        present: 'present',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        purchase: 'purchase',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        qualify: 'qualify',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        read: 'read',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        receive: 'receive',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        reject: 'reject',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        remove: 'remove',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        removeFriend: 'removeFriend',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        replace: 'replace',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        request: 'request',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        requestFriend: 'requestFriend',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        resolve: 'resolve',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        _return: 'return',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        retract: 'retract',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        rsvpMaybe: 'rsvp-maybe',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        rsvpNo: 'rsvp-no',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        rsvpYes: 'rsvp-yes',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        satisfy: 'satisfy',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        save: 'save',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        schedule: 'schedule',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        search: 'search',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        sell: 'sell',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        send: 'send',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        share: 'share',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        sponsor: 'sponsor',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        start: 'start',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        stopFollowing: 'stop-following',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        submit: 'submit',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        tag: 'tag',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        terminate: 'terminate',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        tie: 'tie',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        unfavorite: 'unfavorite',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        unlike: 'unlike',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        unsatisfy: 'unsatisfy',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        unsave: 'unsave',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        unshare: 'unshare',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        update: 'update',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        use: 'use',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        watch: 'watch',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.verbs **/
        win: 'win'
      },
      /**
       * @memberOf asms.Constants
       * @namespace asms.Constants.objectTypes
       **/
      objectTypes: {
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        alert: 'alert',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        application: 'application',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        article: 'article',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        audio: 'audio',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        badge: 'badge',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        binary: 'binary',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        bookmark: 'bookmark',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        collection: 'collection',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        comment: 'comment',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        device: 'device',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        event: 'event',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        file: 'file',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        game: 'game',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        group: 'group',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        image: 'image',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        issue: 'issue',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        job: 'job',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        note: 'note',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        offer: 'offer',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        organization: 'organization',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        page: 'page',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        permission: 'permission',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        person: 'person',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        place: 'place',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        process: 'process',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes **/
        product: 'product',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes 
         **/
        question: 'question',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes 
         **/
        review: 'review',
        /** 
         * @constant
         * @default
         * @memberOf asms.Constants.objectTypes 
         **/
        role: 'role',
        /**
         * @constant 
         * @default
         * @memberOf asms.Constants.objectTypes 
         **/
        service: 'service',
        /** 
         * @constant 
         * @default
         * @memberOf asms.Constants.objectTypes 
         **/
        task: 'task',
        /** 
         * @constant 
         * @default
         * @memberOf asms.Constants.objectTypes 
         **/
        team: 'team',
        /**
         * @constant 
         * @default
         * @memberOf asms.Constants.objectTypes 
         **/
        video: 'video'
      }
    },
    /**
     * @memberOf asms
     * @namespace asms.Models
     */
    Models : M
  };
  deep_freeze(AS, ['Models']);

  if ( typeof define === 'function' && define.amd ) {
    define( 'asms', [], function() {
      return AS;
    });
  }

  if (_$ !== undefined)
    _$.asms = AS;

  return AS;
}));
