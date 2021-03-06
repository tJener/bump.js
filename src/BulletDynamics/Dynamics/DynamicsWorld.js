// load: bump.js
// load: BulletCollision/CollisionDispatch/CollisionWorld.js

// run: BulletDynamics/ConstraintSolver/ContactSolverInfo.js

(function( window, Bump ) {

  Bump.DynamicsWorldType = Bump.Enum([
    { id: 'BT_SIMPLE_DYNAMICS_WORLD',     param: 1 },
    { id: 'BT_DISCRETE_DYNAMICS_WORLD',   param: 2 },
    { id: 'BT_CONTINUOUS_DYNAMICS_WORLD', param: 3 },
    { id: 'BT_SOFT_RIGID_DYNAMICS_WORLD', param: 4 }
  ]);

  Bump.DynamicsWorld = Bump.type({
    parent: Bump.CollisionWorld,

    init: function DynamicsWorld( dispatcher, broadphase, collisionConfiguration ) {
      this._super( dispatcher, broadphase, collisionConfiguration );

      this.internalTickCallback = null;
      this.internalPreTickCallback = null;
      this.worldUserInfo = null;

      this.solverInfo = Bump.ContactSolverInfo.create();

      return this;
    },

    members: {
      destruct: Bump.noop,
      stepSimulation: Bump.abstract,
      debugDrawWorld: Bump.abstract,
      addConstraint: Bump.noop,
      removeConstraint: Bump.noop,
      addAction: Bump.abstract,
      removeAction: Bump.abstract,
      setGravity: Bump.abstract,
      getGravity: Bump.abstract,
      synchronizeMotionStates: Bump.abstract,
      addRigidBody: Bump.abstract,
      addRigidBodyWithGroup: Bump.abstract,
      removeRigidBody: Bump.abstract,
      setConstraintSolver: Bump.abstract,
      getConstraintSolver: Bump.abstract,

      getNumConstraints: function() {
        return 0;
      },

      getConstraint: function() {
        return null;
      },

      getWorldType: Bump.abstract,
      clearForces: Bump.abstract,

      setInternalTickCallback: function( cb, worldUserInfo, isPreTick ) {
        worldUserInfo = worldUserInfo === undefined ? null : worldUserInfo;

        if ( isPreTick ) {
          this.internalPreTickCallback = cb;
        } else {
          this.internalTickCallback = cb;
        }

        this.worldUserInfo = worldUserInfo;
      },

      setWorldUserInfo: function( worldUserInfo ) {
        this.worldUserInfo = worldUserInfo;
      },

      getWorldUserInfo: function() {
        return this.worldUserInfo;
      },

      getSolverInfo: function() {
        return this.solverInfo;
      },

      addVehicle: Bump.noop,
      removeVehicle: Bump.noop,
      addCharacter: Bump.noop,
      removeCharacter: Bump.noop
    }
  });

})( this, this.Bump );
