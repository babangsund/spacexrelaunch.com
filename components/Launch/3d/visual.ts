import { geoInterpolate } from "d3-geo";
import { interpolateNumber } from "d3-interpolate";
import { ScaleLinear } from "d3-scale";
import {
  Line,
  Mesh,
  Cache,
  Scene,
  Sprite,
  Vector3,
  BackSide,
  SpotLight,
  NeverDepth,
  BoxGeometry,
  UniformsLib,
  TubeGeometry,
  AmbientLight,
  TextureLoader,
  WebGLRenderer,
  SpriteMaterial,
  LoadingManager,
  SphereGeometry,
  ShaderMaterial,
  AdditiveBlending,
  CatmullRomCurve3,
  PerspectiveCamera,
  MeshBasicMaterial,
  SphereBufferGeometry,
  MeshStandardMaterial,
  Renderer,
  Loader,
  Texture,
  Camera,
} from "three";
import {
  LaunchData,
  LaunchTelemetry,
  LaunchWithData,
  Position,
} from "../../../data/launch";

export type UpdateVisual = (data: {
  stage: 1 | 2;
  altitude: number;
  position: Position;
}) => void;

const atmosphereVertexShader = `
varying vec3 vertexNormal;

void main() {
  vertexNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 0.9);
}
`;

const atmosphereFragmentShader = `
varying vec3 vertexNormal;

void main() {
  // edit 70.0 for blur radius
  // edit 0.99 for initial radius
  float intensity = pow(0.99 - dot(vertexNormal, vec3(0, 0, 1.0)), 8.0);
  gl_FragColor = vec4(0.61, 0.75, 0.88, 1.0) * intensity;
}
`;

const radius = 100;

function createRenderer(
  width: number,
  height: number,
  canvas: HTMLCanvasElement
) {
  // Rcetina displays have such a high pixel density there is very little visual difference between having AA on/off.
  const antialias = window.devicePixelRatio > 1 ? false : true;

  const renderer = new WebGLRenderer({
    canvas,
    antialias: antialias,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  return renderer;
}

function createCamera() {
  const fov = 30;
  const aspect = window.innerWidth / window.innerHeight; // 2; // the canvas default
  const near = 0.1;
  const far = 1000;
  const camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, 0);
  // camera.position.z = 0
  return camera;
}

function doesNeedResize(renderer: Renderer) {
  const canvas = renderer.domElement;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const needResize =
    canvas.clientWidth !== width || canvas.clientHeight !== height;

  return needResize;
}

function getPosition(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new Vector3(x, y, z);
}

async function addSkybox(scene: Scene, loader: TextureLoader) {
  const materialArray = [];
  const texture_ft = await loader.loadAsync("/images/skybox-stars-dark/nz.png");
  const texture_bk = await loader.loadAsync("/images/skybox-stars-dark/pz.png");
  const texture_up = await loader.loadAsync("/images/skybox-stars-dark/py.png");
  const texture_dn = await loader.loadAsync("/images/skybox-stars-dark/ny.png");
  const texture_rt = await loader.loadAsync("/images/skybox-stars-dark/px.png");
  const texture_lf = await loader.loadAsync("/images/skybox-stars-dark/nx.png");

  materialArray.push(new MeshBasicMaterial({ map: texture_ft }));
  materialArray.push(new MeshBasicMaterial({ map: texture_bk }));
  materialArray.push(new MeshBasicMaterial({ map: texture_up }));
  materialArray.push(new MeshBasicMaterial({ map: texture_dn }));
  materialArray.push(new MeshBasicMaterial({ map: texture_rt }));
  materialArray.push(new MeshBasicMaterial({ map: texture_lf }));

  materialArray.forEach((material) => {
    material.side = BackSide;
  });

  const geometry = new BoxGeometry(500, 500, 500);
  const skybox = new Mesh(geometry, materialArray);

  scene.add(skybox);
  return skybox;
}

async function addEarth(
  scene: Scene,
  loader: TextureLoader,
  sphereGeometry: SphereGeometry
) {
  const earthMaterial = new MeshStandardMaterial({
    map: await loader.loadAsync("/images/earth-spacex.png"),
    color: 0x191919,
  });
  const earth = new Mesh(sphereGeometry, earthMaterial);

  scene.add(earth);
  return earth;
}

type PositionKey = "x" | "y" | "z";

function addAtmosphere(
  scene: Scene,
  sphereGeometry: SphereGeometry,
  position: Partial<Record<PositionKey, number>> = {}
) {
  const material = new ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    side: BackSide,
    transparent: true,
    depthFunc: NeverDepth,
    blending: AdditiveBlending,
    uniforms: UniformsLib.lights,
  });
  const atmosphere = new Mesh(sphereGeometry, material);
  atmosphere.scale.set(0.908, 0.907, 0.907);

  Object.entries(position).forEach(([key, value]) => {
    atmosphere.position[key as PositionKey] = value;
  });

  scene.add(atmosphere);
  return atmosphere;
}

