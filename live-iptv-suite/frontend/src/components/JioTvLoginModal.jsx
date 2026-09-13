import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function JioTvLoginModal({ open, onClose, onSyncSuccess }) {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: Success
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const handleSendOtp = async () => {
    if (!mobile || mobile.trim().length < 10) {
      setError('Please enter a valid 10-digit Jio Mobile Number');
      return;
    }
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch('/api/connectors/jiotv/send-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobile.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setMsg(data.message || 'OTP sent to your mobile phone!');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request OTP. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the 6-digit OTP code');
      return;
    }
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch('/api/connectors/jiotv/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobile.trim(), otp: otp.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP code');

      setMsg(data.message || 'JioTV Connected successfully!');
      setStep(3);
      if (onSyncSuccess) onSyncSuccess();
      setTimeout(() => {
        onClose();
        setStep(1);
        setMobile('');
        setOtp('');
      }, 2500);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#0d0d10',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: 4,
          p: 1.5,
          maxWidth: 480,
          width: '100%',
          color: '#ffffff'
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartphoneIcon sx={{ color: '#f97316' }} /> Connect JioTV (OTP Sync)
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
          Enter your Jio Mobile Number to automatically authenticate and sync 1000+ JioTV channels into StreamPulse.
        </Typography>

        {msg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{msg}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {step === 1 && (
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Jio Mobile Number"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  borderRadius: 2.5,
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                  '&:hover fieldset': { borderColor: '#f97316' }
                },
                '& .MuiInputLabel-root': { color: '#9ca3af' }
              }}
            />
          </Box>
        )}

        {step === 2 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ color: '#00e5ff', fontWeight: 700, display: 'block', mb: 1 }}>
              OTP SENT TO {mobile}
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              label="6-Digit OTP Code"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  borderRadius: 2.5,
                  '& fieldset': { borderColor: 'rgba(0, 229, 255, 0.4)' },
                  '&:hover fieldset': { borderColor: '#00e5ff' }
                },
                '& .MuiInputLabel-root': { color: '#9ca3af' }
              }}
            />
          </Box>
        )}

        {step === 3 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 56, color: '#10b981', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff' }}>
              JioTV Channels Synced!
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
              All JioTV HD channels are now available in your Channels tab.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: '#9ca3af', fontWeight: 600 }}>
          Cancel
        </Button>
        {step === 1 && (
          <Button
            variant="contained"
            disabled={loading}
            onClick={handleSendOtp}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SmartphoneIcon />}
            sx={{
              background: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: 20,
              px: 3
            }}
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
        )}
        {step === 2 && (
          <Button
            variant="contained"
            disabled={loading}
            onClick={handleVerifyOtp}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockIcon />}
            sx={{
              background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
              color: '#ffffff',
              fontWeight: 800,
              borderRadius: 20,
              px: 3
            }}
          >
            {loading ? 'Verifying...' : 'Verify OTP & Sync'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
