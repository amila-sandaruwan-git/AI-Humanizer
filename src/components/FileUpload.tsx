// src/components/FileUpload.tsx

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Stack,
  LinearProgress,
  Alert,
  Chip,
  useTheme,
  useMediaQuery,
  Fade,
  Backdrop,
} from '@mui/material';
import {
  CloudUpload,
  Close,
  InsertDriveFile,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useToast } from '../context/ToastContext';

interface FileUploadProps {
  onFileContent: (content: string, fileName: string) => void;
  onClose?: () => void;
}

const SUPPORTED_FORMATS = ['.txt', '.md', '.docx', '.pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const FileUpload: React.FC<FileUploadProps> = ({ onFileContent, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showError, showSuccess } = useToast();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    if (isProcessing) return;
    setSelectedFile(null);
    setError(null);
    setIsProcessing(false);
    setProgress(0);
    setIsDragging(false);
    onClose?.();
  }, [isProcessing, onClose]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose]);

  const validateFile = useCallback((file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_FORMATS.includes(ext)) {
      return `Unsupported format. Please upload: ${SUPPORTED_FORMATS.join(', ')}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 10MB (your file: ${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }
    return null;
  }, []);

  const readFileContent = useCallback(async (file: File): Promise<string> => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (ext === '.txt' || ext === '.md') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    }

    if (ext === '.docx') {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    if (ext === '.pdf') {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    }

    throw new Error('Unsupported file format');
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        showError(validationError);
        return;
      }

      setSelectedFile(file);
      setIsProcessing(true);
      setProgress(10);

      try {
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 15, 90));
        }, 200);

        const content = await readFileContent(file);

        clearInterval(progressInterval);
        setProgress(100);

        if (!content || content.trim().length === 0) {
          throw new Error('File appears to be empty or could not be read');
        }

        setTimeout(() => {
          onFileContent(content, file.name);
          showSuccess(`File "${file.name}" loaded`);
          handleClose();
        }, 300);
      } catch (err: any) {
        console.error('File processing error:', err);
        const errorMsg = err.message || 'Failed to process file';
        setError(errorMsg);
        showError(errorMsg);
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [validateFile, readFileContent, onFileContent, showSuccess, showError, handleClose]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) handleFile(files[0]);
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) handleFile(files[0]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFile]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      <Backdrop
        open
        onClick={handleClose}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(43, 47, 69, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: (theme) => theme.zIndex.modal + 2,
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          p: isMobile ? 0 : 3,
          pointerEvents: 'none',
        }}
      >
        <Fade in timeout={200}>
          <Paper
            elevation={24}
            onClick={(e) => e.stopPropagation()}
            sx={{
              width: '100%',
              maxWidth: isMobile ? '100%' : 520,
              maxHeight: isMobile ? '92vh' : '85vh',
              borderRadius: isMobile ? '20px 20px 0 0' : 4,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'auto',
              backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
              border: `1px solid ${
                isDark ? 'rgba(255,255,255,0.1)' : 'rgba(43,47,69,0.08)'
              }`,
              boxShadow: isDark
                ? '0 24px 80px rgba(0,0,0,0.6)'
                : '0 24px 80px rgba(43,47,69,0.2)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: { xs: 2, sm: 2.5 },
                pb: 1.5,
                borderBottom: `1px solid ${
                  isDark ? 'rgba(255,255,255,0.06)' : 'rgba(43,47,69,0.08)'
                }`,
                flexShrink: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                <Box
                  sx={{
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CloudUpload sx={{ color: '#fff', fontSize: { xs: 18, sm: 22 } }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.9375rem', sm: '1.125rem' },
                      lineHeight: 1.2,
                    }}
                  >
                    Import File
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    TXT, DOCX, PDF, MD - Max 10MB
                  </Typography>
                </Box>
              </Box>

              <IconButton
                onClick={handleClose}
                disabled={isProcessing}
                aria-label="Close"
                sx={{
                  width: { xs: 40, sm: 36 },
                  height: { xs: 40, sm: 36 },
                  borderRadius: 2,
                  color: 'text.secondary',
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(43,47,69,0.04)',
                  flexShrink: 0,
                  '&:hover': {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(43,47,69,0.08)',
                    color: 'text.primary',
                  },
                }}
              >
                <Close sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            <Box
              sx={{
                p: { xs: 2, sm: 2.5 },
                overflowY: 'auto',
                flex: 1,
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                pb: {
                  xs: 'calc(16px + env(safe-area-inset-bottom))',
                  sm: 2.5,
                },
              }}
            >
              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={!isProcessing ? handleBrowseClick : undefined}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragging
                    ? 'primary.main'
                    : error
                    ? 'error.main'
                    : isDark
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(43,47,69,0.15)',
                  borderRadius: 3,
                  p: { xs: 2.5, sm: 4 },
                  textAlign: 'center',
                  cursor: isProcessing ? 'default' : 'pointer',
                  backgroundColor: isDragging
                    ? isDark
                      ? 'rgba(144,202,249,0.08)'
                      : 'rgba(91,111,214,0.06)'
                    : isDark
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(91,111,214,0.02)',
                  minHeight: { xs: 180, sm: 220 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isProcessing ? (
                  <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <InsertDriveFile sx={{ color: '#fff', fontSize: 28 }} />
                    </Box>
                    <Box sx={{ width: '100%', maxWidth: 280 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          color: 'text.primary',
                          fontSize: '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Processing {selectedFile?.name}...
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(43,47,69,0.08)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background:
                              'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1,
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                        }}
                      >
                        {progress}% - Extracting text content
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
                    <Box
                      sx={{
                        width: { xs: 56, sm: 64 },
                        height: { xs: 56, sm: 64 },
                        borderRadius: '50%',
                        background: isDragging
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(91,111,214,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CloudUpload
                        sx={{
                          fontSize: { xs: 28, sm: 32 },
                          color: isDragging
                            ? '#fff'
                            : isDark
                            ? 'rgba(255,255,255,0.5)'
                            : '#5b6fd6',
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          color: 'text.primary',
                          fontSize: { xs: '0.9375rem', sm: '1rem' },
                          mb: 0.5,
                          px: 1,
                        }}
                      >
                        {isDragging ? 'Drop your file here' : 'Drag & drop a file here'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.8125rem',
                          mb: 1.5,
                        }}
                      >
                        or
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<InsertDriveFile />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBrowseClick();
                        }}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          px: { xs: 2.5, sm: 3 },
                          py: 1,
                          fontSize: '0.8125rem',
                          background:
                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          boxShadow: 'none',
                          minHeight: 44,
                          '&:hover': { boxShadow: 'none' },
                        }}
                      >
                        Browse Files
                      </Button>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        mt: 1,
                        px: 1,
                        gap: 0.75,
                      }}
                    >
                      {SUPPORTED_FORMATS.map((format) => (
                        <Chip
                          key={format}
                          label={format.toUpperCase().replace('.', '')}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(43,47,69,0.05)',
                            color: 'text.secondary',
                            border: 'none',
                          }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Box>

              {error && (
                <Alert
                  severity="error"
                  icon={<ErrorIcon />}
                  onClose={() => setError(null)}
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    fontSize: '0.8125rem',
                    '& .MuiAlert-message': { minWidth: 0, wordBreak: 'break-word' },
                  }}
                >
                  {error}
                </Alert>
              )}

              {!isProcessing && !error && (
                <Box
                  sx={{
                    mt: 2.5,
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: isDark
                      ? 'rgba(102,126,234,0.08)'
                      : 'rgba(91,111,214,0.06)',
                    border: '1px solid',
                    borderColor: isDark
                      ? 'rgba(102,126,234,0.2)'
                      : 'rgba(91,111,214,0.16)',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                      lineHeight: 1.5,
                      display: 'block',
                    }}
                  >
                    Your file is processed locally in your browser. No data is sent to
                    any server.
                  </Typography>
                </Box>
              )}
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_FORMATS.join(',')}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </Paper>
        </Fade>
      </Box>
    </>
  );
};

export default memo(FileUpload);