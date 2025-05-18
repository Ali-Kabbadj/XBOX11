import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  RefObject,
  useRef,
} from "react";
import { useGamepad } from "./GamepadContext";

// ======= Navigation Types =======
export interface NavigationItem {
  id: string;
  ref: RefObject<HTMLElement>;
  parentId: string | null;
  children: string[];
  disabled: boolean;
  lastActiveChildId?: string | null; // Track the last active child
}

export interface NavigationContextType {
  // Registration
  registerItem: (
    id: string,
    ref: RefObject<HTMLElement>,
    parentId: string | null,
    disabled?: boolean,
  ) => void;
  unregisterItem: (id: string) => void;

  // Navigation state
  activeItemId: string | null;
  focusItem: (id: string) => void;

  // Navigation helpers
  getItemById: (id: string) => NavigationItem | undefined;
  getParentId: (id: string) => string | null;
  getChildren: (id: string) => string[];

  // Navigation properties
  isActive: (id: string) => boolean;
  isChildActive: (id: string) => boolean;

  // Parent/child navigation configuration
  autoSelectFirstChild: boolean;
  rememberLastChild: boolean;
  setAutoSelectFirstChild: (value: boolean) => void;
  setRememberLastChild: (value: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

// Default actions for common controller buttons
export enum GamepadAction {
  SELECT = 0, // A on Xbox, X on PlayStation
  BACK = 1, // B on Xbox, O on PlayStation
  MENU = 9, // Start button
  OPTION = 8, // Select/Option button
  UP,
  LEFT,
  RIGHT,
  DOWN,
}

// ======= Provider Component =======
interface NavigationProviderProps {
  children: ReactNode;
  initialActiveId?: string | null;
  debounceMs?: number;
  onAction?: (action: GamepadAction, itemId: string) => void;
  onNavigationAction?: (...props: any) => void;
  autoSelectFirstChild?: boolean;
  rememberLastChild?: boolean;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  initialActiveId = null,
  debounceMs = 150,
  onAction,
  onNavigationAction,
  autoSelectFirstChild = true,
  rememberLastChild = true,
}) => {
  // Create a ref for tracking initialization
  const initializedRef = useRef(false);

  // Navigation state
  const [items, setItems] = useState<Record<string, NavigationItem>>({});
  const [activeItemId, setActiveItemId] = useState<string | null>(
    initialActiveId,
  );
  const [lastNavigationTime, setLastNavigationTime] = useState(0);
  const [autoSelectFirstChildState, setAutoSelectFirstChildState] =
    useState(autoSelectFirstChild);
  const [rememberLastChildState, setRememberLastChildState] =
    useState(rememberLastChild);

  // Cache for last navigation direction
  const lastDirectionRef = useRef<GamepadAction | null>(null);

  // Access gamepad context
  const { connected, getActionPressed, getButtonPressed } = useGamepad();

  // Register a new navigation item
  const registerItem = useCallback(
    (
      id: string,
      ref: RefObject<HTMLElement>,
      parentId: string | null = null,
      disabled: boolean = false,
    ) => {
      setItems((prev) => {
        // Create a new items object to avoid mutating prev
        const updated = { ...prev };

        // Check if item already exists with same properties
        if (
          prev[id] &&
          prev[id].parentId === parentId &&
          prev[id].disabled === disabled
        ) {
          return prev; // No change needed
        }

        // Preserve the lastActiveChildId if this item already exists
        const lastActiveChildId = prev[id]?.lastActiveChildId;

        // Create or update the current item
        updated[id] = {
          id,
          ref,
          parentId,
          // Keep existing children array or initialize empty array
          children: prev[id]?.children || [],
          disabled,
          lastActiveChildId,
        };

        // Handle parent-child relationship
        if (parentId) {
          // If this item has a new parent, remove it from its old parent's children
          if (prev[id] && prev[id].parentId && prev[id].parentId !== parentId) {
            const oldParentId = prev[id].parentId;
            if (updated[oldParentId]) {
              updated[oldParentId] = {
                ...updated[oldParentId],
                children: updated[oldParentId].children.filter(
                  (cid) => cid !== id,
                ),
              };
            }
          }

          // Make sure the parent exists
          if (!updated[parentId]) {
            // Create parent placeholder if it doesn't exist yet
            updated[parentId] = {
              id: parentId,
              ref: { current: null }, // Placeholder ref
              parentId: null,
              children: [],
              disabled: false,
            };
          }

          // Only add to children array if not already there
          if (!updated[parentId].children.includes(id)) {
            updated[parentId] = {
              ...updated[parentId],
              children: [...updated[parentId].children, id],
            };
          }
        } else if (prev[id] && prev[id].parentId) {
          // If item had a parent before but now doesn't, remove from old parent's children
          const oldParentId = prev[id].parentId;
          if (updated[oldParentId]) {
            updated[oldParentId] = {
              ...updated[oldParentId],
              children: updated[oldParentId].children.filter(
                (cid) => cid !== id,
              ),
            };
          }
        }

        return updated;
      });

      // Only set initial active item if not already set and this is a child
      if (initialActiveId === null && parentId !== null && !disabled) {
        setActiveItemId((currentActiveId) => {
          // Only set it if it's not already set
          if (currentActiveId === null) {
            return id;
          }
          return currentActiveId;
        });
      }
    },
    [initialActiveId],
  );

  // Unregister a navigation item
  const unregisterItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        // If item doesn't exist, no changes needed
        if (!prev[id]) return prev;

        const newItems = { ...prev };
        const item = newItems[id];

        // Remove this item from its parent's children list
        if (item.parentId && newItems[item.parentId]) {
          newItems[item.parentId] = {
            ...newItems[item.parentId],
            children: newItems[item.parentId].children.filter(
              (childId) => childId !== id,
            ),
          };
        }

        // If this was the active item, find a new active item
        if (activeItemId === id) {
          // Instead of setting the active ID directly,
          // return data for a separate effect to handle
          setTimeout(() => {
            setActiveItemId((currentActiveId) => {
              if (currentActiveId !== id) return currentActiveId;

              // Find a new ID to activate
              const newItems = { ...prev };
              delete newItems[id];

              // First try siblings
              if (item.parentId && newItems[item.parentId]) {
                const siblings = newItems[item.parentId].children;
                if (siblings.length > 0) {
                  const validSibling = siblings.find(
                    (sibId) => !newItems[sibId].disabled,
                  );
                  if (validSibling) return validSibling;
                } else {
                  // If no siblings, find first available child from another parent
                  const firstAvailableChild = Object.values(newItems)
                    .filter((i) => i.parentId !== null && !i.disabled)
                    .map((i) => i.id)[0];
                  if (firstAvailableChild) return firstAvailableChild;
                }
              }

              // If no valid siblings or other children found, return null
              return null;
            });
          }, 0);
        }

        // Delete the item
        delete newItems[id];
        return newItems;
      });
    },
    [activeItemId],
  );

  // Helper to get an item by id
  const getItemById = useCallback(
    (id: string) => {
      return items[id];
    },
    [items],
  );

  // Get parent ID for an item
  const getParentId = useCallback(
    (id: string) => {
      return items[id]?.parentId || null;
    },
    [items],
  );

  // Get children IDs for an item
  const getChildren = useCallback(
    (id: string) => {
      return items[id]?.children || [];
    },
    [items],
  );

  // Check if an item is the active one
  const isActive = useCallback(
    (id: string) => {
      return activeItemId === id;
    },
    [activeItemId],
  );

  // Check if an item has the active item as a descendant
  const isChildActive = useCallback(
    (id: string) => {
      if (!activeItemId || activeItemId === id) return false;

      // Walk up from active item to see if we find this id
      let currentId = activeItemId;
      while (currentId) {
        const parentId = items[currentId]?.parentId;
        if (parentId === id) return true;
        if (!parentId) break;
        currentId = parentId;
      }

      return false;
    },
    [activeItemId, items],
  );

  // Update the last active child for a parent
  const updateLastActiveChild = useCallback(
    (childId: string) => {
      const parentId = items[childId]?.parentId;
      if (!parentId) return;

      setItems((prev) => ({
        ...prev,
        [parentId]: {
          ...prev[parentId],
          lastActiveChildId: childId,
        },
      }));
    },
    [items],
  );

  // Get the best child to focus for a parent
  const getBestChildToFocus = useCallback(
    (parentId: string) => {
      const parent = items[parentId];
      if (!parent || !parent.children.length) return null;

      // 1. If we're remembering the last active child, try that first
      if (rememberLastChildState && parent.lastActiveChildId) {
        const lastActiveChild = items[parent.lastActiveChildId];
        if (lastActiveChild && !lastActiveChild.disabled) {
          return parent.lastActiveChildId;
        }
      }

      // 2. Otherwise, get the first non-disabled child
      return (
        parent.children.find((childId) => !items[childId]?.disabled) || null
      );
    },
    [items, rememberLastChildState],
  );

  // Focus a specific item
  const focusItem = useCallback(
    (id: string) => {
      if (!items[id] || items[id].disabled) return;

      // If this is a parent with children and we should auto-select children
      // if (autoSelectFirstChildState && items[id].children.length > 0) {
      if (items[id].children.length > 0) {
        const childToFocus = getBestChildToFocus(id);

        if (childToFocus) {
          setActiveItemId(childToFocus);
          // Auto-scroll the child into view
          items[childToFocus].ref.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
          return;
        }
      }

      // If item has a parent, update the parent's lastActiveChildId
      if (items[id].parentId) {
        updateLastActiveChild(id);
      }

      setActiveItemId(id);
      // Auto-scroll the item into view
      items[id].ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    },
    [
      items,
      // autoSelectFirstChildState,
      getBestChildToFocus,
      updateLastActiveChild,
    ],
  );

  // Helper to get all items within a specific parent
  const getItemsInParent = useCallback(
    (parentId: string | null) => {
      return Object.values(items).filter(
        (item) => item.parentId === parentId && !item.disabled,
      );
    },
    [items],
  );

  // const arraysEqual = (a: string | any[], b: string | any[]) => {
  //   if (a.length !== b.length) return false;
  //   const sortedA = [...a].sort();
  //   const sortedB = [...b].sort();
  //   return sortedA.every((val, i) => val === sortedB[i]);
  // };

  // Get all parent items
  const getAllParentItems = useCallback(() => {
    // Only get true parent items (those with parentId === null)
    const rootParents = Object.values(items).filter(
      (item) => item.parentId === null && !item.disabled,
    );

    // Make sure all parents have their children array properly populated
    const parentsWithValidChildren = rootParents.map((parent) => {
      // Ensure parent's children array includes all items that reference it
      const childrenIds = Object.values(items)
        .filter((item) => item.parentId === parent.id)
        .map((item) => item.id);

      // If the children array doesn't match what should be there, create an updated parent
      // if (!arraysEqual(parent.children, childrenIds)) {
      //   // This is just for logging - not actually updating the state
      //   console.log(`Parent ${parent.id} has mismatched children:`, {
      //     current: parent.children,
      //     should: childrenIds,
      //   });
      // }

      return parent;
    });

    return parentsWithValidChildren;
  }, [items]);

  const getSpatialMap = useCallback(() => {
    const parents = getAllParentItems();
    const itemMap: {
      [parentId: string]: {
        item: NavigationItem;
        children: NavigationItem[];
        rect: DOMRect | null;
      };
    } = {};

    parents.forEach((parent) => {
      // Get all children that reference this parent
      const children = Object.values(items).filter(
        (item) => item.parentId === parent.id && !item.disabled,
      );

      const childrenWithRects = children.map((child) => {
        const rect = child.ref.current?.getBoundingClientRect() || null;
        return { item: child, rect };
      });

      // Sort children horizontally (left to right)
      childrenWithRects.sort((a, b) => {
        if (!a.rect || !b.rect) return 0;
        return a.rect.left - b.rect.left;
      });

      itemMap[parent.id] = {
        item: parent,
        children: children,
        rect: parent.ref.current?.getBoundingClientRect() || null,
      };
    });

    return itemMap;
  }, [items, getAllParentItems]);

  // Find the best sibling item in horizontal navigation (with wraparound)
  const findHorizontalSibling = useCallback(
    (direction: GamepadAction.LEFT | GamepadAction.RIGHT) => {
      if (!activeItemId || !items[activeItemId]) return null;

      const currentItem = items[activeItemId];
      const parentId = currentItem.parentId;

      if (!parentId) return null;

      const siblings = getItemsInParent(parentId);
      if (siblings.length <= 1) return null;

      // Create an array of siblings with their positions
      const siblingsWithPos = siblings.map((item) => {
        const rect = item.ref.current?.getBoundingClientRect();
        return { item, left: rect?.left || 0, right: rect?.right || 0 };
      });

      // Sort siblings by horizontal position
      siblingsWithPos.sort((a, b) => a.left - b.left);

      // Find the current index in the sorted array
      const currentIndex = siblingsWithPos.findIndex(
        (item) => item.item.id === activeItemId,
      );
      if (currentIndex === -1) return null;

      let targetIndex;
      if (direction === GamepadAction.RIGHT) {
        // Move right (with wraparound)
        targetIndex = (currentIndex + 1) % siblingsWithPos.length;
      } else {
        // Move left (with wraparound)
        targetIndex =
          (currentIndex - 1 + siblingsWithPos.length) % siblingsWithPos.length;
      }

      return siblingsWithPos[targetIndex].item.id;
    },
    [activeItemId, items, getItemsInParent],
  );

  // Find item in the row above/below that aligns with current column position
  const findVerticalSibling = useCallback(
    (direction: GamepadAction.UP | GamepadAction.DOWN) => {
      if (!activeItemId || !items[activeItemId]) return null;

      const currentItem = items[activeItemId];
      if (!currentItem.parentId) {
        console.log("no parrent returning null");
        return null;
      }

      const currentRect = currentItem.ref.current?.getBoundingClientRect();
      if (!currentRect) {
        console.log("no currentRect returning null");
        return null;
      }

      // Get the horizontal center of the current item
      const currentCenterX = currentRect.left + currentRect.width / 2;

      // Build a spatial map of all parents and their children
      const spatialMap = getSpatialMap();

      // Get all parent rects and sort them vertically
      const parentRects = Object.values(spatialMap)
        .filter((p) => p.rect !== null)
        .sort((a, b) => {
          // TypeScript check to make sure rect isn't null
          if (!a.rect || !b.rect) return 0;
          return a.rect.top - b.rect.top;
        });

      // Find the current parent's position in the vertical order
      const currentParentIndex = parentRects.findIndex(
        (p) => p.item.id === currentItem.parentId,
      );

      if (currentParentIndex === -1) {
        console.log("currentParentIndex = ", currentParentIndex);
        return null;
      }

      let targetParentIndex;
      if (direction === GamepadAction.UP) {
        // Move up with wraparound
        targetParentIndex =
          (currentParentIndex - 1 + parentRects.length) % parentRects.length;
      } else {
        // Move down with wraparound
        targetParentIndex = (currentParentIndex + 1) % parentRects.length;
      }

      const targetParent = parentRects[targetParentIndex];

      // Find the child in the target parent that best aligns with current X position
      let bestChild = null as unknown as NavigationItem;
      let bestDistance = Infinity;

      targetParent.children.forEach((child) => {
        const childRect = child.ref.current?.getBoundingClientRect();
        if (!childRect) {
          console.log("No childRect, returning");
          return;
        }

        const childCenterX = childRect.left + childRect.width / 2;
        const distance = Math.abs(childCenterX - currentCenterX);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestChild = child;
        }
      });
      return bestChild ? bestChild.id : null;
    },
    [activeItemId, items, getSpatialMap],
  );

  // Navigate to parent (move up in hierarchy)
  const navigateToParent = useCallback(() => {
    if (!activeItemId) return;

    const parentId = items[activeItemId]?.parentId;
    if (parentId && !items[parentId].disabled) {
      // Update parent's lastActiveChildId to remember the current selection
      updateLastActiveChild(activeItemId);

      // When going up to parent, we want to actually select the parent
      // rather than another child (different from PS5 behavior where it would auto-select a child)
      setActiveItemId(parentId);
      items[parentId].ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      return true;
    }

    return false;
  }, [activeItemId, items, updateLastActiveChild]);

  // Navigate to first child (move down in hierarchy)
  const navigateToChild = useCallback(() => {
    if (!activeItemId) return;

    const children = items[activeItemId]?.children || [];
    if (children.length === 0) return false;

    const childToFocus = getBestChildToFocus(activeItemId);

    if (childToFocus) {
      focusItem(childToFocus);
      return true;
    }

    return false;
  }, [activeItemId, items, getBestChildToFocus, focusItem]);

  // Handle directional navigation
  useEffect(() => {
    if (!connected || !activeItemId) return;

    const now = Date.now();
    if (now - lastNavigationTime < debounceMs) return;

    const action = getActionPressed();
    if (action === null) return;

    // Store the direction for smarter navigation
    lastDirectionRef.current = action;

    // Prevent navigation during the first render
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    // Determine navigation strategy based on direction
    let nextItemId: string | null = null;
    switch (action) {
      case GamepadAction.LEFT:
      case GamepadAction.RIGHT:
        // Horizontal navigation with wraparound
        nextItemId = findHorizontalSibling(action);
        if (onNavigationAction) {
          onNavigationAction(action, nextItemId);
        }
        break;

      case GamepadAction.UP:
      case GamepadAction.DOWN:
        // Vertical navigation prioritizing column alignment
        nextItemId = findVerticalSibling(action);
        break;
    }

    if (nextItemId) {
      focusItem(nextItemId);
      setLastNavigationTime(now);
    }
  }, [
    connected,
    activeItemId,
    getActionPressed,
    lastNavigationTime,
    debounceMs,
    findHorizontalSibling,
    findVerticalSibling,
    navigateToParent,
    navigateToChild,
    focusItem,
  ]);

  //Handle button presses
  useEffect(() => {
    if (!connected || !activeItemId || !onAction) {
      return;
    }

    const action = getButtonPressed();
    if (action != null && action > -1) {
      onAction(action as GamepadAction, activeItemId);
    }
  }, [connected, activeItemId, getButtonPressed, onAction]);

  // Make sure a child is always selected on initialization
  useEffect(() => {
    // If no item is selected yet, find the first available child
    if (activeItemId === null && Object.keys(items).length > 0) {
      // Find all children (items with parents)
      const allChildren = Object.values(items).filter(
        (item) => item.parentId !== null && !item.disabled,
      );

      if (allChildren.length > 0) {
        // Select the first available child
        focusItem(allChildren[0].id);
      }
    }
  }, [items, activeItemId, focusItem, onNavigationAction]);

  // Context value
  const contextValue: NavigationContextType = {
    registerItem,
    unregisterItem,
    activeItemId,
    focusItem,
    getItemById,
    getParentId,
    getChildren,
    isActive,
    isChildActive,
    autoSelectFirstChild: autoSelectFirstChildState,
    rememberLastChild: rememberLastChildState,
    setAutoSelectFirstChild: setAutoSelectFirstChildState,
    setRememberLastChild: setRememberLastChildState,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

// Custom hook to use the navigation context
export const useNavigation = () => {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }

  return context;
};
