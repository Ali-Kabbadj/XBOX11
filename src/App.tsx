import "./styles/App.css";


import {
  NavigationContainer,
  NavigationTile,
  PS5Header,
  PS5GameTile,
  PS5DetailPanel,
  PS5ActionButton,
} from "./components/Navigation/NavigationComponents";

import {
  GamepadAction,
  NavigationProvider,
} from "./contexts/gamepad/NavigationSystem";

import { GamepadProvider } from "./contexts/gamepad/GamepadContext";
import { useEffect, useState } from "react";

// Main App Component
export default function App() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Handle gamepad actions
  const handleAction = (action: GamepadAction, itemId: string) => {
    console.log("action handled", action, itemId);
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
    }

    // Clear notification after 2 seconds
    setTimeout(() => setNotification(null), 2000);
  };

  // Update background when selection changes
  useEffect(() => {
    // This would typically set different background images based on the selection
    // For demo purposes, we'll always use a dark gradient
    setBackgroundImage(
      "linear-gradient(to bottom, rgba(0,0,15,0.8) 0%, rgba(0,0,20,0.9) 100%)",
    );
  }, [selectedItem]);

  // Define parent containers and their children
  const Games = {
    id: "games",
    title: "Games",
    items: [
      {
        id: "game1",
        title: "Adventure Quest",
        icon: "🎮",
        bgColor: "from-blue-900",
      },
      {
        id: "game2",
        title: "Racing Stars",
        icon: "🏎️",
        bgColor: "from-red-900",
      },
      {
        id: "game3",
        title: "Puzzle World",
        icon: "🧩",
        bgColor: "from-green-900",
      },
      {
        id: "game4",
        title: "Space Explorer",
        icon: "🚀",
        bgColor: "from-purple-900",
      },
      {
        id: "game5",
        title: "Fantasy RPG",
        icon: "⚔️",
        bgColor: "from-yellow-900",
      },
    ],
  };

  const Media = {
    id: "media",
    title: "Media",
    items: [
      { id: "media1", title: "Movies", icon: "🎬", bgColor: "from-blue-900" },
      { id: "media2", title: "Music", icon: "🎵", bgColor: "from-pink-900" },
      { id: "media3", title: "Photos", icon: "📷", bgColor: "from-green-900" },
      { id: "media4", title: "Streaming", icon: "📺", bgColor: "from-red-900" },
    ],
  };

  const Apps = {
    id: "apps",
    title: "Apps",
    items: [
      { id: "app1", title: "Browser", icon: "🌐", bgColor: "from-blue-800" },
      { id: "app2", title: "YouTube", icon: "📱", bgColor: "from-red-800" },
      { id: "app3", title: "Netflix", icon: "📺", bgColor: "from-gray-800" },
      { id: "app4", title: "Spotify", icon: "🎧", bgColor: "from-green-800" },
    ],
  };

  const Settings = {
    id: "settings",
    title: "Settings",
    items: [
      {
        id: "setting1",
        title: "Account",
        icon: "👤",
        bgColor: "from-blue-900",
      },
      {
        id: "setting2",
        title: "Display",
        icon: "🖥️",
        bgColor: "from-gray-900",
      },
      {
        id: "setting3",
        title: "Sound",
        icon: "🔊",
        bgColor: "from-purple-900",
      },
      {
        id: "setting4",
        title: "Network",
        icon: "📡",
        bgColor: "from-green-900",
      },
      {
        id: "setting5",
        title: "Storage",
        icon: "💾",
        bgColor: "from-yellow-900",
      },
    ],
  };

  const Sections = [Games, Media, Apps, Settings];

  // Get the currently selected game if any
  const currentGame = Sections.flatMap((section) => section.items).find(
    (item) => item.id === selectedItem,
  );

  return (
    <GamepadProvider>
      <NavigationProvider
        onAction={handleAction}
        autoSelectFirstChild={true}
        rememberLastChild={true}
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
            <PS5Header activeSection="Games" />

            {/* Main content */}
            <div className="px-8 py-4 space-y-14">
              {/* Render each section with its child items */}
              {Sections.map((section) => (
                <NavigationContainer
                  key={section.id}
                  id={section.id}
                  parentId={null}
                  title={section.title}
                  className="mb-4"
                >
                  <div className="flex space-x-6 overflow-x-visible pl-4 mt-2">
                    {section.items.map((item) => (
                      <PS5GameTile
                        key={item.id}
                        id={item.id}
                        parentId={section.id}
                        title={item.title}
                        icon={item.icon}
                      />
                    ))}
                  </div>
                </NavigationContainer>
              ))}
            </div>

            {/* Game details for selected item */}
            {currentGame && (
              <PS5DetailPanel
                title={currentGame.title}
                subtitle={`Experience the immersive world of ${currentGame.title}`}
              >
                <div className="flex space-x-4 mt-6">
                  <PS5ActionButton label="Play" primary={true} />
                  <PS5ActionButton label="Options" primary={false} />
                </div>
              </PS5DetailPanel>
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
