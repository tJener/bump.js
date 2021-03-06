// load: bump.js
// load: LinearMath/Math.js

// run: BulletDynamics/Dynamics/RigidBody.js

(function( window, Bump ) {
  var DEFAULT_DEBUGDRAW_SIZE = 0.3,
      tmpV1 = Bump.Vector3.create();

  Bump.TypedConstraintType = Bump.Enum([
    { id: 'POINT2POINT_CONSTRAINT_TYPE', value: 3 },
    'HINGE_CONSTRAINT_TYPE',
    'CONETWIST_CONSTRAINT_TYPE',
    'D6_CONSTRAINT_TYPE',
    'SLIDER_CONSTRAINT_TYPE',
    'CONTACT_CONSTRAINT_TYPE',
    'D6_SPRING_CONSTRAINT_TYPE',
    'MAX_CONSTRAINT_TYPE'
  ]);

  Bump.ConstraintParams = Bump.Enum([
    { id: 'BT_CONSTRAINT_ERP', value: 1 },
    'BT_CONSTRAINT_STOP_ERP',
    'BT_CONSTRAINT_CFM',
    'BT_CONSTRAINT_STOP_CFM'
  ]);

  Bump.TypedConstraint = Bump.type({
    parent: Bump.TypedObject,

    init: function TypedConstraint( type, rbA, rbB ) {
      rbB = rbB === undefined ? this.getFixedBody() : rbB;

      // Initializer list
      this._super( type );
      this.userConstraintType = -1;
      this.userConstraintId = -1;
      this.breakingImpulseThreshold = Infinity;
      this.isEnabled = true;
      this.needsFeedback = false;
      this.overrideNumSolverIterations = -1;
      this.rbA = rbA;
      this.rbB = rbB;
      this.appliedImpulse = 0;
      this.dbgDrawSize = DEFAULT_DEBUGDRAW_SIZE;
      // End initializer list
    },

    members: {
      clone: function( dest ) {
        dest = dest || Bump.TypedConstraint.create( this.objectType, this.rbA, this.rbB );

        this._super( dest );

        dest.userConstraintType = this.userConstraintType;
        dest.userConstraintId = this.userConstraintId;
        dest.breakingImpulseThreshold = this.breakingImpulseThreshold;
        dest.isEnabled = this.isEnabled;
        dest.needsFeedback = this.needsFeedback;
        dest.appliedImpulse = this.appliedImpulse;
        dest.dbgDrawSize = this.dbgDrawSize;

        return dest;
      },

      assign: function( other ) {
        Bump.Assert( false );
        return this;
      },

      getMotorFactor: function( pos, lowLim, uppLim, vel, timeFact ) {
        if ( lowLim > uppLim ) {
          return 1;
        } else if ( lowLim === uppLim ) {
          return 0;
        }

        var lifact = 1, delta_max = vel / timeFact;

        if ( delta_max < 0 ) {
          if ( ( pos >= lowLim ) && ( pos < ( lowLim - delta_max ) ) ) {
            lifact = ( lowLim - pos ) / delta_max;
          } else if ( pos  < lowLim ) {
            lifact = 0;
          } else {
            lifact = 1;
          }
        } else if ( delta_max > 0 ) {
          if ( (pos <= uppLim ) && ( pos > ( uppLim - delta_max ) ) ) {
            lifact = ( uppLim - pos ) / delta_max;
          } else if ( pos  > uppLim ) {
            lifact = 0;
          } else {
            lifact = 1;
          }
        } else {
          lifact = 0;
        }
        return lifact;
      },

      getFixedBody: (function() {
        var s_fixed;
        return function() {
          if ( s_fixed === undefined ) {
            s_fixed = Bump.RigidBody.create( 0, 0, 0 );
          }

          s_fixed.setMassProps( 0, tmpV1.setValue( 0, 0, 0 ) );
          return s_fixed;
        };
      })(),

      getOverrideNumSolverIterations: function() {
        return this.overrideNumSolverIterations;
      },

      // Override the number of constraint solver iterations used to solve this
      // constraint. -1 will use the default number of iterations, as specified
      // in `SolverInfo.numIterations`.
      setOverrideNumSolverIterations: function( overideNumIterations ) {
        this.overrideNumSolverIterations = overideNumIterations;
      },

      // Internal method used by the constraint solver, don't use this directly.
      buildJacobian: Bump.noop,

      // Internal method used by the constraint solver, don't use this directly.
      setupSolverConstraint: Bump.noop,

      // Internal method used by the constraint solver, don't use this directly.
      getInfo1: Bump.abstract,

      // Internal method used by the constraint solver, don't use this directly.
      getInfo2: Bump.abstract,

      // Internal method used by the constraint solver, don't use this directly.
      internalSetAppliedImpulse: function( appliedImpulse ) {
        this.appliedImpulse = appliedImpulse;
      },

      // Internal method used by the constraint solver, don't use this directly.
      internalGetAppliedImpulse: function() {
        return this.appliedImpulse;
      },

      getBreakingImpulseThreshold: function() {
        return this.breakingImpulseThreshold;
      },

      setBreakingImpulseThreshold: function( threshold ) {
        this.breakingImpulseThreshold = threshold;
      },

      isEnabled: function() {
        return this.isEnabled;
      },

      setEnabled: function( enabled ) {
        this.isEnabled = enabled;
      },

      // Internal method used by the constraint solver, don't use this directly.
      solveConstraintObsolete: Bump.noop,

      getRigidBodyA: function() {
        return this.rbA;
      },

      getRigidBodyB: function() {
        return this.rbB;
      },

      getUserConstraintType: function() {
        return this.userConstraintType ;
      },

      setUserConstraintType: function( userConstraintType ) {
        this.userConstraintType = userConstraintType;
      },

      setUserConstraintId: function( uid ) {
        this.userConstraintId = uid;
      },

      getUserConstraintId: function() {
        return this.userConstraintId;
      },

      setUserConstraintPtr: function( ptr ) {
        this.userConstraintPtr = ptr;
      },

      getUserConstraintPtr: function() {
        return this.userConstraintPtr;
      },

      getUid: function() {
        return this.userConstraintId;
      },

      needsFeedback: function() {
        return this.needsFeedback;
      },

      // `enableFeedback` will allow to read the applied linear and angular
      // impulse. Use `getAppliedImpulse`, `getAppliedLinearImpulse` and
      // `getAppliedAngularImpulse` to read feedback information.
      enableFeedback: function( needsFeedback ) {
        this.needsFeedback = needsFeedback;
      },

      getAppliedImpulse: function() {
        Bump.Assert( this.needsFeedback );
        return this.appliedImpulse;
      },

      getConstraintType: function() {
        return this.objectType;
      },

      setDbgDrawSize: function( dbgDrawSize ) {
        this.dbgDrawSize = dbgDrawSize;
      },

      getDbgDrawSize: function() {
        return this.dbgDrawSize;
      },

      setParam: Bump.abstract,
      getParam: Bump.abstract

    },

    typeMembers: {
      ConstraintInfo1: Bump.type( {
        init: function ConstraintInfo1() {
          this.numConstraintRows = 0;
          this.nub = 0;
        }
      }),

      ConstraintInfo2: Bump.type( {
        init: function ConstraintInfo2() {
          this.fps = 0;
          this.erp = 0;
          this.J1linearAxis = [];    // btScalar*
          this.J1angularAxis = [];   // btScalar*
          this.J2linearAxis = [];    // btScalar*
          this.J2angularAxis = [];   // btScalar*
          this.rowskip = 0;
          this.constraintError = []; // btScalar*
          this.cfm = [];             // btScalar*
          this.findex = [];          // int*
          this.numIterations = 0;
          this.damping = 0;
        }
      })
    }
  });

  Bump.AdjustAngleToLimits = function( angleInRadians, angleLowerLimitInRadians, angleUpperLimitInRadians ) {
    var diffLo, diffHi;

    if ( angleLowerLimitInRadians >= angleUpperLimitInRadians ) {
      return angleInRadians;
    }

    else if ( angleInRadians < angleLowerLimitInRadians ) {
      diffLo = Math.abs( Bump.NormalizeAngle( angleLowerLimitInRadians - angleInRadians ) );
      diffHi = Math.abs( Bump.NormalizeAngle( angleUpperLimitInRadians - angleInRadians ) );
      return ( diffLo < diffHi ) ? angleInRadians : ( angleInRadians + Bump.SIMD_2_PI );
    }

    else if ( angleInRadians > angleUpperLimitInRadians ) {
      diffHi = Math.abs( Bump.NormalizeAngle( angleInRadians - angleUpperLimitInRadians ) );
      diffLo = Math.abs( Bump.NormalizeAngle( angleInRadians - angleLowerLimitInRadians ) );
      return ( diffLo < diffHi ) ? ( angleInRadians - Bump.SIMD_2_PI ) : angleInRadians;
    }

    else {
      return angleInRadians;
    }
  };

})( this, this.Bump );
