import { willEntitiesBeOnTheSameTile, getFreeTileAroundEntityExcludingOtherEntity, getDirectionBetweenEntities } from '../utils/EntityManagerUtils';
import { pixelsToTile, getWallsPostions } from '../utils/MapUtils.js';
import BoidsManager from './BoidsManager.js';
import { TILE_WIDTH, TILE_HEIGHT } from '../constants/TileMapConstants';

export default class WalkingEntitiesManager extends Phaser.Group {
  constructor( game, grid ) {
    super( game );
    this.mapGrid = getWallsPostions( grid );
    this.allEntitiesInitialized = false;

    this.boidsManager = new BoidsManager( this.game, this.children, this.mapGrid );
  }
  update() {
    if ( this.allEntitiesInitialized || this.areAllEntitiesInitialized() ) {
      this.manageMovingEntities();
    }

    Phaser.Group.prototype.update.call( this );

    this.boidsManager.update();
  }
  manageMovingEntities() {
    for ( const entityIndex1 in this.children ) {
      for ( const entityIndex2 in this.children ) {
        if ( entityIndex1 === entityIndex2 ) {
          continue;
        }
        const currentHandledEntity = this.children[ Math.min( entityIndex1, entityIndex2 ) ];
        const otherEntity = this.children[ Math.max( entityIndex1, entityIndex2 ) ];

        if ( currentHandledEntity.canMove && otherEntity.canMove && willEntitiesBeOnTheSameTile( currentHandledEntity, otherEntity ) ) {
          const freeTile = getFreeTileAroundEntityExcludingOtherEntity( currentHandledEntity, otherEntity, this.mapGrid );
          const currentTarget = currentHandledEntity.pathsBetweenPathTargets[ currentHandledEntity.currentPathIndex ].target;

          currentHandledEntity.changePathToTemporary( freeTile, currentTarget );
        }
      }
    }
  }
  onCollisionWihOtherEntity( entity1, entity2 ) {
    const freeTile1 = getFreeTileAroundEntityExcludingOtherEntity( entity1, entity2, this.mapGrid );
    const freeTile2 = getFreeTileAroundEntityExcludingOtherEntity( entity2, entity1, this.mapGrid );

    entity1.changePathToTemporary( freeTile1 );
    entity1.changePathToTemporary( freeTile2 );
  }
  onCollisionWithWalls( entity, tileBody ) {
    if ( entity.isChasing === false ) {
      this.findAdjoiningFreeTileAndGoBackOnPath( entity, tileBody );
    } else {
      this.resetVelocityInCorrespondingDimension( entity, tileBody );
    }
  }
  findAdjoiningFreeTileAndGoBackOnPath( entity, tileBody ) {
    const entityTile = pixelsToTile( entity );
    const tile = pixelsToTile( { x: tileBody.x + TILE_WIDTH / 2, y: tileBody.y + TILE_HEIGHT / 2 } );
    let freeTile;

    if ( entityTile.x > tile.x ) {
      freeTile = { x: entityTile.x + 1, y: entityTile.y };
    } else if ( entityTile.x < tile.x ) {
      freeTile = { x: entityTile.x - 1, y: entityTile.y };
    } else if ( entityTile.y < tile.y ) {
      freeTile = { x: entityTile.x, y: entityTile.y - 1 };
    } else if ( entityTile.y > tile.y ) {
      freeTile = { x: entityTile.x, y: entityTile.y + 1 };
    }

    entity.changePathToTemporary( freeTile );
  }
  resetVelocityInCorrespondingDimension( entity, tileBody ) {
    const direction = getDirectionBetweenEntities( entity, tileBody );
    // direction is not always correct becuase of the cases when zombie is colliding with tile's corner
    if ( direction === 'NORTH' || direction === 'SOUTH' ) {
      entity.body.velocity.x = ( entity.body.velocity.x / Math.abs( entity.body.velocity.x ) ) * Math.sqrt( Math.pow( entity.body.velocity.x, 2 ) + Math.pow( entity.body.velocity.y, 2 ) );
      entity.body.velocity.y = 0;
    } else {
      entity.body.velocity.y = ( entity.body.velocity.y / Math.abs( entity.body.velocity.y ) ) * Math.sqrt( Math.pow( entity.body.velocity.x, 2 ) + Math.pow( entity.body.velocity.y, 2 ) );
      entity.body.velocity.x = 0;
    }
  }
  areAllEntitiesInitialized() {
    for ( const entity of this.children ) {
      if ( !entity.isInitialized ) {
        return false;
      }
    }
    this.allEntitiesInitialized = true;
    return true;
  }
}