async function addRocketStage(
  scene: Scene,
  loader: TextureLoader,
  stage: 1 | 2
) {
  const rocketStage = new Sprite(
    new SpriteMaterial({
      map: await loader.loadAsync(`/images/stage-${stage}.png`),
      color: 0xffffff,
      depthWrite: false,
    })
  );

  loader.loadAsync(`/images/stage-${stage}.png`).then((texture) => {
    const { width, height } = texture.image;
    rocketStage.scale.set(width / 40, height / 40, 0);
  });

  scene.add(rocketStage);

  return rocketStage;
}

/**
 * Offset the camera inside a dolly
 * to prevent doing calculating position and rotation offset later
 *
 * @param {Camera instance} camera Camera to attach to the dolly
 * @returns 3DObject Dolly
 */
function addDolly(scene: Scene, camera: PerspectiveCamera) {
  const material = new MeshBasicMaterial();

  const dolly = new Mesh(new SphereGeometry(0, 0, 0), material);
  dolly.add(camera);

  // Initial dolly position
  dolly.position.z = 250;
  dolly.lookAt(new Vector3(0, 0, 0));

  // Position camera inside dolly
  camera.lookAt(new Vector3(0, 200, 0));
  camera.position.y = -120;

  scene.add(dolly);
  return dolly;
}

/**
 * Oversimplified position of the sun (light) given time of day.
 * Only tracks around the equator.
 *
 * @param {Light instance} light
 * @param {Date instance} date
 */
function getPositionAroundCircle(radius = 220, date = new Date()) {
  const directionalOffset = 4;
  const minutesInAnHour = 60;
  const minutesInADay = 1440;
  const minutesPassedToday =
    (date.getHours() - directionalOffset) * minutesInAnHour + date.getMinutes();

  const x =
    radius * Math.cos((2 * Math.PI * minutesPassedToday) / minutesInADay);
  const z =
    radius * Math.sin((2 * Math.PI * minutesPassedToday) / minutesInADay);

  return { x, z };
}

function createTextureLoader() {
  Cache.enabled = true;
  const manager = new LoadingManager();
  manager.onStart = function (url, itemsLoaded, itemsTotal) {};
  manager.onLoad = function () {};
  manager.onProgress = function (url, itemsLoaded, itemsTotal) {};
  manager.onError = function (url) {
    console.error("There was an error loading " + url);
  };

  return new TextureLoader(manager);
}

function createLinearInterpolationPath(
  telemetry: LaunchTelemetry<Date>[],
  altitudeScale: ScaleLinear<number, number>
) {
  const points: Vector3[] = [];

  telemetry.forEach(({ position: [lat, lon], altitude }, index) => {
    const nextTelemetry = telemetry[index + 1];
    if (nextTelemetry) {
      const {
        altitude: nextAlt,
        position: [nextLat, nextLon],
      } = nextTelemetry;

      const interpolate = geoInterpolate([lon, lat], [nextLon, nextLat]);
      const interpolateAlt = interpolateNumber(altitude, nextAlt);

      const factor = 100; // Arbitrarily chosen
      for (let i = 0; i < factor; i++) {
        const [lon, lat] = interpolate(i * (1 / factor));
        const alt = interpolateAlt(i * (1 / factor));
        const point = getPosition(lat, lon, radius + altitudeScale(alt));
        points.push(point);
      }
    } else {
      points.push(getPosition(lat, lon, radius + altitudeScale(altitude)));
    }
  });

  return new CatmullRomCurve3(points);
}

