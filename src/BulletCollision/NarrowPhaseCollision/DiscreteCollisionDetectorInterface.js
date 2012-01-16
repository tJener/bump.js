(function( window, Bump ) {

  Bump.DiscreteCollisionDetectorInterface = Bump.type({
    typeMembers: {
      Result: Bump.type({
        members: {
          setShapeIdentifiersA: function() {
            Bump.Assert( false );
          },

          setShapeIdentifiersB: function() {
            Bump.Assert( false );
          },

          addContactPoint: function() {
            Bump.Assert( false );
          }
        }
      }),

      ClosestPointInput: Bump.type({
        init: function ClosestPointInput() {
          this.transformA = Bump.Transform.create();
          this.transformB = Bump.Transform.create();
          this.maximumDistanceSquared = Infinity;
          this.stackAlloc = null;
        }
      })
    },

    members: {
      getClosestPoints: function() {
        Bump.Assert( false );
      }
    }
  });

  Bump.StorageResult = Bump.type({
    parent: Bump.DiscreteCollisionDetectorInterface.Result,
    init: function StorageResult() {
      this._super();

      this.normalOnSurfaceB = Bump.Vector3.create();
      this.closestPointInB = Bump.Vector3.create();
      // Negative values for distance mean penetration.
      this.distance = Infinity;
    },

    members: {
      addContactPoint: function( normalOnBInWorld, pointInWorld, depth ) {
        if ( depth < this.distance ) {
          this.normalOnSurfaceB.assign( normalOnBInWorld );
          this.closestPointInB.assign( pointInWorld );
          this.distance = depth;
        }
      }
    }
  });

})( this, this.Bump );
