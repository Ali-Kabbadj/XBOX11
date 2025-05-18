import "./styles/App.css";

import {
  NavigationContainer,
  NavigationTile,
  Header,
  SelectableTile,
  DetailPanel,
  ActionButton,
} from "./components/Navigation/NavigationComponents";

import {
  GamepadAction,
  NavigationProvider,
} from "./contexts/gamepad/NavigationSystem";

import { GamepadProvider } from "./contexts/gamepad/GamepadContext";
import { useEffect, useState } from "react";
import { Sections } from "./tempDATA";

type Game = {
  id: string;
  title: string;
  icon: string;
  bgColor: string;
} | null;

// Main App Component
export default function App() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<Game>(null);

  // Handle gamepad actions
  const handleAction = (action: GamepadAction, itemId: string) => {
    console.log(action);
    switch (action) {
      case GamepadAction.SELECT:
        setSelectedItem(itemId);
        setNotification(`Selected: ${itemId}`);
        break;

      case GamepadAction.BACK:
        setNotification("Back pressed");
        break;

      case GamepadAction.MENU:
        setNotification("Menu button pressed");
        break;

      case GamepadAction.OPTION:
        setNotification("Options button pressed");
        break;

      case GamepadAction.LEFT:
      case GamepadAction.RIGHT:
        setSelectedItem(itemId);
    }

    // Clear notification after 2 seconds
    setTimeout(() => setNotification(null), 2000);
  };

  // Update background when selection changes
  useEffect(() => {
    setBackgroundImage(
      "linear-gradient(to bottom, rgba(0,0,15,0.8) 0%, rgba(0,0,20,0.9) 100%)",
    );
    const game = Sections.flatMap((section) => section.items).find(
      (item) => item.id === selectedItem,
    );
    if (game) setCurrentGame(game);
  }, [selectedItem]);

  // Get the currently selected game if any

  return (
    <GamepadProvider>
      <NavigationProvider
        onAction={handleAction}
        autoSelectFirstChild={true}
        rememberLastChild={true}
        onNavigationAction={handleAction}
      >
        <div
          className="min-h-screen bg-black text-white relative overflow-hidden"
          style={{
            background: backgroundImage || "black",
          }}
        >
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black"></div>

          {/* Main content */}
          <div className="relative z-10">
            {/* Header */}
            <Header activeSection="Games" />

            {/* Main content */}
            <div className="px-8 py-4 space-y-14">
              {/* Render each section with its child items */}
              {(() => {
                const gamesSection = Sections.find((s) => s.id === "games");
                return gamesSection ? (
                  <NavigationContainer
                    key={gamesSection.id}
                    id={gamesSection.id}
                    parentId={null}
                    className="mb-4"
                  >
                    <div className="flex space-x-6 overflow-x-visible pl-4 mt-2">
                      {gamesSection.items.map((item) => (
                        <SelectableTile
                          key={item.id}
                          id={item.id}
                          parentId={gamesSection.id}
                          title={item.title}
                          icon={item.icon}
                        />
                      ))}
                    </div>
                  </NavigationContainer>
                ) : null;
              })()}
            </div>

            {/* Game details for selected item */}
            {currentGame && (
              <DetailPanel
                title={currentGame.title}
                subtitle={`Experience the immersive world of ${currentGame.title}`}
              >
                <div className="flex space-x-4 mt-6">
                  <ActionButton label="Play" primary={true} />
                  <ActionButton label="Options" primary={false} />
                </div>
              </DetailPanel>
            )}

            {/* Notification */}
            {notification && (
              <div className="fixed bottom-12 right-12 bg-blue-700/90 backdrop-blur-md text-white px-6 py-3 rounded-md shadow-lg transform transition-all duration-300 ease-out animate-fadeIn">
                {notification}
              </div>
            )}
          </div>
        </div>
      </NavigationProvider>
    </GamepadProvider>
  );
}
