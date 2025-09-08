import React from 'react';
import { Typography, FormControl, InputLabel, Select, MenuItem, Box, Button, Switch, FormControlLabel, SelectChangeEvent } from '@mui/material';

interface Language {
  key: string;
  value: string;
  label: string;
}

interface PreInterviewSetupProps {
  category: string;
  onCategoryChange: (event: SelectChangeEvent<string>) => void;
  categoryOptions: string[];
  position: string;
  isSpeechEnabled: boolean;
  onPositionChange: (event: SelectChangeEvent<string>) => void;
  onSpeechToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onStartInterview: () => void;
  positionOptions: string[];
  level: string;
  setLevel: (level: string) => void;
  levelOptions: string[];
  language: string;
  setLanguage: (language: string) => void;
  LANGUAGES: Language[];
}

const PreInterviewSetup = ({ 
  category,
  onCategoryChange,
  categoryOptions,
  position, 
  isSpeechEnabled, 
  onPositionChange, 
  onSpeechToggle, 
  onStartInterview,
  positionOptions,
  level,
  setLevel,
  levelOptions,
  language,
  setLanguage,
  LANGUAGES 
}: PreInterviewSetupProps) => {
  return (
    <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: 1, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Chuẩn bị cho buổi phỏng vấn
      </Typography>
      <Typography paragraph>
        Bạn sẽ tham gia một buổi phỏng vấn mô phỏng với AI đóng vai trò là một nhà tuyển dụng.
        Hãy chọn lĩnh vực, vị trí công việc, cấp độ (level) và ngôn ngữ phỏng vấn để bắt đầu.
      </Typography>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Ngành nghề/Lĩnh vực</InputLabel>
        <Select value={category} label="Ngành nghề/Lĩnh vực" onChange={onCategoryChange}>
          {categoryOptions.map((cat: string) => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Vị trí ứng tuyển</InputLabel>
        <Select value={position} label="Vị trí ứng tuyển" onChange={onPositionChange}>
          {positionOptions.map((pos: string) => (
            <MenuItem key={pos} value={pos}>{pos}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Cấp độ (Level)</InputLabel>
        <Select value={level} label="Cấp độ (Level)" onChange={(e: SelectChangeEvent) => setLevel(e.target.value)}>
          {levelOptions && levelOptions.map((lv: string) => (
            <MenuItem key={lv} value={lv}>{lv}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Ngôn ngữ phỏng vấn</InputLabel>
        <Select value={language} label="Ngôn ngữ phỏng vấn" onChange={(e: SelectChangeEvent) => setLanguage(e.target.value)}>
          {LANGUAGES && LANGUAGES.map((lang: Language) => (
            <MenuItem key={lang.key} value={lang.value}>{lang.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FormControlLabel
          control={<Switch checked={isSpeechEnabled} onChange={onSpeechToggle} color="primary" />}
          label="Bật tương tác bằng giọng nói"
        />
      </Box>
      <Button variant="contained" color="primary" size="large" onClick={onStartInterview}>
        Bắt đầu phỏng vấn
      </Button>
    </Box>
  );
};

export default PreInterviewSetup;
