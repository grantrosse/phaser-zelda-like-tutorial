import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as Phaser from "phaser";

// ─── Scene imports ──────────────────────────────────────────────────────────
// These are the robot simulation scenes we created in src/robot/
import { RobotPreloadScene } from "./src/robot/robot-preload-scene";
import { RobotScene } from "./src/robot/robot-scene";
import { RobotUIScene } from "./src/robot/robot-ui-scene";
import { ROBOT_EVENT_BUS, ROBOT_EVENTS } from "./src/robot/robot-events";

// ─── Scene key constants (duplicated here to avoid .ts import issues in JSX)
const SCENE_KEYS = {
  ROBOT_PRELOAD_SCENE: "ROBOT_PRELOAD_SCENE",
  ROBOT_SCENE: "ROBOT_SCENE",
  ROBOT_UI_SCENE: "ROBOT_UI_SCENE",
};

// ─── Default config ─────────────────────────────────────────────────────────

const DEFAULT_ROBOT_CONFIG = {
  chassisKey: "rover",
  color: "#4fc3f7",
};

const DEFAULT_WORLD_SIZE = 400;

// ─── Styles ─────────────────────────────────────────────────────────────────

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "12px",
  padding: "16px",
};

const canvasContainerStyle = {
  border: "2px solid #1a3a5c",
  borderRadius: "12px",
  overflow: "hidden",
  background: "#0a1628",
};

const controlBarStyle = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "center",
};

const btnBase = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #1a3a5c",
  background: "#0c1a2e",
  color: "#8ab4f8",
  fontSize: "13px",
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 0.15s, border-color 0.15s",
};

const btnActive = {
  ...btnBase,
  background: "#1a3a5c",
  borderColor: "#4fc3f7",
  color: "#4fc3f7",
};

// ─── PhaserGame Component ───────────────────────────────────────────────────

/**
 * PhaserGame -- React component that boots a Phaser game instance
 * with the robot simulation scenes.
 *
 * Props:
 *   commands     - Array of command primitives to execute
 *   obstacles    - Array of obstacle configs to place in the world
 *   robotConfig  - Robot configuration (chassisKey, color, ports)
 *   worldSize    - World size in pixels (default 400)
 *   onEvent      - Callback for game events (goal reached, collision, etc.)
 *   autoStart    - Whether to start executing commands immediately (default true)
 */
