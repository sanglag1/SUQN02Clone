import React, { useState } from 'react';
import { Box, IconButton, Tooltip, CircularProgress, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useAzureVoiceInteraction } from '@/hooks/useAzureVoiceInteraction';

interface VoiceInteractionProps {
  onSpeechResult: (text: string) => void;
  disabled?: boolean;
  language?: 'vi-VN' | 'en-US';
  isAvatarTalking?: boolean;
}

const VoiceInteraction: React.FC<VoiceInteractionProps> = ({
  onSpeechResult,
  disabled = false,
  language = 'vi-VN',
  isAvatarTalking = false
}) => {
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  const {
    isListening,
    isInitializing,
    startListening,
    stopListening
  } = useAzureVoiceInteraction({
    onSpeechResult: (text: string) => {
      
      onSpeechResult(text);
    },
    onError: setError,
    onInterimResult: setInterimTranscript,
    language,
    silenceTimeout: 2000 // 2 giây delay
  });

  const toggleMicrophone = async () => {
    if (disabled || isAvatarTalking) return;

    if (isListening) {
      await stopListening();
      setInterimTranscript('');
    } else {
      await startListening();
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ position: 'relative' }}>
        <Tooltip title={isListening ? 'Dừng nói' : 'Bắt đầu nói'}>
          <IconButton
            onClick={toggleMicrophone}
            disabled={disabled || isAvatarTalking || isInitializing}
            color={isListening ? 'error' : 'primary'}
            sx={{
              bgcolor: isListening ? 'error.main' : 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: isListening ? 'error.dark' : 'primary.dark',
              },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
              }
            }}
          >
            {isInitializing ? (
              <CircularProgress size={24} color="inherit" />
            ) : isListening ? (
              <MicIcon />
            ) : (
              <MicOffIcon />
            )}
          </IconButton>
        </Tooltip>
        {isListening && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              mt: 1,
              px: 2,
              py: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1,
              whiteSpace: 'nowrap',
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {interimTranscript || 'Đang nghe...'}
            </Typography>
          </Box>
        )}
      </Box>

      <Tooltip title={isSpeakerOn ? 'Tắt tiếng' : 'Bật tiếng'}>
        <IconButton
          onClick={toggleSpeaker}
          color={isSpeakerOn ? 'primary' : 'default'}
        >
          {isSpeakerOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </IconButton>
      </Tooltip>

      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{
            ml: 2,
            animation: 'fadeOut 5s forwards',
            '@keyframes fadeOut': {
              '0%': { opacity: 1 },
              '80%': { opacity: 1 },
              '100%': { opacity: 0 }
            }
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default VoiceInteraction;
