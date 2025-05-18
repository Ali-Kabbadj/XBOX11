import { useNavigation } from "@/contexts/gamepad/NavigationSystem";
import React, { ReactNode, useEffect, useRef } from "react";

// -inspired UI styles
const Styles = {
  // Container styles
  container: `
    text-white py-4 transition-all duration-300
  `,
  containerActive: `
    shadow-lg
  `,
  containerChildActive: `
    opacity-100
  `,
  // Tile styles
  tile: `
    bg-gray-900/40 text-white rounded-xl
    border-0 transition-all duration-300 ease-out
    hover:bg-blue-900/30 transform origin-center
    backdrop-filter backdrop-blur-sm
    overflow-hidden relative
  `,
  tileActive: `
    border-blue-400 bg-blue-900/60 shadow-xl
    scale-110 z-10
    ring-2 ring-blue-400
  `,
  tileDisabled: `
    opacity-50 cursor-not-allowed
  `,
  // Menu styles
  menu: `
    flex flex-col rounded-xl
    bg-gray-900/80 backdrop-filter backdrop-blur-md overflow-hidden
    shadow-xl
  `,
  menuItem: `
    px-6 py-4 text-white transition-all duration-200
    hover:bg-gray-800 border-b border-gray-800/50 last:border-b-0
  `,
  menuItemActive: `
    bg-blue-800/80 text-white
  `,
  // Title bar
  titleBar: `
    text-2xl font-medium my-2 pl-4 flex items-center
  `,
};

