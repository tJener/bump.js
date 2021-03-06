// load: bump.js
// load: BulletCollision/BroadphaseCollision/OverlappingPairCache.js
// load: BulletCollision/BroadphaseCollision/Dispatcher.js
// load: BulletCollision/CollisionDispatch/ManifoldResult.js

// run: BulletCollision/BroadphaseCollision/BroadphaseProxy.js
// run: BulletCollision/NarrowPhaseCollision/PersistentManifold.js
// run: BulletCollision/BroadphaseCollision/CollisionAlgorithm.js

(function( window, Bump ) {

  Bump.gNumManifold = 0;

  Bump.CollisionPairCallback = Bump.type({
    parent: Bump.OverlapCallback,

    init: function CollisionPairCallback( dispatchInfo, dispatcher ) {
      this._super();
      this.dispatchInfo = dispatchInfo || null; // const btDispatcherInfo&
      this.dispatcher = dispatcher || null; // btCollisionDispatcher*
    },

    members: {
      // Process the overlap for a given BroadphasePair
      processOverlap: function( pair ) {
        ( this.dispatcher.getNearCallback() )( pair, this.dispatcher, this.dispatchInfo );
        return false;
      }
    }
  });

  // Used in defaultNearCallback
  var tmpDNCMR1 = Bump.ManifoldResult.create();

  Bump.CollisionDispatcher = Bump.type({
    parent: Bump.Dispatcher,

    init: function CollisionDispatcher() {
      this._super();

      var i, j, MAX_BROADPHASE_COLLISION_TYPES = Bump.BroadphaseNativeTypes.MAX_BROADPHASE_COLLISION_TYPES;

      this.dispatcherFlags = 0;
      this.manifoldsPtr = [];
      this.defaultManifoldResult = Bump.ManifoldResult.create();
      this.nearCallback = null;
      this.collisionAlgorithmPoolAllocator = null;
      this.persistentManifoldPoolAllocator = null;

      this.doubleDispatch = new Array( MAX_BROADPHASE_COLLISION_TYPES );
      for ( i = 0; i < MAX_BROADPHASE_COLLISION_TYPES; ++i ) {
        this.doubleDispatch[i] = new Array( MAX_BROADPHASE_COLLISION_TYPES );
        for ( j = 0; j < MAX_BROADPHASE_COLLISION_TYPES; ++j ) {
          this.doubleDispatch[i][j] = null;
        }
      }

      this.collisionConfiguration = null;

      return this;
    },

    members: {
      initWithConfig: function( collisionConfiguration ) {
        Bump.Dispatcher.prototype.init.apply( this, [] );

        var i, j, MAX_BROADPHASE_COLLISION_TYPES = Bump.BroadphaseNativeTypes.MAX_BROADPHASE_COLLISION_TYPES;

        this.dispatcherFlags = Bump.CollisionDispatcher.DispatcherFlags.CD_USE_RELATIVE_CONTACT_BREAKING_THRESHOLD;
        this.manifoldsPtr = [];
        this.defaultManifoldResult = Bump.ManifoldResult.create();
        this.nearCallback = null;
        this.collisionAlgorithmPoolAllocator = null;
        this.persistentManifoldPoolAllocator = null;

        this.doubleDispatch = new Array( MAX_BROADPHASE_COLLISION_TYPES );
        for ( i = 0; i < MAX_BROADPHASE_COLLISION_TYPES; ++i ) {
          this.doubleDispatch[i] = new Array( MAX_BROADPHASE_COLLISION_TYPES );
          for ( j = 0; j < MAX_BROADPHASE_COLLISION_TYPES; ++j ) {
            this.doubleDispatch[i][j] = null;
          }
        }

        this.collisionConfiguration = collisionConfiguration;

        this.setNearCallback( this.defaultNearCallback );
        this.collisionAlgorithmPoolAllocator = collisionConfiguration.getCollisionAlgorithmPool();
        this.persistentManifoldPoolAllocator = collisionConfiguration.getPersistentManifoldPool();

        for ( i = 0; i < MAX_BROADPHASE_COLLISION_TYPES; ++i ) {
          for ( j = 0; j < MAX_BROADPHASE_COLLISION_TYPES; ++j ) {
            this.doubleDispatch[i][j] = this.collisionConfiguration.getCollisionAlgorithmCreateFunc( i, j );
            Bump.Assert( Bump.INCOMPLETE_IMPLEMENTATION || this.doubleDispatch[i][j] !== null );
          }
        }

        return this;
      },

      clone: function( dest ) {
        dest = dest || Bump.CollisionDispatcher.create();

        var i, j, MAX_BROADPHASE_COLLISION_TYPES = Bump.BroadphaseNativeTypes.MAX_BROADPHASE_COLLISION_TYPES;

        dest.dispatcherFlags = this.dispatcherFlags;

        dest.manifoldsPtr.length = 0;
        dest.manifoldsPtr.length = this.manifoldsPtr.length;
        for ( i = 0; i < this.manifoldsPtr.length; ++i ) {
          dest.manifoldsPtr[i] = this.manifoldsPtr[i];
        }

        dest.defaultManifoldResult.assign( this.defaultManifoldResult );
        dest.nearCallback = this.nearCallback;
        dest.collisionAlgorithmPoolAllocator = this.collisionAlgorithmPoolAllocator;
        dest.persistentManifoldPoolAllocator = this.persistentManifoldPoolAllocator;

        for ( i = 0; i < MAX_BROADPHASE_COLLISION_TYPES; ++i ) {
          for ( j = 0; j < MAX_BROADPHASE_COLLISION_TYPES; ++j ) {
            dest.doubleDispatch[i][j] = this.doubleDispatch[i][j];
          }
        }

        dest.collisionConfiguration = this.collisionConfiguration;

        return dest;
      },

      assign: function( other ) {
        var i, j, MAX_BROADPHASE_COLLISION_TYPES = Bump.BroadphaseNativeTypes.MAX_BROADPHASE_COLLISION_TYPES;

        this.dispatcherFlags = other.dispatcherFlags;

        this.manifoldsPtr.length = 0;
        this.manifoldsPtr.length = other.manifoldsPtr.length;
        for ( i = 0; i < other.manifoldsPtr.length; ++i ) {
          this.manifoldsPtr[i] = other.manifoldsPtr[i];
        }

        this.defaultManifoldResult.assign( other.defaultManifoldResult );
        this.nearCallback = other.nearCallback;
        this.collisionAlgorithmPoolAllocator = other.collisionAlgorithmPoolAllocator;
        this.persistentManifoldPoolAllocator = other.persistentManifoldPoolAllocator;

        for ( i = 0; i < MAX_BROADPHASE_COLLISION_TYPES; ++i ) {
          for ( j = 0; j < MAX_BROADPHASE_COLLISION_TYPES; ++j ) {
            this.doubleDispatch[i][j] = other.doubleDispatch[i][j];
          }
        }

        this.collisionConfiguration = other.collisionConfiguration;

        return this;
      },

      getDispatcherFlags: function() {
        return this.dispatcherFlags;
      },

      setDispatcherFlags: function( flags ) {
        this.dispatcherFlags = flags;
      },

      registerCollisionCreateFunc: function( proxyType0, proxyType1, createFunc ) {
        this.doubleDispatch[ proxyType0 ][ proxyType1 ] = createFunc;
      },

      getNumManifolds: function() {
        return this.manifoldsPtr.length;
      },

      // **Warning:** Returns an Array of Arrays.
      getInternalManifoldPointer: function() {
        var m_manifoldsPtr = this.manifoldsPtr;
        return m_manifoldsPtr.length ? m_manifoldsPtr : null;
      },

      getManifoldByIndexInternal: function( index ) {
        return this.manifoldsPtr[ index ];
      },

      getNewManifold: function( b0, b1 ) {
        ++Bump.gNumManifold;

        var body0 = b0, body1 = b1;

        // Optional relative contact breaking threshold, turned on by default.
        // Use `setDispatcherFlags` to switch off feature for improved
        // performance.
        var contactBreakingThreshold = (
          ( this.dispatcherFlags & Bump.CollisionDispatcher.DispatcherFlags.CD_USE_RELATIVE_CONTACT_BREAKING_THRESHOLD ) ?
            Math.min( body0.getCollisionShape().getContactBreakingThreshold( Bump.gContactBreakingThreshold ), body1.getCollisionShape().getContactBreakingThreshold( Bump.gContactBreakingThreshold ) ) :
            Bump.gContactBreakingThreshold
        );

        var contactProcessingThreshold = Math.min( body0.getContactProcessingThreshold(), body1.getContactProcessingThreshold() );

        var manifold;
        if ( this.persistentManifoldPoolAllocator.getFreeCount() ) {
          manifold = this.persistentManifoldPoolAllocator.allocate( body0, body1, 0, contactBreakingThreshold, contactProcessingThreshold );
        } else {
          // We got a pool memory overflow, by default we fallback to
          // dynamically allocate memory. If we require a contiguous contact
          // pool then assert.
          if ( ( this.dispatcherFlags & Bump.CollisionDispatcher.DispatcherFlags.CD_DISABLE_CONTACTPOOL_DYNAMIC_ALLOCATION ) === 0 ) {
            manifold = Bump.PersistentManifold.create( body0, body1, 0, contactBreakingThreshold, contactProcessingThreshold );
          } else {
            Bump.Assert( false );
            // Make sure to increase the `defaultMaxPersistentManifoldPoolSize`
            // in the `DefaultCollisionConstructionInfo`/`btDefaultCollisionConfiguration`.
            return null;
          }
        }

        manifold.index1a = this.manifoldsPtr.length;
        this.manifoldsPtr.push( manifold );

        return manifold;
      },

      releaseManifold: function( manifold ) {
        --Bump.gNumManifold;

        this.clearManifold( manifold );

        var findIndex = manifold.index1a;
        Bump.Assert( findIndex < this.manifoldsPtr.length );

        //     this.manifoldsPtr.swap( findIndex, this.manifoldsPtr.length - 1 );
        this.manifoldsPtr[ findIndex ] = this.manifoldsPtr[ this.manifoldsPtr.length - 1 ];
        this.manifoldsPtr[ findIndex ].index1a = findIndex;
        this.manifoldsPtr.pop();

        manifold.destruct();
        // We have no good way of checking for valid pointers, so ignore for now.
        // if ( !this.persistentManifoldPoolAllocator.validPtr( manifold ) ) {
        //   btAlignedFree(manifold);
        // } else {
        this.persistentManifoldPoolAllocator.freeMemory( manifold );
        // }
      },

      clearManifold: function( manifold ) {
        manifold.clearManifold();
      },

      findAlgorithm: function( body0, body1, sharedManifold ) {
        sharedManifold = sharedManifold === undefined ? null : sharedManifold;

        var ci = Bump.CollisionAlgorithmConstructionInfo.create();

        ci.dispatcher1 = this;
        ci.manifold = sharedManifold;

        // (function() {
        //   console.warn( 'TODO: Remove this debug logic' );
        //   var shape0 = body0.getCollisionShape().getShapeType();
        //   var shape1 = body1.getCollisionShape().getShapeType();
        //   if ( this.doubleDispatch[ shape0 ][ shape1 ] == null ) {
        //     var type0, type1;
        //     for ( var type in Bump.BroadphaseNativeTypes ) {
        //       if ( Bump.BroadphaseNativeTypes[ type ] === shape0 ) {
        //         type0 = type;
        //       }

        //       if ( Bump.BroadphaseNativeTypes[ type ] === shape1 ) {
        //         type1 = type;
        //       }
        //     }
        //     console.error( 'Could not find collision algorithm between ' + type0 + ' and ' + type1 );
        //   }
        // }.bind( this ))();

        var algo =
          this.doubleDispatch[ body0.getCollisionShape().getShapeType() ][ body1.getCollisionShape().getShapeType() ]
          .CreateCollisionAlgorithm( ci, body0, body1 );

        return algo;
      },

      needsCollision: function( body0, body1 ) {
        Bump.Assert( body0 !== null );
        Bump.Assert( body1 !== null );

        var needsCollision = true;

        if ( ( !body0.isActive() ) && ( !body1.isActive() ) ) {
          needsCollision = false;
        } else if ( !body0.checkCollideWith( body1 ) ) {
          needsCollision = false;
        }

        return needsCollision;
      },

      needsResponse: function( body0, body1 ) {
        // Here you can do filtering.
        var hasResponse =
          ( body0.hasContactResponse() && body1.hasContactResponse() );

        // No response between two static/kinematic bodies.
        hasResponse = hasResponse &&
          (( !body0.isStaticOrKinematicObject() ) || ( !body1.isStaticOrKinematicObject() ));
        return hasResponse;
      },

      dispatchAllCollisionPairs: function( pairCache, dispatchInfo, dispatcher ) {
        var collisionCallback = Bump.CollisionPairCallback.create( dispatchInfo, this );

        pairCache.processAllOverlappingPairs( collisionCallback, dispatcher );
      },

      setNearCallback: function( nearCallback ) {
        this.nearCallback = nearCallback;
      },

      getNearCallback: function() {
        return this.nearCallback;
      },

      defaultNearCallback: function( collisionPair,  dispatcher, dispatchInfo ) {
        var colObj0 = collisionPair.pProxy0.clientObject,
            colObj1 = collisionPair.pProxy1.clientObject;

        if ( dispatcher.needsCollision( colObj0, colObj1 ) ) {
          // Dispatcher will keep algorithms persistent in the collision pair.
          if ( !collisionPair.algorithm ) {
            collisionPair.algorithm = dispatcher.findAlgorithm( colObj0, colObj1 );
          }

          if ( collisionPair.algorithm ) {
            var contactPointResult = tmpDNCMR1.setWithCollisionObjects( colObj0, colObj1 );

            if ( dispatchInfo.dispatchFunc === Bump.DispatcherInfo.DispatchFunc.DISPATCH_DISCRETE ) {
              // Discrete collision detection query.
              collisionPair.algorithm.processCollision( colObj0, colObj1, dispatchInfo, contactPointResult );
            } else {
              // Continuous collision detection query, time of impact (toi).
              var toi = collisionPair.algorithm.calculateTimeOfImpact( colObj0, colObj1, dispatchInfo, contactPointResult );
              if ( dispatchInfo.timeOfImpact > toi ) {
                dispatchInfo.timeOfImpact = toi;
              }
            }
          }
        }
      },

      allocateCollisionAlgorithm: function( size ) {
        // **MEMPOOL:** Ignoring for now…
        //
        //     if ( this.collisionAlgorithmPoolAllocator.getFreeCount() ) {
        //       return this.collisionAlgorithmPoolAllocator.allocate( size );
        //     }

        //     // Warn user for overflow?
        //     return Bump.AlignedAlloc( size, 16 );
      },

      freeCollisionAlgorithm: function( ptr ) {
        // **MEMPOOL:** Ignoring for now…
        //
        //     if ( this.collisionAlgorithmPoolAllocator.validPtr( ptr ) ) {
        //       this.collisionAlgorithmPoolAllocator.freeMemory( ptr );
        //     } else {
        //       Bump.AlignedFree( ptr );
        //     }
      },

      getCollisionConfiguration: function() {
        return this.collisionConfiguration;
      },

      setCollisionConfiguration: function( config ) {
        this.collisionConfiguration = config;
      },

      getInternalManifoldPool: function() {
        return this.persistentManifoldPoolAllocator;
      }

    },

    typeMembers: {
      create: function( collisionConfiguration ) {
        var cd = Object.create( Bump.CollisionDispatcher.prototype );
        if ( arguments.length ) {
          return cd.initWithConfig( collisionConfiguration );
        }

        return cd.init();
      }
    }
  });

  Bump.CollisionDispatcher.DispatcherFlags = Bump.Enum([
    { id: 'CD_STATIC_STATIC_REPORTED', value: 1 },
    { id: 'CD_USE_RELATIVE_CONTACT_BREAKING_THRESHOLD', value: 2 },
    { id: 'CD_DISABLE_CONTACTPOOL_DYNAMIC_ALLOCATION', value: 4 }
  ]);

})( this, this.Bump );
