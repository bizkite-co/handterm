// Level.tsx
import { IParallaxLayer } from './ParallaxLayer';

export const layers: IParallaxLayer[][] = [
  [
    { imageSrc: '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0003_bg.png', scale: 1, movementRate: 0.0 },
    { imageSrc: '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0002_far-buildings.png', scale: 0.8, movementRate: 0.4 },
    { imageSrc: '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0001_buildings.png', scale: 0.6, movementRate: 0.6 },
    { imageSrc: '/images/parallax-industrial-pack/parallax-industrial-pack/layers/skill-desc_0000_foreground.png', scale: 0.6, movementRate: 1 },
  ],
  [
    { imageSrc: '/images/cyberpunk-street-files/cyberpunk-street-files/PNG/layers/far-buildings.png', scale: 1, movementRate: 0.4 },
    { imageSrc: '/images/cyberpunk-street-files/cyberpunk-street-files/PNG/layers/back-buildings.png', scale: 0.8, movementRate: 0.6 },
    { imageSrc: '/images/cyberpunk-street-files/cyberpunk-street-files/PNG/layers/foreground.png', scale: 1, movementRate: 1 },
  ],
  [
    { imageSrc: '/images/post_soviet_city_parallax/post_soviet_city_parallax/layer_1_ground.png', scale: 1, movementRate: 1 },
    { imageSrc: '/images/post_soviet_city_parallax/post_soviet_city_parallax/layer_2_stars.png', scale: 0.8, movementRate: 0.0 },
    { imageSrc: '/images/post_soviet_city_parallax/post_soviet_city_parallax/layer_3_moon.png', scale: 0.8, movementRate: 0.0 },
    { imageSrc: '/images/post_soviet_city_parallax/post_soviet_city_parallax/layer_4_clouds_1.png', scale: 0.8, movementRate: 0.2 },
    { imageSrc: '/images/post_soviet_city_parallax/post_soviet_city_parallax/layer_6_far_buildings.png', scale: 0.8, movementRate: 0.3 },
    { imageSrc: '/images/post_soviet_city_parallax/post_soviet_city_parallax/layer_7_bg_buildings.png', scale: 0.8, movementRate: 0.5 },
    { imageSrc: '/images/post_soviet_city_parallax/post_soviet_city_parallax/layer_8_fg_buildings.png', scale: 0.6, movementRate: 0.6 },
    { imageSrc: '/images/post_soviet_city_parallax/post_soviet_city_parallax/layer_9_wall.png', scale: 0.6, movementRate: 1 },
  ],
  [
    {imageSrc: '/images/parallax-city-background-pack/1BG.png', scale: 1, movementRate: 0},
    {imageSrc: '/images/parallax-city-background-pack/2Mountain.png', scale: 1, movementRate: 0.2},
    {imageSrc: '/images/parallax-city-background-pack/3MountainCloser.png', scale: 1, movementRate: 0.3},
    {imageSrc: '/images/parallax-city-background-pack/3MountainCloserWCranes.png', scale: 1, movementRate: 0.4},
    {imageSrc: '/images/parallax-city-background-pack/5Buildings.png', scale: 1, movementRate: 0.5},
    {imageSrc: '/images/parallax-city-background-pack/6BlueBuildings.png', scale: 1, movementRate: 0.7},
    {imageSrc: '/images/parallax-city-background-pack/7FireDept.png', scale: 1, movementRate: 0.8},
    {imageSrc: '/images/parallax-city-background-pack/8Player.png', scale: 1, movementRate: 1},
  ],
  [
    {imageSrc: '/images/city-ruins/post_apocalipse1.png', scale: 1.3, movementRate: 0},
    {imageSrc: '/images/city-ruins/post_apocalipse2.png', scale: 1.3, movementRate: 0.5},
    {imageSrc: '/images/city-ruins/post_apocalipse3.png', scale: 1, movementRate: 1},
  ],
  [
    {imageSrc: '/images/haunted-forest-parallaxing-background/background_1.png', scale: 1, movementRate: 0},
    {imageSrc: '/images/haunted-forest-parallaxing-background/background_2.png', scale: 1, movementRate: 0.2},
    {imageSrc: '/images/haunted-forest-parallaxing-background/background_3.png', scale: 1, movementRate: 0.4},
    {imageSrc: '/images/haunted-forest-parallaxing-background/background_4.png', scale: 1, movementRate: 0.6},
    {imageSrc: '/images/haunted-forest-parallaxing-background/background_5.png', scale: 1, movementRate: 1},
  ]
];


export const getLevelCount = (): number => {
  return layers.length;
}
