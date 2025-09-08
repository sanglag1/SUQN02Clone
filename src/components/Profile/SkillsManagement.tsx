'use client';

import React, { useState } from 'react';

interface SkillsManagementProps {
  skills: string[];
  isEditing: boolean;
  onSkillsChange: (skills: string[]) => void;
}

export const SkillsManagement: React.FC<SkillsManagementProps> = ({
  skills,
  isEditing,
  onSkillsChange
}) => {
  const [newSkill, setNewSkill] = useState("");

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      onSkillsChange([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addSkill();
    }
  };

  return (
    <div className="space-y-6">
      {/* Add new skill */}
      {isEditing && (
        <div className="flex gap-3">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a new skill"
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={addSkill}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Add
          </button>
        </div>
      )}

      {/* Skills list */}
      <div className="flex flex-wrap gap-3">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200 hover:from-blue-200 hover:to-purple-200 transition-all duration-200"
          >
            {skill}
            {isEditing && (
              <button
                onClick={() => removeSkill(skill)}
                className="ml-2 text-blue-600 hover:text-red-600 transition-colors duration-200 font-bold"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Empty state */}
      {skills.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
          <p className="text-lg font-medium text-gray-600 mb-2">No skills added yet</p>
          {isEditing && (
            <p className="text-sm text-gray-500">Add your skills using the input above</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsManagement;
