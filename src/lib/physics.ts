import Matter from "matter-js";

const NOTE_WIDTH = 150;
const NOTE_HEIGHT = 150;
const WALL_THICKNESS = 60;

export interface PhysicsEngine {
  engine: Matter.Engine;
  runner: Matter.Runner;
  mouse: Matter.Mouse;
  mouseConstraint: Matter.MouseConstraint;
  addNoteBody: (id: string, x: number, y: number, angle: number) => Matter.Body;
  removeNoteBody: (id: string) => void;
  getBodies: () => Map<string, Matter.Body>;
  resize: (width: number, height: number) => void;
  destroy: () => void;
}

export function createPhysicsEngine(
  container: HTMLElement
): PhysicsEngine {
  const engine = Matter.Engine.create({
    enableSleeping: true,
  });

  engine.gravity.y = 1;

  const runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);

  const width = window.innerWidth;
  const height = window.innerHeight;

  const floor = Matter.Bodies.rectangle(
    width / 2, height + WALL_THICKNESS / 2, width * 3, WALL_THICKNESS,
    { isStatic: true, label: "floor" }
  );
  const leftWall = Matter.Bodies.rectangle(
    -WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height * 3,
    { isStatic: true, label: "leftWall" }
  );
  const rightWall = Matter.Bodies.rectangle(
    width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height * 3,
    { isStatic: true, label: "rightWall" }
  );

  Matter.Composite.add(engine.world, [floor, leftWall, rightWall]);

  const mouse = Matter.Mouse.create(container);
  const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: 0.2,
      render: { visible: false },
    },
  });
  Matter.Composite.add(engine.world, mouseConstraint);

  const bodies = new Map<string, Matter.Body>();

  function addNoteBody(id: string, x: number, y: number, angle: number): Matter.Body {
    const body = Matter.Bodies.rectangle(x, y, NOTE_WIDTH, NOTE_HEIGHT, {
      restitution: 0.3,
      friction: 0.5,
      frictionAir: 0.02,
      angle,
      label: id,
      sleepThreshold: 60,
    });
    bodies.set(id, body);
    Matter.Composite.add(engine.world, body);
    return body;
  }

  function removeNoteBody(id: string) {
    const body = bodies.get(id);
    if (body) {
      Matter.Composite.remove(engine.world, body);
      bodies.delete(id);
    }
  }

  function resize(newWidth: number, newHeight: number) {
    Matter.Body.setPosition(floor, { x: newWidth / 2, y: newHeight + WALL_THICKNESS / 2 });
    Matter.Body.setPosition(rightWall, { x: newWidth + WALL_THICKNESS / 2, y: newHeight / 2 });
    Matter.Body.setPosition(leftWall, { x: -WALL_THICKNESS / 2, y: newHeight / 2 });
  }

  function destroy() {
    Matter.Runner.stop(runner);
    Matter.Engine.clear(engine);
    bodies.clear();
  }

  return {
    engine,
    runner,
    mouse,
    mouseConstraint,
    addNoteBody,
    removeNoteBody,
    getBodies: () => bodies,
    resize,
    destroy,
  };
}
