import React from 'react';
import { Box, Typography } from '@mui/material';

const InterviewGuidelines = () => (
  <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 2, p: 3, mb: 3 }}>
    <Typography variant="h6" gutterBottom>Hướng dẫn phỏng vấn</Typography>
    <Typography variant="body2" paragraph>
      - Trả lời ngắn gọn, tập trung vào ý chính.<br />
      - Sử dụng ví dụ thực tế để minh họa.<br />
      - Giữ thái độ tự tin, lịch sự.<br />
      - Nếu không rõ câu hỏi, hãy hỏi lại AI.<br />
      - Có thể sử dụng giọng nói nếu bật tính năng này.
    </Typography>
  </Box>
);

export default InterviewGuidelines;