function addLights(scene: Scene, liftoffTime: Date) {
  const light = new SpotLight(0xffffff, 10, 1500);
  const { x, z } = getPositionAroundCircle(250, liftoffTime);
  light.position.set(x, 0, z);
  scene.add(light);
  scene.add(light.target);
  scene.add(new AmbientLight(0xffffff, 5));
  return light;
}

function addPath(
  scene: Scene,
  launch: LaunchData<Date>,
  altitudeScale: ScaleLinear<number, number>
) {
  const path = new Line(
    new TubeGeometry(
      createLinearInterpolationPath(launch.telemetry, altitudeScale),
      6000,
      0.12,
      8,
      false
    ),
    new MeshBasicMaterial({
      color: 0x9b9ea2,
      depthWrite: false,
    })
  );

  scene.add(path);
  return path;
}

export async function makeVisual(
  canvas: HTMLCanvasElement,
  launch: LaunchData<Date>,
  altitudeScale: ScaleLinear<number, number>
) {
  const renderer = createRenderer(
    window.innerWidth,
    window.innerHeight,
    canvas
  );

  const camera = createCamera();
  const loader = createTextureLoader();

  await Promise.all([
    loader.loadAsync("/images/skybox-stars-dark/nz.png"),
    loader.loadAsync("/images/skybox-stars-dark/pz.png"),
    loader.loadAsync("/images/skybox-stars-dark/py.png"),
    loader.loadAsync("/images/skybox-stars-dark/ny.png"),
    loader.loadAsync("/images/skybox-stars-dark/px.png"),
    loader.loadAsync("/images/skybox-stars-dark/nx.png"),
    loader.loadAsync("/images/earth-spacex.png"),
    loader.loadAsync(`/images/stage-1.png`),
    loader.loadAsync(`/images/stage-2.png`),
  ]);

  const scene = new Scene();

  // Sphere Geometry
  const widthSegments = 100;
  const heightSegments = 100;
  const sphereGeometry = new SphereBufferGeometry(
    radius,
    widthSegments,
    heightSegments
  );

  // Earth
  await addEarth(scene, loader, sphereGeometry);

  // Atmosphere
  addAtmosphere(
    scene,
    sphereGeometry,
    getPositionAroundCircle(3, launch.liftoffTime)
  );

  // Light
  const light = addLights(scene, launch.liftoffTime);

  // Skybox
  await addSkybox(scene, loader);

  addPath(scene, launch, altitudeScale);

  const stage1 = await addRocketStage(scene, loader, 1);
  const stage2 = await addRocketStage(scene, loader, 2);

  const rocketStages = {
    1: stage1,
    2: stage2,
  };

  const dolly = addDolly(scene, camera);

  // Move the sun every minute.
  setInterval(() => {
    const { x: lightX, z: lightZ } = getPositionAroundCircle(
      220,
      launch.liftoffTime
    );
    light.position.set(lightX, 0, lightZ);
  }, 1000 * 60); // Every minute

  function render() {
    if (doesNeedResize(renderer)) {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  const update: UpdateVisual = ({ position: [lat, lon], altitude, stage }) => {
    const scaledAltitude = altitudeScale(altitude);

    rocketStages[stage].position.copy(
      getPosition(
        lat,
        lon,
        100 + Math.max(scaledAltitude, 1) // 1 is an arbitrary value to prevent it from clipping into the ground.
      )
    );

    dolly.position.copy(getPosition(lat, lon, 250));
    dolly.lookAt(new Vector3(0, 0, 0));
  };

  update({
    stage: 1,
    altitude: 0,
    position: launch.telemetry[0].position,
  });

  requestAnimationFrame(render);

  return update;
}
