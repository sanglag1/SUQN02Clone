"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon: string;
  component: React.ReactNode;
}

interface TabContainerProps {
  tabs: Tab[];
  defaultTab?: string;
}

export default function TabContainer({ tabs, defaultTab }: TabContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTabData?.component}
      </div>
    </div>
  );
}
