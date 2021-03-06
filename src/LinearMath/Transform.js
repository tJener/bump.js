// load: bump.js
// load: LinearMath/Vector3.js
// load: LinearMath/Matrix3x3.js
// load: LinearMath/Quaternion.js

// **Bump.Transform** is the port of the `btTransform` class in
// [Bullet](http://bulletphysics.org).

(function( window, Bump ) {
  var tmpV1, tmpM1, tmpQ1;

  Bump.Transform = Bump.type({

    typeMembers: {
      // ## Constructors

      // Overloaded constructor that creates a new transform from either a
      // [Quaternion](Quaternion.html) or a [Matrix3x3](Matrix3x3.html), and an
      // optional [Vector3](vector3.html) `c` which represents the translation.
      create: function( rot, c ) {
        var transform = Object.create( Bump.Transform.prototype );
        if ( !rot ) {
          return transform.init();
        }

        // The given rotation `rot` is a quaternion.
        if ( rot.w !== undefined ) {
          return transform._initWithQuaternion( rot, c );
        }

        // The given rotation `rot` is a 3x3 rotation matrix.
        return transform._initWithBasis( rot, c );
      },

      // Creates a clone of an `other` transform.
      clone: function( other ) {
        var transform = Object.create( Bump.Transform.prototype );
        transform._initWithBasis( other.basis, other.origin );
        return transform;
      },

      getIdentity: function() {
        var transform = Object.create( Bump.Transform.prototype );
        transform.init();
        return transform.setIdentity();
      }
    },

    // ### Initialization
    // Used by the constructors. Not recommended for normal use.

    // Initialize `this` transform with a Quaternion and optional Vector3.
    init: function Transform() {
        this.basis = Bump.Matrix3x3.create();
        this.origin = Bump.Vector3.create();
        return this;
    },

    members: {
      _initWithBasis: function Transform( b, c ) {
        this.basis = Bump.Matrix3x3.clone( b );
        this.origin = ( c ? Bump.Vector3.clone( c ) : Bump.Vector3.create() );
        return this;
      },

      // Initialize a transform with all zeros.
      _initWithQuaternion: function Transform( q, c ) {
        this.basis = Bump.Matrix3x3.createWithQuaternion( q );
        this.origin = ( c ? c.clone() : Bump.Vector3.create() );
        return this;
      },

      // ## Members

      // ### Basic utilities

      // Clones `this` transform to `dest`.
      clone: function( dest ) {
        dest = dest || Bump.Transform.create();
        this.basis.clone( dest.basis );
        this.origin.clone( dest.origin );
        return dest;
      },

      assign: function( other ) {
        this.basis.assign( other.basis );
        this.origin.assign( other.origin );
        return this;
      },

      getOrigin: function() {
        return this.origin;
      },

      getBasis: function() {
        return this.basis;
      },

      getRotation: function( dest ) {
        return this.basis.getRotation( dest );
      },

      setOrigin: function( origin ) {
        origin.clone( this.origin );
        return this;
      },

      setBasis: function( basis ) {
        basis.clone( this.basis );
        return this;
      },

      setRotation: function( quat ) {
        this.basis.setRotation( quat );
        return this;
      },

      setIdentity: function() {
        this.basis.setIdentity();
        this.origin.setValue( 0, 0, 0 );
        return this;
      },

      // ### Math operators

      equal: function( other ) {
        return ( this.basis.equal( other.basis ) &&
                 this.origin.equal( other.origin ) );
      },

      // Port of `btTransform::operator()`.
      transform: function( vec, dest ) {
        dest = dest || Bump.Vector3.create();
        return dest.setValue(
          this.basis.el0.dot( vec ) + this.origin.x,
          this.basis.el1.dot( vec ) + this.origin.y,
          this.basis.el2.dot( vec ) + this.origin.z
        );
      },

      // Sets `this` to be the value of the product of two transforms `t1` and
      // `t2`
      mult: function( t1, t2 ) {
        t1.basis.multiplyMatrix( t2.basis, this.basis );
        t1.transform( t2.origin, this.origin );
        return this;
      },

      multiplyTransform: function( t, dest ) {
        dest = dest || Bump.Transform.create();

        // Perform the origin transformation first, so that we can avoid having
        // to use a temporary `Matrix3x3` when `this === dest`.
        this.transform( t.origin, dest.origin );
        this.basis.multiplyMatrix( t.basis, dest.basis );

        return dest;
      },

      multiplyTransformSelf: function( t ) {
        this.origin.addSelf( this.basis.multiplyVector( t.origin, tmpV1 ) );
        this.basis.multiplyMatrixSelf( t.basis );
        return this;
      },

      multiplyQuaternion: function( quat, dest ) {
        dest = dest || Bump.Quaternion.create();
        return this.getRotation( tmpQ1 ).multiplyQuaternion( quat, dest );
      },

      multiplyVector: function( vec, dest ) {
        return this.transform( vec, dest );
      },

      // ### Other utilities

      inverse: function( dest ) {
        dest = dest || Bump.Transform.create();

        var inv = this.basis.transpose( tmpM1 );
        dest.setBasis( inv );
        inv.multiplyVector( this.origin.negate( tmpV1 ), dest.origin );
        return dest;
      },

      invXform: function( vec, dest ) {
        dest = dest || Bump.Vector3.create();

        var v = vec.subtract( this.origin, tmpV1 ),
            basisTranspose = this.basis.transpose( tmpM1 );
        return basisTranspose.multiplyVector( v, dest );
      },

      inverseTimes: function( t, dest ) {
        dest = dest || Bump.Transform.create();

        var v = t.origin.subtract( this.origin, tmpV1 );
        this.basis.vectorMultiply( v, dest.origin );
        this.basis.transposeTimes( t.basis, dest.basis );
        return dest;
      }
    }
  });

  tmpV1 = Bump.Vector3.create();
  tmpM1 = Bump.Matrix3x3.create();
  tmpQ1 = Bump.Quaternion.create();
})( this, this.Bump );
