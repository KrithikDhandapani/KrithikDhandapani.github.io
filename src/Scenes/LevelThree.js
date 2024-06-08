class LevelThree extends Phaser.Scene {
    constructor() {
        super("LevelThree");
    }

    preload() {
        // Load assets
        this.load.setPath("./assets/");
        this.load.image("tilemap_tiles", "tilemap_tiles.png");
        this.load.tilemapTiledJSON("LevelThree", "LevelThree.json");

        // Load sound effects
        this.load.audio("jumpSound", ["footstep_grass_001.ogg"]);
        this.load.audio("coinSound", ["impactMetal_medium_002.ogg"]);
    }

    init() {
        // Variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 900;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1800;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 0.5;
        this.SCALE = 1.8;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("LevelThree", 18, 18, 45, 25);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // Find coins in the "Objects" layer in Phaser
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        // Convert coins to Arcade Physics sprites
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        this.coinGroup = this.add.group(this.coins);

        // Find EndLevel objects in the "Objects" layer
        this.endLevelObjects = this.map.createFromObjects("Objects", {
            name: "EndLevel",
            key: "tilemap_sheet",
            frame: 131 
        });
        this.failObjects = this.map.createFromObjects("Objects", {
            name: "Fail",
            key: "tilemap_sheet",
            frame: 24 
        });

        // Convert EndLevel objects to Arcade Physics sprites
        this.physics.world.enable(this.endLevelObjects, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.failObjects, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.endLevelObjects
        this.endLevelGroup = this.add.group(this.endLevelObjects);
        this.failGroup = this.add.group(this.failObjects);

        // Set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0002.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.coinSound.play(); // play coin sound effect
        });

        // Handle collision detection with EndLevel objects
        this.physics.add.overlap(my.sprite.player, this.endLevelGroup, () => {
            this.physics.pause();
            this.add.text(
                this.cameras.main.midPoint.x, 
                this.cameras.main.midPoint.y - 230, // Adjust the value as needed
                "Congratulations! You have completed Pixel Adventure!", 
                {
                    fontSize: '24px',
                    fill: '#00ff00'
            }).setOrigin(0.5);

            this.add.text(this.cameras.main.midPoint.x - 190, this.cameras.main.midPoint.y - 150, "", {
                fontSize: '32px',
                fill: '#ffffff'
            }).setOrigin(0.5);
            this.add.text(this.cameras.main.midPoint.x + 190, this.cameras.main.midPoint.y - 150, "", {
                fontSize: '32px',
                fill: '#ffffff'
            }).setOrigin(0.5);

            this.input.keyboard.on('keydown-E', () => {
                this.scene.start('LevelTwo');
            });

            this.resetEnabled = true; // Flag to enable reset
        });

        // Handle collision detection with Fail objects
        this.physics.add.overlap(my.sprite.player, this.failGroup, () => {
            this.physics.pause();
            this.add.text(
                this.cameras.main.midPoint.x, 
                this.cameras.main.midPoint.y - 230, // Adjust the value as needed
                "Press R to restart", 
                {
                    fontSize: '64px',
                    fill: '#ffffff'
            }).setOrigin(0.5);
            this.resetEnabled = true; // Flag to enable reset
        });

        // Load sound effects
        this.jumpSound = this.sound.add("jumpSound");
        this.coinSound = this.sound.add("coinSound");

        // Set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // Debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true;
            this.physics.world.debugGraphic.clear();
        }, this);

        // Movement VFX
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['scratch_01.png', 'slash_01.png'],
            scale: {start: 0.01, end: 0.1},
            lifespan: 350,
            alpha: {start: 5, end: 0.5}, 
        });

        my.vfx.walking.stop();

        // Jumping VFX
        my.vfx.jumping = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_01.png', 'smoke_01.png'],
            scale: {start: 0.1, end: 0},
            lifespan: 300,
            alpha: {start: 1, end: 0},
            speedY: {min: -200, max: -400},
            quantity: 10,
            on: false
        });

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        this.resetEnabled = false; // Initialize reset flag
    }

    update() {
        if (cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else if (cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
        }

        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }

        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.vfx.jumping.startFollow(my.sprite.player, 0, my.sprite.player.displayHeight / 2);
            my.vfx.jumping.explode(10, my.sprite.player.x, my.sprite.player.y + my.sprite.player.displayHeight / 2);
            this.jumpSound.play(); // Play the jump sound effect
        }

        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        if (this.resetEnabled && Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}
