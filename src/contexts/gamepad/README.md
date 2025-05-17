# PS5-Style Gamepad Navigation System

This system provides a complete abstraction for gamepad input handling and spatial navigation, similar to how the PlayStation 5 UI works. It allows you to create complex, nested navigation hierarchies that can be traversed using a gamepad.

## Features

- **Gamepad Detection**: Auto-detects connected gamepads and their type
- **Input Handling**: Processes button presses and analog stick movements
- **Spatial Navigation**: Intelligently finds the best element to focus based on direction
- **Hierarchical Navigation**: Navigate between parent and child components
- **UI Components**: Ready-to-use styled components for PS5-like appearance

## Architecture

The system is divided into three main parts:

1. **GamepadContext**: Handles gamepad connections and raw input
2. **NavigationSystem**: Manages focus and navigation between elements
3. **UI Components**: Provides styled components for building the UI

## Usage Guide

### Basic Setup

First, wrap your app with the `GamepadProvider` and `NavigationProvider`:

```tsx
import { GamepadProvider } from './GamepadContext';
import { NavigationProvider } from './NavigationSystem';

function App() {
  return (
    <GamepadProvider>
      <NavigationProvider>
        {/* Your app content here */}
      </NavigationProvider>
    </GamepadProvider>
  );
}
```

### Handling Navigation Actions

You can provide callbacks for common gamepad actions:

```tsx
<NavigationProvider 
  onAction={(action, itemId) => {
    switch (action) {
      case GamepadAction.SELECT: 
        console.log(`Selected: ${itemId}`);
        break;
      case GamepadAction.BACK:
        console.log('Back pressed');
        break;
      // etc.
    }
  }}
>
  {/* Content */}
</NavigationProvider>
```

### Creating Navigable Elements

There are two ways to create navigable elements:

#### 1. Using the `Navigable` component:

```tsx
import { Navigable } from './NavigationSystem';

<Navigable
  id="my-button"
  parentId="button-container"
  onClick={() => console.log('Clicked!')}
>
  Click Me
</Navigable>
```

#### 2. Using the `useNavigable` hook:

```tsx
import { useNavigable } from './useNavigable';

function MyCustomButton({ id, parentId }) {
  const { active } = useNavigable(id, parentId, false, {
    onSelect: () => console.log('Selected!'),
    onBack: () => console.log('Back pressed'),
  });

  return (
    <button 
      className={active ? 'active' : ''}
    >
      Custom Button
    </button>
  );
}
```

### Structured Navigation

Create a hierarchy using parent-child relationships:

```tsx
<NavigationContainer id="menu" parentId="root">
  <NavigationMenu id="menu-items" parentId="menu">
    <NavigationMenuItem id="item-1" parentId="menu-items">
      Item 1
    </NavigationMenuItem>
    <NavigationMenuItem id="item-2" parentId="menu-items">
      Item 2
    </NavigationMenuItem>
  </NavigationMenu>
</NavigationContainer>
```

## Navigation Logic

The system implements the following navigation logic:

1. **D-Pad / Analog Stick**: 
   - When pressing UP/DOWN/LEFT/RIGHT, finds the best element to navigate to
   - Uses spatial positioning to determine the next focus

2. **Parent-Child Navigation**: 
   - Pressing DOWN on a parent navigates to first child
   - Pressing UP on a child navigates to its parent

3. **Button Actions**:
   - A/X (GamepadAction.SELECT): Confirms selection
   - B/O (GamepadAction.BACK): Goes back
   - Start (GamepadAction.MENU): Opens menu
   - Select/Option (GamepadAction.OPTION): Shows options

## Advanced Usage

### Custom Navigation Behavior

You can customize navigation behavior by accessing the `useNavigation` hook:

```tsx
const { 
  activeItemId, 
  focusItem, 
  isActive,
  isChildActive
} = useNavigation();

// Manually focus an item
focusItem('my-item-id');

// Check if an item or its children are active
if (isActive('parent-id') || isChildActive('parent-id')) {
  // Do something
}
```

### Raw Gamepad Access

If needed, you can access raw gamepad data:

```tsx
const { 
  gamepads, 
  activeGamepad,
  connected,
  isButtonPressed,
  wasButtonJustPressed,
  axisValues
} = useGamepad();

// Check button press
if (wasButtonJustPressed(0)) {
  console.log('A/X button was just pressed');
}

// Get analog stick values
const [leftStickX, leftStickY] = axisValues;
```

## Styling

The included styled components provide a PlayStation-like appearance:

- `NavigationContainer`: Top-level container for a section
- `NavigationTile`: Card-like selectable element
- `NavigationMenu`: Vertical menu container
- `NavigationMenuItem`: Menu item
- `NavigationGrid`: Grid layout
- `NavigationRow`: Horizontal layout
- `NavigationColumn`: Vertical layout

All styled components accept `className` prop for additional customization.

## Best Practices

1. **Unique IDs**: Always use unique IDs for navigable elements
2. **Clear Hierarchy**: Maintain a clear parent-child relationship
3. **Logical Layout**: Arrange elements in a way that makes spatial navigation intuitive
4. **Visual Feedback**: Provide clear visual feedback for the active element
5. **Group Related Items**: Use containers to group related navigable elements

## Troubleshooting

- **Navigation not working**: Check that elements have unique IDs and are properly registered
- **Wrong element gets focus**: Adjust layout to make spatial relationships clearer
- **Gamepad not detected**: Make sure browser supports the Gamepad API or polyfill is loaded
- **Buttons not working**: Check mapping for your specific controller type

## Controller Support

The system automatically detects these controller types:
- Xbox controllers (standard mapping)
- PlayStation controllers (DualShock 4, DualSense)
- Generic controllers

## Example

See the included `App.tsx` for a complete example of a complex navigation hierarchy with multiple levels of parent-child relationships.