// Interface definitions
interface StyledNavigableProps {
  id: string;
  parentId?: string | null;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface StyledNavigationGroupProps {
  id: string;
  parentId?: string | null;
  children: ReactNode;
  className?: string;
  title?: string;
}

// Component for navigable items
interface NavigableProps {
  id: string;
  parentId?: string | null;
  disabled?: boolean;
  className?: string;
  activeClassName?: string;
  childActiveClassName?: string;
  children: ReactNode;
  onClick?: () => void;
  [key: string]: any; // Allow other props to pass through
}

// In NavigationSystem.tsx
export const Navigable: React.FC<NavigableProps> = ({
  id,
  parentId = null,
  disabled = false,
  className = "",
  activeClassName = "navigable-active",
  childActiveClassName = "navigable-child-active",
  children,
  onClick,
  ...rest
}) => {
  const { registerItem, unregisterItem, isActive, isChildActive, focusItem } =
    useNavigation();

  const ref = useRef<HTMLDivElement | null>(null);
  const registeredRef = useRef(false);

  // Register this item on mount
  useEffect(() => {
    if (!registeredRef.current) {
      registerItem(id, ref, parentId, disabled);
      registeredRef.current = true;
    }

    return () => {
      unregisterItem(id);
      registeredRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, parentId, disabled]);

  // Update registration if props change
  useEffect(() => {
    if (registeredRef.current) {
      unregisterItem(id);
      registerItem(id, ref, parentId, disabled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, parentId]);

  // Handle click to focus this item
  const handleClick = () => {
    if (!disabled) {
      focusItem(id);
      if (onClick) onClick();
    }
  };

  // Compute className
  const isActiveValue = isActive(id);
  const isChildActiveValue = isChildActive(id);

  // Build the className dynamically
  const computedClassName = `
    ${className}
    ${isActiveValue ? activeClassName : ""}
    ${isChildActiveValue ? childActiveClassName : ""}
  `.trim();

  return (
    <div
      ref={ref ? ref : undefined}
      className={computedClassName}
      onClick={handleClick}
      data-navigable-id={id}
      data-navigable-active={isActiveValue}
      data-navigable-child-active={isChildActiveValue}
      data-navigable-disabled={disabled}
      tabIndex={isActiveValue ? 0 : -1}
      {...rest}
    >
      {children}
    </div>
  );
};

// Navigation group component
interface NavigationGroupProps {
  id: string;
  parentId?: string | null;
  className?: string;
  activeClassName?: string;
  childActiveClassName?: string;
  children: ReactNode;
  [key: string]: any; // Allow other props to pass through
}

export const NavigationGroup: React.FC<NavigationGroupProps> = ({
  id,
  parentId = null,
  className = "",
  activeClassName = "navigation-group-active",
  childActiveClassName = "navigation-group-child-active",
  children,
  ...rest
}) => {
  // Group is never disabled
  return (
    <Navigable
      id={id}
      parentId={parentId}
      className={className}
      activeClassName={activeClassName}
      childActiveClassName={childActiveClassName}
      {...rest}
    >
      {children}
    </Navigable>
  );
};

// Styled Components
export const NavigationContainer: React.FC<StyledNavigationGroupProps> = ({
  id,
  parentId = null,
  children,
  className = "",
  title = "",
}) => {
  return (
    <NavigationGroup
      id={id}
      parentId={parentId}
      className={`${Styles.container} ${className}`}
      activeClassName={Styles.containerActive}
      childActiveClassName={Styles.containerChildActive}
    >
      {title && <h2 className={Styles.titleBar}>{title}</h2>}
      {children}
    </NavigationGroup>
  );
};

export const NavigationTile: React.FC<StyledNavigableProps> = ({
  id,
  parentId = null,
  disabled = false,
  children,
  className = "",
  onClick,
}) => {
  return (
    <Navigable
      id={id}
      parentId={parentId}
      disabled={disabled}
      className={`
        ${Styles.tile}
        ${className}
        ${disabled ? Styles.tileDisabled : ""}
      `}
      activeClassName={Styles.tileActive}
      onClick={onClick}
    >
      {children}
    </Navigable>
  );
};

export const NavigationMenu: React.FC<StyledNavigationGroupProps> = ({
  id,
  parentId = null,
  children,
  className = "",
  title,
}) => {
  return (
    <NavigationGroup
      id={id}
      parentId={parentId}
      className={`${Styles.menu} ${className}`}
    >
      {title && (
        <div className="px-6 py-3 bg-gray-950 font-medium">{title}</div>
      )}
      {children}
    </NavigationGroup>
  );
};

export const NavigationMenuItem: React.FC<StyledNavigableProps> = ({
  id,
  parentId = null,
  disabled = false,
  children,
  className = "",
  onClick,
}) => {
  return (
    <Navigable
      id={id}
      parentId={parentId}
      disabled={disabled}
      className={`
        ${Styles.menuItem} 
        ${className} 
        ${disabled ? Styles.tileDisabled : ""}
      `}
      activeClassName={Styles.menuItemActive}
      onClick={onClick}
    >
      {children}
    </Navigable>
  );
};

export const NavigationGrid: React.FC<{
  children: ReactNode;
  className?: string;
  columns?: number;
}> = ({ children, className = "", columns = 5 }) => {
  //  uses horizontal scrolling rows rather than a grid
  return (
    <div className={`flex space-x-6 px-4 overflow-x-visible ${className}`}>
      {children}
    </div>
  );
};

//  uses rows for game tiles
export const NavigationRow: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return <div className={`flex space-x-6 px-4 ${className}`}>{children}</div>;
};

export const NavigationColumn: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={`flex flex-col space-y-6 ${className}`}>{children}</div>
  );
};

// Tile header
export const Header: React.FC<{
  activeSection: string;
  time?: string;
}> = ({ activeSection, time = "3:40 PM" }) => {
  return (
    <div className="flex justify-between items-center px-12 py-4">
      <div className="flex space-x-12 items-center">
        <div className="text-2xl font-bold">Games</div>
        <div className="text-2xl text-gray-400">Media</div>
      </div>
      <div className="flex items-center space-x-8">
        <div className="text-2xl">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
        <div className="text-2xl">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            1
          </div>
          <div className="text-xl">{time}</div>
        </div>
      </div>
    </div>
  );
};

// selectable navigatiion item
export const SelectableTile: React.FC<{
  id: string;
  parentId: string;
  title: string;
  icon: string;
  isActive?: boolean;
}> = ({ id, parentId, title, icon, isActive }) => {
  return (
    <NavigationTile
      id={id}
      parentId={parentId}
      className="flex flex-col w-48 h-48 rounded-xl"
    >
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-5xl mb-4">{icon}</div>
        <div className="font-medium text-lg text-center">{title}</div>
      </div>
    </NavigationTile>
  );
};

export const DetailPanel: React.FC<{
  title: string;
  subtitle?: string;
  children?: ReactNode;
}> = ({ title, subtitle, children }) => {
  return (
    <div className="absolute left-12 bottom-h-100 max-w-md z-20">
      <h1 className="text-4xl font-bold mb-2">{title}</h1>
      {subtitle && <div className="text-lg text-gray-300 mb-4">{subtitle}</div>}
      {children}
    </div>
  );
};

export const ActionButton: React.FC<{
  label: string;
  onClick?: () => void;
  primary?: boolean;
}> = ({ label, onClick, primary = true }) => {
  return (
    <button
      onClick={onClick}
      className={`px-12 py-4 rounded-full ${
        primary ? "bg-white text-black font-bold" : "bg-gray-800 text-white"
      } transition-all duration-200 hover:opacity-90`}
    >
      {label}
    </button>
  );
};
