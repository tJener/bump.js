// load: bump.js
// load: BulletCollision/NarrowPhaseCollision/DiscreteCollisionDetectorInterface.js

// run: LinearMath/Vector3.js

(function( window, Bump ) {

  Bump.REL_ERROR2 = 1e-6;

  Bump.gNumDeepPenetrationChecks = 0;
  Bump.gNumGjkChecks = 0;

  Bump.GjkPairDetector = Bump.type({
    parent: Bump.DiscreteCollisionDetectorInterface,

    init: function GjkPairDetector( objectA, objectB ) {
      // This could probably be improved in some way
      var shapeTypeA, shapeTypeB, marginA, marginB, simplexSolver, penetrationDepthSolver;

      if ( arguments.length === 4 ) {
        shapeTypeA = objectA.getShapeType();
        shapeTypeB = objectB.getShapeType();
        marginA    = objectA.getMargin();
        marginB    = objectB.getMargin();

        simplexSolver          = arguments[2];
        penetrationDepthSolver = arguments[3];
      } else {
        shapeTypeA             = arguments[2];
        shapeTypeB             = arguments[3];
        marginA                = arguments[4];
        marginB                = arguments[5];
        simplexSolver          = arguments[6];
        penetrationDepthSolver = arguments[7];
      }

      this._super();

      // Initializer list
      this.cachedSeparatingAxis = Bump.Vector3.create( 0, 1, 0 );
      this.penetrationDepthSolver = penetrationDepthSolver;
      this.simplexSolver = simplexSolver;
      this.minkowskiA = objectA;
      this.minkowskiB = objectB;
      this.shapeTypeA = shapeTypeA;
      this.shapeTypeB = shapeTypeB;
      this.marginA = marginA;
      this.marginB = marginB;
      this.ignoreMargin = false;
      this.lastUsedMethod = -1;
      this.catchDegeneracies = 1;
      // End initializer list

      // Default initializers
      this.cachedSeparatingDistance = 0;
      this.curIter = 0;
      this.degenerateSimplex = 0;
      // End default initializers
    },

    members: {
      getClosestPoints: function( input, output, debugDraw, swapResults ) {
        if ( arguments.length < 4 ) {
          swapResults = false;
        }

        this.getClosestPointsNonVirtual( input, output, debugDraw );
      },

      getClosestPointsNonVirtual: function( input, output, debugDraw ) {
        var m_penetrationDepthSolver = this.penetrationDepthSolver;
        var SIMD_EPSILON = Bump.SIMD_EPSILON;
        var m_simplexSolver = this.simplexSolver;
        var m_minkowskiA = this.minkowskiA;
        var m_minkowskiB = this.minkowskiB;
        var m_cachedSeparatingAxis = this.cachedSeparatingAxis;

        this.cachedSeparatingDistance = 0;

        var distance = 0;
        var normalInB = Bump.Vector3.create( 0, 0, 0 );
        var pointOnA = Bump.Vector3.create();
        var pointOnB = Bump.Vector3.create();
        var localTransA = input.transformA.clone();
        var localTransB = input.transformB.clone();
        var positionOffset = localTransA.origin.add( localTransB.origin ).multiplyScalar( 0.5 );
        localTransA.origin.subtractSelf( positionOffset );
        localTransB.origin.subtractSelf( positionOffset );

        var check2d = m_minkowskiA.isConvex2d() && m_minkowskiB.isConvex2d();

        var marginA = this.marginA;
        var marginB = this.marginB;

        ++Bump.gNumGjkChecks;

        // for CCD we don't use margins
        if ( this.ignoreMargin ) {
          marginA = 0;
          marginB = 0;
        }

        this.curIter = 0;
        var gGjkMaxIter = 1000; // this is to catch invalid input, perhaps check for #NaN?
        m_cachedSeparatingAxis.setValue( 0, 1, 0 );

        var isValid = false;
        var checkSimplex = false;
        var checkPenetration = true;
        this.degenerateSimplex = 0;

        this.lastUsedMethod = -1;

        var squaredDistance = Bump.LARGE_FLOAT;
        var delta = 0;

        var margin = marginA + marginB;

        m_simplexSolver.reset();

        for ( ; ; ) {
          var seperatingAxisInA = input.transformA.basis.vectorMultiply( m_cachedSeparatingAxis.negate() );
          var seperatingAxisInB = input.transformB.basis.vectorMultiply( m_cachedSeparatingAxis );

          var pInA = m_minkowskiA.localGetSupportVertexWithoutMarginNonVirtual( seperatingAxisInA );
          var qInB = m_minkowskiB.localGetSupportVertexWithoutMarginNonVirtual( seperatingAxisInB );

          var pWorld = localTransA.transform( pInA );
          var qWorld = localTransB.transform( qInB );

          if ( check2d ) {
            pWorld.z = 0;
            qWorld.z = 0;
          }

          var w = pWorld.subtract( qWorld );
          delta = m_cachedSeparatingAxis.dot( w );

          // potential exit, they don't overlap
          if ( (delta > 0) && (delta * delta > squaredDistance * input.maximumDistanceSquared) ) {
            this.degenerateSimplex = 10;
            checkSimplex = true;
            // checkPenetration = false;
            break;
          }

          // exit 0: the new point is already in the simplex, or we didn't come any closer
          if ( m_simplexSolver.inSimplex( w ) ) {
            this.degenerateSimplex = 1;
            checkSimplex = true;
            break;
          }

          // are we getting any closer ?
          var f0 = squaredDistance - delta;
          var f1 = squaredDistance * Bump.REL_ERROR2;

          if ( f0 <= f1 ) {
            if ( f0 <= 0 ) {
              this.degenerateSimplex = 2;
            } else {
              this.degenerateSimplex = 11;
            }
            checkSimplex = true;
            break;
          }

          // add current vertex to simplex
          m_simplexSolver.addVertex( w, pWorld, qWorld );
          var newCachedSeparatingAxis = Bump.Vector3.create( 0, 0, 0 );

          // calculate the closest point to the origin (update vector v)
          if ( !m_simplexSolver.closest( newCachedSeparatingAxis ) ) {
            this.degenerateSimplex = 3;
            checkSimplex = true;
            break;
          }

          if ( newCachedSeparatingAxis.length2() < Bump.REL_ERROR2 ) {
            m_cachedSeparatingAxis.assign( newCachedSeparatingAxis );
            this.degenerateSimplex = 6;
            checkSimplex = true;
            break;
          }

          var previousSquaredDistance = squaredDistance;
          squaredDistance = newCachedSeparatingAxis.length2();

          // redundant m_simplexSolver->compute_points(pointOnA, pointOnB);

          // are we getting any closer ?
          if ( previousSquaredDistance - squaredDistance <= SIMD_EPSILON * previousSquaredDistance ) {
            this.degenerateSimplex = 12;
            checkSimplex = true;
            break;
          }

          m_cachedSeparatingAxis.assign( newCachedSeparatingAxis );

          // degeneracy, this is typically due to invalid/uninitialized
          // worldtransforms for a btCollisionObject
          if ( this.curIter++ > this.gGjkMaxIter ) {
            break;
          }

          var check = ( !m_simplexSolver.fullSimplex() );

          if ( !check ) {
            this.degenerateSimplex = 13;
            break;
          }
        }

        var lenSqr;
        if ( checkSimplex ) {
          m_simplexSolver.compute_points( pointOnA, pointOnB );
          normalInB.assign( m_cachedSeparatingAxis );
          lenSqr = m_cachedSeparatingAxis.length2();

          // valid normal
          if ( lenSqr < 0.0001 ) {
            this.degenerateSimplex = 5;
          }

          if ( lenSqr > SIMD_EPSILON * SIMD_EPSILON ) {
            var rlen = 1 / Math.sqrt( lenSqr );
            normalInB.multiplyScalarSelf( rlen ); // normalize
            var s = Math.sqrt( squaredDistance );

            Bump.Assert( s > 0 );
            pointOnA.subtractSelf( m_cachedSeparatingAxis.multiplyScalar( marginA / s ) );
            pointOnB.addSelf( m_cachedSeparatingAxis.multiplyScalar( marginB / s ) );
            distance = ( ( 1 / rlen ) - margin );
            isValid = true;

            this.lastUsedMethod = 1;
          } else {
            this.lastUsedMethod = 2;
          }
        }

        var catchDegeneratePenetrationCase = (
          this.catchDegeneracies &&
            this.penetrationDepthSolver &&
            this.degenerateSimplex &&
            ( ( distance + margin ) < 0.01 )
        );

        if ( checkPenetration && ( !isValid || catchDegeneratePenetrationCase ) ) {
          // penetration case

          // if there is no way to handle penetrations, bail out
          if ( m_penetrationDepthSolver ) {
            // Penetration depth case.
            var tmpPointOnA = Bump.Vector3.create();
            var tmpPointOnB = Bump.Vector3.create();

            ++Bump.gNumDeepPenetrationChecks;
            m_cachedSeparatingAxis.setZero();

            var isValid2 = m_penetrationDepthSolver.calcPenDepth(
              m_simplexSolver,
              m_minkowskiA, m_minkowskiB,
              localTransA, localTransB,
              m_cachedSeparatingAxis, tmpPointOnA, tmpPointOnB,
              debugDraw, input.stackAlloc
            );

            var distance2;
            if ( isValid2 ) {
              var tmpNormalInB = tmpPointOnB.subtract( tmpPointOnA );
              lenSqr = tmpNormalInB.length2();
              if ( lenSqr <= ( SIMD_EPSILON * SIMD_EPSILON ) ) {
                tmpNormalInB.assign( m_cachedSeparatingAxis );
                lenSqr = m_cachedSeparatingAxis.length2();
              }

              if ( lenSqr > ( SIMD_EPSILON * SIMD_EPSILON ) ) {
                tmpNormalInB.divideScalarSelf( Math.sqrt( lenSqr ) );
                distance2 = -(tmpPointOnA.subtract( tmpPointOnB ).length());
                // only replace valid penetrations when the result is deeper (check)
                if ( !isValid || ( distance2 < distance ) ) {
                  distance = distance2;
                  pointOnA.assign( tmpPointOnA );
                  pointOnB.assign( tmpPointOnB );
                  normalInB.assign( tmpNormalInB );
                  isValid = true;
                  this.lastUsedMethod = 3;
                } else {
                  this.lastUsedMethod = 8;
                }
              } else {
                this.lastUsedMethod = 9;
              }
            } else {
              // this is another degenerate case, where the initial GJK calculation reports a degenerate case
              // EPA reports no penetration, and the second GJK (using the supporting vector without margin)
              // reports a valid positive distance. Use the results of the second GJK instead of failing.
              // thanks to Jacob.Langford for the reproduction case
              // http://code.google.com/p/bullet/issues/detail?id=250

              if ( m_cachedSeparatingAxis.length2() > 0 ) {
                distance2 = tmpPointOnA.subtract( tmpPointOnB ).length() - margin;
                // only replace valid distances when the distance is less
                if ( !isValid || ( distance2 < distance ) ) {
                  distance = distance2;
                  pointOnA.assign( tmpPointOnA );
                  pointOnB.assign( tmpPointOnB );
                  pointOnA.subtractSelf( m_cachedSeparatingAxis.multiplyScalar( marginA ) );
                  pointOnB.addSelf( m_cachedSeparatingAxis.multiplyScalar( marginB ) );
                  normalInB.assign( m_cachedSeparatingAxis );
                  normalInB.normalize();
                  isValid = true;
                  this.lastUsedMethod = 6;
                } else {
                  this.lastUsedMethod = 5;
                }
              }
            }

          }

        }

        if ( isValid && (( distance < 0 ) || ( distance * distance < input.maximumDistanceSquared )) ) {
          m_cachedSeparatingAxis.assign( normalInB );
          this.cachedSeparatingDistance = distance;

          output.addContactPoint(
            normalInB,
            pointOnB.add( positionOffset ),
            distance
          );
        }

      },

      setMinkowskiA: function( minkA ) {
        this.minkowskiA = minkA;
      },

      setMinkowskiB: function( minkB ) {
        this.minkowskiB = minkB;
      },

      setCachedSeperatingAxis: function( seperatingAxis ) {
        this.cachedSeparatingAxis.assign( seperatingAxis );
      },

      getCachedSeparatingAxis: function() {
        return this.cachedSeparatingAxis;
      },

      setPenetrationDepthSolver: function( penetrationDepthSolver ) {
        this.penetrationDepthSolver = penetrationDepthSolver;
      },

      setIgnoreMargin: function( ignoreMargin ) {
        this.ignoreMargin = ignoreMargin;
      }

    },

    typeMembers: {
      ClosestPointInput: Bump.DiscreteCollisionDetectorInterface.ClosestPointInput,
      Result: Bump.DiscreteCollisionDetectorInterface.Result
    }
  });

})( this, this.Bump );
