// Math stuff that bullet defines.
(function( window, Bump ) {

  // Arccosine calculation with bounds checking.
  // Port of `btAcos` from `btScalar.h`.
  if ( !Bump.Acos ) {
    Bump.Acos = function btAcos( x ) {
      if ( x < -1 ) { x = -1; }
      if ( x >  1 ) { x =  1; }
      return Math.acos( x );
    };
  }

  // Arcsine calculation with bounds checking.
  // Port of `btAsin` from `btScalar.h`.
  Bump.Asin = function btAsin( x ) {
    if ( x < -1 ) { x = -1; }
    if ( x >  1 ) { x =  1; }
    return Math.asin( x );
  };

  Bump.Fsels = function btFsels( a, b, c ) {
    return a >= 0 ? b : c;
  };

  Bump.Fmod = function btFmod( x, y ) {
    var i = ~~( x / y );
    return x - i * y;
  };

  Bump.Assert = function btAssert( expression ) {
    if ( !expression ) {
      undefined.error();
    }
  };

  Bump.RecipSqrt = function btRecipSqrt( x ) {
    return 1 / Math.sqrt( x );
  };

  Bump.NormalizeAngle = function btNormalizeAngle( angleInRadians ) {
    angleInRadians = Bump.Fmod( angleInRadians, Bump.SIMD_2_PI );
    if ( angleInRadians < -Math.PI ) {
      return angleInRadians + Math.PI;
    } else if( angleInRadians > Math.PI ) {
      return angleInRadians - Math.PI;
    } else {
      return angleInRadians;
    }
  };

  Bump.TypedObject = Bump.type({
    init: function TypedObject( objectType ) {
      this.objectType = objectType;
    },

    members: {
      clone: function( dest ) {
        dest = dest || Bump.TypedObject.create();
        dest.objectType = this.objectType;
        return dest;
      },

      assign: function( other ) {
        this.objectType = other.objectType;
        return this;
      },

      getObjectType: function() {
        return this.objectType;
      }
    };
  }

  if ( !Bump.RecipSqrt ) {
    Bump.RecipSqrt = function btRecipSqrt( x ) {
      return 1 / Math.sqrt( x );
    };
  }

  if ( Bump.SIMD_EPSILON === undefined ) {
    Bump.SIMD_EPSILON = Math.pow( 2, -52 );
  }

  if ( Bump.SIMDSQRT12 === undefined ) {
    Bump.SIMDSQRT12 = Math.sqrt( 1 / 2 );
  }

})( this, this.Bump );
