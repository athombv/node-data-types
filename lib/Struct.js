
function Struct(name, defs) {
  Object.seal(defs);
  let size = 0;
  let varsize = false;
  for(const dt of Object.values(defs)) {
      if(typeof dt.length === 'number' && dt.length > 0)
          size += dt.length;
      else
          varsize = true;
  }
  const r ={ [name]: class {
      constructor(props = {}) {
          for(const key in props) {
              if(!defs[key]) throw new TypeError(`${this.constructor.name}: ${key} is an unexpected property`);
              this[key] = props[key];
          }
          for(const key in defs) {
              if(typeof props[key] === 'undefined')
                  this[key] = defs[key].defaultValue;
          }
      }

      static get fields() {
          return defs;
      }

      static get name() {
          return name;
      }

      static get length() {
          return varsize ? -size : size;
      }

      static fromJSON(props) {
          return new this(props);
      }

      static fromArgs(...args) {
          return new this(Object.keys(defs).reduce((res, key, i) => {
              res[key] = args[i];
              return res;
          },{}));
      }

      static fromBuffer(buf, i, returnLength) {
          i = i || 0;
          let length = 0;
          const result = new this();
          for(const p in defs) {
              if(defs[p].length > 0) {
                  result[p] = defs[p].fromBuffer(buf, i+length, false);
                  length += defs[p].length;
              } else {
                  const entry = defs[p].fromBuffer(buf.slice(i, i + buf.length-(size-length)), length, true);
                  result[p] = entry.result;
                  length += entry.length;
              }
          }
          if(returnLength && varsize)
              return {
                  result, length
              };
          return result;
      }

      toJSON() {
          const result = {};

          for(const key in defs) {
              result[key] = this[key];
          }

          return result;
      }

      static toBuffer(buf, v, i) {
          if(!(v instanceof this.constructor)) v = new this(v); 
          return v.toBuffer(buf, i);
      }

      toBuffer(buf, i) {
          let length = 0;
          i = i || 0;


          if(varsize && !buf) {
              buf = Buffer.alloc(size+255); //TODO:fix my size
          } else if(!buf)
              buf = Buffer.alloc(size);

          for(const p in defs) {
              let varsize = defs[p].length;
              if(defs[p].length <= 0 ) {
                  let rBuf = defs[p].toBuffer(buf, this[p], i+length);
                  varsize = isFinite(rBuf) ? rBuf : Buffer.isBuffer(rBuf) ? rBuf.length : 0;
              } else 
                  defs[p].toBuffer(buf, this[p], i+length);
              
              length += varsize;
          }

          return buf.slice(i, length);
      }
  }};

  return r[name];
}


module.exports = Struct;