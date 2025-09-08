import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

interface AutoPromptIndicatorProps {
  isActive: boolean;
  duration: number; // in milliseconds
  onTimeout: () => void;
  language: 'en-US' | 'vi-VN';
}

const AutoPromptIndicator: React.FC<AutoPromptIndicatorProps> = ({
  isActive,
  duration,
  onTimeout,
  language
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 100;
        const newProgress = ((duration - newTime) / duration) * 100;
        setProgress(newProgress);

        if (newTime <= 0) {
          onTimeout();
          return duration;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, duration, onTimeout]);

  if (!isActive || timeLeft <= 0) {
    return null;
  }

  const secondsLeft = Math.ceil(timeLeft / 1000);

  return (
    <Box 
      sx={{ 
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(255, 165, 0, 0.9)',
        borderRadius: '8px',
        padding: '12px 16px',
        minWidth: '200px',
        zIndex: 1000,
        border: '1px solid #ff8c00',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'white', 
          fontWeight: 'medium',
          marginBottom: '8px',
          textAlign: 'center'
        }}
      >
        {language === 'vi-VN' 
          ? `AI sẽ hỏi lại sau ${secondsLeft}s`
          : `AI will prompt again in ${secondsLeft}s`
        }
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{
          height: '4px',
          borderRadius: '2px',
          backgroundColor: 'rgba(255,255,255,0.3)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: 'white'
          }
        }}
      />
    </Box>
  );
};

export default AutoPromptIndicator;