const PhaserGame = forwardRef(function PhaserGame(
  {
    commands = [],
    obstacles = [],
    robotConfig = DEFAULT_ROBOT_CONFIG,
    worldSize = DEFAULT_WORLD_SIZE,
    onEvent,
    autoStart = true,
  },
  ref
) {
  const gameContainerRef = useRef(null);
  const gameRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // ── Create/destroy Phaser game instance ─────────────────────────────────

  useEffect(() => {
    if (!gameContainerRef.current) return;

    // Clean up any existing game
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    const sceneData = {
      commands: commands || [],
      obstacles: obstacles || [],
      robotConfig: robotConfig || DEFAULT_ROBOT_CONFIG,
      worldSize: worldSize || DEFAULT_WORLD_SIZE,
    };

    const config = {
      type: Phaser.WEBGL,
      pixelArt: true,
      roundPixels: true,
      parent: gameContainerRef.current,
      width: worldSize || DEFAULT_WORLD_SIZE,
      height: worldSize || DEFAULT_WORLD_SIZE,
      backgroundColor: "#0a1628",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);

    game.scene.add(SCENE_KEYS.ROBOT_PRELOAD_SCENE, RobotPreloadScene);
    game.scene.add(SCENE_KEYS.ROBOT_SCENE, RobotScene);
    game.scene.add(SCENE_KEYS.ROBOT_UI_SCENE, RobotUIScene);

    // Start preload scene with our data
    game.scene.start(SCENE_KEYS.ROBOT_PRELOAD_SCENE, sceneData);

    gameRef.current = game;

    // Set initial state
    if (commands && commands.length > 0 && autoStart) {
      setIsRunning(true);
      setIsDone(false);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
    // We intentionally only recreate the game when key structural data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Event forwarding ────────────────────────────────────────────────────

  useEffect(() => {
    if (!onEvent) return;

    const forward = (eventName) => (...args) => {
      onEvent({ type: eventName, data: args });
    };

    const handlers = {};
    const events = [
      ROBOT_EVENTS.COMMAND_START,
      ROBOT_EVENTS.COMMAND_COMPLETE,
      ROBOT_EVENTS.ALL_COMMANDS_DONE,
      ROBOT_EVENTS.GOAL_REACHED,
      ROBOT_EVENTS.COLLISION,
      ROBOT_EVENTS.SENSOR_READING,
      ROBOT_EVENTS.OBJECT_PICKED_UP,
      ROBOT_EVENTS.OBJECT_DROPPED,
    ];

    for (const evt of events) {
      handlers[evt] = forward(evt);
      ROBOT_EVENT_BUS.on(evt, handlers[evt]);
    }

    return () => {
      for (const evt of events) {
        ROBOT_EVENT_BUS.off(evt, handlers[evt]);
      }
    };
  }, [onEvent]);

  // ── Track status via events ─────────────────────────────────────────────

  useEffect(() => {
    const onAllDone = () => {
      setIsRunning(false);
      setIsDone(true);
      setIsPaused(false);
    };
    const onCmdsLoaded = () => {
      setIsRunning(true);
      setIsDone(false);
      setIsPaused(false);
    };

    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.ALL_COMMANDS_DONE, onAllDone);
    ROBOT_EVENT_BUS.on(ROBOT_EVENTS.COMMANDS_LOADED, onCmdsLoaded);

    return () => {
      ROBOT_EVENT_BUS.off(ROBOT_EVENTS.ALL_COMMANDS_DONE, onAllDone);
      ROBOT_EVENT_BUS.off(ROBOT_EVENTS.COMMANDS_LOADED, onCmdsLoaded);
    };
  }, []);

  // ── Update commands when props change ───────────────────────────────────

  useEffect(() => {
    if (!gameRef.current) return;

    const robotScene = gameRef.current.scene.getScene(SCENE_KEYS.ROBOT_SCENE);
    if (robotScene && robotScene.scene.isActive()) {
      robotScene.updateCommands(commands || []);
    }
  }, [commands]);

  // ── Update obstacles when props change ──────────────────────────────────

  useEffect(() => {
    if (!gameRef.current) return;

    const robotScene = gameRef.current.scene.getScene(SCENE_KEYS.ROBOT_SCENE);
    if (robotScene && robotScene.scene.isActive()) {
      robotScene.updateObstacles(obstacles || []);
    }
  }, [obstacles]);

  // ── Control handlers ──────────────────────────────────────────────────────

  const handlePlay = useCallback(() => {
    ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.PLAY);
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const handlePause = useCallback(() => {
    ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.PAUSE);
    setIsPaused(true);
  }, []);

  const handleReset = useCallback(() => {
    ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.RESET);
    setIsRunning(false);
    setIsPaused(false);
    setIsDone(false);

    // Reload commands after a brief delay to allow reset to complete
    setTimeout(() => {
      if (gameRef.current) {
        const robotScene = gameRef.current.scene.getScene(SCENE_KEYS.ROBOT_SCENE);
        if (robotScene && robotScene.scene.isActive() && commands && commands.length > 0) {
          robotScene.updateCommands(commands);
        }
      }
    }, 100);
  }, [commands]);

  const handleRerun = useCallback(() => {
    handleReset();
    setTimeout(() => {
      ROBOT_EVENT_BUS.emit(ROBOT_EVENTS.PLAY);
      setIsRunning(true);
    }, 200);
  }, [handleReset]);

  // ── Imperative handle for parent ref ──────────────────────────────────────

  useImperativeHandle(
    ref,
    () => ({
      play: handlePlay,
      pause: handlePause,
      reset: handleReset,
      rerun: handleRerun,
      loadCommands: (cmds) => {
        if (gameRef.current) {
          const robotScene = gameRef.current.scene.getScene(SCENE_KEYS.ROBOT_SCENE);
          if (robotScene && robotScene.scene.isActive()) {
            robotScene.updateCommands(cmds);
          }
        }
      },
      loadObstacles: (obs) => {
        if (gameRef.current) {
          const robotScene = gameRef.current.scene.getScene(SCENE_KEYS.ROBOT_SCENE);
          if (robotScene && robotScene.scene.isActive()) {
            robotScene.updateObstacles(obs);
          }
        }
      },
    }),
    [handlePlay, handlePause, handleReset, handleRerun]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={containerStyle}>
      {/* Phaser canvas container */}
      <div
        ref={gameContainerRef}
        style={{
          ...canvasContainerStyle,
          width: worldSize || DEFAULT_WORLD_SIZE,
          height: worldSize || DEFAULT_WORLD_SIZE,
        }}
      />

      {/* Control bar */}
      <div style={controlBarStyle}>
        {isPaused ? (
          <button onClick={handlePlay} style={btnActive}>
            ▶ Resume
          </button>
        ) : isRunning ? (
          <button onClick={handlePause} style={btnBase}>
            ⏸ Pause
          </button>
        ) : (
          <button onClick={handlePlay} style={btnActive}>
            ▶ Play
          </button>
        )}
        <button onClick={handleReset} style={btnBase}>
          ↺ Reset
        </button>
        {isDone && (
          <button onClick={handleRerun} style={btnActive}>
            🔁 Rerun
          </button>
        )}
        <span
          style={{
            fontSize: "11px",
            color: isDone ? "#ffb74d" : isRunning ? "#66bb6a" : "#3a5a7a",
            fontWeight: 800,
          }}
        >
          {isDone
            ? "✓ Complete"
            : isRunning
            ? isPaused
              ? "⏸ Paused"
              : "● Running"
            : "○ Ready"}
        </span>
      </div>
    </div>
  );
});

export default PhaserGame;
