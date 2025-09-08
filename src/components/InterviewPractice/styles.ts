import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  background: '#fff',
}));

export const MessageList = styled('div')(() => ({
  maxHeight: 300,
  overflowY: 'auto',
  padding: 8,
  background: '#f9f9f9',
  borderRadius: 8,
}));

export const MessageItem = styled('div')<{ sender: string }>(({ sender }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: sender === 'user' ? 'flex-end' : 'flex-start',
  marginBottom: 8,
}));

export const MessageContent = styled('div')<{ sender: string }>(({ sender, theme }) => ({
  background: sender === 'user' ? '#e3f2fd' : '#ede7f6',
  color: sender === 'user' ? '#1565c0' : '#6a1b9a',
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  maxWidth: '80%',
  wordBreak: 'break-word',
  marginBottom: 2,
}));
