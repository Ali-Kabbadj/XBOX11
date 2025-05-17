import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { GamepadAction } from "./NavigationSystem";

// ======= Types =======
export type ButtonState = {
  name: string;
  pressed: boolean;
  value: number;
  index: number;
};

export type AxisState = {
  name: string;
  value: number;
  index: number;
};

export type DetectedType = "xbox" | "ds4" | "generic";

export interface GamepadState {
  id: string;
  index: number;
  mapping: string;
  detectedType: DetectedType;
  buttons: ButtonState[];
  axes: AxisState[];
  connected: boolean;
}

// Directions for navigation
// export enum Direction {
//   UP,
//   RIGHT,
//   DOWN,
//   LEFT,
// }

export enum Direction {
  UP,
  LEFT,
  RIGHT,
  DOWN,
}

interface GamepadContextType {
  gamepads: Record<number, GamepadState>;
  activeGamepad: GamepadState | null;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  connected: boolean;
  lastButtonPressed: number | null;
  isButtonPressed: (buttonIndex: number) => boolean;
  wasButtonJustPressed: (buttonIndex: number) => boolean;
  getDirectionPressed: () => Direction | null;
  getButtonPressed: () => GamepadAction | null;
  axisValues: number[];
}

const GamepadContext = createContext<GamepadContextType | null>(null);

// Button pressed state tracking for edge detection
const previousButtonStates: Record<number, boolean[]> = {};

// Constants
const AXIS_THRESHOLD = 0.5;
const DEFAULT_POLL_INTERVAL = 16; // ~60fps

// ======= Provider Component =======
interface GamepadProviderProps {
  children: ReactNode;
  pollInterval?: number;
}

