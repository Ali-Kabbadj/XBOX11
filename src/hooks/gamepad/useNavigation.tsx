
import { useGamepad } from "@/contexts/gamepad/GamepadContext";
import { GamepadAction, useNavigation } from "@/contexts/gamepad/NavigationSystem";
import { useEffect, useCallback, useRef } from "react";

interface UseNavigableOptionsProps {
  onSelect?: () => void;
  onBack?: () => void;
  onMenu?: () => void;
  onOption?: () => void;
}

/**
 * Hook that combines gamepad and navigation capabilities with common actions
 *
 * @param id The id of the navigable item
 * @param parentId Optional parent id
 * @param disabled Whether this item is disabled
 * @param options Optional callbacks for common gamepad actions
 */
export const useNavigable = (
  id: string,
  parentId: string | null = null,
  disabled: boolean = false,
  options: UseNavigableOptionsProps = {},
) => {
  const { registerItem, unregisterItem, isActive, focusItem } = useNavigation();
  const { wasButtonJustPressed } = useGamepad();

  // Extract callback options
  const { onSelect, onBack, onMenu, onOption } = options;

  // Create a dummy ref for non-Navigable component registration
  const dummyRef = useRef(null);

  // Handle registering and unregistering
  useEffect(() => {
    registerItem(id, dummyRef, parentId, disabled);

    return () => {
      unregisterItem(id);
    };
  }, [id, parentId, disabled, registerItem, unregisterItem]);

  // Handle button presses for active item
  useEffect(() => {
    if (!isActive(id) || disabled) return;

    const handleButtonPress = () => {
      if (wasButtonJustPressed(GamepadAction.SELECT) && onSelect) {
        onSelect();
        return true;
      }

      if (wasButtonJustPressed(GamepadAction.BACK) && onBack) {
        onBack();
        return true;
      }

      if (wasButtonJustPressed(GamepadAction.MENU) && onMenu) {
        onMenu();
        return true;
      }

      if (wasButtonJustPressed(GamepadAction.OPTION) && onOption) {
        onOption();
        return true;
      }

      return false;
    };

    handleButtonPress();
  }, [
    id,
    disabled,
    isActive,
    wasButtonJustPressed,
    onSelect,
    onBack,
    onMenu,
    onOption,
  ]);

  // Convenient way to focus this item
  const focus = useCallback(() => {
    if (!disabled) {
      focusItem(id);
    }
  }, [id, disabled, focusItem]);

  return {
    active: isActive(id),
    focus,
    disabled,
  };
};