export const GamepadProvider = ({
  children,
  pollInterval = DEFAULT_POLL_INTERVAL,
}: GamepadProviderProps) => {
  // Store all normalized gamepads by index
  const [gamepads, setGamepads] = useState<Record<number, GamepadState>>({});
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [justPressedButtons, setJustPressedButtons] = useState<
    Record<number, boolean[]>
  >({});

  // Detect pad type from ID
  const detectType = (id: string): DetectedType => {
    const lc = id.toLowerCase();
    if (lc.includes("xbox") || lc.includes("xinput")) {
      return "xbox";
    }
    if (
      lc.includes("sony") ||
      lc.includes("ps") ||
      lc.includes("dualshock") ||
      lc.includes("playstation")
    ) {
      return "ds4";
    }
    return "generic";
  };

  // Normalize and update all gamepads
  const updateGamepadState = useCallback(async () => {
    const raw = navigator.getGamepads();

    setGamepads((prevGamepads) => {
      const updated = { ...prevGamepads };
      const newJustPressed: Record<number, boolean[]> = {};

      for (let i = 0; i < raw.length; i++) {
        const gp = raw[i];
        if (!gp) continue;

        const type = detectType(gp.id);

        // Track button edge detection (just pressed)
        const buttonStates = gp.buttons.map((b) => b.pressed);

        // Initialize previous states if needed
        if (!previousButtonStates[i]) {
          previousButtonStates[i] = new Array(buttonStates.length).fill(false);
        }

        // Calculate which buttons were just pressed this frame
        newJustPressed[i] = buttonStates.map(
          (isPressed, idx) => isPressed && !previousButtonStates[i][idx],
        );

        // Update previous states for next frame
        previousButtonStates[i] = [...buttonStates];

        updated[i] = {
          id: gp.id,
          index: i,
          mapping: gp.mapping,
          detectedType: type,
          buttons: gp.buttons.map((b, idx) => ({
            name: `Button ${idx}`,
            pressed: b.pressed,
            value: b.value,
            index: idx,
          })),
          axes: gp.axes.map((v, idx) => ({
            name: `Axis ${idx}`,
            value: v,
            index: idx,
          })),
          connected: true,
        };
      }

      // Mark disconnects
      Object.keys(prevGamepads).forEach((key) => {
        const idx = Number(key);
        if (!raw[idx] && updated[idx]?.connected) {
          updated[idx] = { ...updated[idx], connected: false };
        }
      });
      return updated;
    });

    // Set active index in a separate state update
    setJustPressedButtons((newJustPressed) => {
      // Update active index outside the gamepads state update
      const currentRaw = navigator.getGamepads();
      if (activeIndex === null) {
        for (let i = 0; i < currentRaw.length; i++) {
          if (currentRaw[i]) {
            setActiveIndex(i);
            break;
          }
        }
      } else if (!currentRaw[activeIndex]) {
        setActiveIndex(null);
      }
      return newJustPressed;
    });
  }, []);

  useEffect(() => {
    // Handle new connection
    const onConnect = async (e: GamepadEvent) => {
      const type = detectType(e.gamepad.id);
      // await maybeLoadPolyfill(type);

      setGamepads((prev) => ({
        ...prev,
        [e.gamepad.index]: {
          id: e.gamepad.id,
          index: e.gamepad.index,
          mapping: e.gamepad.mapping,
          detectedType: type,
          buttons: e.gamepad.buttons.map((b, idx) => ({
            name: `Button ${idx}`,
            pressed: b.pressed,
            value: b.value,
            index: idx,
          })),
          axes: e.gamepad.axes.map((v, idx) => ({
            name: `Axis ${idx}`,
            value: v,
            index: idx,
          })),
          connected: true,
        },
      }));

      if (activeIndex === null) setActiveIndex(e.gamepad.index);
    };

    // Handle disconnection
    const onDisconnect = (e: GamepadEvent) => {
      window.location.reload();
      setGamepads((prev) => ({
        ...prev,
        [e.gamepad.index]: {
          ...prev[e.gamepad.index],
          connected: false,
        },
      }));

      if (activeIndex === e.gamepad.index) setActiveIndex(null);
    };

    window.addEventListener("gamepadconnected", onConnect);
    window.addEventListener("gamepaddisconnected", onDisconnect);
    // Start polling
    const loop = setInterval(updateGamepadState, pollInterval);
    return () => {
      window.removeEventListener("gamepadconnected", onConnect);
      window.removeEventListener("gamepaddisconnected", onDisconnect);
      clearInterval(loop);
    };
  }, []);

  // Derived values
  const activeGamepad = activeIndex !== null ? gamepads[activeIndex] : null;
  const connected = Boolean(activeGamepad?.connected);

  const lastButtonPressed = useMemo<number | null>(() => {
    if (!activeGamepad) return null;
    const btn = activeGamepad.buttons.find((b) => b.pressed);
    return btn ? btn.index : null;
  }, [activeGamepad]);

  const axisValues = useMemo(() => {
    if (!activeGamepad) return [];
    return activeGamepad.axes.map((a) => a.value);
  }, [activeGamepad]);

  // Helper functions for components to use
  const isButtonPressed = useCallback(
    (buttonIndex: number): boolean => {
      if (!activeGamepad) return false;
      const button = activeGamepad.buttons[buttonIndex];
      return button?.pressed || false;
    },
    [activeGamepad],
  );

  const wasButtonJustPressed = useCallback(
    (buttonIndex: number): boolean => {
      if (!activeGamepad || !activeIndex) return false;
      return justPressedButtons[activeIndex]?.[buttonIndex] || false;
    },
    [activeIndex, justPressedButtons],
  );

  const getDirectionPressed = useCallback((): Direction | null => {
    if (!activeGamepad) return null;

    // Check D-pad (assumes standard mapping)
    // Common button mappings for d-pad: 12=up, 13=down, 14=left, 15=right
    if (isButtonPressed(16)) return Direction.UP;
    if (isButtonPressed(19)) return Direction.RIGHT;
    if (isButtonPressed(17)) return Direction.DOWN;
    if (isButtonPressed(18)) return Direction.LEFT;

    // Check analog sticks
    // Left stick is usually axes 0 (horizontal) and 1 (vertical)
    if (activeGamepad.axes.length >= 2) {
      const horizontalAxis = activeGamepad.axes[1].value;
      const verticalAxis = activeGamepad.axes[2].value;

      if (verticalAxis < -AXIS_THRESHOLD) return Direction.DOWN;
      if (horizontalAxis > AXIS_THRESHOLD) return Direction.RIGHT;
      if (verticalAxis > AXIS_THRESHOLD) return Direction.UP;
      if (horizontalAxis < -AXIS_THRESHOLD) return Direction.LEFT;
    }

    return null;
  }, [activeGamepad, isButtonPressed]);

  const getButtonPressed = useCallback((): GamepadAction | null => {
    if (!activeGamepad) return null;
    if (isButtonPressed(1)) return GamepadAction.SELECT;
    if (isButtonPressed(2)) return GamepadAction.BACK;
    if (isButtonPressed(12)) return GamepadAction.MENU;
    if (isButtonPressed(11)) return GamepadAction.OPTION;

    return null;
  }, [activeGamepad, isButtonPressed]);

  // Value for the context
  const contextValue: GamepadContextType = {
    gamepads,
    activeGamepad,
    activeIndex,
    setActiveIndex,
    connected,
    lastButtonPressed,
    isButtonPressed,
    wasButtonJustPressed,
    getDirectionPressed,
    axisValues,
    getButtonPressed,
  };

  return (
    <GamepadContext.Provider value={contextValue}>
      {children}
    </GamepadContext.Provider>
  );
};

// Custom hook to use the gamepad context
export const useGamepad = () => {
  const context = useContext(GamepadContext);

  if (!context) {
    throw new Error("useGamepad must be used within a GamepadProvider");
  }
  return context;
};
